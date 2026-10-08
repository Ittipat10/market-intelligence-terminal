#!/usr/bin/env python3
"""
Market Intelligence - Weekly & Monthly EMA 10 Scanner
------------------------------------------------------
Scans:
- US Stocks (250 S&P Leaders)
- Thai Stocks (SET100)
- Cryptocurrencies (Top 100 Volume)

Strategy:
- Timeframes: Weekly (1wk) and Monthly (1mo)
- Primary Trigger: Price closes above EMA 10 (Crossover: prev_close <= prev_ema10 and curr_close > curr_ema10)
- Trend Setup: Above EMA 10 (curr_close > curr_ema10)
- High Probability Setup: Weekly Crossover while Monthly is Above EMA 10

Outputs:
- Terminal summary table highlighting fresh crossovers
- JSON file: data/scan-results-wm.json
"""

import json
import os
import sys
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
import yfinance as yf

# Import ticker lists directly from scanner.py without modifying scanner.py
try:
    from scanner import US_STOCKS_TICKERS, THAI_SET100_TICKERS, CRYPTO_TICKERS
except ImportError:
    print("[ERROR] Could not import ticker lists from scanner.py. Please verify scanner.py is in the same directory.")
    sys.exit(1)


def format_volume(vol: float) -> str:
    """Format volume numbers into human-readable units."""
    if pd.isna(vol) or vol <= 0:
        return "--"
    if vol >= 1_000_000_000:
        return f"{vol / 1_000_000_000:.2f}B"
    if vol >= 1_000_000:
        return f"{vol / 1_000_000:.1f}M"
    if vol >= 1_000:
        return f"{vol / 1_000:.1f}K"
    return f"{int(vol):,}"


def scan_symbol_weekly_monthly(symbol: str, name: str, display_ticker: str = None) -> dict:
    """
    Download Weekly (2y) and Monthly (5y) data for a given ticker.
    Calculate EMA 10 and determine crossover / trend status.
    """
    if not display_ticker:
        display_ticker = symbol

    try:
        ticker = yf.Ticker(symbol)

        # 1. Weekly Data (1wk interval, 2 years)
        df_w = ticker.history(period="2y", interval="1wk")
        if df_w is None or len(df_w) < 15:
            return None

        # 2. Monthly Data (1mo interval, 5 years)
        df_m = ticker.history(period="5y", interval="1mo")
        if df_m is None or len(df_m) < 15:
            return None

        # Clean NaN rows if any at tail
        df_w = df_w.dropna(subset=["Close"])
        df_m = df_m.dropna(subset=["Close"])

        # --- Weekly Calculations ---
        close_w = df_w["Close"]
        ema10_w = close_w.ewm(span=10, adjust=False).mean()

        curr_close_w = float(close_w.iloc[-1])
        prev_close_w = float(close_w.iloc[-2])
        curr_ema10_w = float(ema10_w.iloc[-1])
        prev_ema10_w = float(ema10_w.iloc[-2])

        is_w_cross = (prev_close_w <= prev_ema10_w) and (curr_close_w > curr_ema10_w)
        is_w_above = curr_close_w > curr_ema10_w

        if is_w_cross:
            w_status = "BULLISH_CROSS"
        elif is_w_above:
            w_status = "ABOVE_EMA10"
        else:
            w_status = "BELOW_EMA10"

        w_change_pct = ((curr_close_w - prev_close_w) / prev_close_w) * 100.0
        w_diff_ema_pct = ((curr_close_w - curr_ema10_w) / curr_ema10_w) * 100.0
        w_vol = df_w["Volume"].iloc[-1] if "Volume" in df_w else 0

        # --- Monthly Calculations ---
        close_m = df_m["Close"]
        ema10_m = close_m.ewm(span=10, adjust=False).mean()

        curr_close_m = float(close_m.iloc[-1])
        prev_close_m = float(close_m.iloc[-2])
        curr_ema10_m = float(ema10_m.iloc[-1])
        prev_ema10_m = float(ema10_m.iloc[-2])

        is_m_cross = (prev_close_m <= prev_ema10_m) and (curr_close_m > curr_ema10_m)
        is_m_above = curr_close_m > curr_ema10_m

        if is_m_cross:
            m_status = "BULLISH_CROSS"
        elif is_m_above:
            m_status = "ABOVE_EMA10"
        else:
            m_status = "BELOW_EMA10"

        m_change_pct = ((curr_close_m - prev_close_m) / prev_close_m) * 100.0
        m_diff_ema_pct = ((curr_close_m - curr_ema10_m) / curr_ema10_m) * 100.0
        m_vol = df_m["Volume"].iloc[-1] if "Volume" in df_m else 0

        # --- Overall Strategy Signal Classification ---
        if is_w_cross and is_m_cross:
            overall_signal = "DOUBLE_CROSS"
            signal_score = 100
        elif is_w_cross and is_m_above:
            overall_signal = "WEEKLY_CROSS_MONTHLY_BULL"
            signal_score = 90
        elif is_m_cross:
            overall_signal = "MONTHLY_CROSS"
            signal_score = 80
        elif is_w_cross:
            overall_signal = "WEEKLY_CROSS"
            signal_score = 75
        elif is_w_above and is_m_above:
            overall_signal = "BULLISH_TREND"
            signal_score = 60
        elif is_w_above or is_m_above:
            overall_signal = "MIXED"
            signal_score = 40
        else:
            overall_signal = "BEARISH"
            signal_score = 10

        last_price = curr_close_w

        return {
            "ticker": display_ticker,
            "raw_symbol": symbol,
            "name": name,
            "price": round(last_price, 2 if last_price >= 1 else 4),
            "overall_signal": overall_signal,
            "signal_score": signal_score,
            "has_cross_signal": bool(is_w_cross or is_m_cross),
            "weekly": {
                "status": w_status,
                "is_cross": bool(is_w_cross),
                "close": round(curr_close_w, 2 if curr_close_w >= 1 else 4),
                "ema10": round(curr_ema10_w, 2 if curr_ema10_w >= 1 else 4),
                "diff_ema_pct": round(w_diff_ema_pct, 2),
                "change_pct": round(w_change_pct, 2),
                "volume": format_volume(w_vol)
            },
            "monthly": {
                "status": m_status,
                "is_cross": bool(is_m_cross),
                "close": round(curr_close_m, 2 if curr_close_m >= 1 else 4),
                "ema10": round(curr_ema10_m, 2 if curr_ema10_m >= 1 else 4),
                "diff_ema_pct": round(m_diff_ema_pct, 2),
                "change_pct": round(m_change_pct, 2),
                "volume": format_volume(m_vol)
            }
        }
    except Exception:
        return None


def scan_category_parallel(items: list, max_workers: int = 12) -> list:
    """Scan list of tickers concurrently using ThreadPoolExecutor."""
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_map = {}
        for item in items:
            if len(item) == 2:
                symbol, name = item
                display_ticker = symbol
            else:
                symbol, name, display_ticker = item
            future = executor.submit(scan_symbol_weekly_monthly, symbol, name, display_ticker)
            future_map[future] = symbol

        for future in as_completed(future_map):
            res = future.result()
            if res:
                results.append(res)

    # Sort results by signal_score descending, then weekly change_pct descending
    results.sort(key=lambda x: (x["signal_score"], x["weekly"]["change_pct"]), reverse=True)
    return results


def print_cross_summary_table(category_name: str, items: list):
    """Print high-visibility terminal table of fresh EMA 10 crossovers."""
    crossover_items = [it for it in items if it["has_cross_signal"]]

    print("\n" + "=" * 90)
    print(f"  📌 {category_name} - สัญญาณราคาตัดขึ้น EMA 10 (CROSSOVERS)")
    print("=" * 90)

    if not crossover_items:
        print("  ไม่พบสินทรัพย์ที่มีสัญญาณตัดขึ้น EMA 10 ในรอบสแกนนี้")
        return

    # Header
    print(f" {'TICKER':<10} {'NAME':<28} {'PRICE':<10} {'WEEKLY':<18} {'MONTHLY':<18} {'SETUP':<16}")
    print("-" * 90)

    for it in crossover_items:
        ticker = it["ticker"][:9]
        name = it["name"][:26]
        price = f"{it['price']:,.2f}" if it['price'] >= 1 else f"{it['price']:.4f}"

        w_str = "🔥 CROSS" if it["weekly"]["is_cross"] else ("▲ Above" if it["weekly"]["status"] == "ABOVE_EMA10" else "▼ Below")
        m_str = "🔥 CROSS" if it["monthly"]["is_cross"] else ("▲ Above" if it["monthly"]["status"] == "ABOVE_EMA10" else "▼ Below")

        setup = it["overall_signal"]
        if setup == "DOUBLE_CROSS":
            setup_tag = "★★ DOUBLE CROSS"
        elif setup == "WEEKLY_CROSS_MONTHLY_BULL":
            setup_tag = "★ W-Cross + M-Bull"
        elif setup == "MONTHLY_CROSS":
            setup_tag = "★ Monthly Cross"
        elif setup == "WEEKLY_CROSS":
            setup_tag = "Weekly Cross"
        else:
            setup_tag = setup

        print(f" {ticker:<10} {name:<28} {price:<10} {w_str:<18} {m_str:<18} {setup_tag:<16}")

    print("-" * 90)
    print(f" รวมพบสัญญาณตัดขึ้น: {len(crossover_items)} ตัว จากทั้งหมด {len(items)} ตัวที่สแกนสำเร็จ")


def run_scanner():
    """Main execution function to scan all categories and save JSON."""
    start_time = datetime.now()
    print("=" * 90)
    print("  Market Intelligence - Weekly & Monthly EMA 10 Screener Engine")
    print(f"  Execution Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("  Strategy: Price Crosses Above EMA 10 (Weekly / Monthly)")
    print("=" * 90)

    categories = {
        "us_stocks": (US_STOCKS_TICKERS, "US Stocks (250 S&P Leaders)"),
        "thai_stocks": (THAI_SET100_TICKERS, "Thai Stocks (SET100)"),
        "crypto": (CRYPTO_TICKERS, "Crypto (Top 100 Volume)")
    }

    final_results = {
        "metadata": {
            "title": "Weekly & Monthly EMA 10 Screener",
            "timestamp": start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "strategy": "Price Crosses Above EMA 10",
            "timeframes": ["1wk", "1mo"]
        },
        "summary": {},
        "data": {}
    }

    total_scanned = 0
    total_crossovers = 0

    for cat_key, (ticker_list, label) in categories.items():
        print(f"\n[SCANNING] {label}: {len(ticker_list)} tickers...")
        scanned = scan_category_parallel(ticker_list, max_workers=14)
        final_results["data"][cat_key] = scanned
        total_scanned += len(scanned)

        cross_count = sum(1 for it in scanned if it["has_cross_signal"])
        total_crossovers += cross_count
        final_results["summary"][cat_key] = {
            "total_screened": len(scanned),
            "total_crossovers": cross_count
        }

        # Print detailed table to terminal immediately
        print_cross_summary_table(label, scanned)

    # Save output to JSON
    output_dir = "data"
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "scan-results-wm.json")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final_results, f, indent=2, ensure_ascii=False)

    duration = (datetime.now() - start_time).total_seconds()
    print("\n" + "=" * 90)
    print(f"  [SUCCESS] สแกนเสร็จสิ้นทั้งหมด {total_scanned} สินทรัพย์ ในเวลา {duration:.1f} วินาที!")
    print(f"  🔥 พบสินทรัพย์ที่มีสัญญาณตัดขึ้น EMA 10 ทั้งหมด: {total_crossovers} ตัว")
    print(f"  💾 บันทึกผลลัพธ์ลงไฟล์: {output_file}")
    print("=" * 90)


if __name__ == "__main__":
    run_scanner()
