import React, { useEffect, useState, useMemo } from "react";
import {
  FaSync,
  FaFileCsv,
  FaFileExcel,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaColumns,
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaHome,
  FaStickyNote,
  FaCreditCard,
  FaMoneyBill,
  FaTruck,
  FaCalendarAlt,
  FaClipboardList, // Icons for order details modal
} from "react-icons/fa";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker"; // Import DatePicker for consistency
import "react-datepicker/dist/react-datepicker.css"; // Import DatePicker CSS for consistency

// Adjusted Import Paths for ColumnManager, InvoiceDownloadButton
import ColumnManager from "./ColumnManager";
import InvoiceDownloadButton from "./InvoiceDownloadButton";

// Import the centralized column definitions and status badge utility
import { ALL_COLUMNS, statusBadge } from "./columnDefinitions";

// Define a unique localStorage key for this page's column configuration
const LOCAL_STORAGE_COLUMNS_KEY = "orders_cancelled_page_columns";

export default function CancelledOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("updatedAt");
  const [sortAsc, setSortAsc] = useState(false); // Default to descending for 'updatedAt'
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // State for general order details modal

  // State to manage which columns are currently visible in the table
  // Initialized by attempting to load from localStorage, falling back to defaultVisible columns.
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const savedColumns = localStorage.getItem(LOCAL_STORAGE_COLUMNS_KEY);
      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns);
        // Ensure parsed columns are still valid and map to full column objects
        return parsedColumns
          .map((id) => ALL_COLUMNS.find((col) => col.id === id))
          .filter(Boolean);
      }
    } catch (e) {
      console.error("Failed to parse visible columns from localStorage", e);
      // Fallback to default if parsing fails
    }
    return ALL_COLUMNS.filter((col) => col.defaultVisible);
  });

  // Effect to save visibleColumns to localStorage whenever it changes
  useEffect(() => {
    // Only save the IDs of the visible columns to keep the stored data minimal
    localStorage.setItem(
      LOCAL_STORAGE_COLUMNS_KEY,
      JSON.stringify(visibleColumns.map((col) => col.id))
    );
  }, [visibleColumns]);

  const [staffList, setStaffList] = useState([]);
  const staffMap = useMemo(() => {
    const map = {};
    staffList.forEach((staff) => {
      map[staff.staffId] = staff.name;
    });
    return map;
  }, [staffList]);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("https://test.api.dpmsign.com/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStaffList(data?.data?.staff || []);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };

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
      const cancelled = (data.data.orders || [])
        .filter((o) => o.status === "order-canceled")
        .map((order) => ({
          ...order,
          staffName: staffMap[order.staffId] || "N/A", // Add staffName to order object
        }));
      setOrders(cancelled);
      applyFiltersAndSort(cancelled, searchTerm, sortField, sortAsc);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = (currentOrders, term, field, asc) => {
    let tempFiltered = currentOrders.filter(
      (o) =>
        o.customerName.toLowerCase().includes(term.toLowerCase()) ||
        o.customerPhone.includes(term) ||
        o.orderId.toString().includes(term)
    );

    const sorted = [...tempFiltered].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (field === "orderTotalPrice") {
        return asc ? aVal - bVal : bVal - aVal;
      }
      if (
        field === "createdAt" ||
        field === "updatedAt" ||
        field === "deliveryDate"
      ) {
        const dateA = new Date(aVal);
        const dateB = new Date(bVal);
        return asc ? dateA - dateB : dateB - dateA;
      }
      if (typeof aVal === "string") {
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
    setFilteredOrders(sorted);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (staffList.length > 0 || !loading) {
      fetchOrders();
    }
  }, [staffList]);

  useEffect(() => {
    applyFiltersAndSort(orders, searchTerm, sortField, sortAsc);
  }, [orders, searchTerm, sortField, sortAsc]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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
    document.body.removeChild(link);
  };

  const handleSort = (fieldId) => {
    const field =
      ALL_COLUMNS.find((col) => col.id === fieldId)?.dataKey || fieldId;
    const asc = field === sortField ? !sortAsc : true;
    setSortField(field);
    setSortAsc(asc);
  };

  // Function to close the general order details modal
  const closeOrderDetailsModal = () => setSelectedOrder(null);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen rounded-lg shadow-lg">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            ❌ Cancelled Orders
          </h1>
          <p className="text-sm text-gray-500">
            Orders marked as canceled. You can search, sort, or export them.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            placeholder="Search name, phone, ID..."
            value={searchTerm}
            onChange={handleSearch}
            className="input input-sm input-bordered w-52 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="btn btn-sm btn-info text-white shadow-md rounded-md hover:scale-105 transition-transform"
            onClick={fetchOrders}
            disabled={loading}
          >
            <FaSync className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            className="btn btn-sm btn-success text-white shadow-md rounded-md hover:scale-105 transition-transform"
            onClick={exportToExcel}
          >
            <FaFileExcel /> Excel
          </button>
          <button
            className="btn btn-sm btn-warning text-white shadow-md rounded-md hover:scale-105 transition-transform"
            onClick={exportToCSV}
          >
            <FaFileCsv /> CSV
          </button>
          <button
            className="btn btn-sm btn-neutral text-white shadow-md rounded-md hover:scale-105 transition-transform"
            onClick={() => setShowColumnManager(true)}
          >
            <FaColumns /> Manage Columns
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md max-h-[calc(100vh-200px)] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-600">
            Loading cancelled orders...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error text-sm font-medium">
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No cancelled orders found.
          </div>
        ) : (
          <table className="table table-xs table-pin-rows">
            <thead className="bg-base-200 text-gray-700 text-[11px] sticky top-0 z-10">
              <tr>
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    className={`cursor-pointer ${
                      col.isSortable ? "" : "pointer-events-none"
                    }`}
                    onClick={() => col.isSortable && handleSort(col.id)}
                  >
                    {col.label}
                    {col.isSortable &&
                      sortField === col.dataKey &&
                      (sortAsc ? (
                        <FaSortAlphaDown className="inline ml-1" />
                      ) : (
                        <FaSortAlphaUp className="inline ml-1" />
                      ))}
                  </th>
                ))}
                {/* Removed the static 'Actions' column header */}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover text-xs">
                  {visibleColumns.map((col) => (
                    <td
                      key={`${order.orderId}-${col.id}`}
                      className={
                        col.dataKey === "billingAddress"
                          ? "max-w-[150px] truncate"
                          : ""
                      }
                    >
                      {/* Render custom date picker for deliveryDate column (read-only for cancelled) */}
                      {col.id === "deliveryDate" ? (
                        <div className="relative flex items-center">
                          <DatePicker
                            selected={
                              order.deliveryDate
                                ? new Date(order.deliveryDate)
                                : null
                            }
                            dateFormat="yyyy/MM/dd"
                            className="input input-xs input-bordered w-full pr-6"
                            wrapperClassName="w-full"
                            disabled // Make it read-only
                          />
                          <FaCalendarAlt className="absolute right-2 text-gray-400 pointer-events-none" />
                        </div>
                      ) : col.id === "orderDetails" ? ( // Render "View" button for order details
                        col.render(order, setSelectedOrder)
                      ) : col.id === "invoiceDownload" ? ( // Render InvoiceDownloadButton
                        col.render(order)
                      ) : col.render ? (
                        col.render(order)
                      ) : (
                        order[col.dataKey]
                      )}
                    </td>
                  ))}
                  {/* The actions column content is now handled by the dynamic columns */}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-4 text-xs text-gray-500 border-t text-right">
          Showing {filteredOrders.length} entr
          {filteredOrders.length === 1 ? "y" : "ies"}
        </div>
      </div>

      {showColumnManager && (
        <ColumnManager
          allColumns={ALL_COLUMNS}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          onClose={() => setShowColumnManager(false)}
        />
      )}

      {/* General Order Details Modal */}
      {selectedOrder && (
        <dialog className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl bg-white p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaClipboardList /> Order #{selectedOrder.orderId} Details
              </h3>
              <button
                onClick={closeOrderDetailsModal}
                className="btn btn-sm btn-circle btn-error text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="space-y-1">
                <p className="flex items-center gap-2">
                  <FaUser /> <strong>Customer:</strong>{" "}
                  {selectedOrder.customerName}
                </p>
                <p className="flex items-center gap-2">
                  <FaEnvelope /> <strong>Email:</strong>{" "}
                  {selectedOrder.customerEmail || "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <FaPhone /> <strong>Phone:</strong>{" "}
                  {selectedOrder.customerPhone}
                </p>
                <p className="flex items-center gap-2">
                  <FaHome /> <strong>Billing:</strong>{" "}
                  {selectedOrder.billingAddress || "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <FaStickyNote /> <strong>Notes:</strong>{" "}
                  {selectedOrder.additionalNotes || "N/A"}
                </p>
                <p className="flex items-center gap-2 ">
                  <FaUser /> <strong>Staff Name:</strong>{" "}
                  {selectedOrder.staffName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="flex items-center gap-2">
                  <FaCreditCard /> <strong>Payment:</strong>{" "}
                  {selectedOrder.paymentMethod?.replace("-payment", "") ||
                    "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <FaMoneyBill /> <strong>Total:</strong> ৳
                  {selectedOrder.orderTotalPrice?.toLocaleString("en-BD") ||
                    "-"}
                </p>
                <p className="flex items-center gap-2">
                  <FaTruck /> <strong>Delivery:</strong>{" "}
                  {selectedOrder.deliveryMethod || "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <FaCalendarAlt /> <strong>Delivery Date:</strong>{" "}
                  {selectedOrder.deliveryDate
                    ? new Date(selectedOrder.deliveryDate).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <FaClipboardList /> <strong>Status:</strong>{" "}
                  {statusBadge(selectedOrder.status)}
                </p>
                {/* Display payment details if available */}
                {selectedOrder.payments &&
                  selectedOrder.payments.length > 0 && (
                    <div className="mt-2 text-xs">
                      <h5 className="font-semibold text-gray-600">
                        Payment History:
                      </h5>
                      <ul className="list-disc ml-4">
                        {selectedOrder.payments.map((payment, idx) => (
                          <li key={idx}>
                            ৳{payment.amount?.toLocaleString("en-BD")} via{" "}
                            {payment.paymentMethod?.replace("-payment", "")} (
                            {payment.isPaid ? "Paid" : "Unpaid"}) on{" "}
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaClipboardList /> Order Items
              </h4>
              <ul className="list-disc ml-5 text-sm space-y-1">
                {selectedOrder.orderItems?.length > 0 ? (
                  selectedOrder.orderItems.map((item, idx) => {
                    const basePrice = Number(item.basePriceBeforeDiscount || 0);
                    const discountAmount = Number(item.itemDiscountAmount || 0);
                    const finalItemTotal = Number(item.price || 0);

                    const actualDiscountPercentage =
                      basePrice > 0 ? (discountAmount / basePrice) * 100 : 0;

                    return (
                      <li key={idx}>
                        <strong>{item.product?.name || "N/A"}</strong> — Qty:{" "}
                        {item.quantity || 0}
                        {item.widthInch && item.heightInch
                          ? `${item.widthInch}x${item.heightInch} inch`
                          : "N/A"}
                        <div className="text-xs text-gray-500">
                          SKU: {item.product?.sku || "N/A"} | Price: ৳
                          {item.price?.toLocaleString("en-BD") || "0.00"}
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li>No items found for this order.</li>
                )}
              </ul>
            </div>

            <div className="modal-action mt-6">
              <button
                className="btn btn-sm btn-neutral rounded-md"
                onClick={closeOrderDetailsModal}
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
