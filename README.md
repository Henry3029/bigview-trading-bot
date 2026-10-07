# 🎙️ Bigview: Voice-Controlled Trading & Ecosystem Management

Bigview is an advanced, multi-engine trading assistant integrated with Amazon Alexa and powered by a secure Node.js backend. It enables hands-free portfolio tracking, active position monitoring, and ecosystem-wide emergency controls (such as a multi-turn kill switch) using voice commands and visual APL (Alexa Presentation Language) cards.

---

## ✨ Key Features

* **Voice-Controlled Trading Actions:** Check portfolio balances, review active positions, and fetch trade histories completely hands-free.
* **Multi-Turn Safety Protocols:** Built-in confirmation workflows (e.g., executing an emergency kill switch across multiple trading engines requires explicit voice confirmation to prevent accidental triggers).
* **Visual APL Dashboards:** Renders dynamic visual cards on supported Alexa devices (like Echo Show simulators) alongside voice feedback.
* **Secure Backend API:** Handles account linking tokens, API key routing, and state management securely via Express.

---

## 🗣️ Voice Commands & Utterances

* **Invocation Name:** `big view`
* **Sample Utterances:**
  * *"Alexa, open big view."*
  * *"How much is my portfolio worth?"*
  * *"What are my top holdings?"*
  * *"Check trading engine status."*
  * *"Alexa, ask big view to pause trading."*
  * *"Resume the bot"*
  * *"Alexa, ask big view what is the price of Bitcoin?"*
  * *"Alexa, ask big view how is Ethereum performing today?"*
  * *"Show recent activity."*
  * *"What is the bot currently doing?"*

---

## 👨‍⚖️ Instructions for Judges (Evaluation & Testing)

Because Amazon Alexa skills in development mode require specific testing handles, we have provided a companion web dashboard hosted on Vercel so you can easily review the application interface, test data, and account configurations.

### 1. Exploring the Web Dashboard
You can log in to the live web platform to inspect the account layout and analytics without setting up live exchange API keys. Use the following mock credentials:
* **Email / Username:** `judge_demo@example.com`
* **Password:** `Hackathon2026`

> **Note on Sample Data:** Logging in with these credentials grants access to a pre-configured sandbox profile populated with sample data, including simulated active positions on WEEX, historical trade logs, and mock portfolio balances so you can evaluate the UI and backend response behavior immediately.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express, TypeScript
* **Voice & UI:** Alexa Skills Kit (ASK), Alexa Presentation Language (APL)
* **Frontend Dashboard:** React / Next.js deployed on Vercel
* **Security & Auth:** OAuth2 Account Linking, Secure Session Handlers

---

## 🚀 Getting Started & Local Setup

### 1. Backend & Alexa Fulfillment Setup
```bash
# Clone repository
git clone [https://github.com/Henry3029/bigview-trading-bot.git](https://github.com/Henry3029/bigview-trading-bot.git)
cd bigview-trading-bot

# Install dependencies
npm install

Create and configure your .env file:

PORT=3001
MONGO_URI=mongodb://localhost:27017/dbname
ALEXA_SKILL_ID=your_alexa_skill_id
EXCHANGE_API_KEY=your_api_key
EXCHANGE_SECRET_KEY=your_secret_key

Run the local development server:
npm run dev

Frontend Setup
cd client

# Install dependencies
npm install


Create and configure your .env.local file:

NEXT_PUBLIC_SOCKET_URL=http://localhost:3002


Run the Next.js dashboard:
npm run dev


AWS EC2 Production Deployment

# SSH into AWS EC2 Instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install PM2 Process Manager globally
npm install -g pm2

# Build and start Backend Server on EC2 (Assuming TypeScript is compiled to JS via dist/)
cd server
npm run build
pm2 start dist/server.js --name "bigview-engine"
pm2 save
pm2 startup


<Elicitations message="What would you like to do next?">
  <Elicitation label="Add Vercel link" query="Do you want to insert your production Vercel link into the header section?"/>
  <Elicitation label="Final submission wrap-up" query="Are you ready to copy this directly into your GitHub repository's README?"/>
</Elicitations>