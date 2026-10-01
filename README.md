# Market Intelligence by Job Bangpla 📈

A high-performance, dark-themed trading terminal stock scanner dashboard with automated data fetching, technical indicator rule engine (EMA 20, RSI 14, MACD), bilingual (Thai / English) support, and 24/7 automated GitHub Actions pipeline.

## 🚀 Key Features

- **Trading Terminal UI**: Built with HTML5, Tailwind CSS, and Vanilla JavaScript. Features a live real-time clock, quick ticker bar, responsive layout, and Bloomberg/TradingView terminal aesthetics.
- **Multi-Market Screening**:
  - **US Stocks** (NVDA, AAPL, MSFT, TSLA, AMD, META, AMZN, etc.)
  - **Thai Stocks** (DELTA, PTT, CPALL, KBANK, AOT, GULF, BDMS, etc.)
  - **TFEX Futures** (S50 Index, Gold Online, Silver, USD Futures)
  - **Crypto** (BTC, ETH, SOL, BNB, XRP, DOGE, AVAX)
- **Technical Indicator Screener**:
  - **Trend**: Exponential Moving Average (EMA 20) status
  - **Momentum**: Relative Strength Index (RSI 14) with visual gauge & overbought/oversold presets
  - **Signal**: Moving Average Convergence Divergence (MACD 12, 26, 9) histogram & crossovers
  - **Decision Engine**: Action Signals (`BUY` / `WAIT` / `PASS`) with confidence scores
- **Bilingual Interface**: Instant switcher between **Thai (TH)** and **English (EN)** with persistent preferences.
- **Automated 24/7 Pipeline**:
  - `scanner.py`: Python engine powered by `yfinance` & `pandas`.
  - `.github/workflows/update-data.yml`: GitHub Actions cron job that runs at 23:00 Bangkok time (16:00 UTC) every weekday to refresh data and commit to Git.
  - **Cloudflare Pages**: Free zero-config deployment tracking your repository.

---

## 📂 Project Structure

```text
├── index.html                           # Main dashboard interface (Tailwind CSS)
├── app.js                               # Frontend engine, bilingual i18n & dynamic tables
├── scanner.py                           # Python technical screening & rule engine
├── requirements.txt                     # Python dependencies (yfinance, pandas, numpy)
├── data/
│   └── scan-results.json                # Latest scanned market results JSON
├── .github/
│   └── workflows/
│       └── update-data.yml              # GitHub Actions automated cron schedule
└── README.md
```

---

## 🛠️ Step-by-Step Setup Guide

### 1. Push Code to GitHub

Open Terminal in this directory and run:

```bash
git init
git add .
git commit -m "Initial commit: Market Intelligence by Job Bangpla"
git branch -M main
git remote add origin https://github.com/Ittipat10/market-intelligence-by-job-bangpla.git
git push -u origin main
```

*(Note: If you already have files on GitHub like a default README, run `git pull origin main --rebase` before `git push -u origin main`)*

---

### 2. Enable GitHub Actions Permissions

To allow GitHub Actions to commit updated data back to your repository:
1. Go to your repository on GitHub: `https://github.com/Ittipat10/market-intelligence-by-job-bangpla`
2. Click **Settings** -> **Actions** -> **General**
3. Scroll down to **Workflow permissions**
4. Select **Read and write permissions**
5. Click **Save**

---

### 3. Deploy to Cloudflare Pages (Free & Instant)

1. Sign in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**
3. Select your GitHub repository: `Ittipat10/market-intelligence-by-job-bangpla`
4. Set Build Settings:
   - **Framework preset**: `None`
   - **Build command**: *(Leave empty)*
   - **Build output directory**: `/` *(Root directory)*
5. Click **Save and Deploy**
6. Cloudflare will generate a public URL (e.g., `https://market-intelligence-by-job-bangpla.pages.dev`)

---

### 4. 24/7 Automated Updates

- Every Monday through Friday at **23:00 น. (Bangkok Time)**, GitHub Actions will trigger `scanner.py`.
- It recalculates indicators using live market data and commits `data/scan-results.json`.
- Cloudflare Pages detects the commit and automatically refreshes your live dashboard in seconds!
