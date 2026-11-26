variable "environment" { type = string }

resource "aws_s3_bucket" "exports" {
  bucket = "trailforge-${var.environment}-exports"
  tags   = { Name = "trailforge-${var.environment}-exports" }
}

resource "aws_s3_bucket_versioning" "exports" {
  bucket = aws_s3_bucket.exports.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "exports" {
  bucket = aws_s3_bucket.exports.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
}

resource "aws_s3_bucket_public_access_block" "exports" {
  bucket                  = aws_s3_bucket.exports.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "exports_bucket_name" { value = aws_s3_bucket.exports.bucket }
output "exports_bucket_arn" { value = aws_s3_bucket.exports.arn }
