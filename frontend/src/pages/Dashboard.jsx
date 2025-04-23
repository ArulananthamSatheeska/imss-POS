import React, { useState } from 'react';
import { DollarSign, Package, TrendingDown, TrendingUp, CreditCard, AlertCircle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredProducts, setHoveredProducts] = useState(null);

  const salesData = [
    { date: '2024-03-01', amount: 1200 },
    { date: '2024-03-02', amount: 1800 },
    { date: '2024-03-03', amount: 1400 },
    { date: '2024-03-04', amount: 2200 },
    { date: '2024-03-05', amount: 1600 },
  ];

  const categoryData = [
    {
      category: 'Electronics',
      count: 45,
      products: [
        { name: 'Laptop', price: '$1000' },
        { name: 'Smartphone', price: '$800' },
        { name: 'Headphones', price: '$150' },
      ],
    },
    {
      category: 'Clothing',
      count: 30,
      products: [
        { name: 'T-shirt', price: '$20' },
        { name: 'Jeans', price: '$50' },
        { name: 'Jacket', price: '$100' },
      ],
    },
    {
      category: 'Food',
      count: 25,
      products: [
        { name: 'Apples', price: '$5/kg' },
        { name: 'Milk', price: '$2/liter' },
        { name: 'Bread', price: '$3/loaf' },
      ],
    },
    {
      category: 'Books',
      count: 20,
      products: [
        { name: 'Fiction Book', price: '$15' },
        { name: 'Science Book', price: '$25' },
        { name: 'Biography', price: '$30' },
      ],
    },
  ];

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

  const stats = [
    {
      title: "Today's Sales",
      value: 'LKR 1,234',
      icon: DollarSign,
      trend: 'up',
      percentage: '12%',
    },
    {
      title: 'Total Items',
      value: '156',
      icon: Package,
      trend: 'up',
      percentage: '8%',
    },
    {
      title: 'Low Stock Items',
      value: '5',
      icon: TrendingDown,
      trend: 'down',
      percentage: '2%',
    },
    {
      title: 'Top Selling',
      value: '23',
      icon: TrendingUp,
      trend: 'up',
      percentage: '15%',
    },
  ];

  const paymentDue = [
    {
      title: 'Sales Payment Due',
      value: 'LKR 500',
      icon: CreditCard,
      trend: 'down',
      percentage: '5%',
      color: 'bg-fuchsia-900',
    },
    {
      title: 'Purchase Payment Due',
      value: 'LKR 800',
      icon: CreditCard,
      trend: 'up',
      percentage: '10%',
      color: 'bg-cyan-900',
    },
  ];

  const alerts = [
    {
      title: 'Product Stock Alert',
      value: '3',
      icon: AlertCircle,
      description: 'Items running low in stock.',
      color: 'bg-Cyan-900',
    },
    {
      title: 'Going to Expiry',
      value: '5',
      icon: Clock,
      description: 'Items nearing expiration.',
      color: 'bg-yellow-500',
    },
    {
      title: 'Already Expired',
      value: '3',
      icon: Clock,
      description: 'Items have already expired.',
      color: 'bg-gray-500',
    },
  ];

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
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last month</span>
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
                  {payment.percentage}
                </span>
                <span className="ml-2 text-sm text-white">vs last month</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-full">
              <payment.icon className="text-gray-700 w-6 h-6" />
            </div>
          </div>

        ))}

        {/* Going to Expiry Section */}
        <div className="p-6 bg-red-700 dark:bg-gray-700 rounded-xl shadow-lg backdrop-blur-md hover:shadow-xl transform hover:scale-105 transition-all duration-300">
          <h3 className="text-lg font-semibold text-white">Going to Expiry</h3>
          {alerts.filter((alert) => alert.title === 'Going to Expiry').map((alert, index) => (
            <div key={index} className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{alert.title}</p>
                <p className="text-3xl font-semibold text-white">{alert.value}</p>
                <p className="text-sm text-white">{alert.description}</p>
              </div>
              <div className="bg-white p-4 rounded-full">
                <alert.icon className="text-gray-700 w-6 h-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Already Expired Section */}
        <div className="p-6 bg-teal-900 dark:bg-gray-700 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
          <h3 className="text-lg font-semibold text-white">Already Expired</h3>
          {alerts.filter((alert) => alert.title === 'Already Expired').map((alert, index) => (
            <div key={index} className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{alert.title}</p>
                <p className="text-3xl font-semibold text-white">{alert.value}</p>
                <p className="text-sm text-white">{alert.description}</p>
              </div>
              <div className="bg-white p-4 rounded-full">
                <alert.icon className="text-gray-700 w-6 h-6" />
              </div>
            </div>
          ))}
        </div>
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
                label={({ category, count }) => `${category} (${count})`} // Destructuring the props
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
