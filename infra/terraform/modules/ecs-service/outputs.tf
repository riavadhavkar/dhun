output "ecr_repository_url" {
  value = aws_ecr_repository.this.repository_url
}

output "target_group_arn" {
  value = aws_lb_target_group.this.arn
}

output "security_group_id" {
  value = aws_security_group.service.id
}

output "service_name" {
  value = aws_ecs_service.this.name
}
