output "secret_arn" {
  value = aws_secretsmanager_secret.app.arn
}

output "secret_keys" {
  description = "Keys present in the secret, for building `secrets` blocks in ECS task defs."
  value       = keys(var.secret_values)
}
