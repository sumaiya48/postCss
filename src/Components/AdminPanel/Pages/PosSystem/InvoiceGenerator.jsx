// ✅ FIXED InvoiceGenerator.jsx
import React, { useEffect } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20, borderBottom: "1 solid #000", paddingBottom: 10 },
  section: { marginVertical: 10 },
  row: {
    flexDirection: "row",
    borderBottom: "1 solid #ccc",
    paddingVertical: 4,
  },
  cell: { flex: 1, paddingRight: 5 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  totalLabel: { fontWeight: "bold", marginRight: 10 },
  totalValue: { fontWeight: "bold" },
});

const InvoicePDF = ({
  orderData,
  selectedCustomer,
  selectedItems,
  grossTotal,
  couponDiscount,
  newOrderId,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>Invoice</Text>
        <Text>Order ID: #{newOrderId}</Text>
        <Text>
          Customer: {selectedCustomer.name} ({selectedCustomer.phone})
        </Text>
        <Text>Date: {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={{ marginBottom: 5, fontWeight: "bold" }}>
          Order Items:
        </Text>
        {selectedItems.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.cell}>{item.name}</Text>
            <Text style={styles.cell}>{item.quantity} pcs</Text>
            <Text style={styles.cell}>{item.customUnitPrice} Tk</Text>
            <Text style={styles.cell}>
              {(item.customUnitPrice * item.quantity).toFixed(2)} Tk
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Sub Total:</Text>
        <Text>{(grossTotal + couponDiscount).toFixed(2)} Tk</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Discount:</Text>
        <Text>{couponDiscount.toFixed(2)} Tk</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalValue}>{grossTotal.toFixed(2)} Tk</Text>
      </View>
    </Page>
  </Document>
);

const InvoiceGenerator = ({
  orderData,
  selectedCustomer,
  selectedItems,
  grossTotal,
  couponDiscount,
  newOrderId,
  triggerGenerate,
  onGenerated,
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
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-#${newOrderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      if (onGenerated) onGenerated();
    };

    if (triggerGenerate && orderData && selectedItems && selectedCustomer) {
      generateAndDownload();
    }
  }, [triggerGenerate]);

  return null; // no visible component needed
};

export default InvoiceGenerator;
