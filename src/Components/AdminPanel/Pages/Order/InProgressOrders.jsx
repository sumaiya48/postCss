import React, { useEffect, useState, useMemo } from "react";
import {
  FaSync,
  FaFileCsv,
  FaFileExcel,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaColumns,
  FaCalendarAlt, // Import calendar icon
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaHome,
  FaStickyNote,
  FaCreditCard,
  FaMoneyBill,
  FaTruck,
  FaClipboardList, // Icons for order details modal
} from "react-icons/fa";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker"; // Import DatePicker
import "react-datepicker/dist/react-datepicker.css"; // Import DatePicker CSS
import Swal from "sweetalert2"; // Ensure SweetAlert2 is imported for enhanced prompts

// Adjusted Import Paths for ColumnManager, InvoiceDownloadButton, PaymentModal
import ColumnManager from "./ColumnManager";
import InvoiceDownloadButton from "./InvoiceDownloadButton";
import PaymentModal from "./PaymentModal"; // Ensure PaymentModal is imported

// Import the centralized column definitions and status badge utility
import { ALL_COLUMNS, statusBadge } from "./columnDefinitions";

const IN_PROGRESS_STATUSES = [
  "advance-payment-received",
  "design-in-progress",
  "awaiting-design-approval",
  "production-started",
  "production-in-progress",
  "ready-for-delivery",
  "out-for-delivery",
];

// Define a unique localStorage key for this page's column configuration
const LOCAL_STORAGE_COLUMNS_KEY = "orders_in_progress_page_columns";

export default function InProgressOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("updatedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // State for general order details modal

  // NEW STATE: For managing payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  // NEW STATE: To manually update status after payment (if not fully paid)
  const [manualStatusUpdateOrder, setManualStatusUpdateOrder] = useState(null);

  // State to manage which columns are currently visible in the table
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
      const url = "https://test.api.dpmsign.com/api/order";
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();

      const inProgress = (data.data.orders || [])
        .filter((o) => IN_PROGRESS_STATUSES.includes(o.status))
        .map((order) => ({
          ...order,
          staffName: order.staff?.name || "N/A", // Correctly access staff name from nested object
        }));

      setOrders(inProgress);
      applyFiltersAndSort(inProgress, searchTerm, sortField, sortAsc);
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "InProgressOrders");
    XLSX.writeFile(workbook, "in_progress_orders.xlsx");
  };

  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "in_progress_orders.csv");
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

  // Handler for delivery date change
  const handleDeliveryDateChange = async (orderId, date) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `https://test.api.dpmsign.com/api/order/update-order`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: orderId,
            deliveryDate: date.toISOString(),
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update delivery date");
      }

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.orderId === orderId ? { ...o, deliveryDate: date.toISOString() } : o
        )
      );
      console.log("Delivery date updated successfully!");
    } catch (err) {
      console.error("Error updating delivery date:", err.message);
    }
  };

  // MODIFIED: handleStatusChange to intercept "add-payment" and "order-completed" logic
  const handleStatusChange = async (orderId, newStatus) => {
    const orderToUpdate = orders.find((o) => o.orderId === orderId);

    if (!orderToUpdate) return;

    const totalPaid =
      orderToUpdate.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remainingDue = orderToUpdate.orderTotalPrice - totalPaid;

    // --- NEW LOGIC FOR "ADD PAYMENT" ---
    if (newStatus === "add-payment") {
      // 'add-payment' is a special client-side status
      setSelectedOrderForPayment(orderToUpdate);
      setShowPaymentModal(true);
      return; // Don't proceed with API call for this client-side action
    }
    // --- END NEW LOGIC ---

    // Logic for 'order-completed' (only show payment modal IF there's a due amount and user wants to pay now)
    // If attempting to mark as 'order-completed' AND there's a remaining balance
    if (newStatus === "order-completed" && remainingDue > 0) {
      // Prompt user about outstanding payment before forcing completion.
      const confirmForceComplete = await Swal.fire({
        title: "Balance Due!",
        html: `Order #${
          orderToUpdate.orderId
        } still has ৳${remainingDue.toLocaleString(
          "en-BD"
        )} outstanding.<br/>Do you want to mark it as completed despite the balance?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Complete Anyway",
        cancelButtonText: "No, Keep as In Progress",
      });

      if (!confirmForceComplete.isConfirmed) {
        return; // User cancelled, order status remains unchanged.
      }
      // If confirmed, proceed to update order status via API to 'order-completed'
    }
    // If attempting to mark as 'order-completed' AND there's NO remaining balance (already paid)
    else if (newStatus === "order-completed" && remainingDue <= 0) {
      const confirmCompletion = await Swal.fire({
        title: "Confirm Completion?",
        text: `Order #${orderToUpdate.orderId} is fully paid. Do you want to mark it as completed?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Complete It",
        cancelButtonText: "No, Keep as is",
      });

      if (!confirmCompletion.isConfirmed) {
        return; // User cancelled, do nothing
      }
      // If confirmed, proceed to update order status via API to 'order-completed'
    }
    // For any other status change (or if order-completed was confirmed with no due / force-completed with due)
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `https://test.api.dpmsign.com/api/order/update-order`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: orderId,
            status: newStatus,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      const statusRemovesFromPage =
        newStatus === "order-completed" || newStatus === "order-canceled";

      if (statusRemovesFromPage) {
        setOrders((prevOrders) =>
          prevOrders.filter((o) => o.orderId !== orderId)
        );
      } else {
        fetchOrders(); // Re-fetch to update status in current view
      }

      Swal.fire(
        "Success",
        `Order status updated to "${newStatus.replace(/-/g, " ")}"!`,
        "success"
      );
    } catch (err) {
      console.error("Error updating order status:", err.message);
      Swal.fire(
        "Error",
        "Failed to update order status: " + err.message,
        "error"
      );
    }
  };

  // NEW: Callback after payment is successfully recorded in PaymentModal
  const handlePaymentSuccessAndStatusUpdate = async (orderIdFromModal) => {
    setShowPaymentModal(false); // Close payment modal
    setSelectedOrderForPayment(null); // Clear selected order for payment

    try {
      const token = localStorage.getItem("authToken");
      // Fetch the specific order by ID using the corrected query format
      const orderRes = await fetch(
        `https://test.api.dpmsign.com/api/order?searchTerm=${orderIdFromModal}&searchBy=order-id`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!orderRes.ok) {
        const errorText = await orderRes.text();
        console.error(
          "Failed to fetch updated order after payment:",
          errorText
        );
        throw new Error("Failed to fetch updated order details after payment.");
      }

      const updatedOrderData = await orderRes.json();
      // Ensure that 'orders' array exists and has at least one element
      const fetchedOrder =
        updatedOrderData.orders && updatedOrderData.orders.length > 0
          ? updatedOrderData.orders[0]
          : null;

      if (!fetchedOrder) {
        throw new Error(
          "Updated order details not found, or API returned empty result."
        );
      }

      // Populate staffName for the fetchedOrder for consistency if needed for display later
      fetchedOrder.staffName = fetchedOrder.staff?.name || "N/A";

      const totalPaidAmount = (fetchedOrder.payments || []).reduce(
        (acc, curr) => {
          return curr.isPaid ? acc + curr.amount : acc;
        },
        0
      );
      const isFullyPaid = totalPaidAmount >= fetchedOrder.orderTotalPrice;

      // After payment, simply refresh the order list.
      // The `paymentStatus` will be updated by the backend.
      // The admin/staff will then manually change the main order status to "order-completed" later.
      fetchOrders(); // Refresh to show updated due amount and payment status badge

      if (isFullyPaid) {
        Swal.fire(
          "Success",
          `Order #${fetchedOrder.orderId} is now fully paid!`,
          "success"
        );
      } else {
        Swal.fire(
          "Success",
          `Payment recorded for Order #${
            fetchedOrder.orderId
          }. Balance remaining: ৳${(
            fetchedOrder.orderTotalPrice - totalPaidAmount
          ).toLocaleString("en-BD")}.`,
          "info"
        );
      }
    } catch (err) {
      console.error("Error handling payment success callback:", err.message);
      Swal.fire(
        "Error",
        "Error processing payment completion: " + err.message,
        "error"
      );
      fetchOrders(); // Always refresh to ensure state consistency
    }
  };

  // No longer a separate modal for manual status selection after partial payment.
  // The user will manually change the status from the dropdown after checking the due.
  const handleManualStatusSelection = async (newStatus) => {
    if (!manualStatusUpdateOrder) return;

    await handleStatusChange(manualStatusUpdateOrder.orderId, newStatus);
    setManualStatusUpdateOrder(null); // Clear manual update state
  };

  const closeOrderDetailsModal = () => setSelectedOrder(null);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen rounded-lg shadow-lg">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            ⏳ In Progress Orders
          </h1>
          <p className="text-sm text-gray-500">
            Orders that are currently being processed or awaiting action.
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
            Loading in progress orders...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error text-sm font-medium">
            Error: {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No in progress orders found.
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
                <th>Actions</th>
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
                      {/* Render custom date picker for deliveryDate column */}
                      {col.id === "deliveryDate" ? (
                        <div className="relative flex items-center">
                          <DatePicker
                            selected={
                              order.deliveryDate
                                ? new Date(order.deliveryDate)
                                : null
                            }
                            onChange={(date) =>
                              handleDeliveryDateChange(order.orderId, date)
                            }
                            dateFormat="yyyy/MM/dd"
                            className="input input-xs input-bordered w-full pr-6"
                            wrapperClassName="w-full"
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
                  <td className="relative">
                    <details className="dropdown dropdown-end">
                      <summary className="btn btn-xs btn-outline capitalize">
                        {order.status.replace(/-/g, " ")}
                      </summary>
                      <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 text-xs">
                        {/* Always include "Add Payment" option first for clarity */}
                        <li>
                          <button
                            onClick={() =>
                              handleStatusChange(order.orderId, "add-payment")
                            }
                            className="text-info font-bold" // Highlight "Add Payment"
                          >
                            Add Payment
                          </button>
                        </li>
                        <div className="divider my-0"></div> {/* Separator */}
                        {/* Other status options */}
                        {[
                          "advance-payment-received",
                          "design-in-progress",
                          "awaiting-design-approval",
                          "production-started",
                          "production-in-progress",
                          "ready-for-delivery",
                          "out-for-delivery",
                          // Add other statuses as needed
                        ].map((statusOption) => (
                          <li key={statusOption}>
                            <button
                              onClick={() =>
                                handleStatusChange(order.orderId, statusOption)
                              }
                              className={`capitalize ${
                                statusOption === order.status
                                  ? "text-primary font-bold"
                                  : ""
                              }`}
                            >
                              {statusOption.replace(/-/g, " ")}
                            </button>
                          </li>
                        ))}
                        <div className="divider my-0"></div> {/* Separator */}
                        {/* Move completion/cancellation to the bottom after divider */}
                        <li>
                          <button
                            onClick={() =>
                              handleStatusChange(
                                order.orderId,
                                "order-completed"
                              )
                            }
                            className={
                              order.status === "order-completed"
                                ? "text-primary font-bold"
                                : ""
                            }
                          >
                            Mark Completed
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() =>
                              handleStatusChange(
                                order.orderId,
                                "order-canceled"
                              )
                            }
                            className={
                              order.status === "order-canceled"
                                ? "text-error font-bold"
                                : ""
                            }
                          >
                            Mark Canceled
                          </button>
                        </li>
                      </ul>
                    </details>
                  </td>
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

      {/* Payment Modal Component for 'add-payment' trigger */}
      {showPaymentModal && selectedOrderForPayment && (
        <PaymentModal
          order={selectedOrderForPayment}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={() =>
            handlePaymentSuccessAndStatusUpdate(selectedOrderForPayment.orderId)
          }
        />
      )}

      {/* Manual Status Update Modal (if payment recorded but still due, and user chose to manually update) */}
      {manualStatusUpdateOrder && (
        <dialog className="modal modal-open">
          <div className="modal-box w-96 bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-bold mb-4">
              Update Order #{manualStatusUpdateOrder.orderId} Status
            </h3>
            <p className="mb-4 text-sm">
              The payment for this order was recorded, but there is still a
              balance due. Please select the new order status:
            </p>
            <div className="form-control">
              <select
                className="select select-bordered w-full"
                onChange={(e) => handleManualStatusSelection(e.target.value)}
              >
                <option value="">Select Status</option>
                {/* Dynamically generated options */}
                {IN_PROGRESS_STATUSES.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusOption.replace(/-/g, " ")}
                  </option>
                ))}
                {/* Static options after the dynamic ones */}
                <option value="order-completed">
                  order completed (Force Complete)
                </option>
                <option value="order-canceled">order canceled</option>
              </select>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setManualStatusUpdateOrder(null);
                  fetchOrders(); // Refresh table if user cancels
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </dialog>
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
