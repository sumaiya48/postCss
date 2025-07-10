// ProductImages.jsx
import React from "react";

export default function ProductImages({
  newImages,
  uploadNewImages,
  removeNewImage,
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2 border-gray-300">
        Images
      </h2>
      <div>
        <label className="block mb-2 font-medium text-gray-700">
          Add New Images ({newImages.length})
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={uploadNewImages}
          className="file-input file-input-bordered w-full max-w-xs"
        />
        <div className="flex flex-wrap gap-4 mt-3">
          {newImages.map((file, i) => (
            <div
              key={i}
              className="relative w-24 h-24 rounded overflow-hidden border border-gray-300"
            >
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeNewImage(i)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 text-lg font-bold transition"
                title="Remove Image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
