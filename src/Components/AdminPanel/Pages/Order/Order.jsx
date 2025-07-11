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
  FaColumns, // Icon for column management
  FaSortAlphaDown, // Icon for ascending sort
  FaSortAlphaUp, // Icon for descending sort
} from "react-icons/fa";
import * as XLSX from "xlsx"; // Library for Excel operations
import { saveAs } from "file-saver"; // Library for saving files
import InvoiceDownloadButton from "./InvoiceDownloadButton"; // Component to download invoice PDF
import ColumnManager from "./ColumnManager"; // Component to manage visible table columns
import DatePicker from "react-datepicker"; // Import DatePicker for consistency (even if read-only)
import "react-datepicker/dist/react-datepicker.css"; // Import DatePicker CSS for consistency

// Utility function to get authentication token from local storage
const getToken = () => localStorage.getItem("authToken");

// Utility function to render status badges with dynamic styling
const statusBadge = (status) => {
  const base = "badge text-xs font-medium capitalize";
  switch (status) {
    case "pending":
      return (
        <span className={`${base} badge-error badge-outline`}>pending</span>
      );
    case "partial":
      return (
        <span className={`${base} badge-info badge-outline`}>partial</span>
      );
    case "paid":
      return <span className={`${base} badge-success`}>paid</span>;
    case "order-request-received":
      return (
        <span className={`${base} badge-secondary`}>
          order request received
        </span>
      );
    case "consultation-in-progress":
      return (
        <span className={`${base} badge-primary`}>
          consultation in progress
        </span>
      );
    case "order-canceled":
      return <span className={`${base} badge-error`}>order canceled</span>;
    case "awaiting-advance-payment":
      return (
        <span className={`${base} badge-warning`}>
          awaiting advance payment
        </span>
      );
    case "advance-payment-received":
      return (
        <span className={`${base} badge-info`}>advance payment received</span>
      );
    case "design-in-progress":
      return <span className={`${base} badge-accent`}>design in progress</span>;
    case "awaiting-design-approval":
      return (
        <span className={`${base} badge-warning`}>
          awaiting design approval
        </span>
      );
    case "production-started":
      return <span className={`${base} badge-info`}>production started</span>;
    case "production-in-progress":
      return (
        <span className={`${base} badge-info`}>production in progress</span>
      );
    case "ready-for-delivery":
      return (
        <span className={`${base} badge-success`}>ready for delivery</span>
      );
    case "out-for-delivery":
      return <span className={`${base} badge-primary`}>out for delivery</span>;
    case "order-completed":
      return <span className={`${base} badge-success`}>order completed</span>;
    default:
      return <span className={base}>{status}</span>;
  }
};

// Define all possible columns for the order table
// Each column object includes properties for ID, label, data key, sortability,
// default visibility, and an optional render function for custom cell content.
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
    defaultVisible: false,
  },
  {
    id: "orderItemsCount",
    label: "Items",
    dataKey: "orderItemsCount",
    isSortable: false,
    defaultVisible: true,
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
    isSortable: false,
    defaultVisible: false,
    render: (order) => statusBadge(order.paymentStatus),
  },
  {
    id: "status",
    label: "Order Status",
    dataKey: "status",
    isSortable: false,
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
  {
    id: "deliveryDate",
    label: "Delivery Date",
    dataKey: "deliveryDate",
    isSortable: true,
    defaultVisible: false,
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
  },
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
const LOCAL_STORAGE_COLUMNS_KEY = "orders_all_page_columns";

// Main component for "All Orders" page
export default function Order() {
  // State variables for order data, filtering, loading, and UI interactions
  const [orders, setOrders] = useState([]); // Stores all fetched orders
  const [filteredOrders, setFilteredOrders] = useState([]); // Stores orders after search/filter
  const [staffList, setStaffList] = useState([]); // Stores list of staff for mapping
  const [loading, setLoading] = useState(true); // Indicates if data is being fetched
  const [error, setError] = useState(null); // Stores any error messages
  const [searchTerm, setSearchTerm] = useState(""); // Current search input value
  const [sortField, setSortField] = useState("createdAt"); // Field by which orders are currently sorted
  const [sortAsc, setSortAsc] = useState(false); // Sort order (true for ascending, false for descending)
  const [selectedOrder, setSelectedOrder] = useState(null); // Stores the order selected for modal view
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const ordersPerPage = 10; // Number of orders to display per page
  const [showColumnManager, setShowColumnManager] = useState(false); // Controls visibility of the column manager modal

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

  // Memoized map of staff IDs to staff names for efficient lookup
  const staffMap = useMemo(() => {
    const map = {};
    staffList.forEach((staff) => {
      map[staff.staffId] = staff.name;
    });
    return map;
  }, [staffList]);

  // Function to fetch staff data from the API
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

  // Function to fetch all orders from the API
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      // API endpoint to fetch all orders
      let url = "https://test.api.dpmsign.com/api/order";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();

      // Map staff names to orders after fetching both staff and order data
      const allOrders = (data.data.orders || []).map((order) => ({
        ...order,
        staffName: staffMap[order.staffId] || "N/A",
      }));

      setOrders(allOrders);
      // Apply initial search and sort after fetching all orders
      applyFiltersAndSort(allOrders, searchTerm, sortField, sortAsc);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to apply search and sort logic to the current orders list
  const applyFiltersAndSort = (currentOrders, term, field, asc) => {
    // Filter orders based on the search term (case-insensitive for name/email, direct match for phone/ID)
    let tempFiltered = currentOrders.filter(
      (o) =>
        o.customerName.toLowerCase().includes(term.toLowerCase()) ||
        o.customerPhone.includes(term) ||
        o.orderId.toString().includes(term) ||
        o.customerEmail?.toLowerCase().includes(term.toLowerCase()) // Added email search
    );

    // Sort the filtered orders based on the selected field and order (ascending/descending)
    const sorted = [...tempFiltered].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      // Custom sorting logic for different data types
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
      return 0; // No change in order if values are equal or type is not handled
    });
    setFilteredOrders(sorted);
  };

  // useEffect hook to fetch staff data once on component mount
  useEffect(() => {
    fetchStaff();
  }, []);

  // useEffect hook to fetch orders after staff data is loaded or on initial load
  // This ensures that staff names are available when orders are processed.
  useEffect(() => {
    // Only fetch orders if staffList is loaded or if it's the initial load (to prevent infinite loop)
    if (staffList.length > 0 || !loading) {
      fetchOrders();
    }
  }, [staffList]); // Dependency array: re-run when staffList changes

  // useEffect hook to re-apply filters and sort whenever the raw orders, search term,
  // sort field, or sort order changes. This keeps the displayed data up-to-date.
  useEffect(() => {
    applyFiltersAndSort(orders, searchTerm, sortField, sortAsc);
  }, [orders, searchTerm, sortField, sortAsc]);

  // Handler for search input changes
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to the first page when a new search is performed
  };

  // Function to export filtered orders data to an Excel file
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AllOrders");
    XLSX.writeFile(workbook, "all_orders.xlsx");
  };

  // Function to export filtered orders data to a CSV file
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

  // Handler for sorting column headers when clicked
  const handleSort = (fieldId) => {
    // Find the actual dataKey from ALL_COLUMNS based on the clicked column's ID
    const field =
      ALL_COLUMNS.find((col) => col.id === fieldId)?.dataKey || fieldId;
    // Toggle sort order if the same field is clicked, otherwise default to ascending
    const asc = field === sortField ? !sortAsc : true;
    setSortField(field);
    setSortAsc(asc);
  };

  // Pagination logic: calculate which orders to display on the current page
  const indexOfLastOrder = currentPage * ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfLastOrder - ordersPerPage,
    indexOfLastOrder
  );

  // Function to close the order details modal by resetting selectedOrder state
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
        {/* Search input field */}
        <input
          type="text"
          placeholder="Search by name, phone, email, or order ID"
          className="input input-bordered input-sm w-full md:w-80 rounded-md focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={handleSearch}
        />
        <div className="flex gap-2 flex-wrap items-center">
          {/* Dropdowns for quick sorting options */}
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

          {/* Buttons for data export */}
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

          {/* Button to open the Column Manager modal */}
          <button
            className="btn btn-sm btn-neutral text-white shadow-md rounded-md hover:scale-105 transition-transform"
            onClick={() => setShowColumnManager(true)}
          >
            <FaColumns /> Manage Columns
          </button>
        </div>
      </div>

      {/* Main table display area */}
      <div className="bg-white rounded-xl shadow border overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Conditional rendering based on loading, error, or data availability */}
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
            {/* Table Header */}
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
            {/* Table Body */}
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
                      {/* Render custom date picker for deliveryDate column (read-only) */}
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
                            disabled // Make it read-only for All Orders page
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
                  <td>
                    {/* Button to view order details in a modal */}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-outline btn-xs bg-blue-700 text-white rounded-md"
                    >
                      View
                    </button>
                    {/* Invoice download button */}
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

      {/* Pagination controls */}
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
      {/* Footer text showing number of entries */}
      <div className="p-4 text-xs text-gray-500 border-t text-right">
        Showing {filteredOrders.length} entr
        {filteredOrders.length === 1 ? "y" : "ies"}
      </div>

      {/* Column Manager Modal */}
      {showColumnManager && (
        <ColumnManager
          allColumns={ALL_COLUMNS} // Pass all defined columns
          visibleColumns={visibleColumns} // Pass currently visible columns
          setVisibleColumns={setVisibleColumns} // Pass setter to update visible columns
          onClose={() => setShowColumnManager(false)} // Callback to close the modal
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
