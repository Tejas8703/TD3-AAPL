import torch
import pandas as pd
import numpy as np
import ta
import json
from td3 import TD3, device, calculate_reward, calculate_sharpe_ratio
from sklearn.preprocessing import StandardScaler

MAX_POSITION_SIZE = 0.35
MAX_DAILY_RETURN_MAGNITUDE = 0.10
DEFAULT_LOOKBACK_ROWS = 756  # ~3 years of trading days


def add_technical_indicators(df):
    df['SMA_20'] = ta.trend.sma_indicator(df['Close'], window=20)
    df['SMA_50'] = ta.trend.sma_indicator(df['Close'], window=50)
    df['RSI'] = ta.momentum.rsi(df['Close'], window=14)
    df['MACD'] = ta.trend.macd_diff(df['Close'])
    df['ATR'] = ta.volatility.average_true_range(df['High'], df['Low'], df['Close'])
    df.dropna(inplace=True)
    return df

def eval_csv_file(filepath, lookback_rows=None):
    df = pd.read_csv(filepath)
    # the user CSV has multi level headers, usually 'Date', 'Close', etc.
    # clean it if it contains yfinance multiline head
    if df.columns[0] == 'Price':
        # drop row 0 and 1, set row 2 as col?
        df = pd.read_csv(filepath, header=[0, 1])
        df = df.droplevel(1, axis=1) # Dropping ticker row
        df = df.rename(columns={'Price': 'Date'})
    elif 'Ticker' in df.iloc[0].values or 'Date' in df.iloc[1].values:
        df = pd.read_csv(filepath, skiprows=2)
        df.columns = ['Date', 'Close', 'High', 'Low', 'Open', 'Volume']
        
    # ensure it has Date, Close, High, Low, Open
    cols_to_check = ['Date', 'Close', 'High', 'Low', 'Open']
    for c in cols_to_check:
        if c not in df.columns:
            # try finding it regardless of case
            for col in df.columns:
                if c.lower() in str(col).lower():
                    df = df.rename(columns={col: c})
                    break

    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df = df.sort_values('Date')
    df = df.dropna(subset=['Close'])

    for c in ['Close', 'High', 'Low', 'Open']:
        df[c] = pd.to_numeric(df[c], errors='coerce')

    for c in ['Dividends', 'Stock Splits']:
        if c not in df.columns:
            df[c] = 0.0

    if lookback_rows is not None and lookback_rows > 0:
        df = df.tail(lookback_rows).copy()

    df = add_technical_indicators(df)
    
    scaler = StandardScaler()
    features = ['Open', 'High', 'Low', 'Close', 'Volume', 'Dividends', 'Stock Splits', 'SMA_20', 'SMA_50', 'RSI', 'MACD', 'ATR']
    scaled_data = scaler.fit_transform(df[features].values)
    state_dim = scaled_data.shape[1]

    # Load TD3
    model = TD3(state_dim, 1, 1)
    model_path = "td3_stock_prediction_model_AAPL_full.pth"
    try:
        checkpoint = torch.load(model_path, map_location=device, weights_only=True)
        if "model_state_dict" in checkpoint:
            model.actor.load_state_dict(checkpoint["model_state_dict"])
        elif "actor" in checkpoint:
            model.actor.load_state_dict(checkpoint["actor"])
        else:
            model.actor.load_state_dict(checkpoint)
    except Exception:
        # Fallback to a fast mini-training if model weights don't exist
        from td3 import ReplayBuffer, calculate_reward
        replay_buffer = ReplayBuffer(max_size=1e5)
        # Very fast train loop so web API doesn't time out
        train_steps = min(500, len(scaled_data))
        state = scaled_data[0]
        for t in range(1, train_steps):
            action = model.select_action(state)
            action_val = float(action[0]) if isinstance(action, (list, np.ndarray)) else float(action)
            next_state = scaled_data[t]
            current_price = df['Close'].iloc[t-1]
            next_price = df['Close'].iloc[t]
            reward = calculate_reward(action_val, next_price, current_price)
            replay_buffer.add(state, action, reward, next_state)
            state = next_state
            if len(replay_buffer.storage) > 256:
                model.train(replay_buffer, 2, 256)


    # run inference
    actions = []
    positions = []
    portfolio_history = []
    current_portfolio = 1.0
    portfolio_history.append(current_portfolio)
    returns = []
    
    correct_directions = 0
    total_steps = 0
    
    df_raw = df.reset_index(drop=True)
    prices = df_raw['Close'].values
    prev_position = 0.0

    for t in range(0, len(scaled_data)-1):
        state = scaled_data[t]
        action = model.select_action(state)
        action_val_raw = float(action[0]) if isinstance(action, (list, np.ndarray)) else float(action)
        action_val = float(np.clip(action_val_raw, -MAX_POSITION_SIZE, MAX_POSITION_SIZE))
        # Smooth position changes to reduce unstable oscillation.
        position_val = float(0.8 * prev_position + 0.2 * action_val)
        prev_position = position_val
        
        actions.append(action_val)
        
        positions.append(position_val)
        
        current_price = prices[t]
        next_price = prices[t+1]
        trade_return = (next_price - current_price) / current_price
        trade_return = float(np.clip(trade_return, -MAX_DAILY_RETURN_MAGNITUDE, MAX_DAILY_RETURN_MAGNITUDE))
        
        reward = calculate_reward(position_val, next_price, current_price)
        returns.append(reward)
        
        # basic portfolio sim
        current_portfolio *= (1 + position_val * trade_return)
        current_portfolio = max(current_portfolio, 1e-6)
        portfolio_history.append(float(current_portfolio))
        
        price_change = next_price - current_price
        if (position_val > 0 and price_change > 0) or (position_val < 0 and price_change < 0):
            correct_directions += 1
        total_steps += 1

    actions.append(0.0) # pad last state
    positions.append(0.0)
    # portfolio_history already padded (len + 1)
    
    accuracy = correct_directions / total_steps * 100 if total_steps > 0 else 0

    return_pct = (current_portfolio - 1.0) * 100
    max_portfolio = np.maximum.accumulate(portfolio_history)
    drawdowns = (portfolio_history - max_portfolio) / max_portfolio
    max_drawdown = abs(np.min(drawdowns)) * 100
    
    sharpe = calculate_sharpe_ratio(np.array(returns))

    ohlc = []
    for i, row in df_raw.iterrows():
        ohlc.append({
            "date": row["Date"].strftime("%Y-%m-%d"),
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
        })

    return {
        "metrics": {
            "sharpeRatio": float(sharpe),
            "returnPct": float(return_pct),
            "maxDrawdownPct": float(max_drawdown),
            "finalPortfolioValue": float(current_portfolio),
            "directionAccuracyPct": float(accuracy)
        },
        "ohlc": ohlc,
        "portfolioHistory": portfolio_history,
        "actions": actions,
        "positions": positions
    }
