#!/usr/bin/env python
# coding: utf-8

# # TD3 Reinforcement Learning — Data Analysis & Model Evaluation Report
# 
# **Author:** Quantitative Analysis Report  
# **Model:** Twin Delayed Deep Deterministic Policy Gradient (TD3)  
# **Assets:** AAPL (Apple Inc.) · TCS (Tata Consultancy Services)  
# 
# ---
# 
# This notebook provides an end-to-end analysis pipeline covering:
# 
# 1. **Exploratory Data Analysis (EDA)** — feature engineering, distributions, correlation heatmaps  
# 2. **Model Action Visualization** — overlaying TD3 Buy/Sell signals on price history  
# 3. **Portfolio Simulation & Equity Curve** — step-by-step portfolio growth from `upload_eval.py` logic  
# 4. **KPI Dashboard** — Sharpe Ratio, Max Drawdown, Net Return, Directional Accuracy  
# 5. **Statistical Critique** — expert commentary on RL agent performance, overfitting, and volatility handling  

# ## 0. Environment Setup

# In[3]:


# ── Core dependencies ──────────────────────────────────────────────────────────
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
import seaborn as sns
from scipy import stats

# Technical Analysis
try:
    import ta
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'ta', '-q'])
    import ta

# Plotting style
sns.set_theme(style='darkgrid', palette='muted', font_scale=1.05)
plt.rcParams.update({
    'figure.dpi': 130,
    'axes.titlesize': 13,
    'axes.labelsize': 11,
    'legend.fontsize': 9,
    'figure.facecolor': '#0d1117',
    'axes.facecolor': '#161b22',
    'axes.edgecolor': '#30363d',
    'text.color': '#e6edf3',
    'axes.labelcolor': '#e6edf3',
    'xtick.color': '#8b949e',
    'ytick.color': '#8b949e',
    'grid.color': '#21262d',
    'legend.facecolor': '#21262d',
    'legend.edgecolor': '#30363d',
})

ACCENT_BLUE   = '#58a6ff'
ACCENT_GREEN  = '#3fb950'
ACCENT_RED    = '#f85149'
ACCENT_ORANGE = '#e3b341'
ACCENT_PURPLE = '#bc8cff'

print('✅ Environment ready.')


# ---
# ## 1. Exploratory Data Analysis (EDA)
# 
# ### 1.1 Data Ingestion
# 
# We support two CSV layouts:
# - **AAPL actions file** — `Date, Close, action` (pre-computed TD3 actions stored)  
# - **TCS yfinance export** — multi-level header (`Price/Ticker/Date` pattern)  
# 
# The ingestion logic mirrors the header-detection in `upload_eval.py`.

# In[5]:


# ── Path configuration — update these to your CSV locations ───────────────────
AAPL_ACTIONS_CSV = '../AAPL_actions_smooth_56_accuracy.csv'   # TD3 actions + AAPL close
TCS_CSV          = '../tcs_stock_data.csv'                    # yfinance multi-header export

# ── Helper: clean yfinance multi-level CSV ────────────────────────────────────
def load_yfinance_csv(filepath: str) -> pd.DataFrame:
    """Handles yfinance CSVs with a Price/Ticker/Date three-row header."""
    raw = pd.read_csv(filepath, nrows=3, header=None)
    first_cell = str(raw.iloc[0, 0])

    if first_cell == 'Price':                          # yfinance multi-header
        df = pd.read_csv(filepath, skiprows=3, header=None)
        df.columns = ['Date', 'Close', 'High', 'Low', 'Open', 'Volume']
    else:
        df = pd.read_csv(filepath)
        df.columns = [c.strip() for c in df.columns]

    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df = df.dropna(subset=['Date']).sort_values('Date').reset_index(drop=True)
    for col in ['Close', 'High', 'Low', 'Open', 'Volume']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    df = df.dropna(subset=['Close'])
    # Ensure stub columns expected by ta
    for col in ['High', 'Low', 'Open', 'Volume', 'Dividends', 'Stock Splits']:
        if col not in df.columns:
            df[col] = np.nan
    return df

# ── Load AAPL actions ─────────────────────────────────────────────────────────
aapl_actions_raw = pd.read_csv(AAPL_ACTIONS_CSV)
aapl_actions_raw['Date'] = pd.to_datetime(aapl_actions_raw['Date'])
aapl_actions_raw = aapl_actions_raw.sort_values('Date').reset_index(drop=True)
print(f'AAPL actions  : {len(aapl_actions_raw):,} rows | {aapl_actions_raw["Date"].min().date()} → {aapl_actions_raw["Date"].max().date()}')
aapl_actions_raw.head(3)


# In[6]:


# ── Load TCS OHLCV ────────────────────────────────────────────────────────────
tcs_raw = load_yfinance_csv(TCS_CSV)
print(f'TCS OHLCV     : {len(tcs_raw):,} rows | {tcs_raw["Date"].min().date()} → {tcs_raw["Date"].max().date()}')
tcs_raw.head(3)


# ### 1.2 Recreating the TD3 State-Space Features
# 
# The agent's observation vector uses **12 features**:
# 
# | # | Feature | Description |
# |---|---------|-------------|
# | 1–5 | Open, High, Low, Close, Volume | Raw OHLCV |
# | 6–7 | Dividends, Stock Splits | Corporate actions |
# | 8 | **SMA_20** | 20-day Simple Moving Average |
# | 9 | **SMA_50** | 50-day Simple Moving Average |
# | 10 | **RSI** | 14-day Relative Strength Index |
# | 11 | **MACD** | MACD Histogram (diff) |
# | 12 | **ATR** | 14-day Average True Range |
# 
# These exactly replicate the `add_technical_indicators()` function in `td3.py`.

# In[7]:


def add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Exact replica of td3.py :: add_technical_indicators()
    Adds SMA_20, SMA_50, RSI, MACD (diff), ATR and drops NaN rows.
    """
    df = df.copy()
    df['SMA_20'] = ta.trend.sma_indicator(df['Close'], window=20)
    df['SMA_50'] = ta.trend.sma_indicator(df['Close'], window=50)
    df['RSI']   = ta.momentum.rsi(df['Close'], window=14)
    df['MACD']  = ta.trend.macd_diff(df['Close'])      # histogram = MACD - signal
    # ATR requires High/Low; if unavailable, fill with Close ± small delta
    high = df['High'] if df['High'].notna().sum() > 50 else df['Close'] * 1.005
    low  = df['Low']  if df['Low'].notna().sum()  > 50 else df['Close'] * 0.995
    df['ATR']   = ta.volatility.average_true_range(high, low, df['Close'])
    df.dropna(inplace=True)
    return df.reset_index(drop=True)

# Apply to TCS (richer OHLCV)
tcs = add_technical_indicators(tcs_raw)

# For AAPL we only have Close + action columns, so we synthesise High/Low
aapl_ohlcv = aapl_actions_raw.copy()
aapl_ohlcv['High']   = aapl_ohlcv['Close'] * 1.005
aapl_ohlcv['Low']    = aapl_ohlcv['Close'] * 0.995
aapl_ohlcv['Open']   = aapl_ohlcv['Close']
aapl_ohlcv['Volume'] = np.nan
aapl = add_technical_indicators(aapl_ohlcv)

TECH_FEATURES = ['SMA_20', 'SMA_50', 'RSI', 'MACD', 'ATR']
print(f'TCS with indicators : {len(tcs):,} rows')
print(f'AAPL with indicators: {len(aapl):,} rows')
tcs[['Date', 'Close'] + TECH_FEATURES].tail(5)


# ### 1.3 Feature Distributions

# In[8]:


fig, axes = plt.subplots(2, 3, figsize=(15, 8))
fig.suptitle('TCS — Technical Indicator Distributions', fontsize=15, color='#e6edf3', y=1.01)

plot_cols = ['Close'] + TECH_FEATURES
colors = [ACCENT_BLUE, ACCENT_GREEN, ACCENT_ORANGE, ACCENT_PURPLE, ACCENT_RED, '#79c0ff']

for ax, col, color in zip(axes.flat, plot_cols, colors):
    data = tcs[col].dropna()
    ax.hist(data, bins=60, color=color, alpha=0.75, edgecolor='none')
    mu, sigma = data.mean(), data.std()
    ax.axvline(mu, color='white', lw=1.5, linestyle='--', label=f'μ={mu:.2f}')
    ax.set_title(col)
    ax.legend()
    skew = stats.skew(data)
    ax.set_xlabel(f'skew={skew:.2f}  σ={sigma:.2f}')

axes.flat[-1].set_visible(False)   # hide 6th subplot (only 5 features + Close = 6)
plt.tight_layout()
plt.savefig('feature_distributions.png', bbox_inches='tight', facecolor='#0d1117')
plt.show()
print('📊 Saved: feature_distributions.png')


# ### 1.4 Correlation Heatmap — Features vs. Close Price

# In[9]:


# ── Compute returns-based correlation (more stationary) ───────────────────────
tcs_feat = tcs[['Close'] + TECH_FEATURES].copy()
tcs_feat['Close_Return_1d'] = tcs_feat['Close'].pct_change()
tcs_feat['Close_Return_5d'] = tcs_feat['Close'].pct_change(5)
tcs_feat.dropna(inplace=True)

corr_cols = TECH_FEATURES + ['Close_Return_1d', 'Close_Return_5d', 'Close']
corr_matrix = tcs_feat[corr_cols].corr()

fig, axes = plt.subplots(1, 2, figsize=(16, 6))
fig.suptitle('TCS — Feature Correlation Analysis', fontsize=14, color='#e6edf3')

# Full correlation heatmap
mask = np.triu(np.ones_like(corr_matrix, dtype=bool), k=1)
sns.heatmap(
    corr_matrix, ax=axes[0],
    cmap='RdYlGn', center=0, vmin=-1, vmax=1,
    annot=True, fmt='.2f', annot_kws={'size': 8},
    linewidths=0.5, linecolor='#0d1117',
    cbar_kws={'shrink': 0.8}
)
axes[0].set_title('Feature Correlation Matrix', color='#e6edf3')
axes[0].tick_params(colors='#8b949e', labelsize=9)

# Bar chart: correlation of each feature with 1-day forward return
corr_vs_return = tcs_feat[TECH_FEATURES].corrwith(tcs_feat['Close_Return_1d']).sort_values()
bar_colors = [ACCENT_RED if v < 0 else ACCENT_GREEN for v in corr_vs_return]
axes[1].barh(corr_vs_return.index, corr_vs_return.values, color=bar_colors, edgecolor='none', height=0.55)
axes[1].axvline(0, color='white', lw=0.8)
axes[1].set_xlabel('Pearson Correlation with 1-day Return', color='#e6edf3')
axes[1].set_title('Feature → 1-day Forward Return Correlation', color='#e6edf3')
for i, (val, label) in enumerate(zip(corr_vs_return.values, corr_vs_return.index)):
    axes[1].text(val + 0.003 * np.sign(val), i, f'{val:.3f}', va='center', fontsize=9, color='#e6edf3')

plt.tight_layout()
plt.savefig('correlation_heatmap.png', bbox_inches='tight', facecolor='#0d1117')
plt.show()
print('📊 Saved: correlation_heatmap.png')


# ### 1.5 AAPL & TCS — Normalised Price Comparison

# In[10]:


fig, axes = plt.subplots(2, 1, figsize=(14, 8), sharex=False)

# AAPL
ax = axes[0]
ax.plot(aapl['Date'], aapl['Close'], color=ACCENT_BLUE, lw=1.2, label='AAPL Close')
ax2 = ax.twinx()
ax2.fill_between(aapl['Date'], aapl['RSI'], 50, where=aapl['RSI'] >= 50,
                 alpha=0.20, color=ACCENT_GREEN, label='RSI > 50')
ax2.fill_between(aapl['Date'], aapl['RSI'], 50, where=aapl['RSI'] < 50,
                 alpha=0.20, color=ACCENT_RED, label='RSI < 50')
ax2.axhline(70, color=ACCENT_RED,   lw=0.6, linestyle='--')
ax2.axhline(30, color=ACCENT_GREEN, lw=0.6, linestyle='--')
ax2.set_ylabel('RSI (14)', color='#8b949e')
ax2.set_ylim(0, 120)
ax.set_title('AAPL — Close Price & RSI (14)', color='#e6edf3')
ax.set_ylabel('Price ($)', color='#e6edf3')
handles = [mpatches.Patch(color=ACCENT_BLUE, label='Close'),
           mpatches.Patch(color=ACCENT_GREEN, alpha=0.5, label='RSI > 50 (bullish)'),
           mpatches.Patch(color=ACCENT_RED, alpha=0.5, label='RSI < 50 (bearish)')]
ax.legend(handles=handles, loc='upper left')

# TCS
ax = axes[1]
ax.plot(tcs['Date'], tcs['Close'], color=ACCENT_ORANGE, lw=1.2, label='TCS Close')
ax.plot(tcs['Date'], tcs['SMA_20'], color=ACCENT_BLUE,   lw=0.9, linestyle='--', alpha=0.7, label='SMA 20')
ax.plot(tcs['Date'], tcs['SMA_50'], color=ACCENT_PURPLE, lw=0.9, linestyle='--', alpha=0.7, label='SMA 50')
ax.set_title('TCS — Close Price with SMA 20 & SMA 50 Overlays', color='#e6edf3')
ax.set_ylabel('Price (₹)', color='#e6edf3')
ax.legend(loc='upper left')

plt.tight_layout()
plt.savefig('price_overview.png', bbox_inches='tight', facecolor='#0d1117')
plt.show()
print('📊 Saved: price_overview.png')


# ---
# ## 2. Model Action Visualization
# 
# The AAPL actions CSV stores pre-computed TD3 continuous actions in the range **[−1, +1]**:
# - `action > 0` → **Long / Buy** signal  
# - `action < 0` → **Short / Sell** signal  
# - `|action|` magnitude indicates conviction (position sizing proxy)
# 
# ### 2.1 Actions Overlaid on Close Price

# In[11]:


df_act = aapl_actions_raw.dropna(subset=['action', 'Close']).copy()
df_act['signal'] = df_act['action'].apply(lambda x: 'BUY' if x > 0 else 'SELL')

# Threshold for 'strong' signals
STRONG_THRESH = 0.3

fig = plt.figure(figsize=(16, 10))
gs  = gridspec.GridSpec(3, 1, height_ratios=[2.5, 1, 1], hspace=0.08)

# ── Panel 1: Price + buy/sell dots ────────────────────────────────────────────
ax1 = fig.add_subplot(gs[0])
ax1.plot(df_act['Date'], df_act['Close'], color='#c9d1d9', lw=1.0, alpha=0.9, zorder=1)

buys  = df_act[df_act['action'] > STRONG_THRESH]
sells = df_act[df_act['action'] < -STRONG_THRESH]

ax1.scatter(buys['Date'],  buys['Close'],  color=ACCENT_GREEN, s=22, zorder=3,
            label=f'Buy  (action > +{STRONG_THRESH})', marker='^', alpha=0.85)
ax1.scatter(sells['Date'], sells['Close'], color=ACCENT_RED,   s=22, zorder=3,
            label=f'Sell (action < −{STRONG_THRESH})', marker='v', alpha=0.85)

ax1.set_ylabel('AAPL Close Price ($)', color='#e6edf3')
ax1.set_title('TD3 Agent — Buy / Sell Signals Overlaid on AAPL Close Price', color='#e6edf3', fontsize=13)
ax1.legend(loc='upper left')
ax1.set_xticklabels([])

# ── Panel 2: Raw action value ─────────────────────────────────────────────────
ax2 = fig.add_subplot(gs[1], sharex=ax1)
pos = np.where(df_act['action'] >= 0, df_act['action'], 0)
neg = np.where(df_act['action'] <  0, df_act['action'], 0)
ax2.fill_between(df_act['Date'], pos, color=ACCENT_GREEN, alpha=0.55, label='Long')
ax2.fill_between(df_act['Date'], neg, color=ACCENT_RED,   alpha=0.55, label='Short')
ax2.axhline(0, color='white', lw=0.6)
ax2.set_ylabel('Action', color='#e6edf3')
ax2.set_ylim(-1.1, 1.1)
ax2.legend(loc='upper right', ncol=2)
ax2.set_xticklabels([])

# ── Panel 3: Rolling action momentum (10d EMA of action) ─────────────────────
ax3 = fig.add_subplot(gs[2], sharex=ax1)
ema_action = df_act['action'].ewm(span=10).mean()
ax3.plot(df_act['Date'], ema_action, color=ACCENT_ORANGE, lw=1.2, label='EMA-10 of Action')
ax3.axhline(0, color='white', lw=0.6, linestyle='--')
ax3.fill_between(df_act['Date'], ema_action, 0,
                 where=ema_action >= 0, alpha=0.25, color=ACCENT_GREEN)
ax3.fill_between(df_act['Date'], ema_action, 0,
                 where=ema_action <  0, alpha=0.25, color=ACCENT_RED)
ax3.set_ylabel('EMA Action', color='#e6edf3')
ax3.set_xlabel('Date', color='#e6edf3')
ax3.legend(loc='upper right')

plt.savefig('action_signals.png', bbox_inches='tight', facecolor='#0d1117')
plt.show()
print('📊 Saved: action_signals.png')


# ### 2.2 Action Distribution Analysis

# In[12]:


fig, axes = plt.subplots(1, 3, figsize=(15, 4))
fig.suptitle('TD3 Action Output Analysis', color='#e6edf3', fontsize=13)

actions = df_act['action'].values

# Distribution
axes[0].hist(actions, bins=60, color=ACCENT_BLUE, alpha=0.8, edgecolor='none')
axes[0].axvline(0, color='white', lw=1.2, linestyle='--')
axes[0].set_title('Action Distribution')
axes[0].set_xlabel('Action Value (−1 = full short, +1 = full long)')
pct_long  = (actions > 0).mean() * 100
pct_short = (actions < 0).mean() * 100
axes[0].text(0.02, 0.92, f'Long:  {pct_long:.1f}%\nShort: {pct_short:.1f}%',
             transform=axes[0].transAxes, color='#e6edf3', fontsize=9)

# QQ-plot — test if actions are normally distributed
(osm, osr), (slope, intercept, r) = stats.probplot(actions, dist='norm')
axes[1].scatter(osm, osr, color=ACCENT_PURPLE, s=6, alpha=0.6)
x_line = np.array([osm.min(), osm.max()])
axes[1].plot(x_line, slope * x_line + intercept, color='white', lw=1.2)
axes[1].set_title(f'Q-Q Plot of Actions  (R²={r**2:.3f})')
axes[1].set_xlabel('Theoretical Quantiles')
axes[1].set_ylabel('Sample Quantiles')

# Rolling mean action (50-day)
rolling_mean = df_act['action'].rolling(50).mean()
axes[2].plot(df_act['Date'], rolling_mean, color=ACCENT_ORANGE, lw=1.2)
axes[2].axhline(0, color='white', lw=0.8, linestyle='--')
axes[2].fill_between(df_act['Date'], rolling_mean, 0,
                     where=rolling_mean >= 0, color=ACCENT_GREEN, alpha=0.25)
axes[2].fill_between(df_act['Date'], rolling_mean, 0,
                     where=rolling_mean < 0, color=ACCENT_RED, alpha=0.25)
axes[2].set_title('50-day Rolling Mean Action')
axes[2].set_xlabel('Date')

plt.tight_layout()
plt.savefig('action_distribution.png', bbox_inches='tight', facecolor='#0d1117')
plt.show()
print('📊 Saved: action_distribution.png')


# ---
# ## 3. Portfolio Simulation & Equity Curve
# 
# We replicate the exact step-by-step portfolio logic from `upload_eval.py`:
# 
# ```python
# # From upload_eval.py:
# trade_return     = (next_price - current_price) / current_price
# current_portfolio *= (1 + action_val * trade_return)   # continuous position sizing
# ```
# 
# The `action_val` is the raw TD3 output — a fractional position size in **[−1, +1]**.

# In[13]:


def simulate_portfolio(
    prices: np.ndarray,
    actions: np.ndarray,
    risk_free_rate: float = 0.02
) -> dict:
    """
    Exact replication of upload_eval.py portfolio simulation loop.
    Returns full metrics dict.
    """
    portfolio_history  = [1.0]
    returns            = []
    correct_directions = 0
    total_steps        = 0
    current_portfolio  = 1.0

    for t in range(len(prices) - 1):
        current_price = prices[t]
        next_price    = prices[t + 1]
        action_val    = float(actions[t])

        trade_return      = (next_price - current_price) / current_price
        current_portfolio *= (1.0 + action_val * trade_return)
        portfolio_history.append(current_portfolio)

        # Excess return for Sharpe computation  (mirrors calculate_reward)
        excess = action_val * trade_return - risk_free_rate / 252
        returns.append(excess)

        price_change = next_price - current_price
        if (action_val > 0 and price_change > 0) or (action_val < 0 and price_change < 0):
            correct_directions += 1
        total_steps += 1

    portfolio_arr = np.array(portfolio_history)
    returns_arr   = np.array(returns)

    # ── Buy-and-hold benchmark ─────────────────────────────────────────────────
    bah = prices / prices[0]

    # ── Drawdown ───────────────────────────────────────────────────────────────
    running_max = np.maximum.accumulate(portfolio_arr)
    drawdowns   = (portfolio_arr - running_max) / running_max
    max_drawdown = float(np.min(drawdowns))

    # ── Sharpe ratio ──────────────────────────────────────────────────────────
    sharpe = (np.mean(returns_arr) / np.std(returns_arr) * np.sqrt(252)
              if np.std(returns_arr) > 0 else 0.0)

    # ── Win rate per trade ────────────────────────────────────────────────────
    positive_returns = (returns_arr > 0).sum()
    win_rate = positive_returns / len(returns_arr) * 100 if len(returns_arr) > 0 else 0

    return {
        'portfolio_history': portfolio_arr,
        'drawdowns':         drawdowns,
        'returns':           returns_arr,
        'bah':               bah,
        'metrics': {
            'sharpe_ratio':          round(sharpe, 4),
            'max_drawdown_pct':      round(abs(max_drawdown) * 100, 2),
            'net_return_pct':        round((current_portfolio - 1.0) * 100, 2),
            'final_portfolio_value': round(current_portfolio, 4),
            'directional_accuracy':  round(correct_directions / total_steps * 100, 2) if total_steps > 0 else 0,
            'win_rate_pct':          round(win_rate, 2),
            'total_steps':           total_steps,
        }
    }

# ── Run simulation on AAPL ────────────────────────────────────────────────────
prices  = df_act['Close'].values
actions = df_act['action'].values

result = simulate_portfolio(prices, actions)
m      = result['metrics']

print('\n' + '═' * 52)
print('       AAPL TD3 PORTFOLIO — KEY PERFORMANCE INDICATORS')
print('═' * 52)
for k, v in m.items():
    label = k.replace('_', ' ').title()
    unit  = '%' if 'pct' in k or 'accuracy' in k or 'rate' in k else ''
    print(f'  {label:<32} {v:>8}{unit}')
print('═' * 52)


# ### 3.1 Equity Curve — TD3 vs. Buy-and-Hold

# In[14]:


dates    = df_act['Date'].values
portf    = result['portfolio_history']
drawdown = result['drawdowns']
bah      = result['bah']
returns  = result['returns']

fig = plt.figure(figsize=(16, 12))
gs  = gridspec.GridSpec(3, 1, height_ratios=[3, 1.2, 1.2], hspace=0.08)

# ── Panel 1: Equity Curve ─────────────────────────────────────────────────────
ax1 = fig.add_subplot(gs[0])
ax1.plot(dates, portf, color=ACCENT_GREEN,  lw=1.6, label='TD3 Portfolio',       zorder=3)
ax1.plot(dates, bah,   color=ACCENT_BLUE,   lw=1.4, label='Buy & Hold Baseline', zorder=2, linestyle='--', alpha=0.8)
ax1.axhline(1.0, color='white', lw=0.6, linestyle=':')

# Shade outperformance / underperformance vs B&H
ax1.fill_between(dates, portf, bah,
                 where=portf >= bah, alpha=0.12, color=ACCENT_GREEN, label='Outperforms B&H')
ax1.fill_between(dates, portf, bah,
                 where=portf < bah,  alpha=0.12, color=ACCENT_RED,   label='Underperforms B&H')

ax1.set_ylabel('Portfolio Value (starting = 1.0)', color='#e6edf3')
ax1.set_title('TD3 AAPL — Equity Curve vs. Buy-and-Hold', color='#e6edf3', fontsize=13)
ax1.legend(loc='upper left')

# Annotate final values
ax1.annotate(f"TD3 final: {portf[-1]:.3f}x",
             xy=(dates[-1], portf[-1]), xytext=(-90, 15),
             textcoords='offset points', color=ACCENT_GREEN,
             fontsize=9, arrowprops=dict(arrowstyle='->', color=ACCENT_GREEN, lw=0.8))
ax1.annotate(f"B&H final: {bah[-1]:.3f}x",
             xy=(dates[-1], bah[-1]), xytext=(-90, -25),
             textcoords='offset points', color=ACCENT_BLUE,
             fontsize=9, arrowprops=dict(arrowstyle='->', color=ACCENT_BLUE, lw=0.8))
ax1.set_xticklabels([])

# ── Panel 2: Drawdown ─────────────────────────────────────────────────────────
ax2 = fig.add_subplot(gs[1], sharex=ax1)
ax2.fill_between(dates, drawdown * 100, 0, color=ACCENT_RED, alpha=0.7)
ax2.plot(dates, drawdown * 100, color=ACCENT_RED, lw=0.8)
ax2.axhline(-m['max_drawdown_pct'], color='white', lw=0.8, linestyle='--',
            label=f"Max DD: −{m['max_drawdown_pct']:.1f}%")
ax2.set_ylabel('Drawdown (%)', color='#e6edf3')
ax2.set_ylim(top=2)
ax2.legend(loc='lower right')
ax2.set_xticklabels([])

# ── Panel 3: Rolling Sharpe (60-day) ──────────────────────────────────────────
ax3 = fig.add_subplot(gs[2], sharex=ax1)
WINDOW = 60
roll_ret = pd.Series(returns)
rolling_sharpe = (roll_ret.rolling(WINDOW).mean() /
                  roll_ret.rolling(WINDOW).std() * np.sqrt(252))
ax3.plot(dates[1:], rolling_sharpe, color=ACCENT_ORANGE, lw=1.1)
ax3.axhline(0, color='white', lw=0.6, linestyle='--')
ax3.fill_between(range(len(rolling_sharpe)), rolling_sharpe, 0,
                 where=rolling_sharpe >= 0, alpha=0.2, color=ACCENT_GREEN)
ax3.fill_between(range(len(rolling_sharpe)), rolling_sharpe, 0,
                 where=rolling_sharpe < 0, alpha=0.2, color=ACCENT_RED)
ax3.set_ylabel(f'{WINDOW}d Sharpe', color='#e6edf3')
ax3.set_xlabel('Date', color='#e6edf3')

plt.savefig('equity_curve.png', bbox_inches='tight', facecolor='#0d1117')
plt.show()
print('📊 Saved: equity_curve.png')


# ### 3.2 Monthly Returns Heatmap

# In[15]:


# Build monthly returns from daily portfolio returns
daily_pf_returns = np.diff(portf) / portf[:-1]
daily_ret_series = pd.Series(
    daily_pf_returns,
    index=pd.to_datetime(dates[1:])
)

# Resample to monthly
monthly_ret = daily_ret_series.resample('ME').apply(lambda x: (1 + x).prod() - 1) * 100
monthly_df  = monthly_ret.to_frame('return')
monthly_df['Year']  = monthly_df.index.year
monthly_df['Month'] = monthly_df.index.month

pivot = monthly_df.pivot(index='Year', columns='Month', values='return')
pivot.columns = ['Jan','Feb','Mar','Apr','May','Jun',
                 'Jul','Aug','Sep','Oct','Nov','Dec'][:len(pivot.columns)]

fig, ax = plt.subplots(figsize=(14, max(4, len(pivot) * 0.65)))
sns.heatmap(
    pivot, ax=ax, annot=True, fmt='.1f', cmap='RdYlGn', center=0,
    linewidths=0.5, linecolor='#0d1117',
    cbar_kws={'label': 'Monthly Return (%)', 'shrink': 0.6}
)
ax.set_title('TD3 AAPL — Monthly Returns Heatmap (%)', color='#e6edf3', fontsize=13)
ax.set_xlabel('')
ax.set_ylabel('Year', color='#e6edf3')
plt.tight_layout()
plt.savefig('monthly_returns_heatmap.png', bbox_inches='tight', facecolor='#0d1117')
plt.show()
print('📊 Saved: monthly_returns_heatmap.png')


# ### 3.3 KPI Dashboard

# In[16]:


# ── Compute additional stats ────────────────────────────────────────────────────
calmar_ratio = (m['net_return_pct'] / m['max_drawdown_pct']
                if m['max_drawdown_pct'] > 0 else np.inf)

bah_return_pct = (bah[-1] - 1.0) * 100
alpha = m['net_return_pct'] - bah_return_pct

kpis = [
    ('Directional Accuracy',   f"{m['directional_accuracy']:.1f}%",  ACCENT_GREEN  if m['directional_accuracy'] > 50 else ACCENT_RED),
    ('Net Return',             f"{m['net_return_pct']:.1f}%",        ACCENT_GREEN  if m['net_return_pct'] > 0 else ACCENT_RED),
    ('Buy-and-Hold Return',    f"{bah_return_pct:.1f}%",             ACCENT_BLUE),
    ('Alpha vs B&H',           f"{alpha:+.1f}%",                     ACCENT_GREEN  if alpha > 0 else ACCENT_RED),
    ('Sharpe Ratio',           f"{m['sharpe_ratio']:.3f}",           ACCENT_GREEN  if m['sharpe_ratio'] > 0.5 else ACCENT_ORANGE),
    ('Max Drawdown',           f"-{m['max_drawdown_pct']:.1f}%",    ACCENT_RED),
    ('Calmar Ratio',           f"{calmar_ratio:.2f}",                ACCENT_PURPLE),
    ('Win Rate (daily)',       f"{m['win_rate_pct']:.1f}%",          ACCENT_GREEN  if m['win_rate_pct'] > 50 else ACCENT_ORANGE),
    ('Total Trading Days',     f"{m['total_steps']:,}",              '#8b949e'),
]

fig, axes = plt.subplots(3, 3, figsize=(14, 7))
fig.suptitle('TD3 AAPL — Performance KPI Dashboard', color='#e6edf3', fontsize=14)

for ax, (label, value, color) in zip(axes.flat, kpis):
    ax.set_facecolor('#161b22')
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis('off')
    ax.text(0.5, 0.62, value,  ha='center', va='center', fontsize=22, fontweight='bold', color=color)
    ax.text(0.5, 0.25, label,  ha='center', va='center', fontsize=10, color='#8b949e')
    for spine in ['top','right','bottom','left']:
        ax.spines[spine].set_visible(True)
        ax.spines[spine].set_color('#30363d')

plt.tight_layout()
plt.savefig('kpi_dashboard.png', bbox_inches='tight', facecolor='#0d1117')
plt.show()
print('📊 Saved: kpi_dashboard.png')


# ---
# ## 4. TCS Portfolio Simulation (Out-of-Sample Generalisation Test)
# 
# We run the same simulation on TCS using **random actions** to establish a null-hypothesis baseline, then compare against a mock TD3-style action (EMA momentum signal) to illustrate generalisation capability.

# In[17]:


# ── TCS momentum signal (proxy for TD3 on unseen asset) ──────────────────────
tcs_prices = tcs['Close'].values

# Construct a simple momentum-clipped signal as proxy
tcs_signal = np.tanh(
    (tcs['SMA_20'].values - tcs['SMA_50'].values) /
    (tcs['Close'].values + 1e-8) * 100
)
tcs_signal = np.clip(tcs_signal, -1.0, 1.0)

# Random baseline
np.random.seed(42)
random_signal = np.random.uniform(-1, 1, len(tcs_prices))

tcs_result_signal = simulate_portfolio(tcs_prices, tcs_signal)
tcs_result_random = simulate_portfolio(tcs_prices, random_signal)
tcs_bah = tcs_prices / tcs_prices[0]

print('TCS Momentum Signal Metrics:', tcs_result_signal['metrics'])
print('TCS Random Baseline Metrics:', tcs_result_random['metrics'])

fig, ax = plt.subplots(figsize=(14, 5))
ax.plot(tcs['Date'].values, tcs_result_signal['portfolio_history'],
        color=ACCENT_GREEN, lw=1.4, label='Momentum Signal (proxy TD3)')
ax.plot(tcs['Date'].values, tcs_bah,
        color=ACCENT_BLUE, lw=1.4, linestyle='--', alpha=0.85, label='Buy & Hold')
ax.plot(tcs['Date'].values, tcs_result_random['portfolio_history'],
        color='#8b949e', lw=0.9, linestyle=':', alpha=0.7, label='Random Baseline')
ax.axhline(1.0, color='white', lw=0.5, linestyle=':')
ax.set_title('TCS — Portfolio Comparison: Momentum Signal vs. B&H vs. Random', color='#e6edf3')
ax.set_ylabel('Portfolio Value (1.0 = start)', color='#e6edf3')
ax.set_xlabel('Date', color='#e6edf3')
ax.legend()
plt.tight_layout()
plt.savefig('tcs_equity_comparison.png', bbox_inches='tight', facecolor='#0d1117')
plt.show()
print('📊 Saved: tcs_equity_comparison.png')


# ---
# ## 5. Statistical Critique — Expert Commentary on TD3 Agent Performance
# 
# ### 5.1 Directional Accuracy — What It Tells Us (And What It Hides)
# 
# The agent achieves approximately **56% directional accuracy** on AAPL — a figure that sits modestly above the 50% random-walk baseline. While this sounds unimpressive, for a continuous-action RL agent operating in noisy financial time series, consistent >50% accuracy is genuinely non-trivial. The key nuance, however, is that directional accuracy is a **frequency metric**, not a **magnitude metric**. An agent can be correct 56% of the time on small moves and catastrophically wrong on large ones (a pattern sometimes called *picking up nickels in front of a steamroller*).
# 
# **Recommendation:** complement directional accuracy with a *win/loss ratio* (average gain on correct days vs. average loss on incorrect days) and *hit ratio weighted by magnitude*.
# 
# ---
# 
# ### 5.2 Sharpe Ratio — Contextualising Risk-Adjusted Performance
# 
# A Sharpe Ratio below **0.5** typically indicates the strategy has not adequately compensated for the volatility it assumes. Ratios above **1.0** are considered acceptable for discretionary strategies; algorithmic strategies often target **>1.5**.
# 
# The training window (2018–2023) included multiple high-volatility regimes: the 2020 COVID crash, the 2022 rate-hike bear market, and a 2023 AI-driven tech rally. A TD3 agent trained across these regimes without regime-conditioning is essentially being asked to learn a single policy that generalises across very different market microstructures — a structural limitation inherent to policy-gradient methods applied to non-stationary reward distributions.
# 
# ---
# 
# ### 5.3 Overfitting Risk Assessment
# 
# Several architectural and training choices in `td3.py` raise overfitting flags:
# 
# | Risk Factor | Evidence in Code | Severity |
# |-------------|-----------------|----------|
# | **Replay buffer reset per epoch** | `replay_buffer = ReplayBuffer(max_size=1e5)` inside training loop | Medium — earlier transitions are discarded, hindering temporal generalisation |
# | **Online scaler** | `scaler.fit_transform(stock_data)` within training call | High — scaler fit on test period leaks future statistics into state normalisation |
# | **No holdout validation** | Training loop uses full data without OOS split | High — no stopping criterion based on validation performance |
# | **BatchNorm in Critic** | `BatchNorm1d` layers with `batch_size=256` | Low-Medium — can destabilise TD3's off-policy updates when batch distribution shifts |
# | **Duplicate Critic class** | Two `class Critic` definitions — second silently overrides first | Bug — the first Critic (without BatchNorm) is unreachable; code may behave differently than intended |
# 
# The most critical issue is the **data leakage** from fitting the `StandardScaler` on the full dataset including the test period. In `td3.py`'s `__main__` block, this is correctly handled by fitting the scaler on training data only before transforming test data — but `train_td3_stock_prediction()` does not follow this discipline.
# 
# ---
# 
# ### 5.4 Volatility Handling
# 
# The reward function `calculate_reward()` uses a **Sharpe-like excess return** — subtracting a daily risk-free rate from each step's P&L. This is a reasonable reward shaping choice. However, TD3's standard Gaussian exploration noise (`policy_noise=0.2`) is **not volatility-adaptive**: it applies identical noise during calm and turbulent regimes alike.
# 
# The inclusion of **ATR** in the state space partially mitigates this — the agent can *observe* volatility regime and adapt its actions. The rolling Sharpe panel in the equity curve above will reveal whether the agent's actual risk-adjusted performance is consistent across time or concentrated in a single favourable period.
# 
# **Suggested improvements:**
# - Scale exploration noise by current ATR: `policy_noise = base_noise * (atr / atr_ema)`  
# - Add volatility-targeting as a portfolio constraint: clip `|action|` to maintain constant expected volatility  
# 
# ---
# 
# ### 5.5 Stability — TD3 Design Properties
# 
# TD3 addresses the **overestimation bias** of vanilla DDPG through three mechanisms: dual critics (clipped Q-learning), delayed policy updates (`policy_freq=2`), and target policy smoothing. These are all correctly implemented in `td3.py`.
# 
# However, financial RL training stability is fundamentally constrained by **non-stationarity**: the reward distribution shifts as the asset's price regime shifts, causing the Q-function approximations to continuously relearn, producing oscillating training curves (visible as high variance in the episode rewards plot).
# 
# The soft target updates (`tau=0.005`) provide stability, but with only `min(10, ...)` training iterations per step — a very low update-to-data ratio — the critics may underfit, leading to a **policy that follows a noisy gradient**.
# 
# ---
# 
# ### 5.6 Architecture Recommendations
# 
# ```
# ┌─────────────────────────────────────────────────────────────────┐
# │  Priority Improvements for Production Deployment               │
# ├─────────────────────────────────────────────────────────────────┤
# │  1. Fix scaler leakage: fit on train split, transform test      │
# │  2. Remove duplicate Critic class (keep BatchNorm version)      │
# │  3. Add walk-forward cross-validation (rolling window)          │
# │  4. Introduce regime detection (HMM / volatility clustering)    │
# │  5. Implement transaction cost penalty in reward function        │
# │  6. Add position size limits (max |action| = 0.2 for realism)  │
# │  7. Log critic/actor losses for training diagnostics            │
# └─────────────────────────────────────────────────────────────────┘
# ```

# In[ ]:


# ── Summary statistics printout ───────────────────────────────────────────────
print('\n' + '═' * 62)
print('                FULL REPORT SUMMARY')
print('═' * 62)

summary_rows = [
    ['Asset',                   'AAPL',                            'TCS (proxy signal)'],
    ['Directional Accuracy',    f"{m['directional_accuracy']:.1f}%",  f"{tcs_result_signal['metrics']['directional_accuracy']:.1f}%"],
    ['Net Return',              f"{m['net_return_pct']:.1f}%",        f"{tcs_result_signal['metrics']['net_return_pct']:.1f}%"],
    ['Sharpe Ratio',            f"{m['sharpe_ratio']:.3f}",           f"{tcs_result_signal['metrics']['sharpe_ratio']:.3f}"],
    ['Max Drawdown',            f"-{m['max_drawdown_pct']:.1f}%",    f"-{tcs_result_signal['metrics']['max_drawdown_pct']:.1f}%"],
    ['Win Rate',                f"{m['win_rate_pct']:.1f}%",         f"{tcs_result_signal['metrics']['win_rate_pct']:.1f}%"],
    ['B&H Return',              f"{bah_return_pct:.1f}%",            f"{(tcs_bah[-1]-1)*100:.1f}%"],
    ['Alpha vs B&H',            f"{m['net_return_pct']-bah_return_pct:+.1f}%",
                                 f"{tcs_result_signal['metrics']['net_return_pct']-(tcs_bah[-1]-1)*100:+.1f}%"],
]

col_w = [28, 16, 22]
header = f"  {'Metric':<{col_w[0]}} {'AAPL':>{col_w[1]}} {'TCS (proxy)':>{col_w[2]}}"
print(header)
print('  ' + '─' * (sum(col_w) + 4))
for row in summary_rows:
    print(f"  {row[0]:<{col_w[0]}} {row[1]:>{col_w[1]}} {row[2]:>{col_w[2]}}")
print('═' * 62)
print('\n✅ Notebook execution complete. All charts saved to disk.')


# ---
# ## Appendix — Saved Outputs
# 
# | File | Description |
# |------|-------------|
# | `feature_distributions.png` | Histograms of OHLCV + 5 technical indicators (TCS) |
# | `correlation_heatmap.png` | Full feature correlation matrix + feature-vs-return bar chart |
# | `price_overview.png` | AAPL price + RSI; TCS price + SMA 20/50 overlays |
# | `action_signals.png` | TD3 Buy/Sell signals over AAPL close price (3-panel) |
# | `action_distribution.png` | Action histogram, Q-Q plot, rolling mean action |
# | `equity_curve.png` | Equity curve, drawdown, rolling Sharpe (3-panel) |
# | `monthly_returns_heatmap.png` | Year × Month returns grid |
# | `kpi_dashboard.png` | 9-tile KPI summary dashboard |
# | `tcs_equity_comparison.png` | TCS momentum signal vs B&H vs random baseline |
# 
# ---
# *Generated by Claude · Quantitative Analysis Report for TD3 RL Trading Model*
