// Cancelled Orders Page with search, export, and filtered by "order-canceled"

import React, { useEffect, useState } from "react";
import { FaSync, FaFileCsv, FaFileExcel, FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";
import * as XLSX from "xlsx";

const statusBadge = (status) => {
  const badgeClass = "badge px-2 py-0.5 text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]";
  switch (status) {
    case "pending":
      return <span className={`${badgeClass} badge-error badge-outline`}>Pending</span>;
    case "partial":
      return <span className={`${badgeClass} badge-info badge-outline`}>Partial</span>;
    case "paid":
      return <span className={`${badgeClass} badge-success`}>Paid</span>;
    case "order-canceled":
      return <span className={`${badgeClass} badge-error`}>Canceled</span>;
    default:
      return <span className={`${badgeClass} badge-ghost`}>{status}</span>;
  }
};

export default function CancelledOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const url = "https://test.api.dpmsign.com/api/order?filteredBy=cancelled";
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch cancelled orders");
      const data = await res.json();
      const cancelled = (data.data.orders || []).filter((o) => o.status === "order-canceled");
      setOrders(cancelled);
      setFilteredOrders(cancelled);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const filtered = orders.filter(
      (o) =>
        o.customerName.toLowerCase().includes(value.toLowerCase()) ||
        o.customerPhone.includes(value) ||
        o.orderId.toString().includes(value)
    );
    setFilteredOrders(filtered);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CancelledOrders");
    XLSX.writeFile(workbook, "cancelled_orders.xlsx");
  };

  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "cancelled_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field) => {
    const asc = field === sortField ? !sortAsc : true;
    const sorted = [...filteredOrders].sort((a, b) => {
      if (a[field] < b[field]) return asc ? -1 : 1;
      if (a[field] > b[field]) return asc ? 1 : -1;
      return 0;
    });
    setSortField(field);
    setSortAsc(asc);
    setFilteredOrders(sorted);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">❌ Cancelled Orders</h1>
          <p className="text-sm text-gray-500">
            Orders marked as canceled. You can search, sort, or export them.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search name, phone, ID..."
            value={searchTerm}
            onChange={handleSearch}
            className="input input-sm input-bordered w-52"
          />
          <button className="btn btn-sm btn-info text-white shadow" onClick={fetchOrders} disabled={loading}>
            <FaSync className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="btn btn-sm btn-success text-white shadow" onClick={exportToExcel}>
            <FaFileExcel /> Excel
          </button>
          <button className="btn btn-sm btn-warning text-white shadow" onClick={exportToCSV}>
            <FaFileCsv /> CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-600">Loading cancelled orders...</div>
        ) : error ? (
          <div className="p-8 text-center text-error text-sm font-medium">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No cancelled orders found.</div>
        ) : (
          <table className="table table-xs">
            <thead className="bg-base-200 text-gray-700 text-[11px]">
              <tr>
                <th className="cursor-pointer" onClick={() => handleSort("orderId")}>Order ID {sortField === "orderId" && (sortAsc ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}</th>
                <th className="cursor-pointer" onClick={() => handleSort("customerName")}>Customer {sortField === "customerName" && (sortAsc ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Items</th>
                <th className="cursor-pointer" onClick={() => handleSort("orderTotalPrice")}>Total (৳) {sortField === "orderTotalPrice" && (sortAsc ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="cursor-pointer" onClick={() => handleSort("updatedAt")}>Cancelled {sortField === "updatedAt" && (sortAsc ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover text-xs">
                  <td className="font-semibold text-gray-800">#{order.orderId}</td>
                  <td>{order.customerName}</td>
                  <td>{order.customerPhone}</td>
                  <td className="max-w-[150px] truncate">{order.billingAddress}</td>
                  <td className="text-center">{order.orderItems?.length || 0}</td>
                  <td>{order.orderTotalPrice?.toLocaleString("en-BD") || "-"}</td>
                  <td>{statusBadge(order.paymentStatus)}</td>
                  <td>{statusBadge(order.status)}</td>
                  <td className="whitespace-nowrap">{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-4 text-xs text-gray-500 border-t text-right">
          Showing {filteredOrders.length} entr{filteredOrders.length === 1 ? "y" : "ies"}
        </div>
      </div>
    </div>
  );
}
