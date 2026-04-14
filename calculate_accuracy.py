import pandas as pd
import numpy as np

def calculate_accuracy():
    df = pd.read_csv('AAPL_actions_smooth_56_accuracy.csv')
    df['next_close'] = df['Close'].shift(-1)
    df = df.dropna()
    
    # price change tomorrow vs today
    price_change = df['next_close'] - df['Close']
    
    # correct if action is positive and price goes up
    # or action is negative and price goes down
    correct = ((df['action'] > 0) & (price_change > 0)) | \
              ((df['action'] < 0) & (price_change < 0))
              
    accuracy = correct.sum() / len(df) * 100
    
    # Let's also calculate Sharpe ratio-like metric
    returns = (df['next_close'] - df['Close']) / df['Close']
    strategy_returns = df['action'] * returns
    
    # Approximate Sharpe
    excess_returns = strategy_returns - (0.02 / 252)
    sharpe_ratio = np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)
    
    print(f"Total Rows: {len(df)}")
    print(f"Correct Directions: {correct.sum()}")
    print(f"Directional Accuracy: {accuracy:.2f}%")
    print(f"Estimated Model Sharpe Ratio: {sharpe_ratio:.4f}")

if __name__ == '__main__':
    calculate_accuracy()
