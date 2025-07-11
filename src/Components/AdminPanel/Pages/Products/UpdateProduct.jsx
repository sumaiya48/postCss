// UpdateProduct.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx"; // Import XLSX for Excel handling

// Import new components (assuming they are in the same directory or accessible)
// import ProductBasicInfo from "./ProductBasicInfo"; // Not directly used here, but good to note
// import ProductTags from "./ProductTags"; // Not directly used here, but good to note
import ProductAttributes from "./ProductAttributes"; // We will use this component
// import ProductVariations from "./ProductVariations"; // Not directly used here, but good to note
// import ProductVariants from "./ProductVariants"; // Not directly used here, but good to note
// import ProductImages from "./ProductImages"; // Not directly used here, but good to note

export default function UpdateProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allFetchedCategories, setAllFetchedCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  // State holders for all editable fields:
  const [basic, setBasic] = useState({
    name: "",
    description: "",
    basePrice: "",
    minOrderQuantity: "",
    discountStart: null,
    discountEnd: null,
    maxDiscountPercentage: null,
    pricingType: "flat",
    isActive: true,
    categoryId: null,
    sku: "", // SKU is read-only but part of basic info
  });
  const [tags, setTags] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [variations, setVariations] = useState([]);
  const [variants, setVariants] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    (async () => {
      await fetchCategories(); // Fetch categories first as product details depend on it
      if (productId) await fetchProductDetails(productId);
      setLoading(false);
    })();
  }, [productId]); // Add allFetchedCategories to dependencies to ensure it's loaded before fetchProductDetails

  async function fetchCategories() {
    try {
      const res = await axios.get(
        "https://test.api.dpmsign.com/api/product-category"
      );
      const all = res.data.data.categories || [];
      setAllFetchedCategories(all);

      const topLevel = all.filter((cat) => cat.parentCategoryId === null);
      setCategories(topLevel);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchProductDetails(id) {
    try {
      const res = await axios.get(
        `https://test.api.dpmsign.com/api/product/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const p = res.data.data.product;

      // Handle category and subcategory population
      const productCategoryId = p.categoryId;
      let parentCategoryId = null;
      let actualCategoryId = productCategoryId; // This will be the subcategoryId if applicable

      const foundCategory = allFetchedCategories.find(
        (cat) => cat.categoryId === productCategoryId
      );

      if (foundCategory && foundCategory.parentCategoryId !== null) {
        // This is a subcategory, so its parent is the actual category to select in the first dropdown
        parentCategoryId = foundCategory.parentCategoryId;
        setSubCategories(
          allFetchedCategories.find(
            (cat) => cat.categoryId === parentCategoryId
          )?.subCategories || []
        );
      } else {
        // This is a top-level category or no category found
        setSubCategories(foundCategory?.subCategories || []);
      }

      setBasic({
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        minOrderQuantity: p.minOrderQuantity,
        pricingType: p.pricingType,
        isActive: p.isActive,
        discountStart: p.discountStart,
        discountEnd: p.discountEnd,
        maxDiscountPercentage: p.maxDiscountPercentage,
        categoryId: parentCategoryId || productCategoryId || "", // Set the parent category ID or the product's own category ID
        subCategoryId: parentCategoryId ? productCategoryId : null, // Set the subcategory ID if applicable
        sku: p.sku || "",
      });

      setTags(p.tags?.map((t) => t.tag) || []);
      setAttributes(
        p.attributes?.map((a) => ({
          property: a.property,
          description: a.description,
          attributeId: a.attributeId, // Keep attributeId for existing attributes
        })) || []
      );
      setVariations(
        p.variations?.map((v) => ({
          name: v.name,
          unit: v.unit,
          variationItems: v.variationItems.map((vi) => ({
            value: vi.value,
            variationItemId: vi.variationItemId,
          })),
          variationId: v.variationId,
        })) || []
      );
      setVariants(
        p.variants?.map((v) => ({
          additionalPrice: v.additionalPrice,
          variantDetails: v.variantDetails.map((d) => ({
            variationName: d.variationItem?.variation?.name, // Adjusted to safely access variation name
            variationItemValue: d.variationItem?.value, // Adjusted to safely access variation item value
            productVariantDetailId: d.productVariantDetailId,
          })),
          productVariantId: v.productVariantId,
        })) || []
      );
      setExistingImages(p.images || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", "Failed to fetch product details", "error");
    }
  }

  function handleBasicChange(e) {
    const { name, value, type, checked } = e.target;

    if (name === "categoryId") {
      const selectedCategoryId = Number(value);
      const selectedCategory = allFetchedCategories.find(
        (cat) => cat.categoryId === selectedCategoryId
      );

      setBasic((prev) => ({
        ...prev,
        categoryId: selectedCategoryId,
        subCategoryId: null, // Reset subcategory when parent category changes
      }));
      setSubCategories(selectedCategory?.subCategories || []);
    } else if (name === "subCategoryId") {
      setBasic((prev) => ({ ...prev, subCategoryId: Number(value) }));
    } else {
      setBasic((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : value === "" // Treat empty string inputs for numbers as null for optional fields
            ? null
            : Number.isNaN(Number(value)) ||
              name === "description" ||
              name === "name" ||
              name === "pricingType" // Don't convert non-numeric or specific text fields to numbers
            ? value
            : Number(value),
      }));
    }
  }

  // Tag handlers
  const addTag = () => setTags((prev) => [...prev, ""]);
  const updateTag = (i, value) =>
    setTags((prev) => prev.map((t, idx) => (idx === i ? value : t)));
  const removeTag = (i) =>
    setTags((prev) => prev.filter((_, idx) => idx !== i));

  // Attribute handlers
  const addAttr = () =>
    setAttributes((prev) => [...prev, { property: "", description: "" }]);
  const updateAttr = (i, field, value) => {
    setAttributes((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a))
    );
  };
  const removeAttr = (i) =>
    setAttributes((prev) => prev.filter((_, idx) => idx !== i));

  // New: handleExcelUpload for attributes
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const parsedAttributes = json
          .map((row) => ({
            property: row.Property,
            description: row.Description,
          }))
          .filter((attr) => attr.property && attr.description);

        setAttributes((prev) => [...prev, ...parsedAttributes]);
        Swal.fire("Success", "Attributes loaded from Excel!", "success");
      } catch (error) {
        console.error("Error processing Excel file:", error);
        Swal.fire(
          "Error",
          "Failed to process Excel file. Ensure it's a valid format with 'Property' and 'Description' columns.",
          "error"
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Variation handlers
  const addVar = () =>
    setVariations((prev) => [
      ...prev,
      { name: "", unit: "", variationItems: [] },
    ]);
  const updateVar = (i, field, value) =>
    setVariatios((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v))
    );
  const addVarItem = (i) => {
    setVariations((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? { ...v, variationItems: [...v.variationItems, { value: "" }] }
          : v
      )
    );
  };
  const updateVarItem = (i, j, value) => {
    setVariations((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? {
              ...v,
              variationItems: v.variationItems.map((vi, viIdx) =>
                viIdx === j ? { ...vi, value } : vi
              ),
            }
          : v
      )
    );
  };
  const removeVarItem = (i, j) => {
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
  };
  const removeVar = (i) =>
    setVariations((prev) => prev.filter((_, idx) => idx !== i));

  // Variant handlers
  const addVt = () =>
    setVariants((prev) => [
      ...prev,
      { additionalPrice: "", variantDetails: [] },
    ]);
  const updateVt = (i, field, value) =>
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v))
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
  const updateVtDetail = (i, j, field, value) =>
    setVariants((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? {
              ...v,
              variantDetails: v.variantDetails.map((d, di) =>
                di === j ? { ...d, [field]: value } : d
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

  // Images
  const uploadNewImages = (e) => {
    const files = Array.from(e.target.files);
    setNewImages((prev) => [...prev, ...files]);
  };
  const removeNewImage = (i) =>
    setNewImages((prev) => prev.filter((_, idx) => idx !== i));
  const removeExistingImage = (imgId) => {
    setExistingImages((prev) => prev.filter((i) => i.imageId !== imgId));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Determine the final category ID (sub-category if selected, otherwise parent category)
      const finalCategoryId = basic.subCategoryId || basic.categoryId;

      // Create FormData object to send both JSON data and files
      const formData = new FormData();

      // Append product ID
      formData.append("productId", Number(productId));

      // Append basic product information
      formData.append("name", basic.name);
      formData.append("description", basic.description);
      formData.append("basePrice", Number(basic.basePrice));
      formData.append("minOrderQuantity", Number(basic.minOrderQuantity));
      formData.append("pricingType", basic.pricingType);
      formData.append("isActive", basic.isActive);
      // Ensure categoryId is sent, converting null to empty string if no category selected
      formData.append(
        "categoryId",
        finalCategoryId !== null ? String(finalCategoryId) : ""
      );

      // Append discount fields, converting null to empty string for FormData
      formData.append(
        "discountStart",
        basic.discountStart !== null && basic.discountStart !== ""
          ? Number(basic.discountStart)
          : ""
      );
      formData.append(
        "discountEnd",
        basic.discountEnd !== null && basic.discountEnd !== ""
          ? Number(basic.discountEnd)
          : ""
      );
      formData.append(
        "maxDiscountPercentage",
        basic.maxDiscountPercentage !== null &&
          basic.maxDiscountPercentage !== ""
          ? Number(basic.maxDiscountPercentage)
          : ""
      );

      // Append stringified arrays for complex data (tags, attributes, variations, variants)
      // MODIFIED: Attributes handling for update
      formData.append(
        "attributes",
        JSON.stringify(
          attributes.map((a) => ({
            // Only include attributeId if it exists (for existing attributes)
            ...(a.attributeId && { attributeId: a.attributeId }),
            property: a.property,
            description: a.description,
          }))
        )
      );
      formData.append("tags", JSON.stringify(tags));
      formData.append(
        "variations",
        JSON.stringify(
          variations.map(({ variationItems, variationId, ...v }) => ({
            // Keep variationId for existing variations, remove for new ones
            ...(variationId && { variationId }),
            ...v,
            variationItems: variationItems.map(
              ({ variationItemId, ...vi }) => ({
                // Keep variationItemId for existing variation items, remove for new ones
                ...(variationItemId && { variationItemId }),
                ...vi,
              })
            ),
          }))
        )
      );
      formData.append(
        "variants",
        JSON.stringify(
          variants.map(({ productVariantId, variantDetails, ...v }) => ({
            // Keep productVariantId for existing variants, remove for new ones
            ...(productVariantId && { productVariantId }),
            ...v,
            additionalPrice: Number(v.additionalPrice) || 0, // Ensure additionalPrice is a number
            variantDetails: variantDetails.map(
              ({ productVariantDetailId, ...d }) => ({
                // Keep productVariantDetailId for existing variant details, remove for new ones
                ...(productVariantDetailId && { productVariantDetailId }),
                ...d,
              })
            ),
          }))
        )
      );

      // Append IDs of existing images to be kept
      formData.append(
        "existingImageIds",
        JSON.stringify(existingImages.map((img) => img.imageId))
      );

      // Append new image files
      newImages.forEach((file) => {
        formData.append("product-images", file); // 'product-images' must match Multer field name in backend
      });

      // Make the PUT request
      await axios.put("https://test.api.dpmsign.com/api/product", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Axios automatically sets 'Content-Type': 'multipart/form-data' when FormData is passed.
          // Do NOT set it manually here.
        },
      });

      Swal.fire("Success!", "Product updated successfully!", "success");
      navigate("/products/all");
    } catch (err) {
      console.error(
        "Product update error:",
        err.response?.data?.message || err.message || err
      );
      Swal.fire(
        "Error!",
        err.response?.data?.message ||
          "Product update failed. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div className="p-8 text-lg text-center">Loading product details...</div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white shadow-md rounded-md">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline mb-6 px-4 py-2 hover:bg-gray-100 transition"
      >
        ← Back
      </button>
      <h1 className="text-4xl font-extrabold mb-8 text-gray-800">
        Update Product
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
                minLength={5}
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

            {/* Discount fields */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Discount Start (Optional)
              </label>
              <input
                name="discountStart"
                type="number"
                value={basic.discountStart || ""}
                onChange={handleBasicChange}
                className="input input-bordered w-full"
                min={0}
                placeholder="Enter discount start amount"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Discount End (Optional)
              </label>
              <input
                name="discountEnd"
                type="number"
                value={basic.discountEnd || ""}
                onChange={handleBasicChange}
                className="input input-bordered w-full"
                min={0}
                placeholder="Enter discount end amount"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Max Discount Percentage (Optional)
              </label>
              <input
                name="maxDiscountPercentage"
                type="number"
                value={basic.maxDiscountPercentage || ""}
                onChange={handleBasicChange}
                className="input input-bordered w-full"
                min={0}
                max={100}
                placeholder="Enter maximum discount percentage (0-100)"
              />
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
                value={basic.categoryId || ""}
                onChange={handleBasicChange}
                className="select select-bordered w-full"
              >
                <option value="">Select Parent Category</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

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
            <p className="mb-2 font-medium text-gray-700">
              Existing Images ({existingImages.length})
            </p>
            <div className="flex flex-wrap gap-4">
              {existingImages.map((img) => (
                <div
                  key={img.imageId}
                  className="relative w-24 h-24 rounded overflow-hidden border border-gray-300"
                >
                  <img
                    src={`https://test.api.dpmsign.com/static/product-images/${img.imageName}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.imageId)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 text-lg font-bold transition"
                    title="Remove Image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

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

        {/* Attributes Section (Integrated ProductAttributes component) */}
        <ProductAttributes
          attributes={attributes}
          updateAttr={updateAttr}
          removeAttr={removeAttr}
          addAttr={addAttr}
          handleExcelUpload={handleExcelUpload} // Pass the new handler
        />

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
                    <select
                      value={d.variationName}
                      onChange={(e) =>
                        updateVtDetail(i, j, "variationName", e.target.value)
                      }
                      className="select select-bordered flex-grow"
                      required
                    >
                      <option value="">Select Variation Name</option>
                      {variations.map((variationOption, idx) => (
                        <option key={idx} value={variationOption.name}>
                          {variationOption.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={d.variationItemValue}
                      onChange={(e) =>
                        updateVtDetail(
                          i,
                          j,
                          "variationItemValue",
                          e.target.value
                        )
                      }
                      className="select select-bordered flex-grow"
                      required
                    >
                      <option value="">Select Item Value</option>
                      {variations
                        .find((v) => v.name === d.variationName)
                        ?.variationItems.map((item, idx) => (
                          <option key={idx} value={item.value}>
                            {item.value}
                          </option>
                        ))}
                    </select>
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
          {submitting ? "Updating..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}
