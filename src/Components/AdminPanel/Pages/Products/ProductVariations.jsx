// ProductVariations.jsx
import React from "react";

export default function ProductVariations({
  variations,
  updateVar,
  removeVar,
  addVar,
  addVarItem,
  updateVarItem,
  removeVarItem,
  handleCreateVariants,
}) {
  const isCreateVariantsDisabled =
    variations.length === 0 ||
    variations.some(
      (v) =>
        v.name === "" ||
        v.variationItems.length === 0 ||
        v.variationItems.some((item) => item.value === "")
    );

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2 border-gray-300">
        Variations
      </h2>
      {variations.length === 0 && (
        <p className="text-gray-500 mb-2">No variations added yet.</p>
      )}
      {variations.map((v, i) => (
        <div
          key={i}
          className="mb-4 p-4 border rounded-lg shadow-sm bg-gray-50"
        >
          <div className="flex flex-wrap gap-3 items-end mb-3">
            <input
              placeholder="Name"
              value={v.name}
              onChange={(e) => updateVar(i, "name", e.target.value)}
              className="input input-bordered flex-grow min-w-[150px]"
            />
            <input
              placeholder="Unit"
              value={v.unit}
              onChange={(e) => updateVar(i, "unit", e.target.value)}
              className="input input-bordered w-36"
            />
            <button
              type="button"
              onClick={() => removeVar(i)}
              className="btn btn-sm btn-error ml-auto"
            >
              Remove Variation
            </button>
          </div>
          <div>
            <label className="block mb-1 font-medium">Items</label>
            {v.variationItems.map((vi, j) => (
              <div key={j} className="flex gap-3 items-center mb-2">
                <input
                  placeholder="Value"
                  value={vi.value}
                  onChange={(e) => updateVarItem(i, j, e.target.value)}
                  className="input input-bordered flex-grow"
                />
                <button
                  type="button"
                  onClick={() => removeVarItem(i, j)}
                  className="btn btn-sm btn-error"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addVarItem(i)}
              className="btn btn-xs btn-secondary mt-1"
            >
              + Add Item
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addVar}
        className="btn btn-sm btn-secondary"
      >
        + Add Variation
      </button>
      <button
        type="button"
        onClick={handleCreateVariants}
        className="btn btn-sm btn-info ml-2"
        disabled={isCreateVariantsDisabled}
      >
        Create Variants
      </button>
    </section>
  );
}
