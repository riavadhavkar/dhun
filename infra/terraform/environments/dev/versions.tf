terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # State is stored remotely so `terraform apply` is safe to run from any
  # machine. The bucket + lock table must exist before this works — see
  # infra/terraform/README.md for the one-time bootstrap steps. Until then,
  # leave this block commented out and Terraform will use local state.
  #
  # backend "s3" {
  #   bucket         = "dhun-terraform-state"
  #   key            = "dev/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "dhun-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region
}
