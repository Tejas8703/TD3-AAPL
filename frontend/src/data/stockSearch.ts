export interface StockEntry {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
}

export const STOCK_DB: StockEntry[] = [
  // US Tech
  { ticker: "AAPL",   name: "Apple Inc.",                  sector: "Technology",     exchange: "NASDAQ" },
  { ticker: "GOOGL",  name: "Alphabet Inc.",                sector: "Technology",     exchange: "NASDAQ" },
  { ticker: "GOOG",   name: "Alphabet Inc. Class C",        sector: "Technology",     exchange: "NASDAQ" },
  { ticker: "MSFT",   name: "Microsoft Corporation",        sector: "Technology",     exchange: "NASDAQ" },
  { ticker: "META",   name: "Meta Platforms Inc.",          sector: "Technology",     exchange: "NASDAQ" },
  { ticker: "AMZN",   name: "Amazon.com Inc.",              sector: "Consumer",       exchange: "NASDAQ" },
  { ticker: "NVDA",   name: "NVIDIA Corporation",           sector: "Semiconductors", exchange: "NASDAQ" },
  { ticker: "TSLA",   name: "Tesla Inc.",                   sector: "EV / Energy",    exchange: "NASDAQ" },
  { ticker: "NFLX",   name: "Netflix Inc.",                 sector: "Entertainment",  exchange: "NASDAQ" },
  { ticker: "AMD",    name: "Advanced Micro Devices",       sector: "Semiconductors", exchange: "NASDAQ" },
  { ticker: "INTC",   name: "Intel Corporation",            sector: "Semiconductors", exchange: "NASDAQ" },
  { ticker: "AVGO",   name: "Broadcom Inc.",                sector: "Semiconductors", exchange: "NASDAQ" },
  { ticker: "QCOM",   name: "Qualcomm Inc.",                sector: "Semiconductors", exchange: "NASDAQ" },
  { ticker: "TXN",    name: "Texas Instruments",            sector: "Semiconductors", exchange: "NASDAQ" },
  { ticker: "MU",     name: "Micron Technology",            sector: "Semiconductors", exchange: "NASDAQ" },
  { ticker: "AMAT",   name: "Applied Materials",            sector: "Semiconductors", exchange: "NASDAQ" },
  { ticker: "TSM",    name: "Taiwan Semiconductor",         sector: "Semiconductors", exchange: "NYSE"   },
  { ticker: "ORCL",   name: "Oracle Corporation",           sector: "Technology",     exchange: "NYSE"   },
  { ticker: "IBM",    name: "IBM Corporation",              sector: "Technology",     exchange: "NYSE"   },
  { ticker: "CRM",    name: "Salesforce Inc.",              sector: "Technology",     exchange: "NYSE"   },
  { ticker: "ADBE",   name: "Adobe Inc.",                   sector: "Technology",     exchange: "NASDAQ" },
  { ticker: "NOW",    name: "ServiceNow Inc.",              sector: "Technology",     exchange: "NYSE"   },
  { ticker: "PLTR",   name: "Palantir Technologies",        sector: "Technology",     exchange: "NYSE"   },
  { ticker: "SHOP",   name: "Shopify Inc.",                 sector: "Technology",     exchange: "NYSE"   },
  { ticker: "SNAP",   name: "Snap Inc.",                    sector: "Social Media",   exchange: "NYSE"   },
  { ticker: "SPOT",   name: "Spotify Technology",           sector: "Entertainment",  exchange: "NYSE"   },
  { ticker: "UBER",   name: "Uber Technologies",            sector: "Transportation", exchange: "NYSE"   },
  { ticker: "LYFT",   name: "Lyft Inc.",                    sector: "Transportation", exchange: "NASDAQ" },
  { ticker: "ABNB",   name: "Airbnb Inc.",                  sector: "Travel",         exchange: "NASDAQ" },
  { ticker: "DASH",   name: "DoorDash Inc.",                sector: "Food Delivery",  exchange: "NYSE"   },
  { ticker: "COIN",   name: "Coinbase Global",              sector: "Crypto",         exchange: "NASDAQ" },
  { ticker: "RBLX",   name: "Roblox Corporation",           sector: "Gaming",         exchange: "NYSE"   },
  { ticker: "PYPL",   name: "PayPal Holdings",              sector: "Fintech",        exchange: "NASDAQ" },
  { ticker: "SQ",     name: "Block Inc.",                   sector: "Fintech",        exchange: "NYSE"   },
  { ticker: "HOOD",   name: "Robinhood Markets",            sector: "Fintech",        exchange: "NASDAQ" },
  // US Finance
  { ticker: "JPM",    name: "JPMorgan Chase & Co.",         sector: "Banking",        exchange: "NYSE"   },
  { ticker: "BAC",    name: "Bank of America",              sector: "Banking",        exchange: "NYSE"   },
  { ticker: "GS",     name: "Goldman Sachs Group",          sector: "Banking",        exchange: "NYSE"   },
  { ticker: "MS",     name: "Morgan Stanley",               sector: "Banking",        exchange: "NYSE"   },
  { ticker: "WFC",    name: "Wells Fargo & Co.",            sector: "Banking",        exchange: "NYSE"   },
  { ticker: "C",      name: "Citigroup Inc.",               sector: "Banking",        exchange: "NYSE"   },
  { ticker: "V",      name: "Visa Inc.",                    sector: "Payments",       exchange: "NYSE"   },
  { ticker: "MA",     name: "Mastercard Inc.",              sector: "Payments",       exchange: "NYSE"   },
  { ticker: "BRK-B",  name: "Berkshire Hathaway B",        sector: "Conglomerate",   exchange: "NYSE"   },
  // US Healthcare
  { ticker: "JNJ",    name: "Johnson & Johnson",            sector: "Healthcare",     exchange: "NYSE"   },
  { ticker: "PFE",    name: "Pfizer Inc.",                  sector: "Pharma",         exchange: "NYSE"   },
  { ticker: "MRNA",   name: "Moderna Inc.",                 sector: "Pharma",         exchange: "NASDAQ" },
  { ticker: "ABBV",   name: "AbbVie Inc.",                  sector: "Pharma",         exchange: "NYSE"   },
  { ticker: "UNH",    name: "UnitedHealth Group",           sector: "Healthcare",     exchange: "NYSE"   },
  { ticker: "AMGN",   name: "Amgen Inc.",                   sector: "Biotech",        exchange: "NASDAQ" },
  { ticker: "GILD",   name: "Gilead Sciences",              sector: "Biotech",        exchange: "NASDAQ" },
  // US Energy / Industrial
  { ticker: "XOM",    name: "ExxonMobil Corporation",       sector: "Energy",         exchange: "NYSE"   },
  { ticker: "CVX",    name: "Chevron Corporation",          sector: "Energy",         exchange: "NYSE"   },
  { ticker: "BA",     name: "Boeing Company",               sector: "Aerospace",      exchange: "NYSE"   },
  { ticker: "GE",     name: "General Electric",             sector: "Industrial",     exchange: "NYSE"   },
  { ticker: "CAT",    name: "Caterpillar Inc.",             sector: "Industrial",     exchange: "NYSE"   },
  { ticker: "HON",    name: "Honeywell International",      sector: "Industrial",     exchange: "NASDAQ" },
  { ticker: "MMM",    name: "3M Company",                   sector: "Industrial",     exchange: "NYSE"   },
  // US Consumer
  { ticker: "WMT",    name: "Walmart Inc.",                 sector: "Retail",         exchange: "NYSE"   },
  { ticker: "TGT",    name: "Target Corporation",           sector: "Retail",         exchange: "NYSE"   },
  { ticker: "COST",   name: "Costco Wholesale",             sector: "Retail",         exchange: "NASDAQ" },
  { ticker: "HD",     name: "Home Depot Inc.",              sector: "Retail",         exchange: "NYSE"   },
  { ticker: "NKE",    name: "Nike Inc.",                    sector: "Consumer",       exchange: "NYSE"   },
  { ticker: "MCD",    name: "McDonald's Corporation",       sector: "Food",           exchange: "NYSE"   },
  { ticker: "SBUX",   name: "Starbucks Corporation",        sector: "Food",           exchange: "NASDAQ" },
  { ticker: "KO",     name: "Coca-Cola Company",            sector: "Beverages",      exchange: "NYSE"   },
  { ticker: "PEP",    name: "PepsiCo Inc.",                 sector: "Beverages",      exchange: "NASDAQ" },
  // US Auto / EV
  { ticker: "F",      name: "Ford Motor Company",           sector: "Automotive",     exchange: "NYSE"   },
  { ticker: "GM",     name: "General Motors",               sector: "Automotive",     exchange: "NYSE"   },
  { ticker: "RIVN",   name: "Rivian Automotive",            sector: "EV",             exchange: "NASDAQ" },
  { ticker: "NIO",    name: "NIO Inc.",                     sector: "EV",             exchange: "NYSE"   },
  // US Telecom / Media
  { ticker: "T",      name: "AT&T Inc.",                    sector: "Telecom",        exchange: "NYSE"   },
  { ticker: "VZ",     name: "Verizon Communications",       sector: "Telecom",        exchange: "NYSE"   },
  { ticker: "TMUS",   name: "T-Mobile US",                  sector: "Telecom",        exchange: "NASDAQ" },
  { ticker: "DIS",    name: "Walt Disney Company",          sector: "Entertainment",  exchange: "NYSE"   },
  { ticker: "CMCSA",  name: "Comcast Corporation",          sector: "Media",          exchange: "NASDAQ" },
  // ETFs
  { ticker: "SPY",    name: "SPDR S&P 500 ETF",            sector: "ETF",            exchange: "NYSE"   },
  { ticker: "QQQ",    name: "Invesco QQQ Trust",            sector: "ETF",            exchange: "NASDAQ" },
  { ticker: "VTI",    name: "Vanguard Total Market ETF",    sector: "ETF",            exchange: "NYSE"   },
  // Indian Stocks (NSE)
  { ticker: "RELIANCE.NS", name: "Reliance Industries",     sector: "Conglomerate",   exchange: "NSE" },
  { ticker: "TCS.NS",      name: "Tata Consultancy Services", sector: "Technology",  exchange: "NSE" },
  { ticker: "INFY.NS",     name: "Infosys Ltd.",             sector: "Technology",    exchange: "NSE" },
  { ticker: "HDFCBANK.NS", name: "HDFC Bank Ltd.",           sector: "Banking",       exchange: "NSE" },
  { ticker: "ICICIBANK.NS",name: "ICICI Bank Ltd.",          sector: "Banking",       exchange: "NSE" },
  { ticker: "WIPRO.NS",    name: "Wipro Ltd.",               sector: "Technology",    exchange: "NSE" },
  { ticker: "HCLTECH.NS",  name: "HCL Technologies",         sector: "Technology",    exchange: "NSE" },
  { ticker: "SBIN.NS",     name: "State Bank of India",      sector: "Banking",       exchange: "NSE" },
  { ticker: "BAJFINANCE.NS",name: "Bajaj Finance Ltd.",      sector: "Fintech",       exchange: "NSE" },
  { ticker: "TATAMOTORS.NS",name: "Tata Motors Ltd.",        sector: "Automotive",    exchange: "NSE" },
  { ticker: "MARUTI.NS",   name: "Maruti Suzuki India",      sector: "Automotive",    exchange: "NSE" },
  { ticker: "ITC.NS",      name: "ITC Ltd.",                 sector: "Consumer",      exchange: "NSE" },
  { ticker: "ADANIENT.NS", name: "Adani Enterprises",        sector: "Conglomerate",  exchange: "NSE" },
  { ticker: "SUNPHARMA.NS",name: "Sun Pharmaceutical",       sector: "Pharma",        exchange: "NSE" },
  { ticker: "HINDUNILVR.NS",name: "Hindustan Unilever",      sector: "Consumer",      exchange: "NSE" },
];

// --- Levenshtein distance ---
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      dp[i][j] = i === 0 ? j : j === 0 ? i : 0;
    }
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// --- Subsequence match score (rewards consecutive matches) ---
function subsequenceScore(query: string, target: string): number {
  let qi = 0, score = 0, consecutive = 0;
  for (let i = 0; i < target.length && qi < query.length; i++) {
    if (target[i] === query[qi]) {
      qi++;
      consecutive++;
      score += consecutive * 5;
    } else {
      consecutive = 0;
    }
  }
  return qi === query.length ? score : 0;
}

// --- Master scoring function ---
function scoreStock(query: string, stock: StockEntry): number {
  if (!query) return 0;
  const q  = query.toLowerCase().trim();
  const t  = stock.ticker.toLowerCase();
  // strip exchange suffix for cleaner matching
  const tBase = t.split(".")[0];
  const n  = stock.name.toLowerCase();
  const words = n.split(/\s+/);

  let score = 0;

  // Tier 1 — exact ticker
  if (t === q || tBase === q) return 10000;

  // Tier 2 — ticker starts with query
  if (t.startsWith(q) || tBase.startsWith(q)) score = Math.max(score, 9000 - t.length * 10);

  // Tier 3 — name starts with query
  if (n.startsWith(q)) score = Math.max(score, 8000);

  // Tier 4 — any word in name starts with query
  words.forEach(w => {
    if (w.startsWith(q)) score = Math.max(score, 7500);
  });

  // Tier 5 — ticker contains query
  if (t.includes(q) || tBase.includes(q)) score = Math.max(score, 7000);

  // Tier 6 — name contains query
  if (n.includes(q)) score = Math.max(score, 6000);

  // Tier 7 — fuzzy Levenshtein on ticker (handles typos)
  if (q.length >= 2) {
    const maxAllowed = Math.max(1, Math.floor(q.length / 3));
    const distTicker = levenshtein(q, tBase);
    if (distTicker <= maxAllowed) {
      score = Math.max(score, 5000 - distTicker * 300);
    }
    // Against first word of name
    const firstWord = words[0];
    const distName = levenshtein(q, firstWord.slice(0, Math.min(q.length + 2, firstWord.length)));
    if (distName <= maxAllowed) {
      score = Math.max(score, 4500 - distName * 300);
    }
  }

  // Tier 8 — subsequence match (e.g. "apl" matches "apple")
  const subTicker = subsequenceScore(q, tBase);
  if (subTicker > 0) score = Math.max(score, 3000 + subTicker);

  const subName = subsequenceScore(q, n.replace(/\s+/g, ""));
  if (subName > 0) score = Math.max(score, 2500 + subName);

  return score;
}

const MIN_SCORE = 2000;

export function searchStocks(query: string, limit = 6): StockEntry[] {
  const q = query.trim();
  if (!q) return [];

  const scored = STOCK_DB.map(s => ({ stock: s, score: scoreStock(q, s) }))
    .filter(r => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(r => r.stock);
}
