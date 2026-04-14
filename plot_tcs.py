import matplotlib.pyplot as plt
from backend.upload_eval import eval_csv_file

def main():
    print("Evaluating TCS data...")
    results = eval_csv_file('tcs_stock_data.csv')
    
    dates = [x['date'] for x in results['ohlc']]
    prices = [x['close'] for x in results['ohlc']]
    actions = results['actions'][:-1] # drop padded
    metrics = results['metrics']

    print(f"Directional Accuracy: {metrics['directionAccuracyPct']:.2f}%")
    
    plt.figure(figsize=(14, 7))
    plt.plot(prices, label='TCS Close Price', color='blue', alpha=0.6)
    
    buy_signals = [i for i, a in enumerate(actions) if a > 0.5]
    sell_signals = [i for i, a in enumerate(actions) if a < -0.5]
    
    plt.scatter(buy_signals, [prices[i] for i in buy_signals], marker='^', color='green', label='Buy Signal', alpha=1)
    plt.scatter(sell_signals, [prices[i] for i in sell_signals], marker='v', color='red', label='Sell Signal', alpha=1)
    
    plt.title('TD3 Predicted Actions vs Actual TCS Price', fontsize=16)
    plt.xlabel('Time Step', fontsize=12)
    plt.ylabel('Price', fontsize=12)
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('tcs_complete_data_plot.png', dpi=300)
    print("Plot saved to tcs_complete_data_plot.png")

if __name__ == "__main__":
    main()
