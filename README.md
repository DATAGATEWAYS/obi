
# OBI Platform

A multifunctional system that includes a Telegram bot, AI API, web interface, and PostgreSQL database – all containerized with Docker.

## 📦 Tech Stack

- Python
- Docker + Docker Compose
- PostgreSQL
- FastAPI
- Telegram Bot API

## 🚀 Features

- Telegram bot integration
- AI processing API
- Web client interface
- PostgreSQL database
- Modular architecture with Docker services

## 📁 Project Structure

```
.
├── admin/              # Admin panel (currently commented out)
├── bots/               # Telegram & WhatsApp bots
├── core/               # Core logic
├── services/           # AI API and DB init
├── web/                # Web interface
├── adapters/           # Adapter components
├── .env                # Environment variables
├── docker-compose.yml  # Docker Compose config
```

## 🛠️ Local Setup (Using Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/DATAGATEWAYS/obi
cd obi
```

### 2. Ensure Docker & Docker Compose are Installed

This script will automatically download Docker
```bash
chmod +x install_docker.sh
./install_docker.sh
```

### 3. Create an `.env` file

Ensure the `.env` file exists and contains required environment variables. You can use the provided one or customize as needed.

### 4. Build and Start the Services

```bash
docker compose up --build
```

This will spin up:

- Telegram bot
- AI API (on port 8000)
- PostgreSQL database
- Web interface

## 🌐 Deployment on DigitalOcean

### Option 1: Using Droplet (Recommended for MVP)

1. Create a Droplet with Ubuntu 22.04
2. SSH into your server:
```bash
ssh root@your_droplet_ip
```

3. Install Docker & Docker Compose:
```bash
apt update && apt install -y docker.io curl
curl -sSL https://get.docker.com | sh
```

4. Upload your project:
```bash
git clone https://github.com/DATAGATEWAYS/obi
cd obi
```
Or use `scp` to upload your ZIP archive.

5. Start services:
```bash
docker compose up --build
```
to shut down services use:
```bash
docker compose down
```

### Option 2: DigitalOcean App Platform (Optional)

This approach supports Git-based deployments, but requires splitting services and may be less flexible.

## 💡 Recommended Droplet Plan for MVP

- **Basic Plan**: 1 vCPU, 1 GB RAM, 25 GB SSD — $5/month
    - Ideal for lightweight bots and APIs
- **Standard Plan**: 2 vCPU, 2 GB RAM — $10/month
    - Recommended if AI processing is heavy or for future scaling

## 📌 Notes

- WhatsApp bot and Admin panel are currently commented out in `docker-compose.yml`
- Make sure to review and adjust environment variables in `.env`
- Consider setting up a domain name and HTTPS using Nginx or Caddy if exposed publicly (for obi website)

## ✅ TODO

- Enable WhatsApp bot
- Enable Admin panel
- Add monitoring/logging (e.g., Prometheus, Grafana)

---

**MIT License**
