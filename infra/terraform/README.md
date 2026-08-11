# Infra (AWS via Terraform)

```
infra/terraform/
├── modules/
│   ├── network/       VPC, public/private subnets, NAT, routing
│   ├── database/      RDS Postgres in private subnets
│   ├── secrets/       one Secrets Manager secret holding all app keys
│   └── ecs-service/   reusable Fargate service (ECR repo, task def, service, target group)
└── environments/
    └── dev/           wires the modules together: ECS cluster, ALB (path routing:
                        /api/* -> api service, /* -> web service)
```

## One-time bootstrap (remote state)

Terraform state defaults to local (`environments/dev/versions.tf` has the S3
backend commented out) so `plan`/`apply` works immediately. To switch to
shared remote state:

```bash
aws s3api create-bucket --bucket dhun-terraform-state --region us-east-1
aws dynamodb create-table --table-name dhun-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

Then uncomment the `backend "s3"` block in `versions.tf` and run `terraform init -migrate-state`.

## Deploy

```bash
cd infra/terraform/environments/dev
terraform init
terraform plan   # review before applying
terraform apply
```

Pass secrets as `TF_VAR_*` env vars rather than a checked-in `.tfvars` file:

```bash
export TF_VAR_db_master_password=...
export TF_VAR_spotify_client_id=...
export TF_VAR_spotify_client_secret=...
export TF_VAR_anthropic_api_key=...
export TF_VAR_nextauth_secret=$(openssl rand -base64 32)
```

## Pushing images

`terraform apply` creates the ECR repos but doesn't build/push images — the
ECS services will fail to start until an image tagged `latest` exists in each
repo:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t dhun-dev-api:latest apps/api
docker tag dhun-dev-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/dhun-dev-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/dhun-dev-api:latest

# web needs the API base URL baked in at build time — see apps/web/Dockerfile
docker build -t dhun-dev-web:latest apps/web \
  --build-arg NEXT_PUBLIC_API_BASE_URL="http://$(terraform -chdir=infra/terraform/environments/dev output -raw alb_dns_name)/api"
docker tag dhun-dev-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/dhun-dev-web:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/dhun-dev-web:latest
```

Then force a new deployment so ECS picks up the pushed image:

```bash
aws ecs update-service --cluster dhun-dev --service dhun-dev-api --force-new-deployment
aws ecs update-service --cluster dhun-dev --service dhun-dev-web --force-new-deployment
```

## After apply

```bash
terraform output alb_dns_name   # visit this in a browser
```

Run migrations against the RDS instance once (e.g. from a bastion, or
temporarily via `aws ecs execute-command` into the running api task):

```bash
alembic upgrade head
```

## Known limitations (dev environment, by design)

- HTTP only, no ACM certificate/HTTPS listener — fine for testing, not for real users
- Single NAT gateway (cost tradeoff) instead of one per AZ
- `skip_final_snapshot = true` on RDS — do not use this setting for prod
- No CI/CD wiring — images are pushed manually per the steps above
