// components/OrderSummary.jsx
import React from "react";
import { FaTrash } from "react-icons/fa";
import Select from "react-select";

export default function OrderSummary({
  selectedItems,
  incrementQuantity,
  decrementQuantity,
  removeProduct,
  handleVariantChange,
  updateItemField,
  calculateItemTotal,
}) {
  return (
    <table className="table table-xs w-full mb-4">
      <thead className="bg-base-200">
        <tr>
          <th>Name</th>
          <th>Variant</th>
          <th>Price</th>
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
          selectedItems.map((item) => (
            <tr key={item.productId}>
              <td>
                {item.name.length > 20
                  ? item.name.slice(0, 20) + "..."
                  : item.name}
              </td>
              <td>
                {item.availableVariants?.length > 0 ? (
                  <Select
                    className="text-sm min-w-[120px]"
                    options={item.availableVariants.map((v) => ({
                      value: v.productVariantId,
                      label: `Variant ${v.productVariantId}${
                        v.color ? ` (${v.color})` : ""
                      }${v.size ? ` (${v.size})` : ""}`,
                    }))}
                    value={
                      item.productVariantId
                        ? {
                            value: item.productVariantId,
                            label: `Variant ${item.productVariantId}${
                              item.selectedVariantDetails?.color
                                ? ` (${item.selectedVariantDetails.color})`
                                : ""
                            }${
                              item.selectedVariantDetails?.size
                                ? ` (${item.selectedVariantDetails.size})`
                                : ""
                            }`,
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
                  item.selectedVariantDetails?.ratio || "N/A"
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
          ))
        )}
      </tbody>
    </table>
  );
}
