terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ── Local for common billing mode ─────────────────────────────────────────────
locals {
  billing = "PAY_PER_REQUEST"
}

# ── Users table ───────────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "users" {
  name         = "${var.prefix}-users"
  billing_mode = local.billing
  hash_key     = "email"

  attribute {
    name = "email"
    type = "S"
  }

  tags = var.tags
}

# ── Teachers table ────────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "teachers" {
  name         = "${var.prefix}-teachers"
  billing_mode = local.billing
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # GSI to query by department
  global_secondary_index {
    name            = "department-index"
    hash_key        = "department"
    projection_type = "ALL"
  }

  attribute {
    name = "department"
    type = "S"
  }

  tags = var.tags
}

# ── Students table ────────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "students" {
  name         = "${var.prefix}-students"
  billing_mode = local.billing
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # GSI to query by email
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  attribute {
    name = "email"
    type = "S"
  }

  tags = var.tags
}

# ── Join Requests table ───────────────────────────────────────────────────────
resource "aws_dynamodb_table" "join_requests" {
  name         = "${var.prefix}-join-requests"
  billing_mode = local.billing
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # GSI to query by studentEmail
  global_secondary_index {
    name            = "studentEmail-index"
    hash_key        = "studentEmail"
    projection_type = "ALL"
  }

  attribute {
    name = "studentEmail"
    type = "S"
  }

  tags = var.tags
}

# ── Marks table ───────────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "marks" {
  name         = "${var.prefix}-marks"
  billing_mode = local.billing
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = var.tags
}

# ── Attendance table ──────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "attendance" {
  name         = "${var.prefix}-attendance"
  billing_mode = local.billing
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = var.tags
}

# ── Announcements table ───────────────────────────────────────────────────────
resource "aws_dynamodb_table" "announcements" {
  name         = "${var.prefix}-announcements"
  billing_mode = local.billing
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = var.tags
}

# ── Fees table ────────────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "fees" {
  name         = "${var.prefix}-fees"
  billing_mode = local.billing
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = var.tags
}
