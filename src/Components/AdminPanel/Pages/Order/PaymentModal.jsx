import React, { useState } from "react";
import {
  FaTimes,
  FaMoneyBillWave,
  FaDollarSign,
  FaInfoCircle,
} from "react-icons/fa";

export default function PaymentModal({ order, onClose, onPaymentSuccess }) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate total due based on orderTotalPrice and existing payments
  const totalDue =
    order.orderTotalPrice -
    (order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);

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

      // First API call: Record the payment
      // Corrected API endpoint to match backend route: /add-payment
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
            // Added customer details required by backend's validateOrderPaymentCreation middleware
            customerName: order.customerName,
            customerEmail: order.customerEmail, // Can be null, backend allows it
            customerPhone: order.customerPhone,
          }),
        }
      );

      if (!recordPaymentRes.ok) {
        const errorData = await recordPaymentRes.json();
        // Provide more detailed error from backend if available
        throw new Error(errorData.message || "Failed to record payment.");
      }

      // Second API call: Update order status
      // The paymentStatus update is handled by the backend's createOrderPayment controller
      // so we only need to update the order's main status here.
      const updateStatusRes = await fetch(
        `https://test.api.dpmsign.com/api/order/update-order`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order.orderId,
            status: "advance-payment-received", // Set the status to move to In Progress
            // Removed paymentStatus from here as it's handled by backend's add-payment logic
          }),
        }
      );

      if (!updateStatusRes.ok) {
        const errorData = await updateStatusRes.json();
        throw new Error(
          errorData.message || "Failed to update order status after payment."
        );
      }

      onPaymentSuccess(); // Callback to parent to refresh order list
    } catch (err) {
      setError(err.message);
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
            {(
              order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
            ).toLocaleString("en-BD")}
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
              isNaN(parseFloat(paymentAmount))
            }
          >
            {loading ? "Processing..." : "Record Payment & Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
