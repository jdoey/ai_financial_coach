import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

def detect_anomalies_hybrid(category_df):
    """
    Uses a hybrid approach: Isolation Forest for pattern detection,
    plus Z-score specifically to catch massive outliers in high-variance 
    categories (like Shopping) that IF sometimes misses.
    """
    df = category_df.copy()
    
    # Ensure we have enough data for meaningful stats
    if len(df) < 5:
        return []

    # --- 1. Statistical Setup (Z-Score) ---
    # We use median/MAD (Median Absolute Deviation) instead of mean/std 
    # because they are more robust to pre-existing huge outliers.
    median = df['amount'].median()
    mad = np.median(np.abs(df['amount'] - median))
    
    # Avoid division by zero if all transaction amounts are identical
    if mad == 0:
        # Fallback to standard deviation if MAD is 0, or just slightly above 0
        mad = df['amount'].std() or 1e-9 

    # Calculate modified Z-score (standardized distance from median)
    # 0.6745 is the consistency constant for normal distributions
    df['z_score'] = 0.6745 * (df['amount'] - median) / mad

    # --- 2. Isolation Forest Setup ---
    # Only use IF if we have enough data for it to learn a pattern (>15 transactions)
    use_if = len(df) >= 15
    if use_if:
        # Contamination 'auto' usually works, but we can slightly tune it if needed.
        model = IsolationForest(contamination='auto', random_state=42)
        # We reshape because sklearn expects 2D array
        df['if_score'] = model.fit_predict(df[['amount']])
    else:
        df['if_score'] = 1 # Default to 'normal' if we don't run IF

    # --- 3. Hybrid Flagging Logic ---
    anomalies = []
    for _, row in df.iterrows():
        is_anomaly = False
        reasons = []

        # Rule A: Massive Outliers (Z-Score > 8)
        # Catches things like $3500 in a $50 avg category. 
        # IF sometimes misses these if the whole category is noisy.
        if abs(row['z_score']) > 8:
            is_anomaly = True
            reasons.append("Extreme Value")

        # Rule B: Standard Anomalies (Isolation Forest says -1 AND Z-score is elevated)
        # We require a moderate Z-score (> 2.5) to avoid flagging normal "odd" transactions
        # just because Isolation Forest got a bit aggressive.
        if use_if and row['if_score'] == -1 and abs(row['z_score']) > 2.5:
            is_anomaly = True
            reasons.append("Unusual Pattern")

        if is_anomaly:
            anomalies.append({
                **row.to_dict(),
                # Convert timestamps to strings for JSON serialization
                'date': row['date'].strftime('%Y-%m-%d'),
                'flag_reasons': reasons,
                'severity': 'high' if abs(row['z_score']) > 10 else 'medium'
            })

    return anomalies

def generate_insights(df):
    """Generates basic spending insights to accompany anomalies."""
    insights = []
    # Example: Biggest spending category this month
    current_month = df['date'].max().to_period('M')
    monthly_data = df[df['date'].dt.to_period('M') == current_month]
    
    if not monthly_data.empty:
        top_cat = monthly_data[monthly_data['type']=='withdrawal'].groupby('category')['amount'].sum().idxmax()
        top_amount = monthly_data[monthly_data['type']=='withdrawal'].groupby('category')['amount'].sum().max()
        insights.append(f"Spending is highest in **{top_cat}** this month (${top_amount:,.0f}).")
        
    return insights

def analyze_transactions(df):
    """
    Main entry point called by app.py.
    Orchestrates the analysis by category.
    """
    # Ensure data types
    df['date'] = pd.to_datetime(df['date'])
    df['amount'] = pd.to_numeric(df['amount'])
    
    # Filter for only withdrawals for anomaly detection usually
    withdrawal_df = df[df['type'] == 'withdrawal'].copy()

    all_anomalies = []

    # Analyze by category
    for category in withdrawal_df['category'].unique():
        category_df = withdrawal_df[withdrawal_df['category'] == category]
        # Run hybrid detection
        cat_anomalies = detect_anomalies_hybrid(category_df)
        all_anomalies.extend(cat_anomalies)

    # Sort anomalies by date (newest first)
    all_anomalies.sort(key=lambda x: x['date'], reverse=True)

    return {
        "anomalies": all_anomalies,
        "insights": generate_insights(df)
    }