variable "aws_region" {
  description = "AWS region to deploy DynamoDB tables"
  type        = string
  default     = "ap-south-1"   # Mumbai — change to your region
}

variable "prefix" {
  description = "Prefix for all DynamoDB table names"
  type        = string
  default     = "sms"
}

variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default = {
    Project     = "EduPrime-SMS"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}
