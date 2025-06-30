#!/bin/bash

set -e

echo "[1/7] Updating package index..."
sudo apt update

echo "[2/7] Installing dependencies..."
sudo apt install -y ca-certificates curl gnupg lsb-release

echo "[3/7] Adding Docker’s official GPG key..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg |   sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "[4/7] Setting up the Docker repository..."
echo   "deb [arch=$(dpkg --print-architecture)   signed-by=/etc/apt/keyrings/docker.gpg]   https://download.docker.com/linux/ubuntu   $(lsb_release -cs) stable" |   sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "[5/7] Updating package index with Docker packages..."
sudo apt update

echo "[6/7] Installing Docker Engine and related tools..."
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "[7/7] Adding user to docker group (no need for sudo)..."
sudo usermod -aG docker $USER

echo "✅ Docker installation complete. Please log out and log back in or run 'newgrp docker'."
docker --version
docker compose version
