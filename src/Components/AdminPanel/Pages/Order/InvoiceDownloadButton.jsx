// InvoiceDownloadButton.jsx
import React from "react";
import { jsPDF } from "jspdf";
import { FaDownload } from "react-icons/fa";

export default function InvoiceDownloadButton({ order }) {
const generatePdf = () => {
  const doc = new jsPDF();
  let currentY = 30;

  // Order Info Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Order Information", 20, currentY);
  currentY += 10;

  doc.setFont("helvetica", "normal");
  doc.text(`Order ID: ${order.orderId || "N/A"}`, 20, currentY);
  currentY += 8;
  doc.text(`Customer: ${order.customerName || "N/A"}`, 20, currentY);
  currentY += 8;
  doc.text(`Email: ${order.customerEmail || "N/A"}`, 20, currentY);
  currentY += 8;
  doc.text(`Phone: ${order.customerPhone || "N/A"}`, 20, currentY);
  currentY += 8;
  doc.text(`Payment Method: ${order.paymentMethod?.replace("-payment", "") || "N/A"}`, 20, currentY);
  currentY += 8;
  doc.text(`Delivery Method: ${order.deliveryMethod || "N/A"}`, 20, currentY);
  currentY += 8;
  doc.text(
    `Delivery Date: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "N/A"}`,
    20,
    currentY
  );
  currentY += 15;

  // Order Items Header
  doc.setFont("helvetica", "bold");
  doc.text("Order Items", 20, currentY);
  currentY += 8;

  // Table Header
  doc.setFontSize(11);
  doc.setFillColor("#f0f0f0");
  doc.rect(20, currentY - 7, 170, 10, "F");

  doc.setTextColor("#000");
  doc.text("No.", 22, currentY);
  doc.text("Product", 32, currentY);
  doc.text("Qty", 110, currentY);
  doc.text("Size", 130, currentY);
  doc.text("Price (৳)", 170, currentY, null, null, "right");

  doc.setFont("helvetica", "normal");
  doc.setTextColor("#444");

  currentY += 8;

  // Ensure orderItems exist and is array
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];

  items.forEach((item, index) => {
    const productName = item?.product?.name || "N/A";
    const qty = item?.quantity || 0;
    const width = item?.widthInch || "-";
    const height = item?.heightInch || "-";
    const size = `${width}x${height} inch`;
    const price = item?.price || 0;

    doc.text(`${index + 1}`, 22, currentY);
    doc.text(productName, 32, currentY, { maxWidth: 70 });
    doc.text(String(qty), 110, currentY);
    doc.text(size, 130, currentY);
    doc.text(`৳${price.toFixed(2)}`, 170, currentY, null, null, "right");

    currentY += 10;
  });

  // Total
  doc.setFont("helvetica", "bold");
  doc.text(`Total Price: ৳${order.orderTotalPrice?.toFixed(2) || "0.00"}`, 170, currentY + 10, null, null, "right");

  doc.save(`Invoice_Order_${order.orderId}.pdf`);
};




  return (
    <button
      onClick={generatePdf}
      className="btn btn-sm btn-outline flex items-center gap-2"
      title="Download Invoice PDF"
    >
      <FaDownload /> Download
    </button>
  );
}
