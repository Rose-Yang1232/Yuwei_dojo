#!/bin/bash

# Exit if any command fails
set -e

DOCKERHUB_USERNAME="Roseeeee11111"
IMAGE_NAME="pwncollege/challenge-legacy:latest"
TAG="latest"  

# Build the Docker image
echo "Building Docker image..."
docker build -t $DOCKERHUB_USERNAME/$IMAGE_NAME:$TAG .

# Push to Docker Hub
echo "Pushing image to Docker Hub..."
docker push $DOCKERHUB_USERNAME/$IMAGE_NAME:$TAG

echo " Done! Image pushed to Docker Hub: $DOCKERHUB_USERNAME/$IMAGE_NAME:$TAG"
