import React from "react";
import { FaFileExcel, FaFileCsv } from "react-icons/fa";

const orders = [
  
  {
    id: "#2",
    name: "Robiul Chokder",
    email: "robiulchokder21@gmail.com",
    phone: "01958253961",
    items: 1,
    total: "19,417 Tk",
    paymentMethod: "Online",
    paymentStatus: "partial",
    delivery: "courier",
    estDelivery: "N/A",
    status: "order request received",
  },
  {
    id: "#1",
    name: "Robiul Chokder",
    email: "robiulislam200212@gmail.com",
    phone: "01991334397",
    items: 1,
    total: "4,643 Tk",
    paymentMethod: "Online",
    paymentStatus: "pending",
    delivery: "courier",
    estDelivery: "20/05/2025 in Today",
    status: "consultation in progress",
  },
];

const getStatusBadge = (status) => {
  switch (status) {
    case "pending":
      return <span className="badge badge-error badge-outline">pending</span>;
    case "partial":
      return <span className="badge badge-info badge-outline">partial</span>;
    case "order request received":
      return <span className="badge badge-secondary">order request received</span>;
    case "order completed":
      return <span className="badge badge-success">order completed</span>;
    case "consultation in progress":
      return <span className="badge badge-primary">consultation in progress</span>;
    default:
      return <span className="badge">{status}</span>;
  }
};

export default function Order() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Active Orders</h1>
        <p className="text-sm text-gray-500">All the active orders of your store in one place!</p>
      </div>

      {/* Export Buttons */}
      <div className="mb-4 flex items-center gap-2">
        <button className="btn btn-success btn-sm text-white">
          <FaFileExcel className="mr-2" /> Export Excel
        </button>
        <button className="btn btn-info btn-sm text-white">
          <FaFileCsv className="mr-2" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="table table-zebra">
          <thead className="bg-base-200 text-sm">
            <tr>
              <th><input type="checkbox" /></th>
              <th>OrderID</th>
              <th>Customer Name</th>
              <th>Customer Email</th>
              <th>Customer Phone</th>
              <th>Order Items</th>
              <th>Total Price (Tk)</th>
              <th>Payment Method</th>
              <th>Payment Status</th>
              <th>Delivery Method</th>
              <th>Est. Delivery</th>
              <th>Current Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr key={i}>
                <td><input type="checkbox" /></td>
                <td>{order.id}</td>
                <td>{order.name}</td>
                <td>{order.email}</td>
                <td>{order.phone}</td>
                <td>{order.items}</td>
                <td>{order.total}</td>
                <td>{order.paymentMethod}</td>
                <td>{getStatusBadge(order.paymentStatus)}</td>
                <td>{order.delivery}</td>
                <td>{order.estDelivery}</td>
                <td>{getStatusBadge(order.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 text-sm text-gray-500">Showing 5 entries from</div>
      </div>
    </div>
  );
}
