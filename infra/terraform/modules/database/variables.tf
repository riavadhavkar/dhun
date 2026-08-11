variable "name_prefix" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "allowed_cidr_blocks" {
  description = "CIDR ranges (e.g. the VPC's private subnets) permitted to reach Postgres on 5432."
  type        = list(string)
}

variable "db_name" {
  type    = string
  default = "dhun"
}

variable "master_username" {
  type    = string
  default = "dhun"
}

variable "master_password" {
  type      = string
  sensitive = true
}

variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "allocated_storage_gb" {
  type    = number
  default = 20
}
