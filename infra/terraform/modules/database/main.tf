resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-db-subnets"
  subnet_ids = var.private_subnet_ids
  tags       = { Name = "${var.name_prefix}-db-subnets" }
}

resource "aws_security_group" "db" {
  name_prefix = "${var.name_prefix}-db-"
  vpc_id      = var.vpc_id

  ingress {
    description = "Postgres from private subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
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

  tags = { Name = "${var.name_prefix}-db-sg" }
}

resource "aws_db_instance" "this" {
  identifier     = "${var.name_prefix}-postgres"
  engine         = "postgres"
  engine_version = "16"

  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage_gb
  storage_type          = "gp3"
  db_subnet_group_name  = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.db.id]

  db_name  = var.db_name
  username = var.master_username
  password = var.master_password

  publicly_accessible = false
  multi_az            = false
  skip_final_snapshot = true # dev environment; enable snapshots for prod

  tags = { Name = "${var.name_prefix}-postgres" }
}
