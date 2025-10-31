# OBI — Telegram Mini App with Web3 quizzes and NFT badges

> The project evolved from a bot with an AI agent into a full-fledged Telegram Mini App with Web3 quizzes, NFT minting, and viewing
> transaction history on Polygon.

## 🚀 What is it

OBI is an educational mini-application inside Telegram where users take short quizzes on blockchain and Web3,
earn NFT badges, and can view their on-chain activity via PolygonScan.

Key features:

- **Web3 quizzes** (questions, progress, history).
- **Minting NFT badges** for achievements.
- **Transaction history** and assets via the PolygonScan API.
- **Authentication and wallets** (embedded wallet via Privy).

## 🧱 Technologies

- **Mini App (frontend):** Next.js, TypeScript, React.
- **AI/API (backend):** Python, FastAPI, Hardhat.
- **Database:** PostgreSQL.
- **Infrastructure:** Docker + Docker Compose.

## 📦 Repository structure

```
.
├── mini_app/            # Next.js Telegram Mini App (quizzes, wallets, minting, view tx)
├── services/
│   ├── ai_api/          # FastAPI: NFT minting, proxy to PolygonScan, quiz API
│   └── db_init/         # initialization
├── bots/
│   └── telegram_bot/    # bot to launch the Mini App, callbacks, service flows
├── web/                 # project website
├── docker-compose.yml
└── README.md
```

## 🔑 Environment variables

### Mini App (Next.js)

```
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here    # App ID from the Privy dashboard (used in the browser)
API_URL=https://<domain-API>:<port>                # Base backend (FastAPI) URL, no trailing /
```

### AI API (FastAPI)

```
TELEGRAM_BOT_TOKEN=                                # bot token from @BotFather
WEBAPP_URL=                                        # production URL of the Mini App (used for button/menu)

# Integrations/AI
DEEPSEEK_API_KEY=                                  # key for DeepSeek (if you use generation/validation)

# Database
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
DATABASE_URL=                                      # e.g.: postgres://user:pass@host:5432/db

# NFT minting
AMOY_RPC_URL=                                      # RPC for Polygon Amoy (testnet, Chain ID 80002)
MINTER_PRIVATE_KEY=                                # private key of the technical minter
OBI_BADGES_ADDRESS=0x...                           # address of the ObiBadges1155 contract
OBI_BADGES_ABI_PATH=/app/contracts/ObiBadges1155.json

# Networks (for switching environments)
CHAIN_ID_TEST=                                     # e.g.: 80002 (Polygon Amoy)
CHAIN_ID_PROD=                                     # e.g.: 137 (Polygon PoS Mainnet)
```

## ▶️ Local run

### Option A. Run all services in Docker

```bash
git clone https://github.com/DATAGATEWAYS/obi
cd obi

# create .env (see the template above)
docker compose up --build
```

The following will start up:

- **db** (PostgreSQL)
- **ai_api** (FastAPI on :8000)
- **telegram_bot**
- **mini_app** (Next.js on :3000, expose a domain/tunnel for Telegram Mini Apps)

Stopping:

```bash
docker compose down
```

### Option B. Develop the Mini App without Docker

```bash
cd mini_app
pnpm i        # or npm i / yarn
pnpm dev      # http://localhost:3000
```

You can run the API in parallel:

```bash
cd services/ai_api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 🧩 Telegram Mini App — settings

1) **Create a bot in @BotFather** and enable the Mini App:

- Save `TELEGRAM_BOT_TOKEN`.
- Set **Web App / Menu Button** to the URL of your Mini App (`NEXT_PUBLIC_APP_URL`).
- Generate a direct link like `https://t.me/<bot>?startapp`.

2) **Allow the Mini App domain** in BotFather and use HTTPS.  
   For local development, use a tunnel (ngrok / local static domain) and paste the domain into the bot settings.

## 🪙 NFT minting (ObiBadges1155)

- **Contract address:** `OBI_BADGES_ADDRESS` (Polygon).
- **ABI:** `OBI_BADGES_ABI_PATH` points to the JSON ABI shipped with the service.
- **Flow:** after meeting the condition (for example, completing the first quiz) the frontend calls the `ai_api` endpoint,
  which signs/sends a transaction to Polygon.

## 🔎 Transaction history (PolygonScan)

- To display address history, use PolygonScan base calls (`/api?module=account&action=txlist&address=...`) or proxy
  through `ai_api`.
- You need a `POLYGONSCAN_API_KEY` and a correct base URL (`https://api.polygonscan.com`).

## 🧰 Docker Compose — example

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: obi
      POSTGRES_PASSWORD: obi
      POSTGRES_DB: obi
    volumes: [ db_data:/var/lib/postgresql/data ]
    ports: [ "5432:5432" ]

  ai_api:
    build: ./services/ai_api
    env_file: .env
    depends_on: [ db ]
    ports: [ "8000:8000" ]

  telegram_bot:
    build: ./bots/telegram_bot
    env_file: .env
    depends_on: [ ai_api ]
    restart: unless-stopped

  mini_app:
    build: ./mini_app
    env_file: .env
    depends_on: [ ai_api ]
    ports: [ "3000:3000" ]
    # when deploying on Vercel this service is not needed – it is deployed separately

volumes:
  db_data:
```

## 🌐 Deployment

### Option 1. Vercel (only `mini_app`)

1) Connect the `mini_app/` repository to Vercel.
2) Add environment variables:
    - `NEXT_PUBLIC_PRIVY_APP_ID`
    - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
    - and other `NEXT_PUBLIC_*` from the section above.
3) Build: `pnpm build`, Output: `.next` (default).
4) Configure the production domain in BotFather for the Mini App.

### Option 2. VPS/Droplet (all services)

1) Server Ubuntu 22.04+ (or 24.04), SSH.
2) Install Docker/Compose (an `install_docker.sh` script or the official instructions).
3) Copy the repository, create `.env`.
4) `docker compose up -d --build`.
5) Put a reverse proxy (Caddy/Nginx) with HTTPS.
6) Set the production domain of the Mini App in BotFather.

## 🧪 Quick checklist

- [ ] The Mini App opens over an HTTPS domain.
- [ ] Web App URL and domain are configured in BotFather.
- [ ] `NEXT_PUBLIC_PRIVY_APP_ID` and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` are set.
- [ ] `OBI_BADGES_ADDRESS` is specified and the ABI JSON is available.
- [ ] `POLYGON_RPC_URL` and `POLYGONSCAN_API_KEY` are valid.
- [ ] Minting works and transactions are visible on PolygonScan.

## 📄 License

MIT
