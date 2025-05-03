import React, { useState, useEffect } from 'react';
import { DollarSign, Package, TrendingDown, TrendingUp, CreditCard, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredProducts, setHoveredProducts] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dailyProfitSummary, setDailyProfitSummary] = useState(null);
  const [billWiseProfitSummary, setBillWiseProfitSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Fetch daily profit summary for current date
    const fetchDailyProfitSummary = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const response = await axios.get('/api/sales/daily-profit-report', {
          params: { date: today }
        });
        setDailyProfitSummary(response.data.summary || {});
      } catch (error) {
        console.error('Error fetching daily profit summary:', error);
      }
    };

    fetchDailyProfitSummary();

    // Fetch bill wise profit summary (total profit)
    const fetchBillWiseProfitSummary = async () => {
      try {
        const response = await axios.get('/api/sales/bill-wise-profit-report');
        setBillWiseProfitSummary(response.data.summary || {});
      } catch (error) {
        console.error('Error fetching bill wise profit summary:', error);
      }
    };

    fetchBillWiseProfitSummary();
  }, []);



  const COLORS = ['#FF6361', '#003F5C', '#BC5090', '#FFA600'];

  const handleMouseEnter = (data) => {
    setHoveredCategory(data.category);
    const selectedCategory = categoryData.find((entry) => entry.category === data.category);
    setHoveredProducts(selectedCategory ? selectedCategory.products : null);
  };

  const handleMouseLeave = () => {
    setHoveredCategory(null);
    setHoveredProducts(null);
  };

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!dashboardData) {
    return <div>No dashboard data available.</div>;
  }

  // Map backend data to frontend UI data structures
  const stats = [
    {
      title: "Today's Sales",
      value: `LKR ${Number(dashboardData.summaryCards.totalTodaysSales).toLocaleString()}`,
      icon: DollarSign,
      trend: 'up',
      percentage: "Today's Sales",
    },
    {
      title: 'Total Items',
      value: dashboardData.summaryCards.totalItems,
      icon: Package,
      trend: 'up',
      percentage: 'Total Items',
    },

    {
      title: 'Today\'s Profit',
      value: dailyProfitSummary ? `LKR ${Number(dailyProfitSummary.totalProfitAll).toLocaleString()}` : `LKR ${Number(dashboardData.summaryCards.todaysProfit).toLocaleString()}`,
      icon: TrendingUp,
      trend: dailyProfitSummary && Number(dailyProfitSummary.totalProfitAll) >= 0 ? 'up' : 'down',
      percentage: "Today's Profit",
    },
    {
      title: 'Total Profit',
      value: billWiseProfitSummary ? `LKR ${Number(billWiseProfitSummary.totalProfitAll).toLocaleString()}` : 'LKR 0',
      icon: TrendingUp,
      trend: billWiseProfitSummary && Number(billWiseProfitSummary.totalProfitAll) >= 0 ? 'up' : 'down',
      percentage: 'Total Profit',
    },
  ];


  const paymentDue = [
    {
      title: 'Sales Payment Due',
      value: `LKR ${Number(dashboardData.financialStatus.salesPaymentDue).toLocaleString()}`,
      icon: CreditCard,
      trend: 'down',
      percentage: 'N/A',
      color: 'bg-fuchsia-900',
    },
    {
      title: 'Purchase Payment Due',
      value: `LKR ${Number(dashboardData.financialStatus.purchasePaymentDue).toLocaleString()}`,
      icon: CreditCard,
      trend: 'up',
      percentage: 'N/A',
      color: 'bg-cyan-900',
    },
  ];

  const alerts = [
    {
      title: 'Going to Expiry',
      value: dashboardData.expiryTracking.itemsGoingToExpire,
      icon: Clock,
      description: 'Items nearing expiration.',
      color: 'bg-yellow-500',
    },
    {
      title: 'Already Expired',
      value: dashboardData.expiryTracking.alreadyExpiredItems,
      icon: Clock,
      description: 'Items have already expired.',
      color: 'bg-gray-500',
    },
  ];

  // Prepare salesData for LineChart
  const salesData = dashboardData.chartsAndReports.monthlySales.map(item => ({
    date: item.month,
    amount: parseFloat(item.total_sales),
  }));

  // Prepare categoryData for PieChart (top selling products)
  const categoryData = dashboardData.chartsAndReports.topSellingProducts.map(product => ({
    category: product.product_name,
    count: Number(product.total_quantity_sold),
    products: [], // No detailed products info from backend, keep empty
  }));

  return (
    <div className="bg-transparent space-y-8 p-6 min-h-screen">

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-6 dark:bg-gray-800/60 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-semibold text-gray-800 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full">
                  <Icon className="text-white w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span
                  className={`text-sm font-bold ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}
                >
                  {stat.percentage}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Due Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
        {paymentDue.map((payment, index) => (
          <div
            key={index}
            className={`p-6 ${payment.color} dark:bg-gray-700 rounded-xl shadow-lg flex items-center justify-between backdrop-blur-md hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
          >
            <div>
              <p className="text-sm text-white">{payment.title}</p>
              <p className="text-3xl font-semibold text-white">{payment.value}</p>
              <div className="flex items-center">
                <span
                  className={`text-sm font-bold ${payment.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}
                >
                </span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-full">
              <payment.icon className="text-gray-700 w-6 h-6" />
            </div>
          </div>

        ))}

        {/* Going to Expiry Section */}
        {alerts.map((alert, index) => (
          <div key={index} className={`p-6 ${alert.color} dark:bg-gray-700 rounded-xl shadow-lg backdrop-blur-md hover:shadow-xl transform hover:scale-105 transition-all duration-300`}>
            <h3 className="text-lg font-semibold text-white">{alert.title}</h3>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{alert.title}</p>
                <p className="text-3xl font-semibold text-white">{alert.value}</p>
                <p className="text-sm text-white">{alert.description}</p>
              </div>
              <div className="bg-white p-4 rounded-full">
                <alert.icon className="text-gray-700 w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white/80 dark:bg-gray-800/60 backdrop-blur-md rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Sales View</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 bg-white/80 dark:bg-gray-800/60 backdrop-blur-md rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Top Selling Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="category"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={5}
                fill="#8884d8"
                label={({ category, count }) => `${category} (${count})`}
                isAnimationActive
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {hoveredCategory && hoveredProducts && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                {hoveredCategory} Products
              </h3>
              <ul className="mt-2 text-gray-600 dark:text-gray-300">
                {hoveredProducts.map((product, index) => (
                  <li key={index}>
                    {product.name} - {product.price}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
