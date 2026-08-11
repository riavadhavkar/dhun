locals {
  name_prefix = "${var.project_name}-${var.environment}"

  database_url = "postgresql+psycopg://${module.database.master_username}:${var.db_master_password}@${module.database.endpoint}/${module.database.db_name}"

  app_secret_values = {
    DATABASE_URL          = local.database_url
    SPOTIFY_CLIENT_ID     = var.spotify_client_id
    SPOTIFY_CLIENT_SECRET = var.spotify_client_secret
    ANTHROPIC_API_KEY     = var.anthropic_api_key
    NEXTAUTH_SECRET       = var.nextauth_secret
  }
}

module "network" {
  source             = "../../modules/network"
  name_prefix        = local.name_prefix
  availability_zones = var.availability_zones
}

module "database" {
  source              = "../../modules/database"
  name_prefix         = local.name_prefix
  vpc_id              = module.network.vpc_id
  private_subnet_ids  = module.network.private_subnet_ids
  allowed_cidr_blocks = [module.network.vpc_cidr]
  master_password     = var.db_master_password
}

module "secrets" {
  source        = "../../modules/secrets"
  name_prefix   = local.name_prefix
  secret_values = local.app_secret_values
}

resource "aws_ecs_cluster" "this" {
  name = local.name_prefix
}

resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = module.network.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${local.name_prefix}-alb-sg" }
}

resource "aws_lb" "this" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.network.public_subnet_ids
}

module "api_service" {
  source                 = "../../modules/ecs-service"
  name_prefix            = local.name_prefix
  service_name           = "api"
  vpc_id                 = module.network.vpc_id
  private_subnet_ids     = module.network.private_subnet_ids
  cluster_id             = aws_ecs_cluster.this.id
  alb_security_group_id  = aws_security_group.alb.id
  container_port         = 8000
  health_check_path      = "/health"
  secrets_arn            = module.secrets.secret_arn
  secret_keys            = module.secrets.secret_keys
}

module "web_service" {
  source                 = "../../modules/ecs-service"
  name_prefix            = local.name_prefix
  service_name           = "web"
  vpc_id                 = module.network.vpc_id
  private_subnet_ids     = module.network.private_subnet_ids
  cluster_id             = aws_ecs_cluster.this.id
  alb_security_group_id  = aws_security_group.alb.id
  container_port         = 3000
  health_check_path      = "/"
  secrets_arn            = module.secrets.secret_arn
  secret_keys            = ["NEXTAUTH_SECRET", "SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"]
  environment = {
    # NEXTAUTH_URL is read server-side at request time, so a runtime env var works fine.
    NEXTAUTH_URL = "http://${aws_lb.this.dns_name}"

    # NOTE: NEXT_PUBLIC_API_BASE_URL is a build-time value in Next.js — Next.js
    # inlines NEXT_PUBLIC_* vars into the client bundle during `next build`, so
    # setting it here as a *runtime* ECS env var has no effect on already-built
    # JS. It must instead be passed as a Docker build-arg when the image is
    # built in CI (e.g. `docker build --build-arg NEXT_PUBLIC_API_BASE_URL=...`,
    # with a matching `ARG`/`ENV` pair added to apps/web/Dockerfile's builder
    # stage) before the image is pushed to ECR.
  }
}

# Default: everything goes to the web service; /api/* is routed to the FastAPI service.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = module.web_service.target_group_arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = module.api_service.target_group_arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
