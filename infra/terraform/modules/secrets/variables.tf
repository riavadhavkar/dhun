variable "name_prefix" {
  type = string
}

variable "secret_values" {
  description = "Map of key -> value stored as a single JSON secret (e.g. DATABASE_URL, ANTHROPIC_API_KEY)."
  type        = map(string)
  sensitive   = true
}
