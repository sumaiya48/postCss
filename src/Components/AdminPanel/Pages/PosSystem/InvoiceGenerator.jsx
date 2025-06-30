import React, { useRef, useEffect } from "react";
import html2pdf from "html2pdf.js"; // Make sure html2pdf.js is installed: npm install html2pdf.js

const InvoiceGenerator = ({
  orderData,
  selectedCustomer,
  selectedItems,
  grossTotal,
  couponDiscount,
  newOrderId,
  products, // Assuming this contains full product details for names
  triggerGenerate,
  onGenerated, // Callback to signal completion and reset trigger
}) => {
  const invoiceContentRef = useRef(null);

  // Helper function to get product name from full products list
  const getProductName = (productId) => {
    const product = products.find((p) => p.productId === productId);
    return product ? product.name : "N/A";
  };

  // Helper function to generate the HTML content for the invoice
  const generateInvoiceHtmlContent = () => {
    let itemsHtml = "";
    selectedItems.forEach((item) => {
      const productName = getProductName(item.productId);
      const unitPrice = Number(item.basePrice || 0);
      const itemTotal = unitPrice * item.quantity;

      itemsHtml += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; color: #333;">${productName}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #333;">$${unitPrice.toFixed(
            2
          )}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #333;">${
            item.quantity
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #333;">$${itemTotal.toFixed(
            2
          )}</td>
        </tr>
      `;
    });

    const invoiceDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const deliveryDateDisplay = new Date(
      orderData.deliveryDate
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
      <div style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #fff;">
        <div style="width: 80%; margin: 0 auto; border: 1px solid #eee; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.05); background-color: #fff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #000;">Your Company Name</h1>
            <p style="color: #333;">123 Main Street, City, Country</p>
            <p style="color: #333;">Email: info@yourcompany.com | Phone: +123 456 7890</p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

          <h2 style="color: #1E3A8A;">Invoice #${newOrderId}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">Invoice Date:</th>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">${invoiceDate}</td>
            </tr>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">Order Date:</th>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">${deliveryDateDisplay}</td>
            </tr>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">Delivery Date:</th>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">${deliveryDateDisplay}</td>
            </tr>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">Payment Status:</th>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">${
                orderData.paymentStatus
              }</td>
            </tr>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">Delivery Method:</th>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">${
                orderData.deliveryMethod
              }</td>
            </tr>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">Payment Method:</th>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">${
                orderData.paymentMethod
              }</td>
            </tr>
            ${
              orderData.staffId
                ? `<tr><th style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">Handled by Staff ID:</th><td style="padding: 8px; border: 1px solid #ddd; text-align: left; color: #333;">${orderData.staffId}</td></tr>`
                : ""
            }
          </table>

          <h3 style="color: #1E3A8A;">Customer Information</h3>
          <p style="color: #333;"><strong>Name:</strong> ${
            selectedCustomer.name
          }</p>
          <p style="color: #333;"><strong>Email:</strong> ${
            selectedCustomer.email || "N/A"
          }</p>
          <p style="color: #333;"><strong>Phone:</strong> ${
            selectedCustomer.phone
          }</p>
          <p style="color: #333;"><strong>Billing Address:</strong> ${
            selectedCustomer.billingAddress || "N/A"
          }</p>
          ${
            orderData.deliveryMethod === "courier" && orderData.courierAddress
              ? `<p style="color: #333;"><strong>Courier Address:</strong> ${
                  orderData.courierAddress
                }</p><p style="color: #333;"><strong>Courier ID:</strong> ${
                  orderData.courierId || "N/A"
                }</p>`
              : ""
          }

          <h3 style="color: #1E3A8A;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="padding: 8px; border: 1px solid #ddd; background-color: #f0f0f0; color: #333;">Product Name</th>
                <th style="padding: 8px; border: 1px solid #ddd; background-color: #f0f0f0; color: #333;">Unit Price</th>
                <th style="padding: 8px; border: 1px solid #ddd; background-color: #f0f0f0; color: #333;">Quantity</th>
                <th style="padding: 8px; border: 1px solid #ddd; background-color: #f0f0f0; text-align: right; color: #333;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="text-align: right;">
            <p style="color: #333;">Subtotal: $${grossTotal.toFixed(2)}</p>
            ${
              couponDiscount > 0
                ? `<p style="color: #333;">Coupon Discount: -$${couponDiscount.toFixed(
                    2
                  )}</p>`
                : ""
            }
            <p style="font-weight: bold; font-size: 1.2em; color: #1E3A8A;">Grand Total: $${grossTotal.toFixed(
              2
            )}</p>
          </div>

          ${
            orderData.additionalNotes
              ? `<div style="margin-top: 20px;"><h3 style="color: #1E3A8A;">Additional Notes</h3><p style="color: #333;">${orderData.additionalNotes}</p></div>`
              : ""
          }

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #333;">Thank you for your business!</p>
          </div>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    if (triggerGenerate && newOrderId && invoiceContentRef.current) {
      const htmlContent = generateInvoiceHtmlContent();
      invoiceContentRef.current.innerHTML = htmlContent;

      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right in mm
        filename: `invoice_ORD-${newOrderId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      html2pdf()
        .set(opt)
        .from(invoiceContentRef.current)
        .save()
        .then(() => {
          onGenerated(); // Callback to signal completion and reset trigger
          invoiceContentRef.current.innerHTML = ""; // Clear the hidden content
        })
        .catch((error) => {
          console.error("Error generating PDF invoice:", error);
          onGenerated(); // Call callback even on error to reset trigger
        });
    }
  }, [
    triggerGenerate,
    newOrderId,
    orderData,
    selectedCustomer,
    selectedItems,
    grossTotal,
    couponDiscount,
    products,
  ]); // All dependencies for generateInvoiceHtmlContent

  return (
    // TEMPORARY VISIBLE STYLE FOR DEBUGGING.
    // REMEMBER TO CHANGE THIS BACK TO THE HIDDEN STYLE AFTER FIXING THE COLOR ERROR.
    <div
      ref={invoiceContentRef}
      style={{
        border: "2px solid red", // Add a distinct border to easily spot it
        padding: "20px",
        backgroundColor: "#fff", // Ensure it has a white background
        position: "relative", // Bring it into the normal document flow
        left: "0",
        top: "0",
        width: "80%", // Make it a reasonable size for viewing
        height: "auto", // Allow content to dictate height
        overflow: "visible", // Allow content to overflow for inspection
        margin: "20px auto", // Center it on the screen
        boxShadow: "0 0 10px rgba(0,0,0,0.1)", // Give it some shadow
        // Crucially, enforce base colors here too in case 'all: initial' is insufficient for some elements
        fontFamily: "Arial, sans-serif",
        color: "#333", // Default text color
      }}
    >
      {/* Content will be dynamically inserted here */}
    </div>

    // Original hidden style (uncomment and replace the above 'div' style when done debugging):
    /*
    <div
      ref={invoiceContentRef}
      style={{
        all: "initial", // Resets all inherited CSS properties
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        backgroundColor: "#fff", // Set explicit background
        padding: "20px",
        width: "210mm", // Standard A4 width
        zIndex: -9999, // Ensure it's behind everything
        fontFamily: "Arial, sans-serif", // Set explicit font family
        color: "#000", // Set explicit text color
        overflow: "hidden", // Hide scrollbars
      }}
    />
    */
  );
};

export default InvoiceGenerator;
