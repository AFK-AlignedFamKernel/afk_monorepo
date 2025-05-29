import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
import json
import sys

def process_trends_data(trends_data):
    """
    Process and visualize Google Trends data.
    
    Args:
        trends_data (dict): The data returned from get_google_trends_data
    """
    if trends_data['status'] != 'success':
        print(f"Error: {trends_data.get('error', 'Unknown error')}")
        return
        
    # Convert the data back to a DataFrame
    df = pd.DataFrame(trends_data['processed_data']['data'])
    
    # Convert date strings to datetime objects
    df['date'] = pd.to_datetime(df['date'])
    
    # Set date as index
    df.set_index('date', inplace=True)
    
    # Create a plot
    plt.figure(figsize=(12, 6))
    for column in df.columns:
        if column != 'isPartial':  # Skip the isPartial column
            plt.plot(df.index, df[column], label=column)
    
    plt.title('Google Trends Over Time')
    plt.xlabel('Date')
    plt.ylabel('Interest')
    plt.legend()
    plt.grid(True)
    
    # Save the plot
    plt.savefig('trends_plot.png')
    print("Plot saved as 'trends_plot.png'")
    
    # Print some statistics
    print("\nTrend Statistics:")
    print("-" * 50)
    for column in df.columns:
        if column != 'isPartial':
            print(f"\n{column}:")
            print(f"Average interest: {df[column].mean():.2f}")
            print(f"Maximum interest: {df[column].max():.2f}")
            print(f"Minimum interest: {df[column].min():.2f}")
            print(f"Peak date: {df[column].idxmax().strftime('%Y-%m-%d')}")

if __name__ == "__main__":
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    
    # Process the trends data
    process_trends_data(input_data) 