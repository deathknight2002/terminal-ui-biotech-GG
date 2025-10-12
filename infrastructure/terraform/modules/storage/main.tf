# S3 Lakehouse Storage Module
# Implements Apache Iceberg table layout with raw provider data storage

resource "aws_s3_bucket" "lakehouse" {
  bucket = "${var.project_name}-lakehouse-${var.environment}"
  
  tags = {
    Name        = "${var.project_name}-lakehouse"
    Environment = var.environment
    Purpose     = "Data Lakehouse"
  }
}

resource "aws_s3_bucket_versioning" "lakehouse" {
  bucket = aws_s3_bucket.lakehouse.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lakehouse" {
  bucket = aws_s3_bucket.lakehouse.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "lakehouse" {
  bucket = aws_s3_bucket.lakehouse.id
  
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
  
  rule {
    id     = "expire-old-versions"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_public_access_block" "lakehouse" {
  bucket = aws_s3_bucket.lakehouse.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Artifacts bucket for model artifacts
resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.project_name}-artifacts-${var.environment}"
  
  tags = {
    Name        = "${var.project_name}-artifacts"
    Environment = var.environment
    Purpose     = "ML Model Artifacts"
  }
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
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

variable "aws_region" {
  description = "AWS region"
  type        = string
}

# Outputs
output "lakehouse_bucket_name" {
  description = "Lakehouse S3 bucket name"
  value       = aws_s3_bucket.lakehouse.id
}

output "lakehouse_bucket_arn" {
  description = "Lakehouse S3 bucket ARN"
  value       = aws_s3_bucket.lakehouse.arn
}

output "artifacts_bucket_name" {
  description = "Artifacts S3 bucket name"
  value       = aws_s3_bucket.artifacts.id
}

output "artifacts_bucket_arn" {
  description = "Artifacts S3 bucket ARN"
  value       = aws_s3_bucket.artifacts.arn
}
