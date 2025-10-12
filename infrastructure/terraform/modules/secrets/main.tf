# AWS Secrets Manager Module
# Centralized secrets management with KMS encryption

resource "aws_kms_key" "secrets" {
  description             = "${var.project_name} secrets encryption key - ${var.environment}"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "${var.project_name}-secrets-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.project_name}-secrets-${var.environment}"
  target_key_id = aws_kms_key.secrets.key_id
}

# API Keys and Provider Credentials
resource "aws_secretsmanager_secret" "provider_keys" {
  name        = "${var.project_name}/${var.environment}/providers/api-keys"
  description = "External provider API keys"
  kms_key_id  = aws_kms_key.secrets.id
  
  tags = {
    Name        = "provider-api-keys"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "provider_keys" {
  secret_id = aws_secretsmanager_secret.provider_keys.id
  secret_string = jsonencode({
    clinicaltrials_gov = ""
    fda_api_key        = ""
    sec_edgar_key      = ""
    openbb_api_key     = ""
  })
}

# ML Model Configuration
resource "aws_secretsmanager_secret" "ml_config" {
  name        = "${var.project_name}/${var.environment}/ml/config"
  description = "ML model configuration and hyperparameters"
  kms_key_id  = aws_kms_key.secrets.id
  
  tags = {
    Name        = "ml-config"
    Environment = var.environment
  }
}

# Dagster Secrets
resource "aws_secretsmanager_secret" "dagster_config" {
  name        = "${var.project_name}/${var.environment}/dagster/config"
  description = "Dagster orchestration configuration"
  kms_key_id  = aws_kms_key.secrets.id
  
  tags = {
    Name        = "dagster-config"
    Environment = var.environment
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

# Outputs
output "kms_key_id" {
  description = "KMS key ID for secrets"
  value       = aws_kms_key.secrets.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for secrets"
  value       = aws_kms_key.secrets.arn
}

output "secrets_prefix" {
  description = "Secrets Manager prefix for application secrets"
  value       = "${var.project_name}/${var.environment}"
}

output "provider_keys_secret_arn" {
  description = "ARN of provider API keys secret"
  value       = aws_secretsmanager_secret.provider_keys.arn
}

output "ml_config_secret_arn" {
  description = "ARN of ML configuration secret"
  value       = aws_secretsmanager_secret.ml_config.arn
}

output "dagster_config_secret_arn" {
  description = "ARN of Dagster configuration secret"
  value       = aws_secretsmanager_secret.dagster_config.arn
}
