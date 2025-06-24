import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- Data for the chart (no changes needed here) ---
const chartData = [
  { month: "Jan", earnings: 4000, orders: 2400, customers: 2400 },
  { month: "Feb", earnings: 3000, orders: 1398, customers: 2210 },
  { month: "Mar", earnings: 9800, orders: 2000, customers: 2290 }, // Swapped values to better match target chart shape
  { month: "Apr", earnings: 3908, orders: 2780, customers: 2000 },
  { month: "May", earnings: 4800, orders: 1890, customers: 2181 },
  { month: "Jun", earnings: 3800, orders: 2390, customers: 2500 },
];

// --- UPDATED: Stat card data array ---
// We remove the icon and change `color` to be the border color class
const statsData = [
  {
    label: "Total Earnings",
    value: "51.6K",
    borderColor: "border-green-400",
  },
  {
    label: "Total Orders",
    value: "85K",
    borderColor: "border-purple-400",
  },
  {
    label: "Total Products",
    value: "4.5K",
    borderColor: "border-cyan-400",
  },
  {
    label: "Total Customers",
    value: "11.6K",
    borderColor: "border-orange-400",
  },
];

// --- NEW: Custom Legend for the Chart ---
// This component replaces the default Recharts legend.
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
  return (
    // Use a light background for the whole page to make the white cards pop
    <div className="p-6 bg-gray-50 min-h-full space-y-6">
      {/* --- UPDATED: Header with filter buttons --- */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hello, Admin</h1>
          <p className="text-gray-500">
            Good morning, let's check your stats today!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-blue-700 transition-colors">
            This week
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm border hover:bg-gray-100 transition-colors">
            This month
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm border hover:bg-gray-100 transition-colors">
            This year
          </button>
        </div>
      </div>

      {/* --- UPDATED: Stat Cards rendering logic --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div
            key={index}
            // New styling: white background, padding, shadow, and the dynamic left border
            className={`bg-white p-5 rounded-lg shadow-md border-l-4 ${stat.borderColor}`}
          >
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* --- UPDATED: Main Grid Layout (2/3 and 1/3) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart (Left Column) */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 relative">
          <h3 className="text-lg font-semibold mb-2">Earnings</h3>
          <p className="text-sm text-gray-500 mb-4">January - June 2024</p>
          <CustomLegend /> {/* Use our new custom legend */}
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              {/* REMOVED the default <Legend /> component */}
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

        {/* Recent Orders (Right Column) */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="font-semibold text-lg mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {Array(6)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://i.pravatar.cc/40?img=${i + 1}`}
                      className="w-10 h-10 rounded-full"
                      alt="avatar"
                    />
                    <div>
                      <h4 className="font-semibold text-sm">Olivia Martin</h4>
                      <p className="text-xs text-gray-500">martin@gmail.com</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold">$1,000</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Top Selling Products table (no layout changes needed here) */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h2 className="font-semibold text-lg mb-4">Top Selling Products</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            {/* head */}
            <thead>
              <tr className="text-sm text-gray-500 uppercase">
                <th>S/No</th>
                <th>Product Name</th>
                <th>Product Code</th>
                <th>Category</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              {/* row 1 */}
              <tr>
                <td>#1</td>
                <td>3D LED Signage</td>
                <td>DPM001</td>
                <td>Award Crest</td>
                <td>120.4K</td>
              </tr>
              {/* row 2 */}
              <tr>
                <td>#2</td>
                <td>Signage</td>
                <td>DPM003</td>
                <td>Award Crest</td>
                <td>20.4K</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* --- NEW: Floating Welcome Banner --- */}
      <div className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl">
        <h4 className="font-bold">Welcome back, Admin!</h4>
        <p className="text-sm">Ready to take charge and make things happen?</p>
      </div>
    </div>
  );
}
