// ProductVariants.jsx
import React from "react";

export default function ProductVariants({
  variants,
  updateVt,
  removeVt,
  variations,
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2 border-gray-300">
        Variants
      </h2>
      {variants.length === 0 && (
        <p className="text-gray-500 mb-2">
          No variants generated yet. Add variations and click "Create Variants".
        </p>
      )}
      {variants.map((vt, i) => (
        <div
          key={i} // Using index as key, consider a more stable unique ID if variants are reordered/deleted frequently
          className="mb-4 p-4 border rounded-lg shadow-sm bg-gray-50"
        >
          <div className="flex flex-wrap gap-3 items-end mb-3">
            <div className="flex-grow flex flex-wrap gap-2">
              {vt.variantDetails.map((detail, j) => (
                <span key={j} className="badge badge-lg badge-outline">
                  {detail.variationName}: {detail.variationItemValue}
                </span>
              ))}
            </div>
            <input
              type="number"
              placeholder="Additional Price"
              value={vt.additionalPrice}
              onChange={(e) => updateVt(i, "additionalPrice", e.target.value)}
              className="input input-bordered w-40"
              min={0}
            />
            <button
              type="button"
              onClick={() => removeVt(i)}
              className="btn btn-sm btn-error ml-auto"
            >
              Remove Variant
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
