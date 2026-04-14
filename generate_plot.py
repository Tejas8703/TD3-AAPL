import pandas as pd
import matplotlib.pyplot as plt

def generate_graph():
    csv_file = "AAPL_actions_smooth_56_accuracy.csv"
    print(f"Loading {csv_file}...")
    df = pd.read_csv(csv_file)
    df['Date'] = pd.to_datetime(df['Date'])
    
    # Sort just in case
    df = df.sort_values('Date')
    
    fig, ax1 = plt.subplots(figsize=(14, 7))
    
    color1 = 'tab:blue'
    ax1.set_xlabel('Date')
    ax1.set_ylabel('Actual Price ($)', color=color1)
    ax1.plot(df['Date'], df['Close'], color=color1, alpha=0.9, label='Actual Price (Close)')
    ax1.tick_params(axis='y', labelcolor=color1)
    
    ax2 = ax1.twinx()
    color2 = 'tab:red'
    ax2.set_ylabel('Model Action Output (Prediction: -1 to 1)', color=color2)
    # Plot action with lowered opacity to see both
    ax2.plot(df['Date'], df['action'], color=color2, alpha=0.3, label='TD3 Predicted Action')
    ax2.axhline(y=0, color='black', linestyle='--', linewidth=1)
    ax2.tick_params(axis='y', labelcolor=color2)
    
    # Adding titles and saving
    plt.title("TD3 Model Complete Data: Actual Price vs. Predicted Action")
    fig.tight_layout()
    
    output_path = "complete_data_plot.png"
    plt.savefig(output_path, dpi=300)
    print(f"Successfully saved plot to {output_path}")

if __name__ == '__main__':
    generate_graph()
