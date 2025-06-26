import axios from "axios";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function ProductModal({ product, onClose, refreshProducts, getCategoryName }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    basePrice: "",
    minOrderQuantity: "",
    pricingType: "",
    isActive: false,
    categoryId: "",
    tags: [],
    attributes: [],
    variations: [],
    variants: [],
    images: [],
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        basePrice: product.basePrice || "",
        minOrderQuantity: product.minOrderQuantity || "",
        pricingType: product.pricingType || "",
        isActive: product.isActive || false,
        categoryId: product.categoryId || "",
        tags: product.tags || [],
        attributes: product.attributes || [],
        variations: product.variations || [],
        variants: product.variants || [],
        images: product.images || [],
      });
    }
  }, [product]);

  // For simplicity, only a few fields editable here; you can expand later

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const token = localStorage.getItem("authToken");

  const handleSave = async () => {
    try {
      // Prepare data to send - adjust as per your API structure
      const payload = {
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        basePrice: parseFloat(formData.basePrice),
        minOrderQuantity: parseInt(formData.minOrderQuantity),
        pricingType: formData.pricingType,
        isActive: formData.isActive,
        categoryId: formData.categoryId,
        // tags, attributes, variations, variants might require special handling
      };

      // Example API call (PUT or PATCH)
      await axios.put(
        `https://test.api.dpmsign.com/api/product/${product.productId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.fire("Success", "Product updated successfully!", "success");
      setEditMode(false);
      refreshProducts(); // Refresh list in parent
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update product!", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-auto">
      <div className="bg-white dark:bg-base-100 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close Modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            src={
              formData.images?.[0]?.imageName
                ? `https://test.api.dpmsign.com/static/product-images/${formData.images[0].imageName}`
                : "/no-image.png"
            }
            alt={formData.name || "Product Image"}
            className="w-32 h-32 rounded-md object-cover shadow-md"
          />

          <div className="flex-1 w-full">
            {editMode ? (
              <>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input input-bordered w-full mb-2"
                  placeholder="Product Name"
                />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="textarea textarea-bordered w-full mb-2"
                  placeholder="Description"
                />
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formData.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{formData.description}</p>
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300 text-sm">
          <div>
            <label className="font-semibold">SKU:</label>
            {editMode ? (
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            ) : (
              <p>{formData.sku || "N/A"}</p>
            )}

            <label className="font-semibold mt-4 block">Base Price (Tk):</label>
            {editMode ? (
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                className="input input-bordered w-full"
                step="0.01"
              />
            ) : (
              <p>{formData.basePrice || "N/A"}</p>
            )}

            <label className="font-semibold mt-4 block">Min Order Qty:</label>
            {editMode ? (
              <input
                type="number"
                name="minOrderQuantity"
                value={formData.minOrderQuantity}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            ) : (
              <p>{formData.minOrderQuantity || "N/A"}</p>
            )}

            <label className="font-semibold mt-4 block">Pricing Type:</label>
            {editMode ? (
              <input
                type="text"
                name="pricingType"
                value={formData.pricingType}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            ) : (
              <p>{formData.pricingType || "N/A"}</p>
            )}

            <label className="font-semibold mt-4 block">Status:</label>
            {editMode ? (
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="checkbox"
              />
            ) : formData.isActive ? (
              <p className="text-green-600 font-semibold">Active</p>
            ) : (
              <p className="text-red-600 font-semibold">Inactive</p>
            )}

            <label className="font-semibold mt-4 block">Category:</label>
            {editMode ? (
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="">Select Category</option>
                {/* map your categories here */}
                {/* Assuming getCategoryName is from parent, you might need to pass categories as prop */}
                {/* Example: */}
                {/* categories.map(cat => <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>) */}
              </select>
            ) : (
              <p>{getCategoryName(formData.categoryId)}</p>
            )}
          </div>

          {/* Tags - show only, editing tags requires more logic */}
          <div>
            <p className="font-semibold mb-1">Tags:</p>
            {formData.tags && formData.tags.length > 0 ? (
              <ul className="list-disc list-inside flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <li
                    key={tag.tagId}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {tag.tag}
                  </li>
                ))}
              </ul>
            ) : (
              <p>N/A</p>
            )}

            {/* You can add tag editing UI here if you want */}
          </div>

          {/* Attributes, Variations, Variants */}
          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Attributes:</p>
            {formData.attributes && formData.attributes.length > 0 ? (
              <ul className="list-disc list-inside">
                {formData.attributes.map((attr) => (
                  <li key={attr.attributeId || attr.property}>
                    <strong>{attr.property}:</strong> {attr.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p>N/A</p>
            )}
          </div>

          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Variations:</p>
            {formData.variations && formData.variations.length > 0 ? (
              <ul className="list-disc list-inside">
                {formData.variations.map((variation) => (
                  <li key={variation.variationId || variation.name}>
                    <strong>{variation.name}</strong>{" "}
                    {variation.unit && `(${variation.unit})`} -{" "}
                    {variation.variationItems && variation.variationItems.length > 0
                      ? variation.variationItems.map((v) => v.value).join(", ")
                      : "N/A"}
                  </li>
                ))}
              </ul>
            ) : (
              <p>N/A</p>
            )}
          </div>

          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Variants:</p>
            {formData.variants && formData.variants.length > 0 ? (
              <ul className="list-disc list-inside">
                {formData.variants.map((variant, idx) => (
                  <li key={variant.productVariantId || idx}>
                    Additional Price: Tk {variant.additionalPrice || "0.00"} -{" "}
                    {variant.variantDetails && variant.variantDetails.length > 0
                      ? variant.variantDetails
                          .map((detail) => detail.variationItem?.value || detail.variationItemValue || "")
                          .join(", ")
                      : "N/A"}
                  </li>
                ))}
              </ul>
            ) : (
              <p>N/A</p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="btn btn-info"
            >
              Edit Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
