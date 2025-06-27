import React, { useEffect, useState } from "react";
import { FaFileExcel, FaFileCsv } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


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

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      let url = `https://test.api.dpmsign.com/api/order`;
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
  const replacer = (key, value) => (value === null ? "" : value); // null কে ফাঁকা রাখবে
  const header = Object.keys(orders[0] || {});
  const csv = [
    header.join(","), // হেডার
    ...orders.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "orders.csv");
};


  return (
    <div className="p-2 md:p-2 bg-gray-50 min-h-screen">
      <div className=" mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Active Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            All the active orders of your store in one place!
          </p>
        </div>

        {/* Controls */}
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

        {/* Table */}
        <div className=" bg-white rounded-lg shadow border">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading orders...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No orders found.</div>
          ) : (
            <table className="table table-zebra  table-xs min-w-full">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th><input type="checkbox" className="checkbox checkbox-sm" /></th>
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
                {orders.map((order, i) => (
                  <tr key={order.orderId || i} className="hover">
                    <td><input type="checkbox" className="checkbox checkbox-xs" /></td>
                    <td className="text-xs">{order.orderId}</td>
                    <td className="text-xs">{order.customerName}</td>
                    <td className="text-xs">{order.customerEmail}</td>
                    <td className="text-xs">{order.customerPhone}</td>
                    <td className="text-xs">{order.orderItems?.length || 0}</td>
                    <td className="text-xs">{order.orderTotalPrice?.toLocaleString("en-BD") || "-"}</td>
                    <td className="text-xs capitalize">{order.paymentMethod?.replace("-payment", "")}</td>
                    
                    <td className="text-xs whitespace-nowrap max-w-[140px] overflow-hidden text-ellipsis">
  {statusBadge(order.paymentStatus)}
</td>

                    <td className="text-xs">{order.deliveryMethod}</td>
                    <td className="text-xs">
                      {order.deliveryDate
                        ? new Date(order.deliveryDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                   <td className="text-xs whitespace-nowrap max-w-[500px] overflow-hidden text-ellipsis">
  {statusBadge(order.status)}
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination + Entry Count */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-500">
            Showing {orders.length} entr{orders.length === 1 ? "y" : "ies"}
          </p>
          <div className="join">
            <button className="join-item btn btn-sm">«</button>
            <button className="join-item btn btn-sm">1</button>
            <button className="join-item btn btn-sm btn-disabled">2</button>
            <button className="join-item btn btn-sm">3</button>
            <button className="join-item btn btn-sm">»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
