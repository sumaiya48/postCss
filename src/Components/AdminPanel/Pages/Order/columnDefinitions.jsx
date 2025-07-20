// Order/columnDefinitions.js
import React from "react";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";
import InvoiceDownloadButton from "./InvoiceDownloadButton"; // Adjusted path based on your structure

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
    defaultVisible: true,
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

export { ALL_COLUMNS, statusBadge };
