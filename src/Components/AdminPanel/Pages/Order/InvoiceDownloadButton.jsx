import { jsPDF } from "jspdf";
import { FaDownload } from "react-icons/fa";

export default function InvoiceDownloadButton({ order, staffName }) {
  const generatePdf = () => {
    const doc = new jsPDF();
    let currentY = 30;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice", 105, currentY, null, null, "center");
    currentY += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Order ID: ${order.orderId || "N/A"}`, 20, currentY);
    currentY += 5;
    doc.text(
      `Date: ${
        order.deliveryDate
          ? new Date(order.deliveryDate).toLocaleDateString()
          : "N/A"
      }`,
      20,
      currentY
    );
    currentY += 9;
    doc.text(`Customer Name: ${order.customerName || "N/A"}`, 20, currentY);
    currentY += 5;
    doc.text(`Phone: ${order.customerPhone || "N/A"}`, 20, currentY);
    currentY += 9;
    doc.text(`Staff Name: ${staffName}`, 20, currentY);
    currentY += 15;

    // Table Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setFillColor("#f0f0f0");
    doc.rect(20, currentY - 7, 170, 10, "F");
    doc.setTextColor("#000");
    doc.text("No.", 22, currentY);
    doc.text("Product", 32, currentY);
    doc.text("Qty", 110, currentY);
    doc.text("Unit Price", 135, currentY);

    doc.text("Total", 180, currentY, null, null, "right");
    currentY += 8;

    // Table Body
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#444");
    let totalPrice = 0;

    const items = Array.isArray(order.orderItems) ? order.orderItems : [];

    items.forEach((item, index) => {
      const productName = item?.product?.name || "N/A";
      const qty = item?.quantity || 0;
      const rawUnitPrice = item?.price;
      const unitPrice =
        typeof rawUnitPrice === "number"
          ? rawUnitPrice
          : parseFloat(rawUnitPrice) || 0;
      const total = unitPrice * qty;
      totalPrice += total;

      doc.text(`${index + 1}`, 22, currentY);
      doc.text(productName, 32, currentY, { maxWidth: 70 });
      doc.text(String(qty), 110, currentY);
      doc.text(`${unitPrice.toFixed(2)} Tk`, 135, currentY);
      doc.text(`${total.toFixed(2)} Tk`, 180, currentY, null, null, "right");

      currentY += 10;
    });

    // Grand Total
    doc.setFont("helvetica", "bold");
    currentY += 10;
    doc.text(
      `Total Price: ${totalPrice.toFixed(2)} Tk`,
      180,
      currentY,
      null,
      null,
      "right"
    );

    // Save PDF
    doc.save(`Invoice_Order_${order.orderId}.pdf`);
  };

  return (
    <button
      onClick={generatePdf}
      className="btn btn-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:scale-105 transition-transform shadow-md whitespace-nowrap"
      title="Download Invoice PDF"
    >
      <FaDownload className="mr-1" /> Download Invoice
    </button>
  );
}
