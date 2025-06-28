import React, { useEffect, useState } from "react";
import { FaFileExcel, FaFileCsv } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FaTimes, FaUser, FaEnvelope, FaPhone, FaHome,
  FaStickyNote, FaCreditCard, FaMoneyBill, FaTruck,
  FaCalendarAlt, FaClipboardList
} from "react-icons/fa";

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
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      let url = "https://test.api.dpmsign.com/api/order";
      if (search) url += `?searchTerm=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      let sortedOrders = data.data.orders || [];

      sortedOrders.sort((a, b) => {
        const fieldA = a[sortField];
        const fieldB = b[sortField];

        if (sortField === "orderTotalPrice") {
          return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
        }

        if (sortField === "deliveryDate") {
          return sortOrder === "asc"
            ? new Date(fieldA) - new Date(fieldB)
            : new Date(fieldB) - new Date(fieldA);
        }

        if (typeof fieldA === "string" && typeof fieldB === "string") {
          return sortOrder === "asc"
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA);
        }

        return 0;
      });

      setOrders(sortedOrders);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, sortField, sortOrder]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(orders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "orders.xlsx");
  };

  const exportToCSV = () => {
    const replacer = (key, value) => (value === null ? "" : value);
    const header = Object.keys(orders[0] || {});
    const csv = [
      header.join(","),
      ...orders.map((row) =>
        header.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "orders.csv");
  };

  const closeModal = () => setSelectedOrder(null);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📦 Active Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and view current orders.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, phone, email, or order ID"
          className="input input-bordered input-sm w-full md:w-80"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <select
            className="select select-sm select-bordered"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="createdAt">Sort by: Created</option>
            <option value="deliveryDate">Sort by: Delivery Date</option>
            <option value="orderTotalPrice">Sort by: Total Price</option>
            <option value="customerName">Sort by: Name</option>
          </select>
          <select
            className="select select-sm select-bordered"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <button onClick={exportToExcel} className="btn btn-success btn-sm text-white">
            <FaFileExcel className="mr-2" /> Excel
          </button>
          <button onClick={exportToCSV} className="btn btn-info btn-sm text-white">
            <FaFileCsv className="mr-2" /> CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading orders...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No orders found.</div>
        ) : (
          <table className="table table-xs">
            <thead className="bg-gray-100 text-gray-600 text-[11px]">
              <tr>
                <th></th>
                <th>ID</th>
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
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={order.orderId || i} className="hover">
                  <td><input type="checkbox" className="checkbox checkbox-xs" /></td>
                  <td>{order.orderId}</td>
                  <td>{order.customerName}</td>
                  <td>{order.customerEmail}</td>
                  <td>{order.customerPhone}</td>
                  <td>{order.orderItems?.length || 0}</td>
                  <td>{order.orderTotalPrice?.toLocaleString("en-BD") || "-"}</td>
                  <td>{order.paymentMethod?.replace("-payment", "")}</td>
                  <td>{statusBadge(order.paymentStatus)}</td>
                  <td>{order.deliveryMethod}</td>
                  <td>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "N/A"}</td>
                  <td className="text-xs whitespace-nowrap max-w-[500px] overflow-hidden text-ellipsis">{statusBadge(order.status)}</td>
                  <td>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-outline btn-xs bg-blue-700 text-white"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

     {selectedOrder && (
  <dialog className="modal modal-open">
    <div className="modal-box w-11/12 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h3 className="text-2xl font-bold text-gray-800">
          📄 Order #{selectedOrder.orderId} Details
        </h3>
        <button onClick={closeModal} className="btn btn-sm btn-circle btn-error text-white">
          <FaTimes />
        </button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div className="space-y-1">
          <p><strong>👤 Customer:</strong> {selectedOrder.customerName}</p>
          <p><strong>📧 Email:</strong> {selectedOrder.customerEmail}</p>
          <p><strong>📞 Phone:</strong> {selectedOrder.customerPhone}</p>
          <p><strong>🏠 Billing:</strong> {selectedOrder.billingAddress}</p>
          <p><strong>📝 Notes:</strong> {selectedOrder.additionalNotes || "N/A"}</p>
        </div>
        <div className="space-y-1">
          <p><strong>💳 Payment:</strong> {selectedOrder.paymentMethod?.replace("-payment", "")}</p>
          <p><strong>💰 Total:</strong> ৳{selectedOrder.orderTotalPrice}</p>
          <p><strong>📦 Delivery:</strong> {selectedOrder.deliveryMethod}</p>
          <p><strong>📅 Delivery Date:</strong> {new Date(selectedOrder.deliveryDate).toLocaleDateString()}</p>
          <p><strong>🚦 Status:</strong> {statusBadge(selectedOrder.status)}</p>
        </div>
      </div>

      {/* Items Section */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-700 mb-2">🧾 Order Items</h4>
        <ul className="list-disc ml-5 text-sm space-y-1">
          {selectedOrder.orderItems?.map((item, idx) => (
            <li key={idx}>
              <strong>{item.product?.name}</strong> — Qty: {item.quantity}, Size: {item.widthInch}x{item.heightInch} inch
              <div className="text-xs text-gray-500">
                SKU: {item.product?.sku} | Price: ৳{item.price}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="modal-action mt-6">
        <button className="btn btn-sm btn-neutral" onClick={closeModal}>Close</button>
      </div>
    </div>
  </dialog>
)}
{selectedOrder && (
  <dialog className="modal modal-open">
    <div className="modal-box w-11/12 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaClipboardList /> Order #{selectedOrder.orderId} Details
        </h3>
        <button onClick={closeModal} className="btn btn-sm btn-circle btn-error text-white">
          <FaTimes />
        </button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div className="space-y-1">
          <p className="flex items-center gap-2"><FaUser /> <strong>Customer:</strong> {selectedOrder.customerName}</p>
          <p className="flex items-center gap-2"><FaEnvelope /> <strong>Email:</strong> {selectedOrder.customerEmail}</p>
          <p className="flex items-center gap-2"><FaPhone /> <strong>Phone:</strong> {selectedOrder.customerPhone}</p>
          <p className="flex items-center gap-2"><FaHome /> <strong>Billing:</strong> {selectedOrder.billingAddress}</p>
          <p className="flex items-center gap-2"><FaStickyNote /> <strong>Notes:</strong> {selectedOrder.additionalNotes || "N/A"}</p>
        </div>

        <div className="space-y-1">
          <p className="flex items-center gap-2"><FaCreditCard /> <strong>Payment:</strong> {selectedOrder.paymentMethod?.replace("-payment", "")}</p>
          <p className="flex items-center gap-2"><FaMoneyBill /> <strong>Total:</strong> ৳{selectedOrder.orderTotalPrice}</p>
          <p className="flex items-center gap-2"><FaTruck /> <strong>Delivery:</strong> {selectedOrder.deliveryMethod}</p>
          <p className="flex items-center gap-2"><FaCalendarAlt /> <strong>Delivery Date:</strong> {new Date(selectedOrder.deliveryDate).toLocaleDateString()}</p>
          <p className="flex items-center gap-2"><FaClipboardList /> <strong>Status:</strong> {statusBadge(selectedOrder.status)}</p>
        </div>
      </div>

      {/* Items Section */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <FaClipboardList /> Order Items
        </h4>
        <ul className="list-disc ml-5 text-sm space-y-1">
          {selectedOrder.orderItems?.map((item, idx) => (
            <li key={idx}>
              <strong>{item.product?.name}</strong> — Qty: {item.quantity}, Size: {item.widthInch}x{item.heightInch} inch
              <div className="text-xs text-gray-500">
                SKU: {item.product?.sku} | Price: ৳{item.price}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="modal-action mt-6">
        <button className="btn btn-sm btn-neutral" onClick={closeModal}>Close</button>
      </div>
    </div>
  </dialog>
)}


    </div>
  );
}
