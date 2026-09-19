# ⚡ Voice-Enabled Algorithmic Trading Bot | Powered by Alexa+ & AWS

An automated, full-stack dual-engine algorithmic trading engine hosted on AWS EC2, integrated with an Alexa+ skill interface and a real-time React monitoring terminal. Users can manage trades, monitor engine performance, and receive real-time execution updates via voice commands or the streaming console interface.

---

## 🎯 Value & User Automation Benefits

Automated execution paired with Alexa+ voice controls provides traders key advantages over manual platforms:

* **🎙️ Voice-Controlled Command & Control:** Query live strategy status, total PnL, and individual engine performance hands-free using natural Alexa+ voice interactions.
* **⚡ 24/7 Low-Latency Execution:** Backend server runs continuously on AWS EC2, ensuring strategies run non-stop without needing active browser sessions.
* **🛡️ Systematic Risk Controls:** Enforces automated Stop-Loss (SL) and Take-Profit (TP) parameters to eliminate emotional trading mistakes.
* **📊 Dual-Engine Strategy Architecture:**
  * **Engine 1 (Major Assets):** Low-volatility execution focused on high-liquidity assets (BTC, ETH, SOL).
  * **Engine 2 (Momentum Altcoins):** High-volatility momentum execution for altcoins.
* **📡 Real-Time Observability:** Live execution logs and market ticks stream directly to a custom web terminal console via WebSockets.

---

## 🏗️ System Architecture & Connection Flow

## 🛠️ Tech Stack & Amazon Tools

* **Voice Integration:** Alexa+ Skill SDK & Webhooks
* **Cloud Infrastructure:** AWS EC2 (Ubuntu instance running PM2 process manager), AWS CloudWatch
* **AI Developer Tooling:** Amazon Q Developer (used for generating Alexa+ handlers and WebSocket routes)
* **Backend Runtime:** Node.js, Express.js, Socket.io (WebSockets)
* **Frontend Console:** React, Next.js, Tailwind CSS

---

## 🚀 Getting Started & Local Setup

### 1. Backend & Alexa Fulfillment Setup
```bash
# Clone repository
git clone [https://github.com/Henry3029/bigview-trading-bot](https://github.com/Henry3029/bigview-trading-bot)
cd bigview-trading-bot

# Install dependencies
npm install
Configure Environment Variables (.env)
PORT=3001
MONGO_URI=mongodb://localhost:27017/dbname
ALEXA_SKILL_ID=your_alexa_skill_id
EXCHANGE_API_KEY=your_api_key
EXCHANGE_SECRET_KEY=your_secret_key

# Run local development server
npm run dev

Frontend Setup
Bash
cd ../client

# Install dependencies
npm install

# Configure Environment Variables (.env.local)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002

# Run Next.js dashboard
npm run dev

🌐 AWS EC2 Production Deployment
Bash
# SSH into AWS EC2 Instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install PM2 Process Manager globally
npm install -g pm2

# Start Backend Server on EC2
cd server
pm2 start AI.ts --name "trading-engine"
pm2 save
pm2 startup
