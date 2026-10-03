variable "aws_region" {
  description = "AWS region for the RateStack host (e.g. ap-south-1)"
  type        = string
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS AMI ID for the selected region"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type (t3.xlarge recommended: Jenkins + SonarQube + Kind are heavy)"
  type        = string
  default     = "t3.xlarge"
}

variable "public_key_path" {
  description = "Path to the SSH public key to register as the deployer key (e.g. ~/.ssh/id_rsa.pub)"
  type        = string
}
