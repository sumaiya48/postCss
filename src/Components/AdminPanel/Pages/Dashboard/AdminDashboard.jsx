import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomLegend = () => (
  <div className="absolute top-0 right-4 flex items-center space-x-4 text-xs text-gray-500">
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-[#10B981] mr-2"></div>
      <span>Earnings</span>
    </div>
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-[#8B5CF6] mr-2"></div>
      <span>Orders</span>
    </div>
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-[#F59E0B] mr-2"></div>
      <span>Customers</span>
    </div>
  </div>
);

export default function AdminDashboard() {
  const token = localStorage.getItem("authToken");

  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [timeFilter, setTimeFilter] = useState("week"); // 'week', 'month', 'year'

  // NEW: State to hold all orders fetched
  const [orders, setOrders] = useState([]);

  // Fetch orders once, setOrders
  useEffect(() => {
    fetch("https://test.api.dpmsign.com/api/order", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const ordersData = data?.data?.orders || [];
        setOrders(ordersData);

        // Set recent orders
        const sortedOrders = [...ordersData].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setRecentOrders(sortedOrders.slice(0, 5));

        // Top products by frequency
        const productMap = {};
        ordersData.forEach((order) => {
          order.items?.forEach((item) => {
            const key = item.productId;
            if (!productMap[key]) {
              productMap[key] = {
                name: item.productName || "Unknown",
                sku: item.sku || "",
                count: 0,
              };
            }
            productMap[key].count += item.quantity || 0;
          });
        });

        const top = Object.values(productMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopProducts(top);

        // Top Selling Products (another logic)
        const productSalesMap = {};
        ordersData.forEach((order) => {
          order.orderItems?.forEach((item) => {
            const id = item.productId;
            const name = item.product?.name || "Unnamed Product";
            const code = item.product?.sku || "N/A";
            const category = item.product?.category || "N/A";

            if (!productSalesMap[id]) {
              productSalesMap[id] = {
                productId: id,
                name,
                code,
                category,
                sold: 0,
              };
            }

            productSalesMap[id].sold += item.quantity;
          });
        });

        const sortedProducts = Object.values(productSalesMap).sort(
          (a, b) => b.sold - a.sold
        );
        setTopSellingProducts(sortedProducts.slice(0, 5)); // top 5
      })
      .catch((err) => console.error("Order fetch error:", err));
  }, [token]);

  // Fetch product count and customer count
  useEffect(() => {
    fetch("https://test.api.dpmsign.com/api/product")
      .then((res) => res.json())
      .then((data) => {
        setProductCount(data?.data?.products?.length || 0);
      });

    fetch("https://test.api.dpmsign.com/api/customer", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const total =
          data?.data?.total ??
          (Array.isArray(data?.data?.customers)
            ? data.data.customers.length
            : 0);
        setCustomerCount(total);
      });
  }, [token]);

  // Filter and process orders when orders, timeFilter or customerCount changes
  useEffect(() => {
    if (!orders.length) return;

    const isInTimeRange = (dateStr, range) => {
      const now = new Date();
      const targetDate = new Date(dateStr);
      const diffTime = now - targetDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (range === "week") return diffDays <= 7;
      if (range === "month")
        return (
          targetDate.getMonth() === now.getMonth() &&
          targetDate.getFullYear() === now.getFullYear()
        );
      if (range === "year") return targetDate.getFullYear() === now.getFullYear();
      return true;
    };

    const filteredOrders = orders.filter((order) =>
      isInTimeRange(order.createdAt, timeFilter)
    );

    setOrderCount(filteredOrders.length);

    const earnings = filteredOrders.reduce(
      (sum, o) => sum + Number(o.orderTotalPrice || 0),
      0
    );
    setTotalEarnings(earnings);

    // Chart Data
    const monthlyData = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt);
      const month = date.toLocaleString("default", { month: "short" });
      if (!monthlyData[month]) monthlyData[month] = { earnings: 0, orders: 0 };
      monthlyData[month].earnings += Number(order.totalAmount || 0);
      monthlyData[month].orders += 1;
    });

    setChartData(
      Object.entries(monthlyData).map(([month, val]) => ({
        month,
        earnings: val.earnings,
        orders: val.orders,
        customers: customerCount,
      }))
    );
  }, [orders, timeFilter, customerCount]);

  const statsData = [
    {
      label: "Total Earnings",
      value: `$${Number(totalEarnings || 0).toLocaleString()}`,
      borderColor: "border-green-400",
    },
    {
      label: "Total Orders",
      value: orderCount,
      borderColor: "border-purple-400",
    },
    {
      label: "Total Products",
      value: productCount,
      borderColor: "border-cyan-400",
    },
    {
      label: "Total Customers",
      value: customerCount,
      borderColor: "border-orange-400",
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hello, Admin</h1>
          <p className="text-gray-500">
            Good morning, let's check your stats today!
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["week", "month", "year"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeFilter(range)}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                timeFilter === range
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {range === "week"
                ? "This Week"
                : range === "month"
                ? "This Month"
                : "This Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className={`bg-white p-5 rounded-lg shadow-md border-l-4 ${stat.borderColor}`}
          >
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Chart & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 relative">
          <h3 className="text-lg font-semibold mb-2">Earnings</h3>
          <p className="text-sm text-gray-500 mb-4">Monthly Overview</p>
          <CustomLegend />
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="font-semibold text-lg mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {recentOrders.map((order, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">#{order.orderId}</h4>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-bold">
                  ${Number(order.orderTotalPrice || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h2 className="font-semibold text-lg mb-4">Top Selling Products</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="text-sm text-gray-500 uppercase">
                <th>S/No</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              {topSellingProducts.map((product, index) => (
                <tr key={product.productId}>
                  <td>#{index + 1}</td>
                  <td>{product.name}</td>
                  <td>{product.code}</td>
                  <td>{product.sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl">
        <h4 className="font-bold">Welcome back, Admin!</h4>
        <p className="text-sm">Ready to take charge and make things happen?</p>
      </div>
    </div>
  );
}
