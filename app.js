/**
 * Market Intelligence Terminal
 * Vanilla JavaScript Core Engine with Bilingual (TH / EN) Support
 */

// Application State
const state = {
  lang: localStorage.getItem('mi_lang') || 'th', // Default to Thai, persisted in localStorage
  currentCategory: 'us_stocks',
  currentFilter: 'ALL', // 'ALL', 'BUY', 'WAIT', 'RSI_OVERSOLD', 'RSI_OVERBOUGHT'
  searchQuery: '',
  sortColumn: 'default',
  sortDirection: 'desc',
  data: null,
  isLoading: false,
  lastUpdated: null
};

// Bilingual Dictionaries
const i18n = {
  en: {
    header_live: "LIVE SCANNER",
    nav_markets: "Markets",
    total_active: "ACTIVE",
    cat_us: "US Stocks",
    cat_thai: "Thai Stocks",
    cat_tfex: "TFEX",
    cat_crypto: "Crypto",
    filter_title: "Signal Filter",
    filter_all: "All Signals",
    filter_buy: "Bullish (BUY / Long)",
    filter_sell: "Bearish (SELL / Short)",
    filter_wait: "Wait / Neutral",
    presets_title: "Technical Presets",
    preset_oversold: "RSI < 35 (Oversold)",
    preset_overbought: "RSI > 65 (Overbought)",
    engine_title: "Screening Engine",
    engine_online: "Online",
    stat_bullish: "BUY",
    stat_bearish: "SELL",
    stat_wait: "WAIT",
    search_placeholder: "Search symbol or name...",
    sort_default: "Sort: Default",
    sort_change_desc: "% Change: High to Low",
    sort_change_asc: "% Change: Low to High",
    sort_rsi_desc: "RSI: High to Low",
    sort_rsi_asc: "RSI: Low to High",
    sort_price_desc: "Price: High to Low",
    sort_price_asc: "Price: Low to High",
    col_ticker: "Ticker Symbol",
    col_price: "Last Price",
    col_change: "% Change",
    col_ema: "EMA 20 Status",
    col_rsi: "RSI (14)",
    col_macd: "MACD (12, 26, 9)",
    col_signal: "Action Signal",
    scanning_txt: "Scanning technical indicators...",
    empty_title: "No screening matches found",
    empty_subtitle: "Try relaxing your search terms or active signal filters",
    reset_btn: "Reset Filters",
    showing: "Showing",
    tickers_label: "tickers",
    last_fetched: "Last fetched:",
    legend_buy: "BUY / Bullish",
    legend_wait: "WAIT / Neutral",
    legend_bear: "Bearish",
    ref_label: "Ref:",
    vol_label: "Vol:",
    markets: {
      us_stocks: {
        title: 'US Equities Scanner',
        subtitle: 'NYSE & NASDAQ Tech & Growth Screening: EMA 20, RSI 14, MACD Crossovers',
        currency: '$'
      },
      thai_stocks: {
        title: 'Thai Stocks Scanner (SET / MAI)',
        subtitle: 'Stock Exchange of Thailand Large Cap & Momentum Screeners',
        currency: '฿'
      },
      tfex: {
        title: 'TFEX Thailand Futures Scanner',
        subtitle: 'Index & Commodity Derivatives: S50, Gold Online, Silver & Currencies',
        currency: 'pts'
      },
      crypto: {
        title: 'Cryptocurrency Spot Intelligence',
        subtitle: 'High-Volume Layer 1 & Major Asset 24H Technical Scan',
        currency: '$'
      }
    },
    signals: {
      BUY: "BUY",
      SELL: "SELL",
      WAIT: "WAIT",
      PASS: "PASS"
    },
    ema: {
      above: "Above EMA 20",
      below: "Below EMA 20",
      at: "At EMA 20"
    },
    rsi: {
      overbought: "Overbought",
      oversold: "Oversold",
      bullish: "Bullish Zone",
      neutral: "Neutral",
      consolidation: "Consolidation"
    },
    macd: {
      "Bullish Crossover": "Bullish Crossover",
      "Bullish Momentum": "Bullish Momentum",
      "Bullish Expansion": "Bullish Expansion",
      "Bullish Strong": "Bullish Strong",
      "Bullish": "Bullish",
      "Bullish Upward": "Bullish Upward",
      "Bearish": "Bearish",
      "Bearish Breakdown": "Bearish Breakdown",
      "Bearish Divergence": "Bearish Divergence",
      "Bearish Continuation": "Bearish Continuation",
      "Neutral": "Neutral",
      "Neutral Bullish": "Neutral Bullish"
    }
  },
  th: {
    header_live: "สแกนเนอร์สด",
    nav_markets: "หมวดหมู่ตลาด",
    total_active: "รายการสด",
    cat_us: "หุ้นสหรัฐฯ (US)",
    cat_thai: "หุ้นไทย (SET)",
    cat_tfex: "TFEX อนุพันธ์",
    cat_crypto: "คริปโทฯ (Crypto)",
    filter_title: "ตัวกรองสัญญาณ",
    filter_all: "สัญญาณทั้งหมด",
    filter_buy: "ขาขึ้น (BUY / Long)",
    filter_sell: "ขาลง (SELL / Short)",
    filter_wait: "รอจังหวะ (WAIT / พักตัว)",
    presets_title: "สูตรเทคนิคอลสำเร็จรูป",
    preset_oversold: "RSI < 35 (ขายมากเกินไป)",
    preset_overbought: "RSI > 65 (ซื้อมากเกินไป)",
    engine_title: "ระบบคัดกรอง AI",
    engine_online: "พร้อมทำงาน",
    stat_bullish: "BUY",
    stat_bearish: "SELL",
    stat_wait: "WAIT",
    search_placeholder: "ค้นหาชื่อย่อหรือชื่อบริษัท...",
    sort_default: "จัดเรียง: ค่าเริ่มต้น",
    sort_change_desc: "% เปลี่ยนแปลง: สูงไปต่ำ",
    sort_change_asc: "% เปลี่ยนแปลง: ต่ำไปสูง",
    sort_rsi_desc: "RSI: สูงไปต่ำ",
    sort_rsi_asc: "RSI: ต่ำไปสูง",
    sort_price_desc: "ราคา: สูงไปต่ำ",
    sort_price_asc: "ราคา: ต่ำไปสูง",
    col_ticker: "ชื่อย่อหุ้น / สินทรัพย์",
    col_price: "ราคาล่าสุด",
    col_change: "% เปลี่ยนแปลง",
    col_ema: "สถานะ EMA 20",
    col_rsi: "RSI (14)",
    col_macd: "MACD (12, 26, 9)",
    col_signal: "สัญญาณคำสั่ง",
    scanning_txt: "กำลังประมวลผลดัชนีชี้วัดทางเทคนิค...",
    empty_title: "ไม่พบข้อมูลหุ้นที่ตรงกับเงื่อนไข",
    empty_subtitle: "ลองเปลี่ยนคำค้นหาหรือผ่อนคลายตัวกรองสัญญาณ",
    reset_btn: "ล้างตัวกรองทั้งหมด",
    showing: "กำลังแสดง",
    tickers_label: "รายการ",
    last_fetched: "อัปเดตล่าสุด:",
    legend_buy: "ซื้อ / ขาขึ้น (BUY)",
    legend_wait: "รอจังหวะ (WAIT)",
    legend_bear: "ขาลง (Bearish)",
    ref_label: "อ้างอิง:",
    vol_label: "วอลุ่ม:",
    markets: {
      us_stocks: {
        title: 'สแกนเนอร์หุ้นสหรัฐฯ (NYSE & NASDAQ)',
        subtitle: 'คัดกรองหุ้นเทคโนโลยีและการเติบโต: เส้น EMA 20, RSI 14 และสัญญาณตัดของ MACD',
        currency: '$'
      },
      thai_stocks: {
        title: 'สแกนเนอร์หุ้นไทย (SET / MAI)',
        subtitle: 'คัดกรองหุ้นมาร์เก็ตแคปใหญ่และหุ้นโมเมนตัมเด่นในตลาดหลักทรัพย์แห่งประเทศไทย',
        currency: '฿'
      },
      tfex: {
        title: 'สแกนเนอร์สัญญาซื้อขายล่วงหน้า TFEX',
        subtitle: 'อนุพันธ์ดัชนีและสินค้าโภคภัณฑ์: S50 Index, Gold Online, Silver และอัตราแลกเปลี่ยน',
        currency: 'pts'
      },
      crypto: {
        title: 'ระบบวิเคราะห์ตลาดคริปโทเคอร์เรนซี',
        subtitle: 'สแกนเชิงเทคนิคอล 24 ชม. ของเหรียญ Layer 1 และสินทรัพย์ดิจิทัลหลัก',
        currency: '$'
      }
    },
    signals: {
      BUY: "ซื้อ (BUY)",
      SELL: "ขาย (SELL)",
      WAIT: "รอ (WAIT)",
      PASS: "ผ่านเกณฑ์ (PASS)"
    },
    ema: {
      above: "เหนือเส้น EMA 20",
      below: "ใต้เส้น EMA 20",
      at: "ใกล้เคียง EMA 20"
    },
    rsi: {
      overbought: "ซื้อมากเกิน (Overbought)",
      oversold: "ขายมากเกิน (Oversold)",
      bullish: "โซนขาขึ้น (Bullish)",
      neutral: "โซนปกติ",
      consolidation: "ช่วงพักตัว"
    },
    macd: {
      "Bullish Crossover": "ตัดขึ้น Bullish",
      "Bullish Momentum": "โมเมนตัมขาขึ้น",
      "Bullish Expansion": "ขยายตัวขาขึ้น",
      "Bullish Strong": "ขาขึ้นแข็งแกร่ง",
      "Bullish": "แนวโน้มขาขึ้น",
      "Bullish Upward": "ขาขึ้นต่อเนื่อง",
      "Bearish": "แนวโน้มขาลง",
      "Bearish Breakdown": "หลุดแนวรับขาลง",
      "Bearish Divergence": "ขัดแย้งขาลง (Divergence)",
      "Bearish Continuation": "ต่อเนื่องขาลง",
      "Neutral": "ไซด์เวย์ (ทรงตัว)",
      "Neutral Bullish": "ไซด์เวย์แนวโน้มบวก"
    }
  }
};

// Fallback dataset to ensure complete offline & file:// protocol operation
const FALLBACK_DATA = {
  us_stocks: [
    { ticker: "NVDA", name: "NVIDIA Corporation", price: 128.45, change: 4.32, ema20_status: "Above EMA 20", ema20_value: 122.10, rsi14: 68.4, macd: { value: 2.85, signal: 1.95, histogram: 0.90, trend: "Bullish Crossover" }, action_signal: "BUY", volume: "52.4M", confidence: "94%" },
    { ticker: "AAPL", name: "Apple Inc.", price: 224.23, change: 1.15, ema20_status: "Above EMA 20", ema20_value: 221.80, rsi14: 56.2, macd: { value: 1.12, signal: 0.88, histogram: 0.24, trend: "Bullish" }, action_signal: "BUY", volume: "38.1M", confidence: "88%" },
    { ticker: "TSLA", name: "Tesla, Inc.", price: 248.98, change: -3.42, ema20_status: "Below EMA 20", ema20_value: 255.40, rsi14: 42.1, macd: { value: -1.45, signal: -0.80, histogram: -0.65, trend: "Bearish Divergence" }, action_signal: "WAIT", volume: "64.8M", confidence: "72%" },
    { ticker: "MSFT", name: "Microsoft Corporation", price: 435.12, change: 0.68, ema20_status: "Above EMA 20", ema20_value: 431.50, rsi14: 58.7, macd: { value: 1.80, signal: 1.65, histogram: 0.15, trend: "Bullish" }, action_signal: "BUY", volume: "18.3M", confidence: "85%" },
    { ticker: "AMD", name: "Advanced Micro Devices", price: 156.80, change: 3.75, ema20_status: "Above EMA 20", ema20_value: 151.20, rsi14: 64.9, macd: { value: 2.10, signal: 1.40, histogram: 0.70, trend: "Bullish Crossover" }, action_signal: "BUY", volume: "31.7M", confidence: "91%" },
    { ticker: "INTC", name: "Intel Corporation", price: 21.40, change: -4.85, ema20_status: "Below EMA 20", ema20_value: 23.10, rsi14: 28.5, macd: { value: -0.85, signal: -0.60, histogram: -0.25, trend: "Bearish" }, action_signal: "WAIT", volume: "42.0M", confidence: "80%" },
    { ticker: "META", name: "Meta Platforms, Inc.", price: 572.50, change: 2.14, ema20_status: "Above EMA 20", ema20_value: 560.10, rsi14: 62.3, macd: { value: 4.50, signal: 3.80, histogram: 0.70, trend: "Bullish" }, action_signal: "BUY", volume: "14.9M", confidence: "89%" },
    { ticker: "AMZN", name: "Amazon.com, Inc.", price: 187.90, change: -0.45, ema20_status: "At EMA 20", ema20_value: 188.10, rsi14: 49.8, macd: { value: 0.05, signal: 0.12, histogram: -0.07, trend: "Neutral" }, action_signal: "WAIT", volume: "22.5M", confidence: "65%" }
  ],
  thai_stocks: [
    { ticker: "DELTA.BK", name: "Delta Electronics Thailand", price: 142.50, change: 5.17, ema20_status: "Above EMA 20", ema20_value: 135.00, rsi14: 71.2, macd: { value: 3.20, signal: 2.10, histogram: 1.10, trend: "Bullish Momentum" }, action_signal: "BUY", volume: "28.4M", confidence: "92%" },
    { ticker: "PTT.BK", name: "PTT Public Company Limited", price: 33.75, change: -0.74, ema20_status: "Below EMA 20", ema20_value: 34.20, rsi14: 44.1, macd: { value: -0.15, signal: -0.08, histogram: -0.07, trend: "Bearish" }, action_signal: "WAIT", volume: "54.1M", confidence: "70%" },
    { ticker: "CPALL.BK", name: "CP ALL Public Company", price: 64.50, change: 1.98, ema20_status: "Above EMA 20", ema20_value: 63.10, rsi14: 59.4, macd: { value: 0.75, signal: 0.52, histogram: 0.23, trend: "Bullish" }, action_signal: "BUY", volume: "19.8M", confidence: "87%" },
    { ticker: "KBANK.BK", name: "Kasikornbank", price: 154.00, change: 2.33, ema20_status: "Above EMA 20", ema20_value: 150.50, rsi14: 63.8, macd: { value: 1.45, signal: 0.95, histogram: 0.50, trend: "Bullish Crossover" }, action_signal: "BUY", volume: "16.2M", confidence: "90%" },
    { ticker: "AOT.BK", name: "Airports of Thailand", price: 61.25, change: -1.61, ema20_status: "Below EMA 20", ema20_value: 62.80, rsi14: 38.6, macd: { value: -0.42, signal: -0.28, histogram: -0.14, trend: "Bearish" }, action_signal: "WAIT", volume: "22.0M", confidence: "75%" },
    { ticker: "GULF.BK", name: "Gulf Energy Development", price: 63.00, change: 3.28, ema20_status: "Above EMA 20", ema20_value: 60.90, rsi14: 67.5, macd: { value: 1.10, signal: 0.72, histogram: 0.38, trend: "Bullish" }, action_signal: "BUY", volume: "34.6M", confidence: "89%" },
    { ticker: "BDMS.BK", name: "Bangkok Dusit Medical Services", price: 27.50, change: 0.00, ema20_status: "At EMA 20", ema20_value: 27.50, rsi14: 51.0, macd: { value: 0.02, signal: 0.01, histogram: 0.01, trend: "Neutral" }, action_signal: "WAIT", volume: "11.5M", confidence: "60%" }
  ],
  tfex: [
    { ticker: "S50M26", name: "SET50 Index Futures M26", price: 932.40, change: 1.45, ema20_status: "Above EMA 20", ema20_value: 921.10, rsi14: 64.2, macd: { value: 3.80, signal: 2.40, histogram: 1.40, trend: "Bullish Strong" }, action_signal: "BUY", volume: "142,500", confidence: "91%" },
    { ticker: "S50U26", name: "SET50 Index Futures U26", price: 928.10, change: 1.32, ema20_status: "Above EMA 20", ema20_value: 918.40, rsi14: 61.7, macd: { value: 3.10, signal: 2.15, histogram: 0.95, trend: "Bullish" }, action_signal: "BUY", volume: "38,200", confidence: "86%" },
    { ticker: "GOM26", name: "Gold Online Futures M26", price: 2684.50, change: 0.82, ema20_status: "Above EMA 20", ema20_value: 2660.00, rsi14: 69.1, macd: { value: 14.50, signal: 11.20, histogram: 3.30, trend: "Bullish Upward" }, action_signal: "BUY", volume: "46,800", confidence: "93%" },
    { ticker: "SVFM26", name: "Silver Online Futures M26", price: 31.85, change: -2.15, ema20_status: "Below EMA 20", ema20_value: 32.50, rsi14: 41.3, macd: { value: -0.45, signal: -0.20, histogram: -0.25, trend: "Bearish Breakdown" }, action_signal: "WAIT", volume: "12,400", confidence: "76%" },
    { ticker: "USDM26", name: "USD Futures M26", price: 33.15, change: -0.36, ema20_status: "Below EMA 20", ema20_value: 33.32, rsi14: 35.8, macd: { value: -0.12, signal: -0.07, histogram: -0.05, trend: "Bearish Continuation" }, action_signal: "WAIT", volume: "18,900", confidence: "81%" }
  ],
  crypto: [
    { ticker: "BTC/USDT", name: "Bitcoin", price: 64820.00, change: 3.85, ema20_status: "Above EMA 20", ema20_value: 62450.00, rsi14: 65.4, macd: { value: 842.10, signal: 612.40, histogram: 229.70, trend: "Bullish Expansion" }, action_signal: "BUY", volume: "1.42B", confidence: "95%" },
    { ticker: "ETH/USDT", name: "Ethereum", price: 2640.50, change: 2.45, ema20_status: "Above EMA 20", ema20_value: 2580.00, rsi14: 58.2, macd: { value: 34.20, signal: 25.10, histogram: 9.10, trend: "Bullish" }, action_signal: "BUY", volume: "780M", confidence: "88%" },
    { ticker: "SOL/USDT", name: "Solana", price: 154.20, change: 6.84, ema20_status: "Above EMA 20", ema20_value: 142.10, rsi14: 72.8, macd: { value: 5.40, signal: 3.60, histogram: 1.80, trend: "Bullish Momentum" }, action_signal: "BUY", volume: "620M", confidence: "93%" },
    { ticker: "BNB/USDT", name: "BNB", price: 586.30, change: 0.88, ema20_status: "Above EMA 20", ema20_value: 580.00, rsi14: 53.6, macd: { value: 3.10, signal: 2.80, histogram: 0.30, trend: "Neutral Bullish" }, action_signal: "BUY", volume: "210M", confidence: "79%" },
    { ticker: "XRP/USDT", name: "Ripple", price: 0.582, change: -2.45, ema20_status: "Below EMA 20", ema20_value: 0.598, rsi14: 41.0, macd: { value: -0.008, signal: -0.004, histogram: -0.004, trend: "Bearish" }, action_signal: "WAIT", volume: "340M", confidence: "74%" },
    { ticker: "DOGE/USDT", name: "Dogecoin", price: 0.108, change: -4.20, ema20_status: "Below EMA 20", ema20_value: 0.114, rsi14: 36.4, macd: { value: -0.0025, signal: -0.0012, histogram: -0.0013, trend: "Bearish" }, action_signal: "WAIT", volume: "180M", confidence: "68%" },
    { ticker: "AVAX/USDT", name: "Avalanche", price: 28.90, change: 4.12, ema20_status: "Above EMA 20", ema20_value: 27.20, rsi14: 63.1, macd: { value: 0.85, signal: 0.55, histogram: 0.30, trend: "Bullish Crossover" }, action_signal: "BUY", volume: "145M", confidence: "89%" }
  ]
};

// DOM Elements
const clockElement = document.getElementById('live-clock');
const dateElement = document.getElementById('live-date');
const tableBody = document.getElementById('scanner-table-body');
const emptyState = document.getElementById('empty-state');
const currentMarketTitle = document.getElementById('current-market-title');
const currentMarketSubtitle = document.getElementById('current-market-subtitle');
const displayedCountElement = document.getElementById('displayed-count');
const lastUpdatedElement = document.getElementById('last-updated-timestamp');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const sortSelect = document.getElementById('sort-select');
const btnRefresh = document.getElementById('btn-refresh');
const refreshIcon = document.getElementById('refresh-icon');
const bullBearRatioBar = document.getElementById('bull-bear-ratio');
const bullishCountStat = document.getElementById('bullish-count-stat');
const waitCountStat = document.getElementById('wait-count-stat');
const totalTickerCount = document.getElementById('total-ticker-count');
const langEnBtn = document.getElementById('lang-en');
const langThBtn = document.getElementById('lang-th');

/**
 * Set and Apply Language (Bilingual Switching)
 */
function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem('mi_lang', lang);

  // Update switcher button styles
  if (lang === 'en') {
    langEnBtn.classList.add('active', 'text-white', 'bg-blue-600', 'shadow-sm');
    langEnBtn.classList.remove('text-slate-400');
    langThBtn.classList.remove('active', 'text-white', 'bg-blue-600', 'shadow-sm');
    langThBtn.classList.add('text-slate-400');
  } else {
    langThBtn.classList.add('active', 'text-white', 'bg-blue-600', 'shadow-sm');
    langThBtn.classList.remove('text-slate-400');
    langEnBtn.classList.remove('active', 'text-white', 'bg-blue-600', 'shadow-sm');
    langEnBtn.classList.add('text-slate-400');
  }

  // Update static text elements by data-i18n
  const dict = i18n[lang] || i18n.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Update placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // Update sidebar counts & table
  updateSidebarCounts();
  renderTable();
}

/**
 * Live Clock Functionality
 */
function initLiveClock() {
  const updateClock = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    clockElement.innerHTML = `
      <span class="text-white">${hours}:${minutes}:${seconds}</span>
      <span class="text-[9px] sm:text-[10px] text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20 font-sans">LOC</span>
    `;

    const locale = state.lang === 'th' ? 'th-TH' : 'en-US';
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    dateElement.textContent = now.toLocaleDateString(locale, options).toUpperCase();
  };

  updateClock();
  setInterval(updateClock, 1000);
}

/**
 * Update Quick Ticker Bar at the top
 */
function updateTopTickerBar() {
  if (!state.data) return;

  const updateItem = (elemPriceId, elemChangeId, item, prefix = '$') => {
    const elPrice = document.getElementById(elemPriceId);
    const elChange = document.getElementById(elemChangeId);
    if (!elPrice || !elChange || !item) return;

    elPrice.textContent = `${prefix}${item.price >= 1000 ? item.price.toLocaleString('en-US') : item.price}`;
    const sign = item.change >= 0 ? '+' : '';
    elChange.textContent = `${sign}${item.change.toFixed(2)}%`;
    elChange.className = item.change >= 0 
      ? 'text-emerald-400 font-semibold' 
      : 'text-rose-400 font-semibold';
  };

  const usList = state.data.us_stocks || [];
  const thaiList = state.data.thai_stocks || [];
  const cryptoList = state.data.crypto || [];
  const tfexList = state.data.tfex || [];

  const nvda = usList.find(x => x.ticker === 'NVDA') || usList[0];
  const delta = thaiList.find(x => x.ticker.includes('DELTA')) || thaiList[0];
  const btc = cryptoList.find(x => x.ticker.includes('BTC')) || cryptoList[0];
  const gold = tfexList.find(x => x.name.toLowerCase().includes('gold') || x.ticker.toLowerCase().includes('gold')) || tfexList[0];

  updateItem('top-sp500-price', 'top-sp500-change', nvda, '$');
  updateItem('top-set-price', 'top-set-change', delta, '฿');
  updateItem('top-btc-price', 'top-btc-change', btc, '$');
  updateItem('top-gold-price', 'top-gold-change', gold, '$');
}

/**
 * Fetch Data Function
 */
async function fetchScannerResults(endpoint = 'data/scan-results.json') {
  state.isLoading = true;
  refreshIcon.classList.add('animate-spin');

  try {
    // Add cache busting query parameter to always get fresh data
    const cacheBusterUrl = `${endpoint}?_t=${Date.now()}`;
    const response = await fetch(cacheBusterUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    state.data = data;
  } catch (error) {
    console.warn(`Fetch to ${endpoint} failed (${error.message}). Loading local fallback data for terminal integrity.`);
    state.data = JSON.parse(JSON.stringify(FALLBACK_DATA));
  } finally {
    state.isLoading = false;
    refreshIcon.classList.remove('animate-spin');
    state.lastUpdated = new Date();
    lastUpdatedElement.textContent = state.lastUpdated.toLocaleTimeString();
    updateSidebarCounts();
    updateTopTickerBar();
    renderTable();
  }
}

/**
 * Update Sidebar stats
 */
function updateSidebarCounts() {
  if (!state.data) return;

  const dict = i18n[state.lang] || i18n.en;
  let totalActive = 0;
  let overallBullish = 0;
  let overallBearish = 0;
  let overallWait = 0;

  Object.keys(state.data).forEach(cat => {
    const items = state.data[cat] || [];
    totalActive += items.length;
    
    const badge = document.querySelector(`.category-badge[data-badge="${cat}"]`);
    if (badge) {
      badge.textContent = items.length;
    }

    items.forEach(item => {
      const sig = (item.action_signal || '').toUpperCase();
      if (sig === 'BUY' || sig === 'PASS') {
        overallBullish++;
      } else if (sig === 'SELL' || sig === 'SHORT') {
        overallBearish++;
      } else {
        overallWait++;
      }
    });
  });

  totalTickerCount.textContent = `${totalActive} ${dict.total_active}`;
  bullishCountStat.textContent = `${overallBullish} ${dict.stat_bullish || 'BUY'}`;
  const bearishCountStat = document.getElementById('bearish-count-stat');
  if (bearishCountStat) {
    bearishCountStat.textContent = `${overallBearish} ${dict.stat_bearish || 'SELL'}`;
  }
  waitCountStat.textContent = `${overallWait} ${dict.stat_wait || 'WAIT'}`;

  const totalDirectional = overallBullish + overallBearish;
  const bullRatio = totalDirectional > 0 ? (overallBullish / totalDirectional) * 100 : 50;
  const bearRatio = totalDirectional > 0 ? (overallBearish / totalDirectional) * 100 : 50;

  if (bullBearRatioBar) bullBearRatioBar.style.width = `${bullRatio}%`;
  const bearRatioBar = document.getElementById('bear-ratio-bar');
  if (bearRatioBar) bearRatioBar.style.width = `${bearRatio}%`;
}

/**
 * Filter & Sort Data
 */
function getFilteredAndSortedData() {
  if (!state.data || !state.data[state.currentCategory]) {
    return [];
  }

  let list = [...state.data[state.currentCategory]];

  // 1. Search Query Filter
  if (state.searchQuery.trim() !== '') {
    const query = state.searchQuery.trim().toLowerCase();
    list = list.filter(item => 
      item.ticker.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query)
    );
  }

  // 2. Signal & Preset Filter
  if (state.currentFilter === 'BUY') {
    list = list.filter(item => {
      const s = (item.action_signal || '').toUpperCase();
      return s === 'BUY' || s === 'PASS';
    });
  } else if (state.currentFilter === 'SELL') {
    list = list.filter(item => {
      const s = (item.action_signal || '').toUpperCase();
      return s === 'SELL' || s === 'SHORT';
    });
  } else if (state.currentFilter === 'WAIT') {
    list = list.filter(item => {
      const s = (item.action_signal || '').toUpperCase();
      return s === 'WAIT' || s === 'HOLD';
    });
  } else if (state.currentFilter === 'RSI_OVERSOLD') {
    list = list.filter(item => item.rsi14 < 35);
  } else if (state.currentFilter === 'RSI_OVERBOUGHT') {
    list = list.filter(item => item.rsi14 > 65);
  }

  // 3. Sorting
  if (state.sortColumn !== 'default') {
    list.sort((a, b) => {
      let valA = a[state.sortColumn];
      let valB = b[state.sortColumn];

      if (typeof valA === 'string') {
        return state.sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      return state.sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }

  return list;
}

/**
 * Format currency and numbers cleanly
 */
function formatPrice(val, category) {
  const dict = i18n[state.lang] || i18n.en;
  const info = dict.markets[category] || { currency: '$' };
  const sign = info.currency === '$' ? '$' : (info.currency === '฿' ? '฿' : '');
  const suffix = info.currency === 'pts' ? (state.lang === 'th' ? ' จุด' : ' pts') : '';

  if (val >= 1000) {
    return `${sign}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
  } else if (val < 1) {
    return `${sign}${val.toFixed(4)}${suffix}`;
  }
  return `${sign}${val.toFixed(2)}${suffix}`;
}

/**
 * Render Data Table Rows with Bilingual Localization
 */
function renderTable() {
  const dict = i18n[state.lang] || i18n.en;
  const currentInfo = dict.markets[state.currentCategory] || { title: 'Market Scanner', subtitle: 'Technical screening' };
  
  currentMarketTitle.textContent = currentInfo.title;
  currentMarketSubtitle.textContent = currentInfo.subtitle;

  const data = getFilteredAndSortedData();
  displayedCountElement.textContent = data.length;

  if (data.length === 0) {
    tableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  const rowsHtml = data.map((stock) => {
    // 1. Change % Color & Sign
    const isPositiveChange = stock.change > 0;
    const isNeutralChange = stock.change === 0;
    const changeClass = isPositiveChange 
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
      : (isNeutralChange 
          ? 'text-slate-400 bg-slate-800/40 border-slate-700/40' 
          : 'text-rose-400 bg-rose-500/10 border-rose-500/20');
    
    const changeSign = isPositiveChange ? '+' : '';
    const arrowIcon = isPositiveChange ? '▲' : (isNeutralChange ? '■' : '▼');

    // 2. EMA 20 Status Styling & Translation
    const isEmaAbove = stock.ema20_status.toLowerCase().includes('above');
    const isEmaBelow = stock.ema20_status.toLowerCase().includes('below');
    const emaClass = isEmaAbove
      ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-600/30'
      : (isEmaBelow 
          ? 'text-rose-300 bg-rose-950/40 border border-rose-600/30' 
          : 'text-amber-300 bg-amber-950/40 border border-amber-600/30');

    let localizedEmaText = stock.ema20_status;
    if (isEmaAbove) localizedEmaText = dict.ema.above;
    else if (isEmaBelow) localizedEmaText = dict.ema.below;
    else localizedEmaText = dict.ema.at;

    // 3. RSI 14 Styling & Translation
    const rsi = stock.rsi14;
    let rsiColor = 'text-slate-300';
    let rsiBarColor = 'bg-blue-500';
    let rsiBadgeText = dict.rsi.neutral;

    if (rsi >= 70) {
      rsiColor = 'text-rose-400 font-bold';
      rsiBarColor = 'bg-rose-500';
      rsiBadgeText = dict.rsi.overbought;
    } else if (rsi <= 30) {
      rsiColor = 'text-emerald-400 font-bold';
      rsiBarColor = 'bg-emerald-400';
      rsiBadgeText = dict.rsi.oversold;
    } else if (rsi > 50) {
      rsiColor = 'text-emerald-300';
      rsiBarColor = 'bg-emerald-500';
      rsiBadgeText = dict.rsi.bullish;
    } else {
      rsiColor = 'text-slate-300';
      rsiBarColor = 'bg-slate-500';
      rsiBadgeText = dict.rsi.consolidation;
    }

    // 4. MACD Styling & Translation
    const isMacdBullish = stock.macd.histogram >= 0;
    const macdClass = isMacdBullish ? 'text-emerald-400' : 'text-rose-400';
    const macdBadgeBg = isMacdBullish ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    const macdHistSign = stock.macd.histogram >= 0 ? '+' : '';
    const localizedMacdTrend = dict.macd[stock.macd.trend] || stock.macd.trend;

    // 5. Action Signal (Green for BUY, Red for SELL, Amber for WAIT)
    const sig = (stock.action_signal || '').toUpperCase();
    const isBuy = sig === 'BUY' || sig === 'PASS';
    const isSell = sig === 'SELL' || sig === 'SHORT';
    const localizedSignal = dict.signals[sig] || stock.action_signal;

    let signalPill;
    if (isBuy) {
      signalPill = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          ${localizedSignal}
          <span class="text-[9px] font-normal text-emerald-400/80">(${stock.confidence || '90%'})</span>
        </span>`;
    } else if (isSell) {
      signalPill = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/20">
          <span class="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
          ${localizedSignal}
          <span class="text-[9px] font-normal text-rose-400/80">(${stock.confidence || '85%'})</span>
        </span>`;
    } else {
      signalPill = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          ${localizedSignal}
          <span class="text-[9px] font-normal text-amber-400/80">(${stock.confidence || '65%'})</span>
        </span>`;
    }

    return `
      <tr class="hover:bg-slate-800/40 transition-colors group">
        <!-- Ticker & Company Name -->
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-white group-hover:border-blue-500/50 transition-colors">
              ${stock.ticker.slice(0, 2)}
            </div>
            <div>
              <div class="font-bold text-white text-sm tracking-wide flex items-center gap-1.5">
                <span>${stock.ticker}</span>
              </div>
              <div class="text-[11px] text-slate-400 font-sans truncate max-w-[140px] lg:max-w-[200px]">
                ${stock.name}
              </div>
            </div>
          </div>
        </td>

        <!-- Last Price -->
        <td class="py-3 px-4 text-right">
          <div class="font-bold text-slate-100 text-sm">
            ${formatPrice(stock.price, state.currentCategory)}
          </div>
          <div class="text-[10px] text-slate-400 font-sans">
            ${dict.vol_label} ${stock.volume || '--'}
          </div>
        </td>

        <!-- % Change -->
        <td class="py-3 px-4 text-right">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${changeClass}">
            <span class="text-[9px]">${arrowIcon}</span>
            <span>${changeSign}${stock.change.toFixed(2)}%</span>
          </span>
        </td>

        <!-- EMA 20 Status -->
        <td class="py-3 px-4 text-center">
          <div class="inline-flex flex-col items-center">
            <span class="px-2.5 py-0.5 rounded text-[11px] font-medium ${emaClass}">
              ${localizedEmaText}
            </span>
            <span class="text-[10px] text-slate-400 mt-0.5 font-mono">
              ${dict.ref_label} ${stock.ema20_value}
            </span>
          </div>
        </td>

        <!-- RSI 14 with Gauge -->
        <td class="py-3 px-4">
          <div class="w-28 mx-auto">
            <div class="flex items-center justify-between text-[11px] mb-1">
              <span class="${rsiColor}">${stock.rsi14.toFixed(1)}</span>
              <span class="text-[9px] text-slate-400">${rsiBadgeText}</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
              <div class="${rsiBarColor} h-1.5 rounded-full" style="width: ${Math.min(Math.max(stock.rsi14, 5), 100)}%"></div>
            </div>
          </div>
        </td>

        <!-- MACD Indicator -->
        <td class="py-3 px-4">
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold ${macdClass}">
                Hist: ${macdHistSign}${stock.macd.histogram.toFixed(2)}
              </span>
              <span class="text-[9px] px-1 py-0.2 rounded border ${macdBadgeBg}">
                ${localizedMacdTrend}
              </span>
            </div>
            <div class="text-[10px] text-slate-400 flex items-center gap-2">
              <span>M: ${stock.macd.value.toFixed(2)}</span>
              <span>Sig: ${stock.macd.signal.toFixed(2)}</span>
            </div>
          </div>
        </td>

        <!-- Action Signal -->
        <td class="py-3 px-4 text-center">
          ${signalPill}
        </td>
      </tr>
    `;
  }).join('');

  tableBody.innerHTML = rowsHtml;
}

/**
 * Setup Event Handlers
 */
function setupEventHandlers() {
  // 1. Language Toggle Buttons
  langEnBtn.addEventListener('click', () => setLanguage('en'));
  langThBtn.addEventListener('click', () => setLanguage('th'));

  // 2. Category Switch Buttons
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-category');
      if (state.currentCategory === selected) return;

      categoryBtns.forEach(b => {
        b.classList.remove('active', 'text-white', 'bg-blue-600/20', 'border-blue-500/40', 'shadow-sm', 'shadow-blue-500/10');
        b.classList.add('text-slate-400', 'border-transparent');
        const dot = b.querySelector('.w-2.h-2');
        if (dot) dot.classList.replace('bg-blue-400', 'bg-slate-500');
      });

      btn.classList.add('active', 'text-white', 'bg-blue-600/20', 'border-blue-500/40', 'shadow-sm', 'shadow-blue-500/10');
      btn.classList.remove('text-slate-400', 'border-transparent');
      const activeDot = btn.querySelector('.w-2.h-2');
      if (activeDot) activeDot.classList.replace('bg-slate-500', 'bg-blue-400');

      state.currentCategory = selected;
      renderTable();
    });
  });

  // 3. Signal Filter Buttons (All, Buy, Wait)
  const signalFilterBtns = document.querySelectorAll('.signal-filter-btn');
  signalFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      state.currentFilter = filter;

      signalFilterBtns.forEach(b => {
        b.classList.remove('active', 'text-white', 'bg-slate-800/90', 'border-slate-700/80');
        b.classList.add('text-slate-400');
      });
      btn.classList.add('active', 'text-white', 'bg-slate-800/90', 'border-slate-700/80');
      btn.classList.remove('text-slate-400');

      renderTable();
    });
  });

  // 4. Technical Presets
  const btnRsiOversold = document.getElementById('preset-rsi-oversold');
  const btnRsiOverbought = document.getElementById('preset-rsi-overbought');

  btnRsiOversold.addEventListener('click', () => {
    if (state.currentFilter === 'RSI_OVERSOLD') {
      state.currentFilter = 'ALL';
      btnRsiOversold.classList.remove('bg-emerald-950/60', 'text-emerald-400', 'border-emerald-500');
    } else {
      state.currentFilter = 'RSI_OVERSOLD';
      btnRsiOversold.classList.add('bg-emerald-950/60', 'text-emerald-400', 'border-emerald-500');
      btnRsiOverbought.classList.remove('bg-rose-950/60', 'text-rose-400', 'border-rose-500');
    }
    renderTable();
  });

  btnRsiOverbought.addEventListener('click', () => {
    if (state.currentFilter === 'RSI_OVERBOUGHT') {
      state.currentFilter = 'ALL';
      btnRsiOverbought.classList.remove('bg-rose-950/60', 'text-rose-400', 'border-rose-500');
    } else {
      state.currentFilter = 'RSI_OVERBOUGHT';
      btnRsiOverbought.classList.add('bg-rose-950/60', 'text-rose-400', 'border-rose-500');
      btnRsiOversold.classList.remove('bg-emerald-950/60', 'text-emerald-400', 'border-emerald-500');
    }
    renderTable();
  });

  // 5. Search Filter
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    clearSearchBtn.classList.toggle('hidden', state.searchQuery === '');
    renderTable();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    renderTable();
  });

  // 6. Sort Dropdown
  sortSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'default') {
      state.sortColumn = 'default';
      state.sortDirection = 'desc';
    } else {
      const [col, dir] = val.split('-');
      state.sortColumn = col === 'price' ? 'price' : (col === 'change' ? 'change' : (col === 'rsi' ? 'rsi14' : col));
      state.sortDirection = dir;
    }
    renderTable();
  });

  // 7. Header Column Click to Sort
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const sortKey = th.getAttribute('data-sort');
      if (state.sortColumn === sortKey) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortColumn = sortKey;
        state.sortDirection = 'desc';
      }
      renderTable();
    });
  });

  // 8. Manual Refresh Button
  btnRefresh.addEventListener('click', () => {
    fetchScannerResults();
  });

  // 9. Reset Filters Button
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.searchQuery = '';
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      state.currentFilter = 'ALL';
      state.sortColumn = 'default';
      sortSelect.value = 'default';
      btnRsiOversold.classList.remove('bg-emerald-950/60', 'text-emerald-400', 'border-emerald-500');
      btnRsiOverbought.classList.remove('bg-rose-950/60', 'text-rose-400', 'border-rose-500');
      renderTable();
    });
  }
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  setupEventHandlers();
  setLanguage(state.lang); // Apply initial language
  fetchScannerResults();

  // Auto refresh every 30 seconds
  setInterval(() => {
    fetchScannerResults();
  }, 30000);
});
