# Main Terraform Configuration for Catalyst Prediction Platform
# Production-grade AWS infrastructure with lakehouse architecture

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    # Configure backend per environment
    # bucket         = "biotech-terminal-terraform-state"
    # key            = "env/${var.environment}/terraform.tfstate"
    # region         = "us-east-1"
    # encrypt        = true
    # dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Biotech Terminal"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "Data Engineering"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Variables
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "biotech-terminal"
}

variable "github_org" {
  description = "GitHub organization for OIDC"
  type        = string
  default     = "deathknight2002"
}

variable "github_repo" {
  description = "GitHub repository for OIDC"
  type        = string
  default     = "terminal-ui-biotech-GG"
}

# Modules
module "networking" {
  source = "./modules/networking"
  
  environment  = var.environment
  project_name = var.project_name
  aws_region   = var.aws_region
}

module "storage" {
  source = "./modules/storage"
  
  environment  = var.environment
  project_name = var.project_name
  aws_region   = var.aws_region
}

module "database" {
  source = "./modules/database"
  
  environment         = var.environment
  project_name        = var.project_name
  vpc_id              = module.networking.vpc_id
  private_subnet_ids  = module.networking.private_subnet_ids
  database_subnet_ids = module.networking.database_subnet_ids
}

module "secrets" {
  source = "./modules/secrets"
  
  environment  = var.environment
  project_name = var.project_name
}

module "github_oidc" {
  source = "./modules/github_oidc"
  
  environment  = var.environment
  project_name = var.project_name
  github_org   = var.github_org
  github_repo  = var.github_repo
}

module "compute" {
  source = "./modules/compute"
  
  environment          = var.environment
  project_name         = var.project_name
  vpc_id               = module.networking.vpc_id
  private_subnet_ids   = module.networking.private_subnet_ids
  lakehouse_bucket_arn = module.storage.lakehouse_bucket_arn
  secrets_kms_key_arn  = module.secrets.kms_key_arn
}

# Outputs
output "lakehouse_bucket" {
  description = "S3 bucket for lakehouse storage"
  value       = module.storage.lakehouse_bucket_name
}

output "database_endpoint" {
  description = "RDS Postgres endpoint"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "secrets_manager_prefix" {
  description = "Secrets Manager prefix for application secrets"
  value       = module.secrets.secrets_prefix
}

output "github_oidc_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC"
  value       = module.github_oidc.role_arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}
