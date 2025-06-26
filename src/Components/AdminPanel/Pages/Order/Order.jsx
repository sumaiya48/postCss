import React, { useEffect, useState } from "react";
import { FaFileExcel, FaFileCsv } from "react-icons/fa";

const getToken = () => localStorage.getItem("authToken");

const statusBadge = (status) => {
  const base = "badge text-xs font-medium capitalize";
  switch (status) {
    case "pending":
      return <span className={`${base} badge-error badge-outline`}>pending</span>;
    case "partial":
      return <span className={`${base} badge-info badge-outline`}>partial</span>;
    case "paid":
      return <span className={`${base} badge-success`}>paid</span>;
    case "order-request-received":
      return <span className={`${base} badge-secondary`}>order request received</span>;
    case "consultation-in-progress":
      return <span className={`${base} badge-primary`}>consultation in progress</span>;
    case "order-canceled":
      return <span className={`${base} badge-error`}>order canceled</span>;
    case "awaiting-advance-payment":
      return <span className={`${base} badge-warning`}>awaiting advance payment</span>;
    case "advance-payment-received":
      return <span className={`${base} badge-info`}>advance payment received</span>;
    case "design-in-progress":
      return <span className={`${base} badge-accent`}>design in progress</span>;
    case "awaiting-design-approval":
      return <span className={`${base} badge-warning`}>awaiting design approval</span>;
    case "production-started":
      return <span className={`${base} badge-info`}>production started</span>;
    case "production-in-progress":
      return <span className={`${base} badge-info`}>production in progress</span>;
    case "ready-for-delivery":
      return <span className={`${base} badge-success`}>ready for delivery</span>;
    case "out-for-delivery":
      return <span className={`${base} badge-primary`}>out for delivery</span>;
    case "order-completed":
      return <span className={`${base} badge-success`}>order completed</span>;
    default:
      return <span className={base}>{status}</span>;
  }
};

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const url = `https://test.api.dpmsign.com/api/order${
          search ? `?searchTerm=${encodeURIComponent(search)}` : ""
        }`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Fetch failed:", errorText);
          throw new Error("Failed to fetch orders");
        }

        const data = await res.json();
        setOrders(data.data.orders || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [search]);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Active Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            All the active orders of your store in one place!
          </p>
        </div>

        {/* Search + Buttons */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-4">
          <input
            type="text"
            className="input input-bordered input-sm w-full md:w-80"
            placeholder="Search by name, phone, email, or order ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn btn-success btn-sm text-white">
              <FaFileExcel className="mr-2" /> Export Excel
            </button>
            <button className="btn btn-info btn-sm text-white">
              <FaFileCsv className="mr-2" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow border">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading orders...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <table className="table table-zebra table-sm">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th>
                    <input type="checkbox" className="checkbox checkbox-sm" />
                  </th>
                  <th>Order ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Total (Tk)</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Delivery</th>
                  <th>Est. Delivery</th>
                  <th>Order Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-6 text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order, i) => (
                    <tr key={order.orderId || i} className="hover">
                      <td><input type="checkbox" className="checkbox checkbox-xs" /></td>
                      <td className="text-xs">{order.orderId}</td>
                      <td className="text-xs">{order.customerName}</td>
                      <td className="text-xs">{order.customerEmail}</td>
                      <td className="text-xs">{order.customerPhone}</td>
                      <td className="text-xs">{order.orderItems?.length || 0}</td>
                      <td className="text-xs">{order.orderTotalPrice?.toLocaleString("en-BD") || "-"}</td>
                      <td className="text-xs capitalize">{order.paymentMethod?.replace("-payment", "")}</td>
                      <td>{statusBadge(order.paymentStatus)}</td>
                      <td className="text-xs">{order.deliveryMethod}</td>
                      <td className="text-xs">
                        {order.deliveryDate
                          ? new Date(order.deliveryDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>{statusBadge(order.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="text-sm text-gray-500 mt-4">
          Showing {orders.length} entr{orders.length === 1 ? "y" : "ies"}
        </div>
      </div>
    </div>
  );
}
