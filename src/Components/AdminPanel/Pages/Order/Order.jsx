// Order/Order.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  FaFileExcel,
  FaFileCsv,
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
  FaClipboardList,
  FaColumns,
  FaSortAlphaDown,
  FaSortAlphaUp,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ADJUSTED IMPORTS
import ColumnManager from "./ColumnManager";
import InvoiceDownloadButton from "./InvoiceDownloadButton";
import { ALL_COLUMNS, statusBadge } from "./columnDefinitions"; // ADJUSTED PATH

// Utility function to get authentication token from local storage
const getToken = () => localStorage.getItem("authToken");

// REMOVE the duplicated statusBadge function and ALL_COLUMNS array from here.

// Define a unique localStorage key for this page's column configuration
const LOCAL_STORAGE_COLUMNS_KEY = "orders_all_page_columns";

// Main component for "All Orders" page
export default function Order() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [showColumnManager, setShowColumnManager] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const savedColumns = localStorage.getItem(LOCAL_STORAGE_COLUMNS_KEY);
      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns);
        return parsedColumns
          .map((id) => ALL_COLUMNS.find((col) => col.id === id))
          .filter(Boolean);
      }
    } catch (e) {
      console.error("Failed to parse visible columns from localStorage", e);
    }
    return ALL_COLUMNS.filter((col) => col.defaultVisible);
  });

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_COLUMNS_KEY,
      JSON.stringify(visibleColumns.map((col) => col.id))
    );
  }, [visibleColumns]);

  const staffMap = useMemo(() => {
    const map = {};
    staffList.forEach((staff) => {
      map[staff.staffId] = staff.name;
    });
    return map;
  }, [staffList]);

  const fetchStaff = async () => {
    try {
      const token = getToken();
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
      const token = getToken();
      let url = "https://test.api.dpmsign.com/api/order";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();

      const allOrders = (data.data.orders || []).map((order) => ({
        ...order,
        staffName: staffMap[order.staffId] || "N/A",
      }));

      setOrders(allOrders);
      applyFiltersAndSort(allOrders, searchTerm, sortField, sortAsc);
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
        o.orderId.toString().includes(term) ||
        o.customerEmail?.toLowerCase().includes(term.toLowerCase())
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
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AllOrders");
    XLSX.writeFile(workbook, "all_orders.xlsx");
  };

  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "all_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (fieldId) => {
    const field =
      ALL_COLUMNS.find((col) => col.id === fieldId)?.dataKey || fieldId;
    const asc = field === sortField ? !sortAsc : true;
    setSortField(field);
    setSortAsc(asc);
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfLastOrder - ordersPerPage,
    indexOfLastOrder
  );

  const closeOrderDetailsModal = () => setSelectedOrder(null);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📦 All Orders</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage and view all orders, regardless of status.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, phone, email, or order ID"
          className="input input-bordered input-sm w-full md:w-80 rounded-md focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={handleSearch}
        />
        <div className="flex gap-2 flex-wrap items-center">
          <select
            className="select select-sm select-bordered rounded-md"
            value={sortField}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="createdAt">Sort by: Created</option>
            <option value="deliveryDate">Sort by: Delivery Date</option>
            <option value="orderTotalPrice">Sort by: Total Price</option>
            <option value="customerName">Sort by: Name</option>
            <option value="updatedAt">Sort by: Last Updated</option>
          </select>
          <select
            className="select select-sm select-bordered rounded-md"
            value={sortAsc}
            onChange={(e) => setSortAsc(e.target.value === "true")}
          >
            <option value={false}>Descending</option>
            <option value={true}>Ascending</option>
          </select>

          <button
            onClick={exportToExcel}
            className="btn btn-success btn-sm text-white shadow-md rounded-md hover:scale-105 transition-transform"
          >
            <FaFileExcel className="mr-2" /> Excel
          </button>
          <button
            onClick={exportToCSV}
            className="btn btn-info btn-sm text-white shadow-md rounded-md hover:scale-105 transition-transform"
          >
            <FaFileCsv className="mr-2" /> CSV
          </button>

          <button
            className="btn btn-sm btn-neutral text-white shadow-md rounded-md hover:scale-105 transition-transform"
            onClick={() => setShowColumnManager(true)}
          >
            <FaColumns /> Manage Columns
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading orders...</div>
        ) : error ? (
          <div className="p-6 text-center text-error text-sm font-medium">
            Error: {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No orders found.</div>
        ) : (
          <table className="table table-xs table-pin-rows">
            <thead className="bg-gray-100 text-gray-600 text-[11px] sticky top-0 z-10">
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order, i) => (
                <tr key={order.orderId || i} className="hover">
                  {visibleColumns.map((col) => (
                    <td
                      key={`${order.orderId}-${col.id}`}
                      className={
                        col.dataKey === "billingAddress"
                          ? "max-w-[150px] truncate"
                          : ""
                      }
                    >
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
                            disabled
                          />
                          <FaCalendarAlt className="absolute right-2 text-gray-400 pointer-events-none" />
                        </div>
                      ) : col.id === "orderDetails" ? (
                        col.render(order, setSelectedOrder)
                      ) : col.id === "invoiceDownload" ? (
                        col.render(order)
                      ) : col.render ? (
                        col.render(order)
                      ) : (
                        order[col.dataKey]
                      )}
                    </td>
                  ))}
                  <td>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-outline btn-xs bg-blue-700 text-white rounded-md"
                    >
                      View
                    </button>
                    <InvoiceDownloadButton
                      order={order}
                      staffName={order.staffName}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-center mt-4 space-x-2">
        {Array.from(
          { length: Math.ceil(filteredOrders.length / ordersPerPage) },
          (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`btn btn-sm rounded-md ${
                currentPage === i + 1 ? "btn-primary" : "btn-outline"
              }`}
            >
              {i + 1}
            </button>
          )
        )}
      </div>
      <div className="p-4 text-xs text-gray-500 border-t text-right">
        Showing {filteredOrders.length} entr
        {filteredOrders.length === 1 ? "y" : "ies"}
      </div>

      {showColumnManager && (
        <ColumnManager
          allColumns={ALL_COLUMNS}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          onClose={() => setShowColumnManager(false)}
        />
      )}

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
                          ? ` x Size: ${item.widthInch}x${item.heightInch} inch`
                          : "N/A"}
                        <div className="text-xs text-gray-500 mt-1">
                          SKU: {item.product?.sku || "N/A"}
                        </div>
                        <div className="text-xs text-gray-600">
                          Price Before Discount: ৳
                          {basePrice.toLocaleString("en-BD")}
                          {discountAmount > 0 && (
                            <span className="text-green-700 ml-2">
                              (Discount: ৳
                              {discountAmount.toLocaleString("en-BD")} /{" "}
                              {actualDiscountPercentage.toFixed(2)}%)
                            </span>
                          )}
                          <br />
                          <span className="font-bold">
                            Final Item Price: ৳
                            {finalItemTotal.toLocaleString("en-BD")}
                          </span>
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
