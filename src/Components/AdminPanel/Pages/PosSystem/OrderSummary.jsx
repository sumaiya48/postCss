// components/OrderSummary.jsx (Updated for better variant display)
import React from "react";
import { FaTrash } from "react-icons/fa";
import Select from "react-select"; // This Select is for AFTER adding to order, if they want to change variant.

export default function OrderSummary({
  selectedItems,
  incrementQuantity,
  decrementQuantity,
  removeProduct,
  handleVariantChange, // Still needed if you allow changing variant in summary
  updateItemField,
  calculateItemTotal,
}) {
  return (
    <table className="table table-xs w-full mb-4">
      <thead className="bg-base-200">
        <tr>
          <th>Name</th>
          <th>Variant</th> {/* Updated header for clarity */}
          <th>Price (Unit/Sq.Ft)</th> {/* Clarified header for price */}
          <th>Dimensions</th>
          <th>Qty</th>
          <th>Total</th>
          <th>Remove</th>
        </tr>
      </thead>
      <tbody>
        {selectedItems.length === 0 ? (
          <tr>
            <td colSpan={7} className="text-center text-gray-500">
              No products selected.
            </td>
          </tr>
        ) : (
          selectedItems.map(
            (
              item,
              index // Simplified conditional rendering
            ) => (
              <tr
                key={`${item.productId}-${item.widthInch || "no-w"}-${
                  item.heightInch || "no-h"
                }-${item.productVariantId || "no-v"}-${index}`} // Enhanced key for better uniqueness
              >
                <td>
                  {item.name.length > 20
                    ? item.name.slice(0, 20) + "..."
                    : item.name}
                </td>
                <td>
                  {/* NEW: Display selected variant details instead of a generic label [new feature] */}
                  {item.selectedVariantDetails &&
                  item.selectedVariantDetails.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {item.selectedVariantDetails.map((detail, idx) => (
                        <span
                          key={idx}
                          className="badge badge-sm badge-outline"
                        >
                          {detail.variationName}: {detail.variationItemValue}
                        </span>
                      ))}
                    </div>
                  ) : item.availableVariants?.length > 0 ? (
                    // Fallback to Select if no variant selected but options exist
                    // Or, if you want to allow changing variants directly in OrderSummary:
                    <Select
                      className="text-sm min-w-[120px]"
                      options={item.availableVariants.map((v) => ({
                        value: v.productVariantId,
                        label:
                          v.variantDetails
                            .map((d) => d.variationItem?.value)
                            .join(", ") || `Variant ${v.productVariantId}`, // Dynamic label for variant
                      }))}
                      value={
                        item.productVariantId
                          ? {
                              value: item.productVariantId,
                              label: item.selectedVariantDetails
                                ? item.selectedVariantDetails
                                    .map((d) => d.variationItemValue)
                                    .join(", ")
                                : `Variant ${item.productVariantId}`,
                            }
                          : null
                      }
                      onChange={(option) =>
                        handleVariantChange(item.productId, option)
                      }
                      isClearable
                      placeholder="Select Variant"
                    />
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    className="input input-bordered input-xs w-20 text-right"
                    value={item.customUnitPrice ?? ""}
                    onChange={(e) =>
                      updateItemField(
                        item.productId,
                        "customUnitPrice",
                        Number(e.target.value)
                      )
                    }
                  />
                </td>
                <td>
                  {item.pricingType === "square-feet" ? (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        placeholder="W"
                        className="input input-bordered input-xs w-12 text-center"
                        value={item.widthInch ?? ""}
                        onChange={(e) =>
                          updateItemField(
                            item.productId,
                            "widthInch",
                            Number(e.target.value)
                          )
                        }
                      />
                      <span>:</span>
                      <input
                        type="number"
                        placeholder="H"
                        className="input input-bordered input-xs w-12 text-center"
                        value={item.heightInch ?? ""}
                        onChange={(e) =>
                          updateItemField(
                            item.productId,
                            "heightInch",
                            Number(e.target.value)
                          )
                        }
                      />
                      {item.widthInch > 0 && item.heightInch > 0 && (
                        <span className="text-xs text-gray-500">
                          (
                          {(
                            (item.widthInch / 12) *
                            (item.heightInch / 12)
                          ).toFixed(2)}{" "}
                          sqft)
                        </span>
                      )}
                    </div>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="flex gap-2">
                  <button
                    onClick={() => decrementQuantity(item.productId)}
                    className="btn btn-xs btn-outline"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => incrementQuantity(item.productId)}
                    className="btn btn-xs btn-outline"
                  >
                    +
                  </button>
                </td>
                <td>{calculateItemTotal(item).toFixed(2)} Tk</td>
                <td>
                  <button
                    onClick={() => removeProduct(item.productId)}
                    className="btn btn-xs btn-error"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            )
          )
        )}
      </tbody>
    </table>
  );
}
