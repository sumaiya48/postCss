// AddProduct.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AddProduct() {
  const navigate = useNavigate();

  const [basic, setBasic] = useState({
    name: "",
    description: "",
    basePrice: "",
    minOrderQuantity: 1,
    pricingType: "flat",
    isActive: true,
    categoryId: "", // This will hold the ID of the selected PARENT category
    subCategoryId: null, // This will hold the ID of the selected SUB-category
    sku: "",
  });

  

  const [allFetchedCategories, setAllFetchedCategories] = useState([]); // Stores the raw, flat list from API
  const [categories, setCategories] = useState([]); // Stores only top-level (parent) categories for the first dropdown
  const [subCategories, setSubCategories] = useState([]); // Stores sub-categories for the second dropdown, based on parent selection

  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [variations, setVariations] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const token = localStorage.getItem("authToken");

  const uploadNewImages = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const res = await axios.get(
          "https://test.api.dpmsign.com/api/product-category"
        );
        const allCategoriesData = res.data.data.categories;
        setAllFetchedCategories(allCategoriesData); // Store the full list

        // Filter out only the top-level categories for the main dropdown
        const topLevelCats = allCategoriesData.filter(
          (cat) => cat.parentCategoryId === null
        );
        setCategories(topLevelCats); // Set 'categories' state to only parent categories
      } catch (err) {
        console.error("Error fetching categories:", err);
        Swal.fire("Error", "Could not load categories.", "error");
      }
    };
    fetchAllCategories();
  }, []);

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "categoryId") {
      const selectedCategoryId = Number(value);
      const selectedCategory = allFetchedCategories.find(
        (cat) => cat.categoryId === selectedCategoryId
      );

      // Reset subCategory and populate new subCategories
      setBasic((prev) => ({
        ...prev,
        categoryId: selectedCategoryId,
        subCategoryId: null, // Always reset subCategory when parent changes
      }));
      setSubCategories(selectedCategory?.subCategories || []);
    } else if (name === "subCategoryId") {
      setBasic((prev) => ({
        ...prev,
        subCategoryId: Number(value),
      }));
    } else {
      setBasic((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const addTag = () => setTags((prev) => [...prev, ""]);
  const updateTag = (i, val) =>
    setTags((prev) => prev.map((t, idx) => (idx === i ? val : t)));
  const removeTag = (i) =>
    setTags((prev) => prev.filter((_, idx) => idx !== i));

  const addAttr = () =>
    setAttributes((prev) => [...prev, { property: "", description: "" }]);
  const updateAttr = (i, field, val) =>
    setAttributes((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [field]: val } : a))
    );
  const removeAttr = (i) =>
    setAttributes((prev) => prev.filter((_, idx) => idx !== i));

  const addVar = () =>
    setVariations((prev) => [
      ...prev,
      { name: "", unit: "", variationItems: [] },
    ]);
  const updateVar = (i, field, val) =>
    setVariations((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: val } : v))
    );
  const addVarItem = (i) =>
    setVariations((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? { ...v, variationItems: [...v.variationItems, { value: "" }] }
          : v
      )
    );
  const updateVarItem = (i, j, val) =>
    setVariations((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? {
              ...v,
              variationItems: v.variationItems.map((vi, viIdx) =>
                viIdx === j ? { ...vi, value: val } : vi
              ),
            }
          : v
      )
    );
  const removeVarItem = (i, j) =>
    setVariations((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? {
              ...v,
              variationItems: v.variationItems.filter(
                (_, viIdx) => viIdx !== j
              ),
            }
          : v
      )
    );
  const removeVar = (i) =>
    setVariations((prev) => prev.filter((_, idx) => idx !== i));

  const addVt = () =>
    setVariants((prev) => [
      ...prev,
      { additionalPrice: "", variantDetails: [] },
    ]);
  const updateVt = (i, field, val) =>
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: val } : v))
    );
  const addVtDetail = (i) =>
    setVariants((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? {
              ...v,
              variantDetails: [
                ...v.variantDetails,
                { variationName: "", variationItemValue: "" },
              ],
            }
          : v
      )
    );
  const updateVtDetail = (i, j, field, val) =>
    setVariants((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? {
              ...v,
              variantDetails: v.variantDetails.map((d, di) =>
                di === j ? { ...d, [field]: val } : d
              ),
            }
          : v
      )
    );
  const removeVtDetail = (i, j) =>
    setVariants((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? {
              ...v,
              variantDetails: v.variantDetails.filter((_, di) => di !== j),
            }
          : v
      )
    );
  const removeVt = (i) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i));

  // The handleImageChange function already calls setNewImages, so no change needed here.
  // const handleImageChange = (e) => setNewImages(Array.from(e.target.files));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const {
  sku,
  subCategoryId,
  categoryId,
  ...restBasic
} = basic;

      // Determine the categoryId to send based on whether a sub-category is selected
     const finalCategoryId = subCategoryId || categoryId;
      if (!finalCategoryId) {
        Swal.fire(
          "Validation Error",
          "Please select a category or sub-category.",
          "warning"
        );
        setSubmitting(false);
        return; // Stop the submission if no category is selected
      }

      const productRes = await axios.post(
  "https://test.api.dpmsign.com/api/product/create",
  {
    ...restBasic,
    categoryId: finalCategoryId,
    basePrice: Number(basic.basePrice),
    minOrderQuantity: Number(basic.minOrderQuantity),
    tags,
    attributes,
    variations,
    variants,
  },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

      const productId = productRes.data.data.product.productId;

      if (newImages.length > 0) {
        const form = new FormData();
        form.append("productId", productId);
        newImages.forEach((img) => form.append("product-images", img));

        await axios.post(
          "https://test.api.dpmsign.com/api/product/upload-image",
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      Swal.fire("Success!", "Product created successfully", "success");
      navigate("/products/all");
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err?.response?.data?.message || "Failed to create product",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white shadow-md rounded-md">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline mb-6 px-4 py-2 hover:bg-gray-100 transition"
      >
        ← Back
      </button>
      <h1 className="text-4xl font-extrabold mb-8 text-gray-800">
        Add Product
      </h1>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Basic Info Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2 border-gray-300">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={basic.name}
                onChange={handleBasicChange}
                className="input input-bordered w-full"
                required
                placeholder="Enter product name"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                SKU (read-only)
              </label>
              <input
                type="text"
                value={basic.sku || "N/A"}
                readOnly
                className="input input-bordered w-full bg-gray-100 cursor-not-allowed"
                placeholder="SKU unavailable"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Base Price <span className="text-red-500">*</span>
              </label>
              <input
                name="basePrice"
                type="number"
                value={basic.basePrice}
                onChange={handleBasicChange}
                className="input input-bordered w-full"
                min={0}
                required
                placeholder="Enter base price"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Minimum Order Qty <span className="text-red-500">*</span>
              </label>
              <input
                name="minOrderQuantity"
                type="number"
                value={basic.minOrderQuantity}
                onChange={handleBasicChange}
                className="input input-bordered w-full"
                min={1}
                required
                placeholder="Enter minimum order quantity"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Pricing Type <span className="text-red-500">*</span>
              </label>
              <select
                name="pricingType"
                value={basic.pricingType}
                onChange={handleBasicChange}
                className="select select-bordered w-full"
                required
              >
                <option value="flat">Flat</option>
                <option value="square-feet">Square Feet</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <input
                name="isActive"
                type="checkbox"
                checked={basic.isActive}
                onChange={handleBasicChange}
                className="checkbox checkbox-primary"
                id="isActive"
              />
              <label
                htmlFor="isActive"
                className="font-medium text-gray-700 cursor-pointer"
              >
                Active
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1 font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={basic.description}
                onChange={handleBasicChange}
                className="textarea textarea-bordered w-full"
                rows={4}
                required
                placeholder="Enter product description"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1 font-medium text-gray-700">
                Category
              </label>
              <select
                name="categoryId"
                value={basic.categoryId}
                onChange={handleBasicChange}
                className="select select-bordered w-full"
              >
                <option value="">Select Parent Category</option>{" "}
                {/* Changed to "Select Parent Category" */}
                {categories.map(
                  (
                    c // Now 'categories' holds only parent categories
                  ) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Sub-category dropdown, shown only if subCategories exist for the selected parent */}
            {subCategories.length > 0 && (
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium text-gray-700">
                  Sub-Category
                </label>
                <select
                  name="subCategoryId"
                  value={basic.subCategoryId || ""}
                  onChange={handleBasicChange}
                  className="select select-bordered w-full"
                >
                  <option value="">Select Sub-Category</option>
                  {subCategories.map((sub) => (
                    <option key={sub.categoryId} value={sub.categoryId}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Images Section */}
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

        {/* Tags Section */}
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

        {/* Attributes Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2 border-gray-300">
            Attributes
          </h2>
          {attributes.length === 0 && (
            <p className="text-gray-500 mb-2">No attributes added yet.</p>
          )}
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

        {/* Variations Section */}
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
        </section>

        {/* Variants Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2 border-gray-300">
            Variants
          </h2>
          {variants.length === 0 && (
            <p className="text-gray-500 mb-2">No variants added yet.</p>
          )}
          {variants.map((vt, i) => (
            <div
              key={i}
              className="mb-4 p-4 border rounded-lg shadow-sm bg-gray-50"
            >
              <div className="flex flex-wrap gap-3 items-end mb-3">
                <input
                  type="number"
                  placeholder="Additional Price"
                  value={vt.additionalPrice}
                  onChange={(e) =>
                    updateVt(i, "additionalPrice", e.target.value)
                  }
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
              <div>
                <label className="block mb-1 font-medium">Details</label>
                {vt.variantDetails.map((d, j) => (
                  <div key={j} className="flex gap-3 items-center mb-2">
                    <input
                      placeholder="Variation Name"
                      value={d.variationName}
                      onChange={(e) =>
                        updateVtDetail(i, j, "variationName", e.target.value)
                      }
                      className="input input-bordered flex-grow"
                    />
                    <input
                      placeholder="Item Value"
                      value={d.variationItemValue}
                      onChange={(e) =>
                        updateVtDetail(
                          i,
                          j,
                          "variationItemValue",
                          e.target.value
                        )
                      }
                      className="input input-bordered flex-grow"
                    />
                    <button
                      type="button"
                      onClick={() => removeVtDetail(i, j)}
                      className="btn btn-sm btn-error"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addVtDetail(i)}
                  className="btn btn-xs btn-secondary mt-1"
                >
                  + Add Detail
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addVt}
            className="btn btn-sm btn-secondary"
          >
            + Add Variant
          </button>
        </section>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className={`btn btn-primary w-full py-3 text-lg font-semibold transition ${
            submitting
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-primary-focus"
          }`}
        >
          {submitting ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}