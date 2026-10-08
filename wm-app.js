/**
 * Market Intelligence - Weekly & Monthly EMA 10 Scanner Dashboard Engine
 * Handles bilingual i18n, filtering, search, sorting, and dynamic table generation.
 */

const state = {
  lang: localStorage.getItem('mi_lang') || 'th',
  currentCategory: 'us_stocks',
  currentFilter: 'CROSS_ALL', // Default to showing items with fresh crossovers!
  searchQuery: '',
  sortMode: 'score_desc',
  data: null,
  rawPayload: null
};

// Bilingual Dictionaries
const i18n = {
  th: {
    title_us: "สแกนเนอร์หุ้นสหรัฐฯ (Weekly & Monthly EMA 10)",
    subtitle_us: "กรองหุ้นผู้นำ S&P 500 / Nasdaq: สัญญาณราคาปิดตัดขึ้นทะลุเส้น EMA 10",
    title_thai: "สแกนเนอร์หุ้นไทย SET100 (Weekly & Monthly EMA 10)",
    subtitle_thai: "กรองหุ้น SET100: สัญญาณราคาปิดตัดขึ้นทะลุเส้น EMA 10 ระดับสัปดาห์และเดือน",
    title_crypto: "สแกนเนอร์คริปโทฯ (Weekly & Monthly EMA 10)",
    subtitle_crypto: "กรองเหรียญชั้นนำ Top 100: สัญญาณ Breakout เหนือ EMA 10 สัปดาห์/เดือน",
    cross_badge: "🔥 ตัดขึ้น EMA 10",
    above_badge: "▲ ยืนเหนือ EMA 10",
    below_badge: "▼ ใต้เส้น EMA 10",
    double_cross: "★★ DOUBLE CROSS",
    w_cross_m_bull: "⚡ W-Cross + M-Bull",
    w_cross: "📈 Weekly Cross",
    m_cross: "🌕 Monthly Cross",
    bull_trend: "🟢 Bull Trend (W+M)",
    mixed: "⚪ พักตัว / ผสม",
    bearish: "▼ แนวโน้มลง",
    no_results: "ไม่พบสินทรัพย์ที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง",
    currency_us: "$",
    currency_thai: "฿",
    currency_crypto: "$"
  },
  en: {
    title_us: "US Equities Scanner (Weekly & Monthly EMA 10)",
    subtitle_us: "S&P 500 & Nasdaq Leaders: Price Closes Above EMA 10 Crossover",
    title_thai: "Thai Stocks SET100 (Weekly & Monthly EMA 10)",
    subtitle_thai: "SET100 Equities: Price Closes Above EMA 10 Weekly & Monthly Crossovers",
    title_crypto: "Crypto Intelligence (Weekly & Monthly EMA 10)",
    subtitle_crypto: "Top 100 Cryptocurrencies: Price Closes Above EMA 10 Breakouts",
    cross_badge: "🔥 CROSS ABOVE",
    above_badge: "▲ Above EMA 10",
    below_badge: "▼ Below EMA 10",
    double_cross: "★★ DOUBLE CROSS",
    w_cross_m_bull: "⚡ W-Cross + M-Bull",
    w_cross: "📈 Weekly Cross",
    m_cross: "🌕 Monthly Cross",
    bull_trend: "🟢 Bull Trend (W+M)",
    mixed: "⚪ Mixed / Range",
    bearish: "▼ Bearish",
    no_results: "No screening matches found for the active filter",
    currency_us: "$",
    currency_thai: "฿",
    currency_crypto: "$"
  }
};

// Clock Engine
function updateLiveClock() {
  const clockEl = document.getElementById('live-clock');
  const dateEl = document.getElementById('live-date');
  if (!clockEl || !dateEl) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
  clockEl.textContent = `${timeStr} LOC`;

  const dateOptions = state.lang === 'th'
    ? { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
    : { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };

  dateEl.textContent = now.toLocaleDateString(state.lang === 'th' ? 'th-TH' : 'en-US', dateOptions);
}

// Data Fetching
async function loadData() {
  try {
    const res = await fetch(`data/scan-results-wm.json?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    state.rawPayload = json;
    state.data = json.data;

    if (json.metadata && json.metadata.timestamp) {
      const timeElem = document.getElementById('engine-last-updated');
      if (timeElem) timeElem.textContent = json.metadata.timestamp;
    }

    updateMarketCounts();
    render();
  } catch (err) {
    console.error("Failed to load scan-results-wm.json:", err);
    // If not found, try falling back to data/scan-results.json
    renderError();
  }
}

function updateMarketCounts() {
  if (!state.data) return;

  const usData = state.data.us_stocks || [];
  const thaiData = state.data.thai_stocks || [];
  const cryptoData = state.data.crypto || [];

  const countUs = document.getElementById('count-us');
  const countThai = document.getElementById('count-thai');
  const countCrypto = document.getElementById('count-crypto');

  if (countUs) countUs.textContent = usData.length;
  if (countThai) countThai.textContent = thaiData.length;
  if (countCrypto) countCrypto.textContent = cryptoData.length;

  const currentCategoryData = state.data[state.currentCategory] || [];
  const totalScannedCount = document.getElementById('total-scanned-count');
  if (totalScannedCount) totalScannedCount.textContent = `${currentCategoryData.length} รายการ`;

  const crossCount = currentCategoryData.filter(x => x.has_cross_signal).length;
  const badgeCrossCount = document.getElementById('badge-cross-count');
  if (badgeCrossCount) badgeCrossCount.textContent = crossCount;
}

function filterAndSortData() {
  if (!state.data) return [];
  const items = state.data[state.currentCategory] || [];

  // Filter
  const filtered = items.filter(item => {
    // Search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchTicker = (item.ticker || '').toLowerCase().includes(q);
      const matchName = (item.name || '').toLowerCase().includes(q);
      if (!matchTicker && !matchName) return false;
    }

    // Signal Filter
    if (state.currentFilter === 'CROSS_ALL') {
      return item.has_cross_signal;
    } else if (state.currentFilter === 'DOUBLE_CROSS') {
      return item.overall_signal === 'DOUBLE_CROSS';
    } else if (state.currentFilter === 'W_CROSS_M_BULL') {
      return item.overall_signal === 'WEEKLY_CROSS_MONTHLY_BULL';
    } else if (state.currentFilter === 'W_CROSS') {
      return item.weekly && item.weekly.is_cross;
    } else if (state.currentFilter === 'M_CROSS') {
      return item.monthly && item.monthly.is_cross;
    } else if (state.currentFilter === 'BULLISH_TREND') {
      return item.overall_signal === 'BULLISH_TREND' || item.overall_signal === 'DOUBLE_CROSS' || item.overall_signal === 'WEEKLY_CROSS_MONTHLY_BULL';
    }
    return true; // 'ALL'
  });

  // Sort
  filtered.sort((a, b) => {
    switch (state.sortMode) {
      case 'w_change_desc':
        return (b.weekly?.change_pct || 0) - (a.weekly?.change_pct || 0);
      case 'm_change_desc':
        return (b.monthly?.change_pct || 0) - (a.monthly?.change_pct || 0);
      case 'w_diff_asc':
        return Math.abs(a.weekly?.diff_ema_pct || 0) - Math.abs(b.weekly?.diff_ema_pct || 0);
      case 'price_desc':
        return (b.price || 0) - (a.price || 0);
      case 'score_desc':
      default:
        if ((b.signal_score || 0) !== (a.signal_score || 0)) {
          return (b.signal_score || 0) - (a.signal_score || 0);
        }
        return (b.weekly?.change_pct || 0) - (a.weekly?.change_pct || 0);
    }
  });

  return filtered;
}

function updateSummaryCards(allItems, filteredItems) {
  const statShowing = document.getElementById('stat-showing');
  const statCross = document.getElementById('stat-cross');
  const statDoubleCross = document.getElementById('stat-double-cross');
  const statBullishTrend = document.getElementById('stat-bullish-trend');

  if (statShowing) statShowing.textContent = `${filteredItems.length} / ${allItems.length}`;
  if (statCross) statCross.textContent = allItems.filter(x => x.has_cross_signal).length;
  if (statDoubleCross) statDoubleCross.textContent = allItems.filter(x => x.overall_signal === 'DOUBLE_CROSS').length;
  if (statBullishTrend) statBullishTrend.textContent = allItems.filter(x => x.weekly?.status === 'ABOVE_EMA10' && x.monthly?.status === 'ABOVE_EMA10').length;
}

function render() {
  if (!state.data) return;

  const t = i18n[state.lang];
  const allItems = state.data[state.currentCategory] || [];
  const items = filterAndSortData();

  updateSummaryCards(allItems, items);

  // Update headers
  const marketTitle = document.getElementById('market-title');
  const marketSubtitle = document.getElementById('market-subtitle');
  if (state.currentCategory === 'us_stocks') {
    if (marketTitle) marketTitle.textContent = t.title_us;
    if (marketSubtitle) marketSubtitle.textContent = t.subtitle_us;
  } else if (state.currentCategory === 'thai_stocks') {
    if (marketTitle) marketTitle.textContent = t.title_thai;
    if (marketSubtitle) marketSubtitle.textContent = t.subtitle_thai;
  } else {
    if (marketTitle) marketTitle.textContent = t.title_crypto;
    if (marketSubtitle) marketSubtitle.textContent = t.subtitle_crypto;
  }

  const tbody = document.getElementById('table-body');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="px-4 py-16 text-center text-slate-500">
          <div class="flex flex-col items-center gap-2">
            <svg class="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span class="text-sm text-slate-400 font-medium">${t.no_results}</span>
            <button onclick="resetFilters()" class="mt-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300">แสดงรายการทั้งหมด (Reset Filters)</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const currency = state.currentCategory === 'thai_stocks' ? '฿' : '$';

  let html = '';
  for (const item of items) {
    const isWCross = item.weekly?.is_cross;
    const isMCross = item.monthly?.is_cross;
    const wStatus = item.weekly?.status;
    const mStatus = item.monthly?.status;

    // Weekly badge
    let wBadge = '';
    if (isWCross) {
      wBadge = `<span class="badge-cross inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">🔥 CROSS</span>`;
    } else if (wStatus === 'ABOVE_EMA10') {
      wBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">▲ เหนือ EMA10</span>`;
    } else {
      wBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">▼ ใต้ EMA10</span>`;
    }

    // Monthly badge
    let mBadge = '';
    if (isMCross) {
      mBadge = `<span class="badge-cross inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">🔥 CROSS</span>`;
    } else if (mStatus === 'ABOVE_EMA10') {
      mBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">▲ เหนือ EMA10</span>`;
    } else {
      mBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">▼ ใต้ EMA10</span>`;
    }

    // Setup Badge
    let setupBadge = '';
    const setup = item.overall_signal;
    if (setup === 'DOUBLE_CROSS') {
      setupBadge = `<span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20">${t.double_cross}</span>`;
    } else if (setup === 'WEEKLY_CROSS_MONTHLY_BULL') {
      setupBadge = `<span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">${t.w_cross_m_bull}</span>`;
    } else if (setup === 'MONTHLY_CROSS') {
      setupBadge = `<span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">${t.m_cross}</span>`;
    } else if (setup === 'WEEKLY_CROSS') {
      setupBadge = `<span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">${t.w_cross}</span>`;
    } else if (setup === 'BULLISH_TREND') {
      setupBadge = `<span class="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${t.bull_trend}</span>`;
    } else {
      setupBadge = `<span class="px-2 py-0.5 rounded text-[10px] text-slate-500 border border-slate-800">${t.mixed}</span>`;
    }

    // Weekly & Monthly % change colors
    const wChg = item.weekly?.change_pct || 0;
    const wChgClass = wChg > 0 ? 'text-emerald-400' : (wChg < 0 ? 'text-rose-400' : 'text-slate-400');
    const wChgSign = wChg > 0 ? '+' : '';

    const mChg = item.monthly?.change_pct || 0;
    const mChgClass = mChg > 0 ? 'text-emerald-400' : (mChg < 0 ? 'text-rose-400' : 'text-slate-400');
    const mChgSign = mChg > 0 ? '+' : '';

    // Distance from EMA10 formatting
    const wDiff = item.weekly?.diff_ema_pct || 0;
    const wDiffSign = wDiff > 0 ? '+' : '';
    const mDiff = item.monthly?.diff_ema_pct || 0;
    const mDiffSign = mDiff > 0 ? '+' : '';

    // Price formatting
    const pStr = item.price >= 1 ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price.toString();
    const wEmaStr = item.weekly?.ema10 >= 1 ? item.weekly.ema10.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.weekly?.ema10;
    const mEmaStr = item.monthly?.ema10 >= 1 ? item.monthly.ema10.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.monthly?.ema10;

    const rowBg = item.has_cross_signal ? 'bg-amber-950/10 hover:bg-amber-950/20' : 'hover:bg-slate-800/40';

    html += `
      <tr class="${rowBg} transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-white shrink-0">
              ${(item.ticker || '??').substring(0, 2)}
            </div>
            <div>
              <div class="font-bold text-slate-100 flex items-center gap-1.5">
                <span>${item.ticker}</span>
                ${item.has_cross_signal ? '<span class="text-xs">⚡</span>' : ''}
              </div>
              <div class="text-[11px] text-slate-400 truncate max-w-[180px] font-sans" title="${item.name}">${item.name}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-right">
          <span class="text-slate-100 font-semibold">${currency}${pStr}</span>
        </td>
        <td class="px-4 py-3 text-center border-l border-slate-800/80 bg-blue-950/10">
          ${wBadge}
        </td>
        <td class="px-4 py-3 text-right bg-blue-950/10">
          <div class="text-slate-300">${wEmaStr}</div>
          <div class="text-[10px] text-slate-500">${wDiffSign}${wDiff}% จากเส้น</div>
        </td>
        <td class="px-4 py-3 text-right bg-blue-950/10">
          <span class="font-semibold ${wChgClass}">${wChgSign}${wChg.toFixed(2)}%</span>
        </td>
        <td class="px-4 py-3 text-center border-l border-slate-800/80 bg-purple-950/10">
          ${mBadge}
        </td>
        <td class="px-4 py-3 text-right bg-purple-950/10">
          <div class="text-slate-300">${mEmaStr}</div>
          <div class="text-[10px] text-slate-500">${mDiffSign}${mDiff}% จากเส้น</div>
        </td>
        <td class="px-4 py-3 text-right bg-purple-950/10">
          <span class="font-semibold ${mChgClass}">${mChgSign}${mChg.toFixed(2)}%</span>
        </td>
        <td class="px-4 py-3 text-center border-l border-slate-800/80">
          ${setupBadge}
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

function renderError() {
  const tbody = document.getElementById('table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="px-4 py-12 text-center text-rose-400">
          <div class="flex flex-col items-center gap-2">
            <span>ไม่สามารถโหลดไฟล์ <code>data/scan-results-wm.json</code> ได้</span>
            <button onclick="loadData()" class="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs">ลองใหม่อีกครั้ง (Retry)</button>
          </div>
        </td>
      </tr>
    `;
  }
}

window.resetFilters = function() {
  state.currentFilter = 'ALL';
  state.searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.getAttribute('data-filter') === 'ALL') {
      btn.className = 'filter-btn w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all';
    } else {
      btn.className = 'filter-btn w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all border border-transparent';
    }
  });

  render();
};

// Event Listeners setup
function setupEventListeners() {
  // Live Clock
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  // Market Tabs
  document.querySelectorAll('.market-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      state.currentCategory = cat;

      document.querySelectorAll('.market-tab').forEach(b => {
        b.className = 'market-tab w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all border border-transparent';
        const dot = b.querySelector('.rounded-full');
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-slate-500';
      });

      btn.className = 'market-tab w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all bg-blue-600/20 text-blue-400 border border-blue-500/30';
      const activeDot = btn.querySelector('.rounded-full');
      if (activeDot) activeDot.className = 'w-2 h-2 rounded-full bg-blue-400';

      updateMarketCounts();
      render();
    });
  });

  // Signal Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.getAttribute('data-filter');
      state.currentFilter = f;

      document.querySelectorAll('.filter-btn').forEach(b => {
        b.className = 'filter-btn w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all border border-transparent';
      });

      btn.className = 'filter-btn w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all';

      render();
    });
  });

  // Search Input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      render();
    });
  }

  // Sort Dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortMode = e.target.value;
      render();
    });
  }

  // Refresh Button
  const btnRefresh = document.getElementById('btn-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      const icon = document.getElementById('refresh-icon');
      if (icon) icon.classList.add('rotate-180');
      loadData().finally(() => {
        setTimeout(() => {
          if (icon) icon.classList.remove('rotate-180');
        }, 500);
      });
    });
  }

  // Language Switcher
  const langEn = document.getElementById('lang-en');
  const langTh = document.getElementById('lang-th');
  if (langEn && langTh) {
    langEn.addEventListener('click', () => {
      state.lang = 'en';
      localStorage.setItem('mi_lang', 'en');
      langEn.className = 'px-2 sm:px-2.5 py-1 rounded-md text-white bg-amber-600 shadow-sm transition-all';
      langTh.className = 'px-2 sm:px-2.5 py-1 rounded-md text-slate-400 hover:text-white transition-all';
      updateLiveClock();
      render();
    });

    langTh.addEventListener('click', () => {
      state.lang = 'th';
      localStorage.setItem('mi_lang', 'th');
      langTh.className = 'px-2 sm:px-2.5 py-1 rounded-md text-white bg-amber-600 shadow-sm transition-all';
      langEn.className = 'px-2 sm:px-2.5 py-1 rounded-md text-slate-400 hover:text-white transition-all';
      updateLiveClock();
      render();
    });
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadData();
});
