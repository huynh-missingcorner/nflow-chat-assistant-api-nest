#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env

# Build the Docker image
docker build -t ecommerce-api .

# Login to Amazon ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI

# Tag the image
docker tag ecommerce-api:latest $ECR_REPOSITORY_URI:latest

# Push the image to ECR
docker push $ECR_REPOSITORY_URI:latest

# Update the ECS service with the new task definition
aws ecs update-service \
  --cluster ecommerce-cluster \
  --service ecommerce-api-service \
  --task-definition ecommerce-api \
  --force-new-deployment \
  --region $AWS_REGION

echo "Deployment completed successfully!"
