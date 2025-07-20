import React, { useState } from "react";
import {
  FaTimes,
  FaMoneyBillWave,
  FaDollarSign,
  FaInfoCircle,
} from "react-icons/fa";
import Swal from "sweetalert2"; // Import Swal

export default function PaymentModal({ order, onClose, onPaymentSuccess }) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate total due based on orderTotalPrice and existing payments
  const totalPaid = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalDue = order.orderTotalPrice - totalPaid;

  const handlePaymentSubmit = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    if (amount > totalDue) {
      setError(
        `Payment amount cannot exceed the remaining due amount: ৳${totalDue.toLocaleString(
          "en-BD"
        )}`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");

      // API call: Record the payment
      const recordPaymentRes = await fetch(
        `https://test.api.dpmsign.com/api/order/add-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order.orderId,
            amount: amount,
            paymentMethod: order.paymentMethod, // Use existing method or allow selection
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
          }),
        }
      );

      if (!recordPaymentRes.ok) {
        const errorData = await recordPaymentRes.json();
        throw new Error(errorData.message || "Failed to record payment.");
      }

      // Show success message within the modal context
      Swal.fire({
        icon: "success",
        title: "Payment Recorded!",
        text: `৳${amount.toLocaleString("en-BD")} has been added to Order #${
          order.orderId
        }.`,
        timer: 2000,
        showConfirmButton: false,
      });

      // Call the parent's success handler, passing the orderId
      onPaymentSuccess(order.orderId); // Pass the orderId back
    } catch (err) {
      setError(err.message);
      Swal.fire("Error", `Failed to record payment: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-lg bg-white p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaMoneyBillWave /> Record Payment for Order #{order.orderId}
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-gray-500 hover:text-gray-800"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4 text-gray-700">
          <p className="flex items-center gap-2">
            <FaInfoCircle /> <strong>Customer:</strong> {order.customerName}
          </p>
          <p className="flex items-center gap-2">
            <FaDollarSign /> <strong>Total Order Price:</strong> ৳
            {order.orderTotalPrice?.toLocaleString("en-BD")}
          </p>
          <p className="flex items-center gap-2">
            <FaDollarSign /> <strong>Previously Paid:</strong> ৳
            {totalPaid.toLocaleString("en-BD")}
          </p>
          <p className="flex items-center gap-2 font-bold text-lg">
            <FaDollarSign /> <strong>Remaining Due:</strong> ৳
            {totalDue.toLocaleString("en-BD")}
          </p>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Enter Payment Amount (৳)</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 100"
              className="input input-bordered w-full rounded-md"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              min="0"
              step="any"
            />
          </div>

          {error && <div className="text-error text-sm mt-2">{error}</div>}
        </div>

        <div className="modal-action mt-6">
          <button onClick={onClose} className="btn btn-ghost rounded-md">
            Cancel
          </button>
          <button
            onClick={handlePaymentSubmit}
            className={`btn btn-primary rounded-md ${loading ? "loading" : ""}`}
            disabled={
              loading ||
              parseFloat(paymentAmount) <= 0 ||
              isNaN(parseFloat(paymentAmount)) ||
              parseFloat(paymentAmount) > totalDue // Disable if amount exceeds due
            }
          >
            {loading ? "Processing..." : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
