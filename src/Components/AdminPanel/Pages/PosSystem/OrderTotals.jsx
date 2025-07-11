// components/OrderTotals.jsx
import React from "react";

export default function OrderTotals({
  subTotal, // This is already the sum of discounted item totals from PosSystem.jsx
  couponDiscount,
  grossTotal,
  paymentMethod,
  setPaymentMethod,
  deliveryMethod,
  setDeliveryMethod,
  paymentStatus,
  setPaymentStatus,
  couriers,
  selectedCourierId,
  setSelectedCourierId,
  courierAddressInput,
  setCourierAddressInput,
  notesInput, // Add notesInput here
  setNotesInput, // Add setNotesInput function
  // *** NEW PROPS FOR DETAILED TOTALS ***
  totalBeforeItemDiscounts, // You'll need to calculate and pass this from PosSystem.jsx
  totalItemDiscounts, // You'll need to calculate and pass this from PosSystem.jsx
}) {
  return (
    <div className="space-y-2 text-sm">
      {/* *** NEW DISPLAY LINES FOR DETAILED TOTALS *** */}
      {totalBeforeItemDiscounts !== undefined && (
        <div className="flex justify-between">
          <span>Sub Total (Before Item Discounts)</span>
          <span>{totalBeforeItemDiscounts?.toFixed(2)} Tk</span>
        </div>
      )}
      {totalItemDiscounts !== undefined && totalItemDiscounts > 0 && (
        <div className="flex justify-between text-green-700">
          <span>Item Discounts Applied</span>
          <span>-{totalItemDiscounts?.toFixed(2)} Tk</span>
        </div>
      )}
      {/* *** END NEW DISPLAY LINES *** */}

      {/* Changed label for clarity given the new breakdown */}
      <div className="flex justify-between">
        <span>Sub Total (After Item Discounts)</span>
        <span>{subTotal?.toFixed(2)} Tk</span>
      </div>
      <div className="flex justify-between">
        <span>Discount (Coupon)</span> {/* Clarified for coupon discount */}
        <span>{couponDiscount?.toFixed(2)} Tk</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>GRAND TOTAL</span> {/* Changed to GRAND TOTAL */}
        <span>{grossTotal?.toFixed(2)} Tk</span>
      </div>

      <div className="flex justify-between">
        <label className="font-bold">Payment Method</label>
        <select
          className="select select-bordered w-1/3"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="online-payment">Online</option>
          <option value="cod-payment">Offline</option>
        </select>
      </div>

      <div className="flex justify-between">
        <label className="font-bold">Delivery Method</label>
        <select
          className="select select-bordered w-1/3"
          value={deliveryMethod}
          onChange={(e) => setDeliveryMethod(e.target.value)}
        >
          <option value="shop-pickup">Shop pickup</option>
          <option value="courier">Courier</option>
        </select>
      </div>

      {deliveryMethod === "courier" && (
        <>
          <div className="flex justify-between">
            <label className="font-bold">Courier</label>
            <select
              className="select select-bordered w-1/3"
              value={selectedCourierId || ""}
              onChange={(e) => setSelectedCourierId(Number(e.target.value))}
            >
              <option value="">Select Courier</option>
              {couriers && couriers.length > 0 ? (
                couriers.map((courier) => (
                  <option key={courier.courierId} value={courier.courierId}>
                    {courier.name}
                  </option>
                ))
              ) : (
                <option>No couriers available</option>
              )}
            </select>
          </div>

          <div className="flex justify-between">
            <label className="font-bold">Courier Address</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={courierAddressInput || ""}
              onChange={(e) => setCourierAddressInput(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="flex justify-between">
        <label className="font-bold">Payment Status</label>
        <select
          className="select select-bordered w-1/3"
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Add the Additional Notes Field here */}
      <div className="flex justify-between">
        <label className="font-bold">Additional Notes</label>
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Add any additional notes here..."
          value={notesInput} // Bind notesInput value
          onChange={(e) => setNotesInput(e.target.value)} // Update notesInput state
        />
      </div>
    </div>
  );
}
