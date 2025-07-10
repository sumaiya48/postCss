// ProductAttributes.jsx
import React from "react";

export default function ProductAttributes({
  attributes,
  updateAttr,
  removeAttr,
  addAttr,
  handleExcelUpload,
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2 border-gray-300">
        Attributes
      </h2>
      {attributes.length === 0 && (
        <p className="text-gray-500 mb-2">No attributes added yet.</p>
      )}
      {/* Excel Upload Input */}
      <div className="flex items-center gap-2 mb-3">
        <label
          htmlFor="attributeExcelUpload"
          className="block font-medium text-gray-700"
        >
          Upload from Excel:
        </label>
        <input
          type="file"
          id="attributeExcelUpload"
          accept=".xlsx, .xls"
          onChange={handleExcelUpload}
          className="file-input file-input-sm file-input-bordered max-w-xs"
        />
        <span className="text-sm text-gray-500">(.xlsx, .xls)</span>
      </div>
      {attributes.map((a, i) => (
        <div key={i} className="flex gap-3 mb-2">
          <input
            placeholder="Property"
            value={a.property}
            onChange={(e) => updateAttr(i, "property", e.target.value)}
            className="input input-bordered flex-1"
          />
          <input
            placeholder="Description"
            value={a.description}
            onChange={(e) => updateAttr(i, "description", e.target.value)}
            className="input input-bordered flex-1"
          />
          <button
            type="button"
            onClick={() => removeAttr(i)}
            className="btn btn-sm btn-error"
            title="Remove Attribute"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addAttr}
        className="btn btn-sm btn-secondary mt-2"
      >
        + Add Attribute
      </button>
    </section>
  );
}
