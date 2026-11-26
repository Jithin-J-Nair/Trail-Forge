terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "trailforge-terraform-state-dev"
    key            = "envs/dev/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "trailforge-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "trailforge"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "network" {
  source      = "../../modules/network"
  environment = var.environment
  cidr_block  = var.vpc_cidr
}

module "rds_postgis" {
  source             = "../../modules/rds_postgis"
  environment        = var.environment
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  db_name            = "trailforge"
  db_username        = "trailforge_app"
  instance_class     = "db.t4g.medium"
}

module "redis" {
  source             = "../../modules/redis"
  environment        = var.environment
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
}

module "s3" {
  source      = "../../modules/s3"
  environment = var.environment
}
