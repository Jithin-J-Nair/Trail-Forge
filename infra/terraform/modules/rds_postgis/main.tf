variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "db_name" { type = string }
variable "db_username" { type = string }
variable "instance_class" { type = string }

resource "aws_db_subnet_group" "this" {
  name       = "trailforge-${var.environment}-db"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "db" {
  name   = "trailforge-${var.environment}-db"
  vpc_id = var.vpc_id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "trailforge-${var.environment}-db-sg" }
}

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "aws_db_instance" "this" {
  identifier              = "trailforge-${var.environment}-postgis"
  engine                  = "postgres"
  engine_version          = "16.4"
  instance_class          = var.instance_class
  allocated_storage       = 50
  max_allocated_storage   = 200
  db_name                 = var.db_name
  username                = var.db_username
  password                = random_password.db.result
  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  storage_encrypted       = true
  backup_retention_period = 7
  multi_az                = var.environment == "prod"
  publicly_accessible     = false
  skip_final_snapshot     = var.environment != "prod"
  deletion_protection     = var.environment == "prod"
  apply_immediately       = var.environment != "prod"
  tags                    = { Name = "trailforge-${var.environment}-postgis" }
}

terraform { required_providers { random = { source = "hashicorp/random" } } }

output "endpoint" { value = aws_db_instance.this.address }
output "port" { value = aws_db_instance.this.port }
output "security_group_id" { value = aws_security_group.db.id }
output "password" { value = random_password.db.result; sensitive = true }
