import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Coffee,
  Target,
  ShoppingBag,
  Car,
  Home,
  Calendar,
  Search,
  AlertCircle,
  AlertOctagon,
  CheckCircle2,
  Receipt,
  Shirt,
  Ham,
  Zap,
  Bot,
  HeartPulse,
  TrendingUp,
  Drama,
  Send,
  PieChart as PieChartIcon,
  Wallet,
  PiggyBank,
  CalendarClock,
  TrendingDown,
  Percent,
  RefreshCcw,
  Activity,
  Scale,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// --- HELPER COMPONENTS ---

const CategoryIcon = ({ category }) => {
  switch (category) {
    case "Coffee":
      return <Coffee className="w-5 h-5 text-amber-700" />;
    case "Subscription":
      return <Calendar className="w-5 h-5 text-purple-500" />;
    case "Groceries":
      return <ShoppingBag className="w-5 h-5 text-green-600" />;
    case "Transport":
      return <Car className="w-5 h-5 text-blue-500" />;
    case "Housing":
      return <Home className="w-5 h-5 text-indigo-600" />;
    case "Utilities":
      return <Zap className="w-5 h-5 text-indigo-600" />;
    case "Shopping":
      return <Shirt className="w-5 h-5 text-indigo-600" />;
    case "Food":
      return <Ham className="w-5 h-5 text-indigo-600" />;
    case "Health":
      return <HeartPulse className="w-5 h-5 text-indigo-600" />;
    case "Entertainment":
      return <Drama className="w-5 h-5 text-indigo-600" />;
    default:
      return <div className="w-5 h-5 bg-gray-200 rounded-full" />;
  }
};

// --- NEW: "DUMB" STATS COMPONENT (Receives data, doesn't calculate it) ---
const FinancialStats = ({ stats, isLoading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Loading Skeleton
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-900/50 h-24 rounded-2xl border border-gray-800/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8 animate-in fade-in duration-500">
      {/* ROW 1: General Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-emerald-900/30 rounded-xl border border-emerald-500/20">
            <PiggyBank className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Net Saved</p>
            <h3
              className={`text-2xl font-bold ${
                stats.saved >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {stats.saved >= 0 ? "+" : ""}
              {formatCurrency(stats.saved)}
            </h3>
          </div>
        </div>
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-blue-900/30 rounded-xl border border-blue-500/20">
            <Wallet className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Spent</p>
            <h3 className="text-2xl font-bold text-gray-100">
              {formatCurrency(stats.total_spent)}
            </h3>
          </div>
        </div>
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-purple-900/30 rounded-xl border border-purple-500/20">
            <CalendarClock className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">
              Avg. Monthly Expenses
            </p>
            <h3 className="text-2xl font-bold text-gray-100">
              {formatCurrency(stats.avg_monthly)}
            </h3>
          </div>
        </div>
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-pink-900/30 rounded-xl border border-pink-500/20">
            <TrendingDown className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">
              Avg. Daily Expenses
            </p>
            <h3 className="text-2xl font-bold text-gray-100">
              {formatCurrency(stats.avg_daily)}
            </h3>
          </div>
        </div>
      </div>

      {/* ROW 2: Actionable Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Savings Rate */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-teal-900/30 rounded-xl border border-teal-500/20">
            <Percent className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Savings Rate</p>
            <h3 className="text-2xl font-bold text-gray-100">
              {stats.savings_rate}%
            </h3>
          </div>
        </div>

        {/* MoM Spending Change */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div
            className={`p-3 rounded-xl border ${
              stats.mom_change <= 0
                ? "bg-emerald-900/30 border-emerald-500/20"
                : "bg-orange-900/30 border-orange-500/20"
            }`}
          >
            <Scale
              className={`w-6 h-6 ${
                stats.mom_change <= 0 ? "text-emerald-400" : "text-orange-400"
              }`}
            />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">MoM Change</p>
            <h3
              className={`text-2xl font-bold ${
                stats.mom_change <= 0 ? "text-emerald-400" : "text-orange-400"
              }`}
            >
              {stats.mom_change > 0 ? "+" : ""}
              {stats.mom_change}%
            </h3>
          </div>
        </div>

        {/* Monthly Fixed Costs */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div className="p-3 bg-indigo-900/30 rounded-xl border border-indigo-500/20">
            <RefreshCcw className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">
              Monthly Recurring Expenses
            </p>
            <h3 className="text-2xl font-bold text-gray-100">
              {formatCurrency(stats.totalMonthlyFixed)}
            </h3>
          </div>
        </div>

        {/* Burn Rate */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg flex items-center space-x-4">
          <div
            className={`p-3 rounded-xl border ${
              stats.burn_rate > 105
                ? "bg-red-900/30 border-red-500/20"
                : "bg-emerald-900/30 border-emerald-500/20"
            }`}
          >
            <Activity
              className={`w-6 h-6 ${
                stats.burn_rate > 105 ? "text-red-400" : "text-emerald-400"
              }`}
            />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Burn Rate</p>
            <h3
              className={`text-2xl font-bold ${
                stats.burn_rate > 105 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {stats.burn_rate}%
            </h3>
            <p className="text-xs text-gray-500">of avg pace</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9B59B6",
  "#3498DB",
  "#E67E22",
  "#2ECC71",
  "#F1C40F",
  "#E74C3C",
  "#1ABC9C",
  "#34495E",
];

// --- MAIN APP COMPONENT ---

function App() {
  const [transactions, setTransactions] = useState([]);
  const [activeTxTab, setActiveTxTab] = useState("recent");
  // Chat bot states
  const [chatHistory, setChatHistory] = useState([
    {
      role: "ai",
      content:
        "Hello! I'm Optimus, your AI financial coach. Ask me anything about your spending, budgeting, or saving goals.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Stats states
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Anomaly states
  const [anomalies, setAnomalies] = useState([]);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(true);
  const [anomalyExplanations, setAnomalyExplanations] = useState({});

  // Goal forecast states
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [forecast, setForecast] = useState(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);

  // Subscription detector states
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);

  // Visualization States
  const [vizPrompt, setVizPrompt] = useState("");
  const [vizData, setVizData] = useState(null);
  const [isLoadingViz, setIsLoadingViz] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  // Auto-scroll chat container to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [chatHistory, isChatLoading]);

  // Initial Data Fetching
  useEffect(() => {
    handleCheckSubscriptions();
    fetchTransactions();
    fetchStats();
    fetchAnomalies();
  }, []);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchAnomalies = async () => {
    setIsLoadingAnomalies(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json();
      if (data.anomalies) {
        console.log(data);
        setAnomalies(data.anomalies);

        const explanationMap = data.anomalies.reduce((acc, item) => {
          acc[item.id] = item.flag_reasons.join(", ");
          return acc;
        }, {});
        setAnomalyExplanations(explanationMap);
      }
    } catch (e) {
      console.error("Failed to fetch anomalies:", e);
    } finally {
      setIsLoadingAnomalies(false);
    }
  };

  const fetchTransactions = () => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => console.error("Failed to fetch transactions:", err));
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.reply || "I'm having trouble connecting right now.",
        },
      ]);

      if (data.visualization && Object.keys(data.visualization).length > 0) {
        setVizData(data.visualization);
      }
    } catch (e) {
      console.error("Chat Error Details:", e);
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", content: "Sorry, I couldn't reach the server." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Default Viz (Pie Chart)
  useEffect(() => {
    if (transactions.length > 0 && !vizData) {
      const categoryTotals = transactions
        .filter((tx) => tx.type === "withdrawal")
        .reduce((acc, tx) => {
          acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
          return acc;
        }, {});

      const pieData = Object.keys(categoryTotals).map((category) => ({
        name: category,
        amount: Number(categoryTotals[category].toFixed(2)),
      }));

      setVizData({
        chartType: "pie",
        title: "Total Spending by Category",
        summary: "Distribution of your expenses.",
        data: pieData,
        dataKey: "amount",
      });
    }
  }, [transactions]);

  const handleForecastGoal = async (e) => {
    e.preventDefault();
    setIsLoadingForecast(true);
    setForecast(null);
    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: goalName,
          amount: goalAmount,
          date: goalDate,
        }),
      });
      const data = await res.json();
      setForecast(data.error ? "Forecast unavailable." : data.forecast_message);
    } catch (e) {
      setForecast("Connection error.");
    } finally {
      setIsLoadingForecast(false);
    }
  };

  const handleCheckSubscriptions = async () => {
    setIsLoadingSubscriptions(true);
    try {
      const res = await fetch("/api/subscriptions", { method: "POST" });
      const data = await res.json();
      if (!data.error) setSubscriptions(data.subscriptions);
    } catch (e) {
      console.error("Sub check failed:", e);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const handleVisualize = async (e) => {
    e.preventDefault();
    setIsLoadingViz(true);
    setVizData(null);
    try {
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: vizPrompt }),
      });
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
        setVizData({ error: data.error });
      } else {
        setVizData(data.visualization);
      }
    } catch (e) {
      setVizData({ error: "Connection failed." });
    } finally {
      setIsLoadingViz(false);
    }
  };

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderChart = () => {
    if (!vizData || vizData.error) return null;
    const commonProps = {
      data: vizData.data,
      margin: { top: 5, right: 20, left: 10, bottom: 5 },
    };

    switch (vizData.chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey={vizData.xAxisKey}
                stroke="#9CA3AF"
                tickFormatter={(date) => {
                  const d = new Date(date);
                  // Handle cases where xAxis might not be a date
                  return isNaN(d.getTime())
                    ? date
                    : `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  color: "#F3F4F6",
                }}
              />
              <Bar dataKey={vizData.dataKey} fill="#8884d8">
                {vizData.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vizData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey={vizData.dataKey}
              >
                {vizData.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  color: "#F3F4F6",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vizData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey={vizData.xAxisKey}
                stroke="#9CA3AF"
                tickFormatter={(v) =>
                  new Date(v).toLocaleString("default", {
                    month: "short",
                    year: "2-digit",
                  })
                }
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  color: "#F3F4F6",
                }}
                formatter={(val) => [`$${val.toFixed(2)}`, "Amount"]}
              />
              <Line
                type="monotone"
                dataKey={vizData.dataKey}
                stroke="#82ca9d"
                strokeWidth={3}
                dot={({ cx, cy, payload }) =>
                  payload.is_anomaly ? (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="white"
                      stroke="red"
                      strokeWidth={2}
                    />
                  ) : (
                    <circle cx={cx} cy={cy} r={3} fill="#82ca9d" />
                  )
                }
              />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return <p className="text-red-400">Unsupported chart type.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-6 md:p-12 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <header className="mb-8 flex-shrink-0">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Optifi
          </h1>
          <p className="text-lg text-gray-400">Your AI-powered finance guide</p>
        </header>

        <FinancialStats stats={stats} isLoading={isLoadingStats} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 flex-1">
          {/* COLUMN 1 */}
          <div className="space-y-8">
            {/* CHATBOT SECTION */}
            <section className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl flex flex-col h-[550px] overflow-hidden">
              <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm z-10 flex items-center">
                <Bot className="w-6 h-6 mr-2 text-emerald-400" />
                <h2 className="text-xl font-bold text-gray-100">Optimus</h2>
              </div>

              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-950/30"
              >
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-emerald-600 text-white rounded-br-none"
                          : "bg-gray-800 text-gray-200 rounded-bl-none"
                      } shadow-md flex items-start space-x-2`}
                    >
                      <span className="text-sm leading-relaxed">
                        {msg.content}
                      </span>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 text-gray-400 p-3 rounded-2xl rounded-bl-none flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-900 border-t border-gray-800">
                <form onSubmit={handleChatSubmit} className="relative flex">
                  <input
                    type="text"
                    placeholder="Ask about your finances..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatLoading}
                    className="w-full py-3 pl-4 pr-12 bg-gray-950 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-100 placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-2 top-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </section>

            <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-blue-400" />
                Goal Forecasting
              </h2>
              <form onSubmit={handleForecastGoal} className="space-y-4 mb-6">
                <input
                  type="text"
                  required
                  placeholder="Goal Name"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-100"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    required
                    placeholder="Amount ($)"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-100"
                  />
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={goalDate}
                      onChange={(e) => setGoalDate(e.target.value)}
                      className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-100 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoadingForecast}
                  className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 text-blue-300 font-semibold rounded-xl flex items-center justify-center border border-blue-900/30 disabled:opacity-70"
                >
                  {isLoadingForecast ? "Forecasting..." : "Am I on track?"}
                </button>
              </form>
              {forecast && (
                <div className="p-5 bg-blue-950/30 rounded-xl border border-blue-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Result
                  </h3>
                  <p className="text-gray-200 leading-relaxed">{forecast}</p>
                </div>
              )}
            </section>
            <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl flex-shrink-0 max-h-[80vh]">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Search className="w-6 h-6 mr-2 text-purple-400" />
                Subscriptions
              </h2>
              {subscriptions.length === 0 && !isLoadingSubscriptions ? (
                <div className="text-center p-6 bg-gray-950/30 rounded-xl border border-gray-800/50 border-dashed">
                  <p className="text-gray-500 mb-4">
                    No subscriptions detected.
                  </p>
                  <button
                    onClick={handleCheckSubscriptions}
                    className="py-2 px-4 bg-purple-900/30 text-purple-300 rounded-lg border border-purple-500/30"
                  >
                    Rescan
                  </button>
                </div>
              ) : isLoadingSubscriptions ? (
                <div className="p-6 flex flex-col items-center text-gray-400 animate-pulse bg-gray-950/30 rounded-xl">
                  <Search className="w-8 h-8 mb-3 opacity-50" />
                  <p>Scanning...</p>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-300 overflow-y-auto pr-2 custom-scrollbar max-h-[590px]">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">
                      {subscriptions.length} found
                    </p>
                    <button
                      onClick={handleCheckSubscriptions}
                      className="text-xs text-purple-400 flex items-center"
                    >
                      <Search className="w-3 h-3 mr-1" /> Rescan
                    </button>
                  </div>
                  {subscriptions.map((sub, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-950 rounded-xl border border-purple-900/30 flex items-start space-x-3"
                    >
                      <div className="mt-1">
                        {sub.type === "Subscription" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500/70" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500/70" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-semibold text-gray-200">
                            {sub.name}
                          </h3>
                          <span className="text-gray-100 font-medium">
                            ${sub.amount}
                          </span>
                        </div>
                        <p className="text-sm text-purple-200/70 mt-1">
                          {sub.ai_note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* COLUMN 2 */}
          <div className="flex flex-col h-full space-y-8">
            {/* VISUALIZATION SECTION */}
            <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <PieChartIcon className="w-6 h-6 mr-2 text-pink-400" />
                Visual Insights
              </h2>
              <form onSubmit={handleVisualize} className="flex space-x-2 mb-4">
                <input
                  type="text"
                  required
                  placeholder="e.g., Show spending by category as a pie chart"
                  value={vizPrompt}
                  onChange={(e) => setVizPrompt(e.target.value)}
                  className="flex-1 p-3 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-gray-100 text-sm"
                />
                <button
                  type="submit"
                  disabled={isLoadingViz}
                  className="py-3 px-4 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-xl flex items-center justify-center disabled:opacity-70"
                >
                  {isLoadingViz ? "..." : <Sparkles className="w-5 h-5" />}
                </button>
              </form>
              {vizData && !vizData.error && (
                <div className="animate-in fade-in duration-500">
                  <h3 className="text-lg font-semibold text-gray-300 mb-2 text-center">
                    {vizData.title}
                  </h3>
                  {renderChart()}
                  <p className="text-sm text-gray-400 text-center mt-4 italic">
                    {vizData.summary}
                  </p>
                </div>
              )}
              {vizData?.error && (
                <p className="text-red-400 text-sm">{vizData.error}</p>
              )}
            </section>
            <div className="flex flex-col h-full min-h-0">
              <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl h-full flex flex-col overflow-hidden max-h-[80vh]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center">
                    <Receipt className="w-6 h-6 mr-2" />
                    Transactions
                  </h2>
                  {/* NEW: Tab Buttons */}
                  <div className="flex space-x-2 bg-gray-950/50 p-1 rounded-lg border border-gray-800/50">
                    <button
                      onClick={() => setActiveTxTab("recent")}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        activeTxTab === "recent"
                          ? "bg-gray-800 text-white"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveTxTab("unusual")}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center ${
                        activeTxTab === "unusual"
                          ? "bg-red-900/40 text-red-200"
                          : "text-gray-400 hover:text-red-300"
                      }`}
                    >
                      {anomalies.length > 0 && (
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                      )}
                      Unusual
                    </button>
                  </div>
                </div>

                {/* CONDITIONAL SEARCH: Hide search when in Unusual mode if you prefer, but keeping it for now */}
                {activeTxTab === "recent" && (
                  <div className="mb-4 relative">
                    <Search className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-100"
                    />
                  </div>
                )}

                <div className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-0 custom-scrollbar">
                  {activeTxTab === "recent" ? (
                    // STANDARD TRANSACTION LIST
                    filteredTransactions.length > 0 ? (
                      filteredTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                              <CategoryIcon category={tx.category} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-200">
                                {tx.description}
                              </p>
                              <p className="text-sm text-gray-500">{tx.date}</p>
                            </div>
                          </div>
                          <p
                            className={`font-semibold ${
                              tx.type === "deposit"
                                ? "text-emerald-400"
                                : "text-gray-100"
                            }`}
                          >
                            {tx.type === "deposit" ? "+" : "-"}$
                            {tx.amount.toFixed(2)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        No transactions found.
                      </div>
                    )
                  ) : (
                    // UNUSUAL (ANOMALY) LIST
                    anomalies.map((tx, index) => (
                      <div
                        key={`anomaly-${index}`}
                        // changed: 'items-center' to 'items-start' for better vertical alignment when expanded
                        // added: 'flex-col' to allow stacking standard details above the explanation
                        className="group flex flex-col p-4 bg-red-950/10 rounded-xl border border-red-900/30 hover:border-red-500/50 hover:bg-red-950/20 transition-all duration-300 animate-in fade-in cursor-help"
                      >
                        {/* Top Row: Standard Details */}
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-900/20 rounded-lg border border-red-800/30 group-hover:border-red-500/50 transition-colors">
                              <AlertOctagon className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-red-100">
                                {tx.description}
                              </p>
                              <p className="text-sm text-red-400/60">
                                {tx.date}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-red-400">
                            -${tx.amount.toFixed(2)}
                          </p>
                        </div>

                        {/* Bottom Row: Explanation (Reveals on hover) */}
                        {anomalyExplanations[tx.id] && (
                          <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300 ease-in-out">
                            <div className="overflow-hidden">
                              <div className="mt-3 pt-3 border-t border-red-900/30 flex items-start space-x-2 text-sm text-red-200/90">
                                <Info className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <span>{anomalyExplanations[tx.id]}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
