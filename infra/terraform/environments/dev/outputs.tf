output "alb_dns_name" {
  description = "Point NEXTAUTH_URL / your browser at this."
  value       = aws_lb.this.dns_name
}

output "api_ecr_repository_url" {
  value = module.api_service.ecr_repository_url
}

output "web_ecr_repository_url" {
  value = module.web_service.ecr_repository_url
}

output "database_endpoint" {
  value = module.database.endpoint
}
