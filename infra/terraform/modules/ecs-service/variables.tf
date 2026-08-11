variable "name_prefix" {
  type = string
}

variable "service_name" {
  description = "e.g. \"api\" or \"web\" — used to namespace resources."
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "cluster_id" {
  type = string
}

variable "alb_security_group_id" {
  type = string
}

variable "container_port" {
  type = number
}

variable "health_check_path" {
  type    = string
  default = "/health"
}

variable "cpu" {
  type    = number
  default = 256
}

variable "memory" {
  type    = number
  default = 512
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "environment" {
  description = "Plain (non-secret) environment variables."
  type        = map(string)
  default     = {}
}

variable "secrets_arn" {
  description = "ARN of the Secrets Manager secret holding sensitive env vars."
  type        = string
}

variable "secret_keys" {
  description = "Keys within the secret to expose as env vars of the same name."
  type        = list(string)
  default     = []
}
