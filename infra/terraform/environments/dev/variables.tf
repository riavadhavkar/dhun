variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "project_name" {
  type    = string
  default = "dhun"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "db_master_password" {
  description = "Postgres master password. Pass via TF_VAR_db_master_password, not a checked-in tfvars file."
  type        = string
  sensitive   = true
}

variable "spotify_client_id" {
  type      = string
  sensitive = true
}

variable "spotify_client_secret" {
  type      = string
  sensitive = true
}

variable "anthropic_api_key" {
  type      = string
  sensitive = true
}

variable "nextauth_secret" {
  description = "Random secret for NextAuth session encryption — generate with `openssl rand -base64 32`."
  type        = string
  sensitive   = true
}
