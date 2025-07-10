// ProductTags.jsx
import React from "react";

export default function ProductTags({ tags, updateTag, removeTag, addTag }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2 border-gray-300">
        Tags
      </h2>
      {tags.length === 0 && (
        <p className="text-gray-500 mb-2">No tags added yet.</p>
      )}
      {tags.map((t, i) => (
        <div key={i} className="flex items-center gap-3 mb-2">
          <input
            type="text"
            value={t}
            onChange={(e) => updateTag(i, e.target.value)}
            className="input input-bordered flex-grow"
            placeholder="Tag"
          />
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="btn btn-sm btn-error"
            title="Remove Tag"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addTag}
        className="btn btn-sm btn-secondary mt-2"
      >
        + Add Tag
      </button>
    </section>
  );
}
