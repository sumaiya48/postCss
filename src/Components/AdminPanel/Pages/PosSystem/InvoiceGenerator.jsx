import React, { useEffect } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// Styles
const styles = StyleSheet.create({
  page: {
    paddingTop: 40, // 🟢 3 line space at top
    paddingHorizontal: 30,
    paddingBottom: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 25,
    borderBottom: "1 solid #000",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  section: {
    marginVertical: 15,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #000",
    backgroundColor: "#eee",
    paddingVertical: 5,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    borderBottom: "1 solid #ddd",
    paddingVertical: 4,
  },
  cell: { flex: 1, paddingRight: 5 },
  amountRight: { textAlign: "right", flex: 1 },
  totalSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  totalLabel: {
    width: "120px",
    textAlign: "right",
    fontWeight: "bold",
    marginRight: 10,
  },
  totalValue: {
    width: "100px",
    textAlign: "right",
    fontWeight: "bold",
  },
});

// PDF Component
const InvoicePDF = ({
  orderData,
  selectedCustomer,
  selectedItems,
  grossTotal,
  couponDiscount,
  newOrderId,
  selectedStaffName, // This prop seems unused, 'staffName' is the one being used below
  staffName,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ ...styles.title, textAlign: "center" }}>🧾 Invoice</Text>
        <View style={{ marginTop: 10 }}>
          <Text>Order ID: #{newOrderId}</Text>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text>
            Customer: {selectedCustomer.name} ({selectedCustomer.phone})
          </Text>
          <Text>Staff: {staffName || "N/A"}</Text>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={{ marginBottom: 8, fontWeight: "bold" }}>Order Items</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.cell}>Product</Text>
          <Text style={styles.cell}>Qty</Text>
          <Text style={styles.cell}>Unit Price</Text>{" "}
          {/* Clarified "Unit Price" here if it's the customUnitPrice (base + variant additional) */}
          {/* *** ADDED HEADER CELLS *** */}
          <Text style={styles.cell}>Subtotal (Before Item Disc)</Text>
          <Text style={styles.cell}>Item Discount</Text>
          {/* *** END ADDED HEADER CELLS *** */}
          <Text style={styles.amountRight}>Final Total</Text>{" "}
          {/* MODIFIED LABEL */}
        </View>
        {selectedItems.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.cell}>{item.name}</Text>
            <Text style={styles.cell}>{item.quantity}</Text>
            <Text style={styles.cell}>
              {/* Display customUnitPrice which is base + variant additional price */}
              {Number(item.customUnitPrice).toFixed(2)} Tk
              {item.pricingType === "square-feet" &&
                item.widthInch &&
                item.heightInch && (
                  <Text style={{ fontSize: 8 }}>
                    {` (${(
                      (item.widthInch / 12) *
                      (item.heightInch / 12)
                    ).toFixed(2)} sq.ft)`}
                  </Text>
                )}
            </Text>
            {/* *** ADDED DATA CELLS *** */}
            <Text style={styles.cell}>
              {Number(item.calculatedBasePrice || 0).toFixed(2)} Tk
            </Text>
            <Text style={styles.cell}>
              {Number(item.discountAmount || 0).toFixed(2)} Tk
            </Text>
            {/* *** END ADDED DATA CELLS *** */}
            <Text style={styles.amountRight}>
              {/* MODIFIED: Use item.calculatedItemTotal directly for the final total of this line item */}
              {Number(item.calculatedItemTotal).toFixed(2)} Tk
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Subtotal (After Item Discounts):
          </Text>{" "}
          {/* MODIFIED LABEL */}
          <Text style={styles.totalValue}>
            {/* Subtotal should sum up calculatedItemTotal of all items */}
            {selectedItems
              .reduce((sum, item) => sum + Number(item.calculatedItemTotal), 0)
              .toFixed(2)}{" "}
            Tk
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Discount:</Text>
          <Text style={styles.totalValue}>
            {/* couponDiscount is currently 0, but this line is for actual coupon discount */}
            {couponDiscount.toFixed(2)} Tk
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { fontSize: 12 }]}>
            GRAND TOTAL:
          </Text>{" "}
          {/* MODIFIED LABEL */}
          <Text style={[styles.totalValue, { fontSize: 12 }]}>
            {/* grossTotal should be the final sum of all calculatedItemTotal values */}
            {grossTotal.toFixed(2)} Tk
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

// Generator Component
const InvoiceGenerator = ({
  orderData,
  selectedCustomer,
  selectedItems,
  grossTotal,
  couponDiscount,
  newOrderId,
  triggerGenerate,
  onGenerated,
  staffName,
}) => {
  useEffect(() => {
    const generateAndDownload = async () => {
      const blob = await pdf(
        <InvoicePDF
          orderData={orderData}
          selectedCustomer={selectedCustomer}
          selectedItems={selectedItems}
          grossTotal={grossTotal}
          couponDiscount={couponDiscount}
          newOrderId={newOrderId}
          staffName={staffName}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-#${newOrderId}.pdf`;
      document.body.appendChild(link);
      console.log("Download URL:", url);

      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      if (onGenerated) onGenerated();
    };

    if (triggerGenerate && orderData && selectedItems && selectedCustomer) {
      generateAndDownload();
    }
  }, [triggerGenerate]);

  return null; // Invisible component
};

export default InvoiceGenerator;
