#!/usr/bin/env python3
"""
Market Intelligence by Job Bangpla - High Performance Screener Engine
Scans:
- 250 Top US Stocks (S&P 500 Leaders)
- 100 Thai Stocks (SET100)
- 100 High-Volume Cryptocurrencies
- Key TFEX Derivatives
Uses concurrent multi-threading for blazingly fast scanning (<60s).
Calculates EMA 20, RSI 14, and MACD (12, 26, 9) with Action Signals.
"""

import json
import os
import sys
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
import yfinance as yf

# -------------------------------------------------------------
# 1. 250 Top S&P 500 Stocks
# -------------------------------------------------------------
US_STOCKS_TICKERS = [
    ("NVDA", "NVIDIA Corporation"), ("AAPL", "Apple Inc."), ("MSFT", "Microsoft Corporation"),
    ("AMZN", "Amazon.com, Inc."), ("GOOGL", "Alphabet Inc. (Class A)"), ("GOOG", "Alphabet Inc. (Class C)"),
    ("META", "Meta Platforms, Inc."), ("TSLA", "Tesla, Inc."), ("AVGO", "Broadcom Inc."),
    ("BRK-B", "Berkshire Hathaway"), ("LLY", "Eli Lilly and Company"), ("JPM", "JPMorgan Chase & Co."),
    ("UNH", "UnitedHealth Group"), ("V", "Visa Inc."), ("XOM", "Exxon Mobil Corporation"),
    ("MA", "Mastercard Incorporated"), ("COST", "Costco Wholesale"), ("HD", "The Home Depot"),
    ("PG", "Procter & Gamble"), ("JNJ", "Johnson & Johnson"), ("BAC", "Bank of America"),
    ("NFLX", "Netflix, Inc."), ("ABBV", "AbbVie Inc."), ("CRM", "Salesforce, Inc."),
    ("WMT", "Walmart Inc."), ("KO", "The Coca-Cola Company"), ("MRK", "Merck & Co., Inc."),
    ("CVX", "Chevron Corporation"), ("AMD", "Advanced Micro Devices"), ("PEP", "PepsiCo, Inc."),
    ("LIN", "Linde plc"), ("TMO", "Thermo Fisher Scientific"), ("ACN", "Accenture plc"),
    ("MCD", "McDonald's Corporation"), ("ORCL", "Oracle Corporation"), ("CSCO", "Cisco Systems"),
    ("ABT", "Abbott Laboratories"), ("QCOM", "QUALCOMM Incorporated"), ("GE", "GE Aerospace"),
    ("DHR", "Danaher Corporation"), ("TXN", "Texas Instruments"), ("INTU", "Intuit Inc."),
    ("CAT", "Caterpillar Inc."), ("IBM", "International Business Machines"), ("PM", "Philip Morris International"),
    ("AMAT", "Applied Materials"), ("VZ", "Verizon Communications"), ("DIS", "The Walt Disney Company"),
    ("NOW", "ServiceNow, Inc."), ("UBER", "Uber Technologies"), ("CMG", "Chipotle Mexican Grill"),
    ("NEE", "NextEra Energy"), ("HON", "Honeywell International"), ("PFE", "Pfizer Inc."),
    ("AMGN", "Amgen Inc."), ("COP", "ConocoPhillips"), ("BKNG", "Booking Holdings"),
    ("LOW", "Lowe's Companies"), ("SPGI", "S&P Global Inc."), ("UNP", "Union Pacific Corporation"),
    ("SYK", "Stryker Corporation"), ("GS", "The Goldman Sachs Group"), ("RTX", "RTX Corporation"),
    ("BA", "The Boeing Company"), ("DE", "Deere & Company"), ("BLK", "BlackRock, Inc."),
    ("ELV", "Elevance Health"), ("MS", "Morgan Stanley"), ("MDT", "Medtronic plc"),
    ("ISRG", "Intuitive Surgical"), ("TJX", "The TJX Companies"), ("PLTR", "Palantir Technologies"),
    ("MMC", "Marsh & McLennan"), ("REGN", "Regeneron Pharmaceuticals"), ("ADP", "Automatic Data Processing"),
    ("VRTX", "Vertex Pharmaceuticals"), ("BSX", "Boston Scientific"), ("PANW", "Palo Alto Networks"),
    ("ETN", "Eaton Corporation"), ("BMY", "Bristol-Myers Squibb"), ("LMT", "Lockheed Martin"),
    ("CI", "The Cigna Group"), ("GILD", "Gilead Sciences"), ("CB", "Chubb Limited"),
    ("SCHW", "The Charles Schwab Corporation"), ("FI", "Fiserv, Inc."), ("MU", "Micron Technology"),
    ("ADI", "Analog Devices"), ("SBUX", "Starbucks Corporation"), ("CVS", "CVS Health Corporation"),
    ("MDLZ", "Mondelez International"), ("ZTS", "Zoetis Inc."), ("LRCX", "Lam Research"),
    ("MO", "Altria Group"), ("SO", "The Southern Company"), ("DUK", "Duke Energy"),
    ("KLAC", "KLA Corporation"), ("ICE", "Intercontinental Exchange"), ("EQIX", "Equinix, Inc."),
    ("SHW", "The Sherwin-Williams Company"), ("PYPL", "PayPal Holdings"), ("WM", "Waste Management"),
    ("CDNS", "Cadence Design Systems"), ("SNPS", "Synopsys, Inc."), ("AON", "Aon plc"),
    ("CL", "Colgate-Palmolive"), ("ITW", "Illinois Tool Works"), ("CRWD", "CrowdStrike Holdings"),
    ("APH", "Amphenol Corporation"), ("CME", "CME Group Inc."), ("T", "AT&T Inc."),
    ("PH", "Parker-Hannifin"), ("COF", "Capital One Financial"), ("MCK", "McKesson Corporation"),
    ("MCO", "Moody's Corporation"), ("TDG", "TransDigm Group"), ("SLB", "Schlumberger Limited"),
    ("USB", "U.S. Bancorp"), ("BDX", "Becton, Dickinson and Company"), ("MAR", "Marriott International"),
    ("EOG", "EOG Resources"), ("NXPI", "NXP Semiconductors"), ("EMR", "Emerson Electric"),
    ("HCA", "HCA Healthcare"), ("F", "Ford Motor Company"), ("GM", "General Motors"),
    ("PCAR", "PACCAR Inc"), ("TRV", "The Travelers Companies"), ("RSG", "Republic Services"),
    ("FCX", "Freeport-McMoRan"), ("ROP", "Roper Technologies"), ("C", "Citigroup Inc."),
    ("PSX", "Phillips 66"), ("AJG", "Arthur J. Gallagher & Co."), ("AFL", "Aflac Incorporated"),
    ("MSI", "Motorola Solutions"), ("CTAS", "Cintas Corporation"), ("CPRT", "Copart, Inc."),
    ("TGT", "Target Corporation"), ("CEG", "Constellation Energy"), ("WFC", "Wells Fargo & Company"),
    ("MET", "MetLife, Inc."), ("PRU", "Prudential Financial"), ("ALL", "The Allstate Corporation"),
    ("KMB", "Kimberly-Clark"), ("EW", "Edwards Lifesciences"), ("NEM", "Newmont Corporation"),
    ("PAYX", "Paychex, Inc."), ("O", "Realty Income Corporation"), ("AIG", "American International Group"),
    ("DLR", "Digital Realty Trust"), ("MPC", "Marathon Petroleum"), ("MNST", "Monster Beverage"),
    ("ROST", "Ross Stores"), ("VLO", "Valero Energy"), ("HES", "Hess Corporation"),
    ("JCI", "Johnson Controls"), ("D", "Dominion Energy"), ("KR", "The Kroger Co."),
    ("MSCI", "MSCI Inc."), ("TEL", "TE Connectivity"), ("AEP", "American Electric Power"),
    ("PSA", "Public Storage"), ("OXY", "Occidental Petroleum"), ("FDX", "FedEx Corporation"),
    ("KMI", "Kinder Morgan"), ("LHX", "L3Harris Technologies"), ("FAST", "Fastenal Company"),
    ("STZ", "Constellation Brands"), ("OTIS", "Otis Worldwide"), ("IDXX", "IDEXX Laboratories"),
    ("AZO", "AutoZone, Inc."), ("GIS", "General Mills"), ("DHI", "D.R. Horton"),
    ("BIIB", "Biogen Inc."), ("IQV", "IQVIA Holdings"), ("ED", "Consolidated Edison"),
    ("EXC", "Exelon Corporation"), ("CNC", "Centene Corporation"), ("CHTR", "Charter Communications"),
    ("CINF", "Cincinnati Financial"), ("CTVA", "Corteva, Inc."), ("DXCM", "DexCom, Inc."),
    ("EXR", "Extra Space Storage"), ("FITB", "Fifth Third Bancorp"), ("GLW", "Corning Incorporated"),
    ("HIG", "The Hartford Insurance"), ("HPQ", "HP Inc."), ("HUM", "Humana Inc."),
    ("KEYS", "Keysight Technologies"), ("LVS", "Las Vegas Sands"), ("MTB", "M&T Bank"),
    ("NKE", "NIKE, Inc."), ("NSC", "Norfolk Southern"), ("PCG", "PG&E Corporation"),
    ("PEG", "Public Service Enterprise"), ("PPG", "PPG Industries"), ("PWR", "Quanta Services"),
    ("RCL", "Royal Caribbean Cruises"), ("SBAC", "SBA Communications"), ("SRE", "Sempra"),
    ("SYY", "Sysco Corporation"), ("TDY", "Teledyne Technologies"), ("URI", "United Rentals"),
    ("VMC", "Vulcan Materials"), ("WBD", "Warner Bros. Discovery"), ("WELL", "Welltower Inc."),
    ("WMB", "The Williams Companies"), ("XEL", "Xcel Energy"), ("YUM", "Yum! Brands"),
    ("ZBH", "Zimmer Biomet"), ("GWW", "W.W. Grainger"), ("FSLR", "First Solar"),
    ("LEN", "Lennar Corporation"), ("KDP", "Keurig Dr Pepper"), ("VRSK", "Verisk Analytics"),
    ("APTV", "Aptiv PLC"), ("ALGN", "Align Technology"), ("EBAY", "eBay Inc."),
    ("ETSY", "Etsy, Inc."), ("ALB", "Albemarle Corporation"), ("APA", "APA Corporation"),
    ("BALL", "Ball Corporation"), ("BAX", "Baxter International"), ("BBY", "Best Buy Co."),
    ("BRO", "Brown & Brown"), ("CAH", "Cardinal Health"), ("CARR", "Carrier Global"),
    ("CBRE", "CBRE Group"), ("CDW", "CDW Corporation"), ("CE", "Celanese Corporation"),
    ("CF", "CF Industries"), ("CHD", "Church & Dwight"), ("CHRW", "C.H. Robinson"),
    ("CLX", "The Clorox Company"), ("CMS", "CMS Energy"), ("COO", "The Cooper Companies"),
    ("CPT", "Camden Property"), ("CSX", "CSX Corporation"), ("DRI", "Darden Restaurants"),
    ("DTE", "DTE Energy"), ("EFX", "Equifax Inc."), ("EIX", "Edison International"),
    ("EL", "The Estée Lauder Companies"), ("ESS", "Essex Property"), ("ETR", "Entergy Corporation"),
    ("EVRG", "Evergy, Inc."), ("EXPD", "Expeditors International"), ("FANG", "Diamondback Energy"),
    ("FDS", "FactSet Research"), ("FE", "FirstEnergy Corp."), ("FICO", "Fair Isaac Corporation"),
    ("FMC", "FMC Corporation"), ("FOXA", "Fox Corporation (Class A)"), ("FTV", "Fortive Corporation"),
    ("GEN", "Gen Digital"), ("GPC", "Genuine Parts Company"), ("GPN", "Global Payments"),
    ("HAL", "Halliburton Company"), ("HAS", "Hasbro, Inc."), ("HBAN", "Huntington Bancshares"),
    ("HRL", "Hormel Foods"), ("HST", "Host Hotels & Resorts"), ("HSY", "The Hershey Company"),
    ("HUBB", "Hubbell Incorporated"), ("IEX", "IDEX Corporation"), ("INCY", "Incyte Corporation"),
    ("INTC", "Intel Corporation"), ("IP", "International Paper"), ("IPG", "Interpublic Group"),
    ("IR", "Ingersoll Rand"), ("IRM", "Iron Mountain"), ("IT", "Gartner, Inc."),
    ("IVZ", "Invesco Ltd."), ("JBHT", "J.B. Hunt Transport"), ("JKHY", "Jack Henry & Associates"),
    ("JNPR", "Juniper Networks"), ("K", "Kellanova"), ("KEY", "KeyCorp"),
    ("KIM", "Kimco Realty"), ("KMX", "CarMax, Inc."), ("L", "Loews Corporation"),
    ("LDOS", "Leidos Holdings"), ("LH", "Labcorp"), ("LKQ", "LKQ Corporation"),
    ("LNT", "Alliant Energy"), ("LULU", "Lululemon Athletica"), ("MAA", "Mid-America Apartment")
]

# -------------------------------------------------------------
# 2. 100 Thai Stocks (Full SET100)
# -------------------------------------------------------------
THAI_SET100_TICKERS = [
    ("AAV.BK", "Asia Aviation"), ("ADVANC.BK", "Advanced Info Service"), ("AMATA.BK", "Amata Corporation"),
    ("AOT.BK", "Airports of Thailand"), ("AP.BK", "AP (Thailand)"), ("AWC.BK", "Asset World Corp"),
    ("BA.BK", "Bangkok Airways"), ("BAM.BK", "Bangkok Commercial Asset Mngt"), ("BANPU.BK", "Banpu Public Company"),
    ("BBL.BK", "Bangkok Bank"), ("BCH.BK", "Bangkok Chain Hospital"), ("BCP.BK", "Bangchak Corporation"),
    ("BCPG.BK", "BCPG Public Company"), ("BDMS.BK", "Bangkok Dusit Medical Services"), ("BEM.BK", "Bangkok Expressway and Metro"),
    ("BGRIM.BK", "B.Grimm Power"), ("BH.BK", "Bumrungrad Hospital"), ("BJC.BK", "Berli Jucker"),
    ("BLA.BK", "Bangkok Life Assurance"), ("BLAND.BK", "Bangkok Land"), ("BTG.BK", "Betagro"),
    ("BTS.BK", "BTS Group Holdings"), ("CBG.BK", "Carabao Group"), ("CCET.BK", "Cal-Comp Electronics"),
    ("CENTEL.BK", "Central Plaza Hotel"), ("CHG.BK", "Chularat Hospital"), ("CK.BK", "CH. Karnchang"),
    ("CKP.BK", "CK Power"), ("COM7.BK", "COM7 Public Company"), ("CPALL.BK", "CP ALL Public Company"),
    ("CPF.BK", "Charoen Pokphand Foods"), ("CPN.BK", "Central Pattana"), ("CRC.BK", "Central Retail Corp"),
    ("DELTA.BK", "Delta Electronics Thailand"), ("DOHOME.BK", "Dohome Public Company"), ("EA.BK", "Energy Absolute"),
    ("EGCO.BK", "Electricity Generating"), ("ERW.BK", "The Erawan Group"), ("GLOBAL.BK", "Siam Global House"),
    ("GPSC.BK", "Global Power Synergy"), ("GULF.BK", "Gulf Energy Development"), ("GUNKUL.BK", "Gunkul Engineering"),
    ("HANA.BK", "Hana Microelectronics"), ("HMPRO.BK", "Home Product Center"), ("ICHI.BK", "Ichitan Group"),
    ("INTUCH.BK", "Intuch Holdings"), ("IRPC.BK", "IRPC Public Company"), ("ITC.BK", "i-Tail Corporation"),
    ("IVL.BK", "Indorama Ventures"), ("JAS.BK", "Jasmine International"), ("JMART.BK", "Jaymart Group Holdings"),
    ("JMT.BK", "JMT Network Services"), ("KBANK.BK", "Kasikornbank"), ("KCE.BK", "KCE Electronics"),
    ("KKP.BK", "Kiatnakin Phatra Bank"), ("KTB.BK", "Krung Thai Bank"), ("KTC.BK", "Krungthai Card"),
    ("LH.BK", "Land and Houses"), ("M.BK", "MK Restaurant Group"), ("MASTER.BK", "Master Style"),
    ("MEGA.BK", "Mega Lifesciences"), ("MINT.BK", "Minor International"), ("MOSHI.BK", "Moshi Moshi Retail"),
    ("MTC.BK", "Muangthai Capital"), ("NEX.BK", "NEX Point"), ("OR.BK", "PTT Oil and Retail Business"),
    ("OSP.BK", "Osotspa"), ("PLANB.BK", "Plan B Media"), ("PR9.BK", "Praram 9 Hospital"),
    ("PRM.BK", "Prima Marine"), ("PSH.BK", "Pruksa Holding"), ("PSL.BK", "Precious Shipping"),
    ("PTG.BK", "PTG Energy"), ("PTT.BK", "PTT Public Company"), ("PTTEP.BK", "PTT Exploration & Production"),
    ("PTTGC.BK", "PTT Global Chemical"), ("QH.BK", "Quality Houses"), ("RATCH.BK", "RATCH Group"),
    ("RCL.BK", "Regional Container Lines"), ("ROJNA.BK", "Rojana Industrial Park"), ("SAPPE.BK", "Sappe Public Company"),
    ("SAWAD.BK", "Srisawad Corporation"), ("SCB.BK", "SCB X Public Company"), ("SCC.BK", "Siam Cement"),
    ("SCGP.BK", "SCG Packaging"), ("SIRI.BK", "Sansiri Public Company"), ("SISB.BK", "SISB Public Company"),
    ("SJWD.BK", "SCGJWD Logistics"), ("SPALI.BK", "Supalai Public Company"), ("SPRC.BK", "Star Petroleum Refining"),
    ("STA.BK", "Sri Trang Agro-Industry"), ("STECON.BK", "Stecon Group"), ("TASCO.BK", "Tipco Asphalt"),
    ("TCAP.BK", "Thanachart Capital"), ("THANI.BK", "Ratchthani Leasing"), ("THCOM.BK", "Thaicom Public Company"),
    ("TIDLOR.BK", "Ngern Tid Lor"), ("TISCO.BK", "Tisco Financial Group"), ("TKN.BK", "Taokaenoi Food & Marketing"),
    ("TLI.BK", "Thai Life Insurance"), ("TOP.BK", "Thai Oil"), ("TRUE.BK", "True Corporation"),
    ("TTB.BK", "TMBThanachart Bank"), ("TTW.BK", "TTW Public Company"), ("TU.BK", "Thai Union Group"),
    ("VGI.BK", "VGI Public Company"), ("WHA.BK", "WHA Corporation")
]

# -------------------------------------------------------------
# 3. 100 High-Volume Cryptocurrencies
# -------------------------------------------------------------
CRYPTO_TICKERS = [
    ("BTC-USD", "Bitcoin", "BTC/USDT"), ("ETH-USD", "Ethereum", "ETH/USDT"),
    ("SOL-USD", "Solana", "SOL/USDT"), ("BNB-USD", "BNB", "BNB/USDT"),
    ("XRP-USD", "Ripple", "XRP/USDT"), ("DOGE-USD", "Dogecoin", "DOGE/USDT"),
    ("ADA-USD", "Cardano", "ADA/USDT"), ("TRX-USD", "TRON", "TRX/USDT"),
    ("AVAX-USD", "Avalanche", "AVAX/USDT"), ("LINK-USD", "Chainlink", "LINK/USDT"),
    ("SUI20947-USD", "Sui", "SUI/USDT"), ("SHIB-USD", "Shiba Inu", "SHIB/USDT"),
    ("DOT-USD", "Polkadot", "DOT/USDT"), ("BCH-USD", "Bitcoin Cash", "BCH/USDT"),
    ("NEAR-USD", "NEAR Protocol", "NEAR/USDT"), ("LTC-USD", "Litecoin", "LTC/USDT"),
    ("UNI7083-USD", "Uniswap", "UNI/USDT"), ("PEPE24478-USD", "Pepe", "PEPE/USDT"),
    ("APT21794-USD", "Aptos", "APT/USDT"), ("ICP-USD", "Internet Computer", "ICP/USDT"),
    ("TAO22974-USD", "Bittensor", "TAO/USDT"), ("FET-USD", "Artificial Superintelligence", "FET/USDT"),
    ("KAS-USD", "Kaspa", "KAS/USDT"), ("XMR-USD", "Monero", "XMR/USDT"),
    ("POL-USD", "Polygon Ecosystem", "POL/USDT"), ("RENDER-USD", "Render", "RENDER/USDT"),
    ("XLM-USD", "Stellar", "XLM/USDT"), ("ETC-USD", "Ethereum Classic", "ETC/USDT"),
    ("AAVE-USD", "Aave", "AAVE/USDT"), ("STX4847-USD", "Stacks", "STX/USDT"),
    ("TIA22861-USD", "Celestia", "TIA/USDT"), ("INJ-USD", "Injective", "INJ/USDT"),
    ("FIL-USD", "Filecoin", "FIL/USDT"), ("FTM-USD", "Fantom", "FTM/USDT"),
    ("ARB11841-USD", "Arbitrum", "ARB/USDT"), ("WIF-USD", "dogwifhat", "WIF/USDT"),
    ("VET-USD", "VeChain", "VET/USDT"), ("OP-USD", "Optimism", "OP/USDT"),
    ("HBAR-USD", "Hedera", "HBAR/USDT"), ("ATOM-USD", "Cosmos", "ATOM/USDT"),
    ("CRO-USD", "Cronos", "CRO/USDT"), ("GRT6733-USD", "The Graph", "GRT/USDT"),
    ("RUNE-USD", "THORChain", "RUNE/USDT"), ("THETA-USD", "Theta Network", "THETA/USDT"),
    ("SEI-USD", "Sei", "SEI/USDT"), ("ONDO-USD", "Ondo", "ONDO/USDT"),
    ("FLOKI-USD", "FLOKI", "FLOKI/USDT"), ("BONK-USD", "Bonk", "BONK/USDT"),
    ("ALGO-USD", "Algorand", "ALGO/USDT"), ("LDO-USD", "Lido DAO", "LDO/USDT"),
    ("BEAM28298-USD", "Beam", "BEAM/USDT"), ("BSV-USD", "Bitcoin SV", "BSV/USDT"),
    ("AR-USD", "Arweave", "AR/USDT"), ("PYTH-USD", "Pyth Network", "PYTH/USDT"),
    ("JUP29210-USD", "Jupiter", "JUP/USDT"), ("ENA-USD", "Ethena", "ENA/USDT"),
    ("CORE23254-USD", "Core", "CORE/USDT"), ("QNT-USD", "Quant", "QNT/USDT"),
    ("GALA-USD", "Gala", "GALA/USDT"), ("JASMY-USD", "JasmyCoin", "JASMY/USDT"),
    ("EOS-USD", "EOS", "EOS/USDT"), ("PENDLE-USD", "Pendle", "PENDLE/USDT"),
    ("FLOW-USD", "Flow", "FLOW/USDT"), ("STRK-USD", "Starknet", "STRK/USDT"),
    ("BTT-USD", "BitTorrent", "BTT/USDT"), ("HNT-USD", "Helium", "HNT/USDT"),
    ("NOT-USD", "Notcoin", "NOT/USDT"), ("NEO-USD", "NEO", "NEO/USDT"),
    ("AKT-USD", "Akash Network", "AKT/USDT"), ("AXS-USD", "Axie Infinity", "AXS/USDT"),
    ("SAND-USD", "The Sandbox", "SAND/USDT"), ("MANA-USD", "Decentraland", "MANA/USDT"),
    ("CHZ-USD", "Chiliz", "CHZ/USDT"), ("RON-USD", "Ronin", "RON/USDT"),
    ("MINA-USD", "Mina", "MINA/USDT"), ("AEVO-USD", "Aevo", "AEVO/USDT"),
    ("KAVA-USD", "Kava", "KAVA/USDT"), ("DYDX-USD", "dYdX", "DYDX/USDT"),
    ("BLUR-USD", "Blur", "BLUR/USDT"), ("ORDI-USD", "ORDI", "ORDI/USDT"),
    ("CFX-USD", "Conflux", "CFX/USDT"), ("WLD-USD", "Worldcoin", "WLD/USDT"),
    ("EGLD-USD", "MultiversX", "EGLD/USDT"), ("GNO-USD", "Gnosis", "GNO/USDT"),
    ("CRV-USD", "Curve DAO", "CRV/USDT"), ("SNX-USD", "Synthetix", "SNX/USDT"),
    ("MKR-USD", "Maker", "MKR/USDT"), ("ASTR-USD", "Astar", "ASTR/USDT"),
    ("ROSE-USD", "Oasis Network", "ROSE/USDT"), ("CAKE-USD", "PancakeSwap", "CAKE/USDT"),
    ("ZEC-USD", "Zcash", "ZEC/USDT"), ("IOTA-USD", "IOTA", "IOTA/USDT"),
    ("GMT-USD", "STEPN", "GMT/USDT"), ("1INCH-USD", "1inch Network", "1INCH/USDT"),
    ("COMP-USD", "Compound", "COMP/USDT"), ("BAT-USD", "Basic Attention Token", "BAT/USDT"),
    ("QTUM-USD", "Qtum", "QTUM/USDT"), ("ENJ-USD", "Enjin Coin", "ENJ/USDT"),
    ("TWT-USD", "Trust Wallet Token", "TWT/USDT"), ("WBNB-USD", "Wrapped BNB", "WBNB/USDT")
]

# -------------------------------------------------------------
# 4. TFEX Futures & Proxies
# -------------------------------------------------------------
TFEX_TICKERS = [
    ("^SET50.BK", "SET50 Index Futures Proxy", "S50 Futures"),
    ("^SET.BK", "SET Index Futures Proxy", "SET Index Futures"),
    ("GC=F", "Gold Online Futures (Proxy GC)", "Gold Online Futures"),
    ("SI=F", "Silver Online Futures (Proxy SI)", "Silver Online Futures"),
    ("THB=X", "USD/THB Currency Futures (Proxy)", "USD Futures")
]


def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculate Wilder's Relative Strength Index."""
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()

    rs = avg_gain / avg_loss.replace(0, 0.00001)
    return 100.0 - (100.0 / (1.0 + rs))


def format_volume(vol: float) -> str:
    """Format volume numbers into readable units."""
    if pd.isna(vol) or vol <= 0:
        return "--"
    if vol >= 1_000_000_000:
        return f"{vol / 1_000_000_000:.2f}B"
    if vol >= 1_000_000:
        return f"{vol / 1_000_000:.1f}M"
    if vol >= 1_000:
        return f"{vol / 1_000:.1f}K"
    return f"{int(vol):,}"


def scan_single_symbol(symbol: str, name: str, display_ticker: str = None) -> dict:
    """Download daily price data, calculate EMA 20, RSI 14, and MACD (12, 26, 9)."""
    if not display_ticker:
        display_ticker = symbol

    try:
        df = yf.Ticker(symbol).history(period="60d", interval="1d")
        if df is None or len(df) < 26:
            return None

        close = df["Close"]
        volume = df["Volume"].iloc[-1] if "Volume" in df else 0

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

        # 4. Action Signal
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
            "name": name,
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
            future = executor.submit(scan_single_symbol, symbol, name, display_ticker)
            future_map[future] = symbol

        for future in as_completed(future_map):
            res = future.result()
            if res:
                results.append(res)

    # Sort results by % Change descending by default
    results.sort(key=lambda x: x["change"], reverse=True)
    return results


def run_scanner():
    """Main execution function to scan all watchlists and save JSON."""
    start_time = datetime.now()
    print("=" * 70)
    print("Market Intelligence by Job Bangpla - Screener Engine")
    print(f"Start Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    categories = {
        "us_stocks": (US_STOCKS_TICKERS, "US Stocks (250 Leaders)"),
        "thai_stocks": (THAI_SET100_TICKERS, "Thai Stocks (SET100)"),
        "tfex": (TFEX_TICKERS, "TFEX Derivatives"),
        "crypto": (CRYPTO_TICKERS, "Crypto (Top 100 Volume)")
    }

    final_results = {}
    total_screened = 0

    for cat_key, (ticker_list, label) in categories.items():
        print(f"\n[SCANNING] {label}: {len(ticker_list)} tickers...")
        scanned = scan_category_parallel(ticker_list, max_workers=14)
        final_results[cat_key] = scanned
        total_screened += len(scanned)
        print(f"  -> Successfully scanned: {len(scanned)} / {len(ticker_list)} tickers")

    output_dir = "data"
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "scan-results.json")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final_results, f, indent=2, ensure_ascii=False)

    duration = (datetime.now() - start_time).total_seconds()
    print("\n" + "=" * 70)
    print(f"[SUCCESS] Scanned {total_screened} items in {duration:.1f} seconds!")
    print(f"Output saved to: {output_file}")
    print("=" * 70)


if __name__ == "__main__":
    run_scanner()
