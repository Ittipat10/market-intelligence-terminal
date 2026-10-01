#!/usr/bin/env python3
"""
Market Intelligence by Job Bangpla
Automated Technical Screener & Rule Engine
Fetches market data via yfinance, calculates EMA 20, RSI 14, and MACD (12, 26, 9),
and generates data/scan-results.json.
"""

import json
import os
import sys
from datetime import datetime
import pandas as pd
import yfinance as yf

# Configuration: Tickers to scan by category
WATCHLIST = {
    "us_stocks": [
        {"ticker": "NVDA", "name": "NVIDIA Corporation", "symbol": "NVDA"},
        {"ticker": "AAPL", "name": "Apple Inc.", "symbol": "AAPL"},
        {"ticker": "TSLA", "name": "Tesla, Inc.", "symbol": "TSLA"},
        {"ticker": "MSFT", "name": "Microsoft Corporation", "symbol": "MSFT"},
        {"ticker": "AMD", "name": "Advanced Micro Devices", "symbol": "AMD"},
        {"ticker": "INTC", "name": "Intel Corporation", "symbol": "INTC"},
        {"ticker": "META", "name": "Meta Platforms, Inc.", "symbol": "META"},
        {"ticker": "AMZN", "name": "Amazon.com, Inc.", "symbol": "AMZN"},
        {"ticker": "GOOGL", "name": "Alphabet Inc.", "symbol": "GOOGL"},
        {"ticker": "AVGO", "name": "Broadcom Inc.", "symbol": "AVGO"}
    ],
    "thai_stocks": [
        {"ticker": "DELTA.BK", "name": "Delta Electronics Thailand", "symbol": "DELTA.BK"},
        {"ticker": "PTT.BK", "name": "PTT Public Company Limited", "symbol": "PTT.BK"},
        {"ticker": "CPALL.BK", "name": "CP ALL Public Company", "symbol": "CPALL.BK"},
        {"ticker": "KBANK.BK", "name": "Kasikornbank", "symbol": "KBANK.BK"},
        {"ticker": "AOT.BK", "name": "Airports of Thailand", "symbol": "AOT.BK"},
        {"ticker": "GULF.BK", "name": "Gulf Energy Development", "symbol": "GULF.BK"},
        {"ticker": "BDMS.BK", "name": "Bangkok Dusit Medical Services", "symbol": "BDMS.BK"},
        {"ticker": "ADVANC.BK", "name": "Advanced Info Service", "symbol": "ADVANC.BK"},
        {"ticker": "SCB.BK", "name": "SCB X Public Company", "symbol": "SCB.BK"},
        {"ticker": "PTTEP.BK", "name": "PTT Exploration and Production", "symbol": "PTTEP.BK"}
    ],
    "tfex": [
        {"ticker": "S50M26", "name": "SET50 Index Futures M26", "symbol": "^SET50.BK"},
        {"ticker": "S50U26", "name": "SET50 Index Futures U26", "symbol": "^SET.BK"},
        {"ticker": "GOM26", "name": "Gold Online Futures M26", "symbol": "GC=F"},
        {"ticker": "SVFM26", "name": "Silver Online Futures M26", "symbol": "SI=F"},
        {"ticker": "USDM26", "name": "USD Futures M26", "symbol": "THB=X"}
    ],
    "crypto": [
        {"ticker": "BTC/USDT", "name": "Bitcoin", "symbol": "BTC-USD"},
        {"ticker": "ETH/USDT", "name": "Ethereum", "symbol": "ETH-USD"},
        {"ticker": "SOL/USDT", "name": "Solana", "symbol": "SOL-USD"},
        {"ticker": "BNB/USDT", "name": "BNB", "symbol": "BNB-USD"},
        {"ticker": "XRP/USDT", "name": "Ripple", "symbol": "XRP-USD"},
        {"ticker": "DOGE/USDT", "name": "Dogecoin", "symbol": "DOGE-USD"},
        {"ticker": "AVAX/USDT", "name": "Avalanche", "symbol": "AVAX-USD"}
    ]
}


def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculate standard Wilder's Relative Strength Index (RSI)."""
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()

    rs = avg_gain / avg_loss.replace(0, 0.00001)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return rsi


def format_volume(vol: float) -> str:
    """Format large numbers into human-readable strings (e.g., 52.4M, 1.2B)."""
    if pd.isna(vol) or vol <= 0:
        return "--"
    if vol >= 1_000_000_000:
        return f"{vol / 1_000_000_000:.2f}B"
    if vol >= 1_000_000:
        return f"{vol / 1_000_000:.1f}M"
    if vol >= 1_000:
        return f"{vol / 1_000:.1f}K"
    return f"{int(vol):,}"


def scan_symbol(item: dict) -> dict:
    """Download data for a single symbol and calculate indicators."""
    symbol = item["symbol"]
    display_ticker = item["ticker"]
    display_name = item["name"]

    try:
        # Download historical daily data for the past 60 days
        ticker_obj = yf.Ticker(symbol)
        df = ticker_obj.history(period="60d", interval="1d")

        if df is None or len(df) < 26:
            print(f"Warning: Insufficient data for {symbol} ({len(df) if df is not None else 0} bars)")
            return None

        # Extract Close prices
        close = df["Close"]
        volume = df["Volume"].iloc[-1] if "Volume" in df else 0

        # Current Price and Previous Close
        last_price = float(close.iloc[-1])
        prev_close = float(close.iloc[-2])
        change_pct = ((last_price - prev_close) / prev_close) * 100.0

        # 1. EMA 20
        ema20_series = close.ewm(span=20, adjust=False).mean()
        ema20_val = float(ema20_series.iloc[-1])
        ema_diff_pct = ((last_price - ema20_val) / ema20_val) * 100.0

        if abs(ema_diff_pct) < 0.2:
            ema20_status = "At EMA 20"
        elif last_price > ema20_val:
            ema20_status = "Above EMA 20"
        else:
            ema20_status = "Below EMA 20"

        # 2. RSI 14
        rsi_series = calculate_rsi(close, 14)
        rsi14 = float(rsi_series.iloc[-1])
        if pd.isna(rsi14):
            rsi14 = 50.0

        # 3. MACD (12, 26, 9)
        ema12 = close.ewm(span=12, adjust=False).mean()
        ema26 = close.ewm(span=26, adjust=False).mean()
        macd_line = ema12 - ema26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        histogram = macd_line - signal_line

        curr_macd = float(macd_line.iloc[-1])
        curr_sig = float(signal_line.iloc[-1])
        curr_hist = float(histogram.iloc[-1])
        prev_hist = float(histogram.iloc[-2])

        # Trend Evaluation
        if curr_hist > 0 and prev_hist <= 0:
            trend = "Bullish Crossover"
        elif curr_hist > 0 and curr_hist > prev_hist:
            trend = "Bullish Momentum"
        elif curr_hist > 0:
            trend = "Bullish"
        elif curr_hist < 0 and prev_hist >= 0:
            trend = "Bearish Breakdown"
        elif curr_hist < 0 and curr_hist < prev_hist:
            trend = "Bearish Momentum"
        else:
            trend = "Neutral"

        # 4. Action Signal & Confidence Score
        # Rule: Bullish if Above EMA 20 + MACD Hist > 0 + RSI in healthy zone (40 - 75)
        bullish_score = 0
        if ema20_status == "Above EMA 20":
            bullish_score += 40
        if curr_hist > 0:
            bullish_score += 35
        if 45 <= rsi14 <= 70:
            bullish_score += 25
        elif 35 <= rsi14 < 45 or 70 < rsi14 <= 78:
            bullish_score += 15

        if bullish_score >= 75 and rsi14 < 78:
            action_signal = "BUY"
            confidence = f"{min(98, bullish_score)}%"
        else:
            action_signal = "WAIT"
            confidence = f"{max(50, 100 - bullish_score)}%"

        return {
            "ticker": display_ticker,
            "name": display_name,
            "price": round(last_price, 2 if last_price >= 1 else 4),
            "change": round(change_pct, 2),
            "ema20_status": ema20_status,
            "ema20_value": round(ema20_val, 2 if ema20_val >= 1 else 4),
            "rsi14": round(rsi14, 1),
            "macd": {
                "value": round(curr_macd, 2 if abs(curr_macd) >= 1 else 4),
                "signal": round(curr_sig, 2 if abs(curr_sig) >= 1 else 4),
                "histogram": round(curr_hist, 2 if abs(curr_hist) >= 1 else 4),
                "trend": trend
            },
            "action_signal": action_signal,
            "volume": format_volume(volume),
            "confidence": confidence
        }

    except Exception as e:
        print(f"Error scanning {symbol}: {e}")
        return None


def run_scanner():
    """Main execution function to scan all watchlists and save JSON."""
    print("=" * 60)
    print("Market Intelligence by Job Bangpla - Screener Engine")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    results = {}
    output_dir = "data"
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "scan-results.json")

    for category, items in WATCHLIST.items():
        print(f"\nScanning category: {category} ({len(items)} tickers)...")
        cat_results = []
        for item in items:
            print(f"  Fetching {item['ticker']} ({item['symbol']})...", end=" ")
            res = scan_symbol(item)
            if res:
                cat_results.append(res)
                print(f"OK [Price: {res['price']}, Signal: {res['action_signal']}]")
            else:
                print("FAILED (Skipped)")

        results[category] = cat_results

    # Save to JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n[SUCCESS] Scan results successfully written to {output_file}")


if __name__ == "__main__":
    run_scanner()
