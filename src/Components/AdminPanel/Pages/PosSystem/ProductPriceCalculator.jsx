// ProductPriceCalculator.jsx
import React, { useEffect, useCallback } from "react";

export default function ProductPriceCalculator({
  product,
  quantity,
  setQuantity,
  widthFeet,
  setWidthFeet,
  widthInches,
  setWidthInches,
  heightFeet,
  setHeightFeet,
  heightInches,
  setHeightInches,
  totalAreaSqFt,
  setTotalAreaSqFt,
  calculatedBasePrice,
  setCalculatedBasePrice,
  discountAmount,
  setDiscountAmount,
  discountPercentageApplied,
  setDiscountPercentageApplied,
  finalPrice,
  setFinalPrice,
  selectedVariant,
  hasVariations,
  isAllVariationsSelected,
}) {
  const isSquareFeet = product.pricingType === "square-feet";

  const calculatePrice = useCallback(() => {
    // START MODIFICATION HERE
    let effectivePricePerUnitOrSqFt = Number(product.basePrice || 0);
    // If a variant is selected, add its additional price to the effective base price per unit/sq.ft.
    if (selectedVariant) {
      effectivePricePerUnitOrSqFt += Number(
        selectedVariant.additionalPrice || 0
      );
    }
    // END MODIFICATION HERE

    const discountStart = Number(product.discountStart || 0);
    const discountEnd = Number(product.discountEnd || 0);
    const maxDiscountPercentage = Number(product.maxDiscountPercentage || 0);

    let currentAreaOrQuantity = 0;

    if (isSquareFeet) {
      const totalWidthInches = Number(widthFeet) * 12 + Number(widthInches);
      const totalHeightInches = Number(heightFeet) * 12 + Number(heightInches);
      currentAreaOrQuantity = (totalWidthInches * totalHeightInches) / 144;
      setTotalAreaSqFt(currentAreaOrQuantity);
    } else {
      currentAreaOrQuantity = Number(quantity);
      setTotalAreaSqFt(quantity);
    }

    // Now, 'calculatedBasePrice' will be the effective price (base + variant additional) * area/quantity
    let priceBeforeDiscount =
      currentAreaOrQuantity * effectivePricePerUnitOrSqFt;

    setCalculatedBasePrice(priceBeforeDiscount);

    let finalCalculatedDiscountAmount = 0;
    let actualDiscountPercentage = 0;

    // Apply the discount logic
    if (currentAreaOrQuantity >= discountStart) {
      if (currentAreaOrQuantity <= discountEnd) {
        // Linear interpolation
        if (discountEnd > discountStart) {
          actualDiscountPercentage =
            (maxDiscountPercentage * (currentAreaOrQuantity - discountStart)) /
            (discountEnd - discountStart);
        } else {
          // If discountStart == discountEnd, apply maxDiscountPercentage if conditions met
          actualDiscountPercentage = maxDiscountPercentage;
        }
      } else {
        // If area > discountEnd, apply the full maxDiscountPercentage
        actualDiscountPercentage = maxDiscountPercentage;
      }
    } else {
      // If area < discountStart, no discount
      actualDiscountPercentage = 0;
    }

    finalCalculatedDiscountAmount =
      (priceBeforeDiscount * actualDiscountPercentage) / 100;

    setDiscountAmount(finalCalculatedDiscountAmount);
    setDiscountPercentageApplied(actualDiscountPercentage);
    setFinalPrice(priceBeforeDiscount - finalCalculatedDiscountAmount);
  }, [
    product,
    quantity,
    widthFeet,
    widthInches,
    heightFeet,
    heightInches,
    selectedVariant, // Keep selectedVariant as a dependency
    isSquareFeet,
    setTotalAreaSqFt,
    setCalculatedBasePrice,
    setDiscountAmount,
    setDiscountPercentageApplied,
    setFinalPrice,
  ]);

  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  const disableInputs = hasVariations && !isAllVariationsSelected;

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
      <h3 className="font-bold mb-2">Price Calculation:</h3>

      {/* Quantity Input (always present) */}
      <div className="form-control mb-3">
        <label className="label">
          <span className="label-text">Quantity</span>
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min="1"
          className="input input-bordered w-full"
          disabled={disableInputs}
        />
      </div>

      {/* Dimensions for Square-Feet Pricing */}
      {isSquareFeet && (
        <div className="space-y-3">
          <p className="font-medium text-gray-700">
            Dimensions (Feet and Inches):
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Width (Feet)</span>
              </label>
              <input
                type="number"
                value={widthFeet}
                onChange={(e) => setWidthFeet(Number(e.target.value))}
                min="0"
                className="input input-bordered w-full"
                disabled={disableInputs}
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Width (Inches)</span>
              </label>
              <input
                type="number"
                value={widthInches}
                onChange={(e) => setWidthInches(Number(e.target.value))}
                min="0"
                max="11"
                className="input input-bordered w-full"
                disabled={disableInputs}
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Height (Feet)</span>
              </label>
              <input
                type="number"
                value={heightFeet}
                onChange={(e) => setHeightFeet(Number(e.target.value))}
                min="0"
                className="input input-bordered w-full"
                disabled={disableInputs}
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Height (Inches)</span>
              </label>
              <input
                type="number"
                value={heightInches}
                onChange={(e) => setHeightInches(Number(e.target.value))}
                min="0"
                max="11"
                className="input input-bordered w-full"
                disabled={disableInputs}
              />
            </div>
          </div>
        </div>
      )}

      {/* Display Calculation Results */}
      <div className="mt-6">
        {isSquareFeet && <p>Total Area: {totalAreaSqFt.toFixed(2)} Sq. Ft.</p>}
        {!isSquareFeet && <p>Quantity: {quantity}</p>}
        <p>Base Price (Before Discount): {calculatedBasePrice.toFixed(2)} Tk</p>
        {discountAmount > 0 && (
          <p className="text-green-700">
            Discount: {discountAmount.toFixed(2)} Tk (
            {discountPercentageApplied.toFixed(2)}%)
          </p>
        )}
        <p className="font-bold text-xl mt-2">
          Final Price: {finalPrice.toFixed(2)} Tk
        </p>
      </div>
    </div>
  );
}
