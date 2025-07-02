// components/CouponInput.jsx
import React from "react";

export default function CouponInput({
  couponCode,
  setCouponCode,
  applyCoupon,
  couponDiscount,
  couponError,
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="input input-bordered input-sm flex-grow"
          placeholder="Enter Coupon Code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" onClick={applyCoupon}>
          Apply Coupon
        </button>
      </div>
      {couponError && (
        <p className="text-red-600 text-sm mt-1">{couponError}</p>
      )}
      {couponDiscount > 0 && (
        <p className="text-green-600 text-sm mt-1">
          Coupon applied! Discount: {couponDiscount.toFixed(2)} Tk
        </p>
      )}
    </div>
  );
}
