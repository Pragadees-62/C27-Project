# ── IAM Role for EC2 to access DynamoDB ──────────────────────────────────────

resource "aws_iam_role" "ec2_dynamodb_role" {
  name = "${var.prefix}-ec2-dynamodb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${var.prefix}-dynamodb-access"
  role = aws_iam_role.ec2_dynamodb_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:DescribeTable"
      ]
      Resource = [
        "arn:aws:dynamodb:${var.aws_region}:*:table/${var.prefix}-*",
        "arn:aws:dynamodb:${var.aws_region}:*:table/${var.prefix}-*/index/*"
      ]
    }]
  })
}

# Instance profile — this is what you attach to the EC2 instance
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.prefix}-ec2-instance-profile"
  role = aws_iam_role.ec2_dynamodb_role.name
}

output "instance_profile_name" {
  description = "Attach this instance profile to your EC2 instance"
  value       = aws_iam_instance_profile.ec2_profile.name
}
