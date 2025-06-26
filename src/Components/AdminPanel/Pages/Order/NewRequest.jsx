import React, { useEffect, useState } from "react";
import { FaSync } from "react-icons/fa";

const statusBadge = (status) => {
  switch (status) {
    case "pending":
      return <span className="badge badge-error badge-outline">pending</span>;
    case "partial":
      return <span className="badge badge-info badge-outline">partial</span>;
    case "paid":
      return <span className="badge badge-success">paid</span>;
    case "order-request-received":
      return (
        <span className="badge badge-secondary">order request received</span>
      );
    case "consultation-in-progress":
      return (
        <span className="badge badge-primary">consultation in progress</span>
      );
    default:
      return <span className="badge">{status}</span>;
  }
};

export default function Pending() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Admin JWT token assumed to be in localStorage
      const token = localStorage.getItem("authToken");
      const url = "https://test.api.dpmsign.com/api/order?filteredBy=requested";
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch pending orders");
      const data = await res.json();
      setOrders(data.data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pending Order Requests</h1>
          <p className="text-sm text-gray-500">
            All new order requests awaiting review.
          </p>
        </div>
        <button
          className="btn btn-sm btn-outline"
          onClick={fetchOrders}
          disabled={loading}
        >
          <FaSync className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        {loading ? (
          <div className="p-8 text-center">Loading pending orders...</div>
        ) : error ? (
          <div className="p-8 text-center text-error">{error}</div>
        ) : (
          <table className="table table-zebra">
            <thead className="bg-base-200 text-sm">
              <tr>
                <th>OrderID</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Billing Address</th>
                <th>Order Items</th>
                <th>Total Price (Tk)</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center">
                    No pending orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>{order.customerName}</td>
                    <td>{order.customerPhone}</td>
                    <td>{order.billingAddress}</td>
                    <td>{order.orderItems?.length || 0}</td>
                    <td>
                      {order.orderTotalPrice?.toLocaleString("en-BD") || "-"}
                    </td>
                    <td>{statusBadge(order.paymentStatus)}</td>
                    <td>{statusBadge(order.status)}</td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        <div className="p-4 text-sm text-gray-500">
          Showing {orders.length} entr{orders.length === 1 ? "y" : "ies"}
        </div>
      </div>
    </div>
  );
}
