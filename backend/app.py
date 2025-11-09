import os
import json
import google.generativeai as genai
import csv
from datetime import datetime
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
import pandas as pd
from ai_engine import analyze_transactions
import re
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import dateparser

# --- Configuration ---

load_dotenv() # Load API key from .env file
app = Flask(__name__)
CORS(app) # Add CORS support

# --- Path Setup ---
# Get the absolute path to the directory where this app.py file is located.
# This ensures we can always find our data files, no matter where we run the command from.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# --- Load Data From CSV (On Startup) ---
# We load the data into memory when the app starts.
# This is much faster for a hackathon than reading from the file on every API request.

def load_transactions_from_csv(filename="transactions.csv"):
    """Reads transactions from CSV, converting types."""
    transactions = []
    filepath = os.path.join(DATA_DIR, filename) # <-- Use robust path
    try:
        with open(filepath, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                row['id'] = int(row['id'])
                row['amount'] = float(row['amount'])
                transactions.append(row)

        transactions.sort(key=lambda x: x['date'], reverse=True)

        print(f"Loaded {len(transactions)} transactions from {filepath}")
    except Exception as e:
        print(f"Error loading {filepath}: {e}. Using empty list.")
    return transactions

TRANSACTIONS_DB = load_transactions_from_csv()


def detect_income_type(df: pd.DataFrame):
    """
    Detects income type and accurately estimates monthly income by adjusting
    for pay frequency (weekly, biweekly, etc.) instead of just averaging deposits.
    """
    # --- 1. Identify income-related transactions ---
    # Filter for deposits and ensure we have valid dates
    income_df = df[df["type"].str.lower().str.contains("deposit|income|payment|payout", na=False)].copy()
    income_df["date"] = pd.to_datetime(income_df["date"], errors="coerce")
    income_df = income_df.dropna(subset=["date"]).sort_values("date")

    if income_df.empty:
        return {
            "income_type": "unknown",
            "estimated_monthly_income": 0.0,
            "income_frequency": "unknown",
            "last_income_date": None
        }

    # --- 2. Compute time gaps and basic stats ---
    income_df["gap_days"] = income_df["date"].diff().dt.days
    
    median_gap = income_df["gap_days"].median() if len(income_df) > 1 else np.nan
    avg_deposit = income_df["amount"].mean()
    income_std = income_df["amount"].std(ddof=0) or 0
    
    # --- 3. Determine frequency ---
    frequency = "unknown"
    if pd.notna(median_gap):
        if median_gap <= 10:    frequency = "weekly"
        elif median_gap <= 24:  frequency = "biweekly" # widened slightly to catch early/late paydays
        elif median_gap <= 45:  frequency = "monthly"
        else:                   frequency = "irregular"

    # --- 4. Determine income type ---
    gap_variability = income_df["gap_days"].std(ddof=0) or 0
    amount_variability_ratio = income_std / avg_deposit if avg_deposit > 0 else 0

    # Strict rules for "recurring": consistent days AND consistent amounts
    if (gap_variability < 5 and amount_variability_ratio < 0.25 and frequency in ["weekly", "biweekly", "monthly"]):
        income_type = "recurring"
    elif (gap_variability > 10 or amount_variability_ratio > 0.4):
        income_type = "gig"
    else:
        # Fallback for edge cases (e.g. only 2 deposits ever)
        income_type = "gig" if frequency == "irregular" else "recurring"

    # --- 5. Estimate Monthly Income (FIXED) ---
    DAYS_IN_MONTH = 30.4375 # Standardized (365.25 / 12)

    if income_type == "recurring":
        # Apply multiplier based on frequency
        if frequency == "weekly":
            multiplier = DAYS_IN_MONTH / 7  # approx 4.35
        elif frequency == "biweekly":
            multiplier = DAYS_IN_MONTH / 14 # approx 2.17
        else:
            multiplier = 1.0 # monthly
            
        estimated_monthly_income = avg_deposit * multiplier

    else:
        # GIG/IRREGULAR: Calculate realized daily average over the total period
        first_day = income_df["date"].min()
        last_day = income_df["date"].max()
        total_days_active = max(30, (last_day - first_day).days) # Minimum 30 days to prevent inflation from brand new accounts
        
        total_income_received = income_df["amount"].sum()
        daily_avg_income = total_income_received / total_days_active
        estimated_monthly_income = daily_avg_income * DAYS_IN_MONTH

    last_income_date = income_df["date"].max().strftime("%Y-%m-%d")

    return {
        "income_type": income_type,
        "estimated_monthly_income": round(float(estimated_monthly_income), 2),
        "income_frequency": frequency,
        "last_income_date": last_income_date
    }

INCOME_PROFILE = detect_income_type(pd.read_csv(os.path.join(DATA_DIR, "transactions.csv"), parse_dates=['date']))
print(INCOME_PROFILE)

def calculate_financial_stats():
    df = pd.DataFrame(TRANSACTIONS_DB)
    df['date'] = pd.to_datetime(df['date'])
    df['amount'] = pd.to_numeric(df['amount'])

    # 1. Basic Totals
    total_deposited = df[df['type'] == 'deposit']['amount'].sum()
    total_spent = df[df['type'] == 'withdrawal']['amount'].sum()
    net_saved = total_deposited - total_spent

    # 2. Averages
    if not df.empty:
        days_diff = max(1, (df['date'].max() - df['date'].min()).days)
        # Approximate months based on date range
        months_diff = max(1, (df['date'].max().year - df['date'].min().year) * 12 + df['date'].max().month - df['date'].min().month + 1)
        avg_monthly = total_spent / months_diff
        avg_daily = total_spent / days_diff
    else:
        avg_monthly, avg_daily = 0, 0

    # 3. Savings Rate
    savings_rate = (net_saved / total_deposited * 100) if total_deposited > 0 else 0

    # 4. MoM Change
    now = datetime.now()
    current_month, current_year = now.month, now.year
    
    def get_month_spend(month, year):
        mask = (df['date'].dt.month == month) & (df['date'].dt.year == year) & (df['type'] == 'withdrawal')
        return df[mask]['amount'].sum()

    last_month_date = now.replace(day=1) - timedelta(days=1)
    last_month_spend = get_month_spend(last_month_date.month, last_month_date.year)
    
    two_months_ago_date = last_month_date.replace(day=1) - timedelta(days=1)
    two_months_ago_spend = get_month_spend(two_months_ago_date.month, two_months_ago_date.year)

    mom_change = ((last_month_spend - two_months_ago_spend) / two_months_ago_spend * 100) if two_months_ago_spend > 0 else 0

    # 5. Burn Rate (Current Month Velocity)
    current_month_spend = get_month_spend(current_month, current_year)
    days_in_month = (now.replace(month=current_month % 12 + 1, day=1) - timedelta(days=1)).day
    days_passed = max(1, now.day)
    expected_spend_so_far = (avg_monthly / days_in_month) * days_passed
    burn_rate = (current_month_spend / expected_spend_so_far * 100) if expected_spend_so_far > 0 else 0
    return {
        "saved": round(net_saved, 2),
        "total_spent": round(total_spent, 2),
        "avg_monthly": round(avg_monthly, 2),
        "avg_daily": round(avg_daily, 2),
        "savings_rate": round(savings_rate, 1),
        "mom_change": round(mom_change, 1),
        "burn_rate": round(burn_rate, 0)
    }

# --- System Prompt: The "Brain" of the AI Coach ---

SYSTEM_PROMPT = """
You are a friendly, encouraging, and non-judgmental financial coach.
Your goal is to help young adults build better financial habits without making them feel guilty.
Your responses should be concise, conversational, and motivating with a maximum of 2 sentences.
"""

VISUALIZATION_SYSTEM_PROMPT = """
You are a data visualization expert. Your goal is to interpret a user's natural language request about their transaction data and return a JSON configuration that can be directly used by a charting library (Recharts).

Supported chart types: 'pie', 'bar', 'line'.

Input:
- User Prompt: What the user wants to see.
- Transactions: The raw data.

Output MUST be a raw JSON object with no markdown formatting.
Structure:
{
  "chartType": "pie" | "bar" | "line",
  "title": "A descriptive title based on the request",
  "data": [ {"name": "Category or Date", "value": NumericalAmount} ],
  "dataKey": "value" (key for numerical data),
  "xAxisKey": "name" (key for categorical/date data),
  "summary": "A very brief, one-sentence insight about this chart."
}

Rules:
1. Aggregate data strictly based on the prompt (e.g., by category, by date).
2. Filter data if requested (e.g., "only coffee", "in November").
3. If the request is impossible, return {"error": "Cannot visualize this request."}
"""

# --- Configure Gemini Model ---
# Configure the API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize the model with the system prompt and use the 'gemini-flash-latest'
model = genai.GenerativeModel(
    'gemini-2.5-flash-lite',
    system_instruction=SYSTEM_PROMPT
)
viz_model = genai.GenerativeModel(
    'gemini-flash-latest', 
    system_instruction=VISUALIZATION_SYSTEM_PROMPT)


# --- Gemini API Logic ---

def call_gemini_forecast(goal_data):
    """Calls Gemini to generate a human-friendly forecast message based on pre-calculated data."""
    if not os.getenv("GEMINI_API_KEY"):
         return {"error": "API_KEY is not set."}

    # --- Financial Stats ---
    stats = calculate_financial_stats()
    if not stats:
        return {"error": "Could not calculate financial metrics."}
    
    # --- 1. Deterministic Math (The Heavy Lifting) ---
    try:
        today = datetime.now()
        target_dt = datetime.strptime(goal_data['target_date'], "%Y-%m-%d")
        days_remaining = max(1, (target_dt - today).days)
        
        # Use the global INCOME_PROFILE we calculated earlier
        monthly_income = INCOME_PROFILE.get('estimated_monthly_income', 0)
        daily_income = monthly_income / 30
        daily_spend = stats.get('avg_daily', 0)
        
        # Calculate real daily surplus (savings pace)
        daily_surplus = daily_income - daily_spend
        projected_savings = daily_surplus * days_remaining
        
        target_amount = float(goal_data['target_amount'])
        on_track = projected_savings >= target_amount
        shortfall = target_amount - projected_savings
        
    except Exception as e:
        print(f"Forecast math error: {e}")
        return {"error": "Invalid goal dates or amounts."}

    # --- 2. Context-Aware Prompt ---
    user_prompt = f"""
    You are a financial coach AI. Generate a forecast message for a user's savings goal based on their ACTUAL current spending habits.
    
    GOAL DETAILS:
    - Goal: "{goal_data.get('name')}"
    - Target: ${target_amount:,.2f} by {goal_data.get('target_date')} ({days_remaining} days left)
    
    USER FINANCIAL REALITY:
    - Daily Income (est): ${daily_income:.2f}/day
    - Daily Spending (avg): ${daily_spend:.2f}/day
    - Actual Daily Savings Pace: ${daily_surplus:.2f}/day
    
    PROJECTION:
    - Projected total by target date: ${projected_savings:,.2f}
    - Status: {"✅ ON TRACK" if on_track else "⚠️ AT RISK"}
    - Shortfall: ${max(0, shortfall):,.2f}

    INSTRUCTIONS:
    - IF FORECAST DATA EXISTS: You MUST use its 'status' and 'forecast_message'. DO NOT re-calculate or contradict it. If it says "AT RISK", you must say so.
    - If no forecast, reply conversationally based on transaction history.
    - If ON TRACK: Congratulate them on their pace of saving ${daily_surplus:.2f}/day.
    - If AT RISK: Be direct. State exactly how much they need to cut their DAILY spending by to hit the goal.
      (Math: They need to save an extra ${0 if on_track else (shortfall/days_remaining):.2f}/day).
    - Tone: Supportive, concise, 2 sentences max.

    OUTPUT JSON ONLY:
    {{
        "status": "on_track" or "at_risk",
        "forecast_message": "Your message here."
    }}
    """

    try:
        response = model.generate_content(user_prompt)
        # Clean up potential markdown from response if Gemini adds it
        clean_json = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_json)
    except Exception as e:
        return {"error": f"AI forecast failed: {str(e)}"}
    
    
def call_gemini_subscription_check(transactions):
    """Calls Gemini to find subscriptions in transaction history."""
    if not os.getenv("GEMINI_API_KEY"):
         return {"error": "GEMINI_API_KEY is not set."}

    user_prompt = f"""
    You are a specialized Transaction Intelligence AI. Your sole purpose is to detect discretionary subscription services and recurring "gray charges" with high precision.

    Analyze the provided transaction history and extract a unique list of active subscriptions.

    ### DEFINITION OF A SUBSCRIPTION:
    A discretionary, recurring financial commitment for a service or product. This includes streaming, software (SaaS), monthly boxes, gym memberships, and app-based services.
    It explicitly EXCLUDES mandatory cost-of-living expenses like rent, mortgage, utilities, standard groceries, insurance, and medical bills.

    ### DETECTION RULES:
    1.  **Vendor Knowledge Base:** aggressively flag known subscription vendors (e.g., Netflix, Spotify, Apple Services, Amazon Prime, Hulu, Disney+, Adobe, HelloFresh, Planet Fitness, Patreon, OnlyFans, standard news outlets).
    2.  **Pattern Recognition:** Identify recurring charges of the SAME (or very similar) amount from the SAME vendor.
        * *Frequency:* Can be weekly, monthly, quarterly, or annually.
        * *Date Drift:* Allow for a ±5 day variance in billing dates to account for weekends and bank holidays.
    3.  **Gray Charge/Free Trial Detection:** Flag small, odd-amount transactions ($0.99, $4.99) that recur, even if the vendor is obscure. These are often forgotten free trials that converted to paid.
    4.  **Nuanced Exclusions (Crucial):**
        * Exclude: Standard "Health" (doctors, pharmacy). DO NOT exclude "Digital Health" (Fitbit, Calm app, MyFitnessPal).
        * Exclude: Standard "Food" (restaurants, supermarkets). DO NOT exclude "Meal Kits" (Blue Apron, Factor75).
        * Exclude: Standard "Transport" (Uber rides, gas). DO NOT exclude "Transport Subs" (Uber One pass, Lyft Pink).

    ### OUTPUT INSTRUCTIONS:
    * Return ONLY raw JSON array. No Markdown, no introductory text.
    * **DEDUPLICATE:** If multiple transactions belong to the same subscription (e.g., 12 charges for Netflix), return ONLY ONE entry representing the active subscription, ideally the most recent one.
    * If a vendor has MULTIPLE distinct subscriptions (e.g., standard Google Storage charge AND a separate YouTube Premium charge at different price points), keep both.

    Transactions to analyze: {json.dumps(transactions)}

    ### REQUIRED JSON FORMAT PER ITEM:
    {{
    "name": "Service Name (Cleaned up, e.g. 'Netflix' instead of 'TST* NETFLIX.COM')",
    "amount": 0.00, (The recurring recurring amount),
    "frequency": "Monthly" | "Weekly" | "Annual" | "Unknown",
    "confidence": "High" (known vendor or clear pattern) | "Medium" (likely gray charge),
    "type": "Subscription" | "Potential Gray Charge",
    "ai_note": "Short rationale (5-10 words)"
    }}
    """
    
    try:
        response = model.generate_content(user_prompt)
        text = response.text.strip()

        # --- ROBUST FIX: Regex Extraction ---
        # This finds the first '[' and the last ']', ignoring everything else outside them.
        match = re.search(r'\[.*\]', text, re.DOTALL)
        
        if match:
            json_string = match.group(0)
            return {"subscriptions": json.loads(json_string)}
        else:
            # No JSON array found in the response
            print("Warning: No JSON array found in Gemini response for subscriptions.")
            return {"subscriptions": []}
            
    except Exception as e:
        print(f"Subscription check failed: {e}")
        return {"subscriptions": []}

def call_gemini_visualization(user_prompt, transactions):
    """Calls Gemini to generate visualization configuration."""
    if not os.getenv("GEMINI_API_KEY"):
        return {"error": "GEMINI_API_KEY is not set."}

    full_prompt = f"""
    User Request: '{user_prompt}'
    Transaction Data: {json.dumps(transactions)}
    """

    try:
        response = viz_model.generate_content(full_prompt)
        if not response.parts: return {"error": "AI response blocked."}

        # Clean up response
        text = response.text.strip()
        if text.startswith("```json"):
             text = text[7:]
        elif text.startswith("```"):
             text = text[3:]
             
        if text.endswith("```"):
             text = text[:-3]

        return {"visualization": json.loads(text.strip())}
    except Exception as e:
        return {"error": f"Visualization generation failed: {str(e)}"}

# --- API Endpoint ---

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    return jsonify(TRANSACTIONS_DB)


@app.route('/api/forecast', methods=['POST'])
def forecast_goal():
    data = request.get_json()
    goal_amount = data.get('amount')
    goal_date = data.get('date')
    goal_name = data.get('name')

    if not all([goal_amount, goal_date, goal_name]):
        return jsonify({"error": "Missing goal data"}), 400

    goal_data = {"name": goal_name, "target_amount": goal_amount, "target_date": goal_date}

    return jsonify(call_gemini_forecast(goal_data))


@app.route('/api/subscriptions', methods=['POST'])
def check_subscriptions():
    """API endpoint to trigger the subscription check."""
    return jsonify(call_gemini_subscription_check(TRANSACTIONS_DB))

# --- Global memory (temporary; use a database like Redis for production) ---
@app.route('/api/visualize', methods=['POST'])
def visualize():
    d = request.get_json()
    return jsonify(call_gemini_visualization(d.get('prompt'), TRANSACTIONS_DB))


def extract_goal_from_message(message: str):
    """
    Extracts a goal (amount + target date) from a user's natural language message.
    Handles phrases like:
      - "save $500 by March"
      - "reach 2k next month"
      - "hit my $1500 goal before July 2025"
      - "save up 3 grand in 3 months"
    Returns a dict with name, target_amount, and target_date if found.
    """
    message = message.lower().strip()

    # --- Find the amount ---
    amount_match = re.search(r"(\$?\s?\d{1,3}(?:[,\d]{3})*(?:\.\d{1,2})?)|(\d+(?:\s?grand|k|bucks))", message)
    target_amount = None
    if amount_match:
        amt_str = amount_match.group(0)
        amt_str = amt_str.replace("$", "").replace(",", "").strip()

        if "grand" in amt_str:
            target_amount = float(re.findall(r"\d+", amt_str)[0]) * 1000
        elif "k" in amt_str:
            target_amount = float(re.findall(r"\d+", amt_str)[0]) * 1000
        else:
            target_amount = float(re.findall(r"\d+(?:\.\d+)?", amt_str)[0])

    # --- Find the date / timeframe ---
    date_phrases = [
        r"(by|before|until)\s+([A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2}|next\s+month|next\s+year|this\s+month|in\s+\d+\s+(?:months|weeks))",
        r"(in\s+\d+\s+(?:months|weeks))",
        r"(next\s+(?:month|year))",
        r"(by\s+[A-Za-z]+)"
    ]

    target_date = None
    for pattern in date_phrases:
        match = re.search(pattern, message)
        if match:
            time_str = match.group(0)
            parsed_date = dateparser.parse(time_str)
            if parsed_date:
                target_date = parsed_date
                break

    # Default to 3 months ahead if no date
    if not target_date:
        target_date = datetime.now() + relativedelta(months=3)

    if target_amount:
        return {
            "name": "User-specified savings goal",
            "target_amount": target_amount,
            "target_date": target_date.strftime("%Y-%m-%d")
        }

    return None

CHAT_HISTORY = {} # key: session_id, value: list of {"role": "user"/"assistant", "content": str}

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    AI-powered chatbot endpoint.
    Accepts a user message and returns:
    - A conversational response
    - ML insights / anomalies
    - Optional chart data if requested
    """
    data = request.get_json()
    user_message = data.get("message", "").strip()
    session_id = data.get("session_id", "default_user")  # Unique ID for each chat user/session

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    # --- Initialize chat history if not present ---
    if session_id not in CHAT_HISTORY:
        CHAT_HISTORY[session_id] = []

    # --- 1. Load transactions and analyze anomalies ---
    df = pd.read_csv(os.path.join(DATA_DIR, "transactions.csv"), parse_dates=['date'])
    ml_results = analyze_transactions(df)
    anomalies = ml_results.get("anomalies", [])
    raw_insights = ml_results.get("insights", [])

     # --- Detect savings goal ---
    goal_data = extract_goal_from_message(user_message)
    forecast_result = None
    if goal_data:
        forecast_result = call_gemini_forecast(goal_data)

    # --- 2. Build a context-aware prompt ---
    # Limit to last 5 messages to control token size
    history_context = CHAT_HISTORY[session_id][-5:]
    formatted_history = "\n".join(
        [f"{msg['role'].capitalize()}: {msg['content']}" for msg in history_context]
    )

    # --- 2. Generate AI Coach response ---
    llm_prompt = f"""
    You are a friendly, data-driven AI financial coach.
    You are chatting with a user about their money goals and habits.

    === FINANCIAL DATA (THE SOURCE OF TRUTH) ===
    Income Profile: {INCOME_PROFILE}
    Recent Spending Insights: {json.dumps(raw_insights[:3])}
    Detected Anomalies: {json.dumps(anomalies[:3], default=str)}
    Recent anomalies (high spending events): {json.dumps(anomalies[:5], default=str)}
    Current Goal Status: {forecast_result if forecast_result else "None set"}

    Conversation so far: {formatted_history}
    
    The user said: "{user_message}"
    
    

    Instructions:
    1. Reply conversationally, referencing previous context where appropriate.
    2. ALWAYS reference the "Financial Data" above to personalize your response. Do not give generic advice.
    3. FORECAST RULE: ALWAYS assume target dates are in the FUTURE. If a user says a date that has already passed this year (like "March 9th"), assume they mean NEXT YEAR.
    4. If the user asks for financial advice, provide 1 short actionable tip with a numeric or measurable focus and potential savings.
    5. If the user asks for anomalies, provide 1-2 instances of anomalous transactions.
    6. Stay under 3 sentences.
    """
    llm_response = model.generate_content(llm_prompt)

    # --- Generate LLM response ---
    try:
        llm_response = model.generate_content(llm_prompt)
        bot_reply = llm_response.text.strip()
    except Exception as e:
        print(f"Gemini API error: {e}")
        bot_reply = "Sorry, I ran into an issue processing that request."

    # --- Save to chat memory ---
    CHAT_HISTORY[session_id].append({"role": "user", "content": user_message})
    CHAT_HISTORY[session_id].append({"role": "assistant", "content": bot_reply})

    # --- 3. Optional: Generate visualization if message mentions chart/graph ---
    visualization = {}
    if any(keyword in user_message.lower() for keyword in ["chart", "graph", "plot", "visualize", "visual"]):
        visualization = call_gemini_visualization(user_message, TRANSACTIONS_DB)
    
    return jsonify({
    "reply": bot_reply,
    "ml_insights": json.loads(json.dumps(raw_insights, default=str)),
    "anomalies": json.loads(json.dumps(anomalies, default=str)),
    "visualization": visualization.get("visualization", {}),
    "session_id": session_id,
    "history_length": len(CHAT_HISTORY[session_id])
})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Returns pre-calculated dashboard statistics."""
    # 1. Calculate base stats
    stats = calculate_financial_stats()
    
    # 2. Get subscriptions for the "Monthly Fixed" calculation
    subs_data = call_gemini_subscription_check(TRANSACTIONS_DB)
    total_subs = sum(item['amount'] for item in subs_data.get('subscriptions', []))

    # 3. Calculate Housing/Utilities average
    df = pd.DataFrame(TRANSACTIONS_DB)
    df['date'] = pd.to_datetime(df['date'])
    months_diff = max(1, (df['date'].max().year - df['date'].min().year) * 12 + df['date'].max().month - df['date'].min().month + 1)
    
    fixed_cats = ['Housing', 'Utilities']
    fixed_spend = df[(df['type'] == 'withdrawal') & (df['category'].isin(fixed_cats))]['amount'].sum()
    avg_fixed_spend = fixed_spend / months_diff

    # 4. Finalize Monthly Fixed
    stats['totalMonthlyFixed'] = round(total_subs + avg_fixed_spend, 2)

    return jsonify(stats)

# --- Run the App ---

if __name__ == '__main__':
    # Debug=True is fine for a hackathon, but not for production
    app.run(debug=True, port=5001)