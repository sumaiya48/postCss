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
import ColumnManager from "./ColumnManager";
import DatePicker from "react-datepicker"; // Import DatePicker
import "react-datepicker/dist/react-datepicker.css"; // Import DatePicker CSS
import PaymentModal from "./PaymentModal"; // Import PaymentModal
import InvoiceDownloadButton from "./InvoiceDownloadButton"; // Import InvoiceDownloadButton for the details modal

// Utility function to render status badges
const statusBadge = (status) => {
  const badgeClass =
    "badge px-2 py-0.5 text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]";
  switch (status) {
    case "pending":
      return (
        <span className={`${badgeClass} badge-error badge-outline`}>
          Pending
        </span>
      );
    case "partial": // Added partial payment status
      return (
        <span className={`${badgeClass} badge-info badge-outline`}>
          Partial
        </span>
      );
    case "paid":
      return <span className={`${badgeClass} badge-success`}>Paid</span>;
    case "order-request-received":
      return <span className={`${badgeClass} badge-secondary`}>Request</span>;
    case "consultation-in-progress":
      return <span className={`${badgeClass} badge-primary`}>Consulting</span>;
    case "awaiting-advance-payment":
      return (
        <span className={`${badgeClass} badge-warning`}>Awaiting Advance</span>
      );
    case "advance-payment-received":
      return (
        <span className={`${badgeClass} badge-info`}>Advance Received</span>
      );
    case "design-in-progress":
      return (
        <span className={`${badgeClass} badge-accent`}>Design In Progress</span>
      );
    case "awaiting-design-approval":
      return (
        <span className={`${badgeClass} badge-warning`}>
          Awaiting Design Approval
        </span>
      );
    case "production-started":
      return (
        <span className={`${badgeClass} badge-info`}>Production Started</span>
      );
    case "production-in-progress":
      return (
        <span className={`${badgeClass} badge-info`}>
          Production In Progress
        </span>
      );
    case "ready-for-delivery":
      return (
        <span className={`${badgeClass} badge-success`}>
          Ready For Delivery
        </span>
      );
    case "out-for-delivery":
      return (
        <span className={`${badgeClass} badge-primary`}>Out For Delivery</span>
      );
    case "order-completed":
      return <span className={`${badgeClass} badge-success`}>Completed</span>;
    case "order-canceled":
      return <span className={`${badgeClass} badge-error`}>Canceled</span>;
    default:
      return <span className={`${badgeClass} badge-ghost`}>{status}</span>;
  }
};

// Define all possible columns with their properties (consistent across all order pages)
const ALL_COLUMNS = [
  {
    id: "orderId",
    label: "Order ID",
    dataKey: "orderId",
    isSortable: true,
    defaultVisible: true,
  },
  {
    id: "customerName",
    label: "Customer",
    dataKey: "customerName",
    isSortable: true,
    defaultVisible: true,
  },
  {
    id: "customerPhone",
    label: "Phone",
    dataKey: "customerPhone",
    isSortable: false,
    defaultVisible: true,
  },
  {
    id: "billingAddress",
    label: "Address",
    dataKey: "billingAddress",
    isSortable: false,
    defaultVisible: true,
  },
  {
    id: "orderItemsCount",
    label: "Items",
    dataKey: "orderItemsCount",
    isSortable: false,
    defaultVisible: false,
    render: (order) => order.orderItems?.length || 0,
  },
  {
    id: "orderTotalPrice",
    label: "Total (৳)",
    dataKey: "orderTotalPrice",
    isSortable: true,
    defaultVisible: true,
    render: (order) => order.orderTotalPrice?.toLocaleString("en-BD") || "-",
  },
  // Added "Due" column
  {
    id: "amountDue",
    label: "Due (৳)",
    dataKey: "amountDue",
    isSortable: true,
    defaultVisible: true,
    render: (order) =>
      (
        order.orderTotalPrice -
        (order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0)
      )?.toLocaleString("en-BD") || "-",
  },
  {
    id: "paymentMethod",
    label: "Payment Method",
    dataKey: "paymentMethod",
    isSortable: false,
    defaultVisible: false,
    render: (order) => order.paymentMethod?.replace("-payment", "") || "-",
  },
  {
    id: "paymentStatus",
    label: "Payment Status",
    dataKey: "paymentStatus",
    isSortable: true,
    defaultVisible: true,
    render: (order) => statusBadge(order.paymentStatus),
  },
  {
    id: "status",
    label: "Order Status",
    dataKey: "status",
    isSortable: true,
    defaultVisible: true,
    render: (order) => statusBadge(order.status),
  },
  {
    id: "deliveryMethod",
    label: "Delivery Method",
    dataKey: "deliveryMethod",
    isSortable: false,
    defaultVisible: false,
  },
  // Added deliveryDate to ALL_COLUMNS and made it dynamically editable
  {
    id: "deliveryDate",
    label: "Delivery Date",
    dataKey: "deliveryDate",
    isSortable: true,
    defaultVisible: true,
    render: (order) =>
      order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString()
        : "N/A",
  },
  {
    id: "createdAt",
    label: "Created",
    dataKey: "createdAt",
    isSortable: true,
    defaultVisible: false,
    render: (order) =>
      order.createdAt ? new Date(order.createdAt).toLocaleString() : "-",
  },
  {
    id: "updatedAt",
    label: "Last Updated",
    dataKey: "updatedAt",
    isSortable: true,
    defaultVisible: false,
    render: (order) =>
      order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "-",
  },
  {
    id: "customerEmail",
    label: "Email",
    dataKey: "customerEmail",
    isSortable: true,
    defaultVisible: false,
  },
  {
    id: "additionalNotes",
    label: "Notes",
    dataKey: "additionalNotes",
    isSortable: false,
    defaultVisible: false,
    render: (order) => order.additionalNotes || "N/A",
  },
  {
    id: "staffName",
    label: "Agent",
    dataKey: "staffName",
    isSortable: true,
    defaultVisible: false,
  }, // Assuming staffName is added to order objects
  {
    id: "orderDetails",
    label: "Details",
    dataKey: "orderDetails",
    isSortable: false,
    defaultVisible: true,
    render: (order, setSelectedOrder) => (
      <button
        onClick={() => setSelectedOrder(order)}
        className="btn btn-outline btn-xs bg-blue-700 text-white"
      >
        View
      </button>
    ),
  },
  {
    id: "invoiceDownload",
    label: "Invoice",
    dataKey: "invoiceDownload",
    isSortable: false,
    defaultVisible: true,
    render: (order) => (
      <InvoiceDownloadButton order={order} staffName={order.staffName} />
    ),
  },
];

// Define a unique localStorage key for this page's column configuration
const LOCAL_STORAGE_COLUMNS_KEY = "orders_new_request_page_columns";

export default function NewRequest() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortAsc, setSortAsc] = useState(false); // Default to descending for 'createdAt'
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // State for payment modal visibility
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null); // Stores order for payment modal
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

  // Memoize the staff list to avoid re-fetching unnecessarily
  const [staffList, setStaffList] = useState([]);
  const staffMap = useMemo(() => {
    const map = {};
    staffList.forEach((staff) => {
      map[staff.staffId] = staff.name;
    });
    return map;
  }, [staffList]);

  // Fetch staff list first
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
      const url = "https://test.api.dpmsign.com/api/order"; // Fetch all to filter locally more precisely
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();

      // Filter for new request orders based on specific statuses and payment status
      const newRequestOrders = (data.data.orders || [])
        .filter(
          (o) =>
            o.paymentStatus === "pending" &&
            (o.status === "order-request-received" ||
              o.status === "consultation-in-progress" ||
              o.status === "awaiting-advance-payment")
        )
        .map((order) => ({
          ...order,
          staffName: staffMap[order.staffId] || "N/A", // Add staffName to order object
        }));

      setOrders(newRequestOrders);
      // Apply initial search and sort after fetching
      applyFiltersAndSort(newRequestOrders, searchTerm, sortField, sortAsc);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to apply search and sort
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
    // Re-fetch orders only if staffList is loaded
    if (staffList.length > 0 || !loading) {
      // Added !loading to prevent infinite loop on initial load
      fetchOrders();
    }
  }, [staffList]); // Depend on staffList to ensure it's loaded before fetching orders

  useEffect(() => {
    // Apply filters and sort whenever orders, searchTerm, sortField, or sortAsc changes
    applyFiltersAndSort(orders, searchTerm, sortField, sortAsc);
  }, [orders, searchTerm, sortField, sortAsc]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "NewRequestOrders");
    XLSX.writeFile(workbook, "new_request_orders.xlsx");
  };

  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "new_request_orders.csv");
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
            deliveryDate: date.toISOString(), // Send date in ISO format
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update delivery date");
      }

      // Update the order in the local state immediately
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.orderId === orderId ? { ...o, deliveryDate: date.toISOString() } : o
        )
      );
      // No need to re-fetch all orders unless other changes are expected
      console.log("Delivery date updated successfully!");
    } catch (err) {
      console.error("Error updating delivery date:", err.message);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    // If the status is "advance-payment-received", open the payment modal
    if (newStatus === "advance-payment-received") {
      const orderToPay = orders.find((o) => o.orderId === orderId);
      if (orderToPay) {
        setSelectedOrderForPayment(orderToPay);
        setShowPaymentModal(true);
      }
      return; // Prevent default status update
    }

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

      // If the order is canceled or completed, remove it from this view
      // Or if its status means it should move to 'In Progress' page
      const statusRemovesFromPage =
        newStatus === "order-canceled" || newStatus === "order-completed";

      if (statusRemovesFromPage) {
        setOrders((prevOrders) =>
          prevOrders.filter((o) => o.orderId !== orderId)
        );
      } else {
        // Otherwise, re-fetch to update the status in the current view
        fetchOrders(); // Re-fetch to ensure the order is re-filtered correctly if its status changes
      }

      // In a real app, use a custom modal/toast instead of alert
      console.log("Order status updated successfully!");
    } catch (err) {
      console.error("Error updating order status:", err.message);
      // In a real app, use a custom modal/toast instead of alert
    }
  };

  // Callback function after successful payment from the modal
  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedOrderForPayment(null);
    fetchOrders(); // Re-fetch all orders to ensure the list is updated correctly (order moves to in-progress)
  };

  // Function to close the general order details modal
  const closeOrderDetailsModal = () => setSelectedOrder(null);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen rounded-lg shadow-lg">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            🆕 New Request Orders
          </h1>
          <p className="text-sm text-gray-500">
            Review new order requests, search, sort, or export them.
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
            Loading new request orders...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error text-sm font-medium">
            Error: {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No new request orders found.
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
                        {[
                          "order-request-received",
                          "consultation-in-progress",
                          "awaiting-advance-payment",
                          "advance-payment-received", // This will trigger the payment modal now
                          "design-in-progress",
                          "awaiting-design-approval",
                          "production-started",
                          "production-in-progress",
                          "ready-for-delivery",
                          "out-for-delivery",
                          "order-completed",
                          "order-canceled",
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

      {/* Payment Modal Component */}
      {showPaymentModal && selectedOrderForPayment && (
        <PaymentModal
          order={selectedOrderForPayment}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
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
                  selectedOrder.orderItems.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.product?.name || "N/A"}</strong> — Qty:{" "}
                      {item.quantity || 0}, Size:{" "}
                      {item.widthInch && item.heightInch
                        ? `${item.widthInch}x${item.heightInch} inch`
                        : "N/A"}
                      <div className="text-xs text-gray-500">
                        SKU: {item.product?.sku || "N/A"} | Price: ৳
                        {item.price?.toLocaleString("en-BD") || "0.00"}
                      </div>
                    </li>
                  ))
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
