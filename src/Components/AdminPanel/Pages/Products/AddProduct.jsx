// AddProduct.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AddProduct() {
  const navigate = useNavigate();

  // State to manage the current step (1: Product Info, 2: Images)
  const [currentStep, setCurrentStep] = useState(1);

  const [basic, setBasic] = useState({
    name: "",
    description: "",
    basePrice: "",
    minOrderQuantity: 1,
    discountStart: null,
    discountEnd: null,
    discountPercentage: null,
    maxDiscountPercentage: null,
    pricingType: "flat",
    isActive: true,
    categoryId: "",
    subCategoryId: null,
    sku: "",
  });

  const [allFetchedCategories, setAllFetchedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [variations, setVariations] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newImages, setNewImages] = useState([]); // Stores File objects
  const token = localStorage.getItem("authToken");

  // State to store productId, initialized by trying to read from sessionStorage
  // This ensures productId persists across refreshes within the same session
  const [productId, setProductId] = useState(() => {
    try {
      const storedProductId = sessionStorage.getItem("currentProductId");
      // Convert to Number, return null if not a valid number
      return storedProductId ? Number(storedProductId) : null;
    } catch (error) {
      // Handle potential security errors if sessionStorage is inaccessible
      console.error("Error reading productId from sessionStorage:", error);
      return null;
    }
  });

  const uploadNewImages = (e) => {
    const files = Array.from(e.target.files);
    setNewImages((prev) => [...prev, ...files]);
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    // Check if a productId exists in session storage on component mount
    // And if currentStep is still 1 (meaning the user just loaded the page)
    if (productId && currentStep === 1) {
      Swal.fire({
        title: "Continue Product Creation?",
        text: `A product with ID ${productId} was previously started. Do you want to continue adding images, or start a new product?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, continue",
        cancelButtonText: "No, start new product",
        allowOutsideClick: false, // Prevent dismissing without choice
        allowEscapeKey: false,
      }).then((result) => {
        if (result.isConfirmed) {
          setCurrentStep(2); // Move to image upload step
        } else {
          // User chose to start a new product, so clear the old ID
          sessionStorage.removeItem("currentProductId");
          setProductId(null);
          // Optional: Clear basic form fields here if you want a completely fresh form
          // setBasic({ ...initialBasicState }); // You'd need an initialBasicState variable
        }
      });
    }

    const fetchAllCategories = async () => {
      try {
        const res = await axios.get(
          "https://test.api.dpmsign.com/api/product-category"
        );
        const allCategoriesData = res.data.data.categories;
        setAllFetchedCategories(allCategoriesData);

        const topLevelCats = allCategoriesData.filter(
          (cat) => cat.parentCategoryId === null
        );
        setCategories(topLevelCats);
      } catch (err) {
        console.error("Error fetching categories:", err);
        Swal.fire("Error", "Could not load categories.", "error");
      }
    };
    fetchAllCategories();

    // Cleanup function for when component unmounts or navigates away
    return () => {
      // You might add logic here to clear sessionStorage IF the process wasn't fully completed.
      // For now, it clears when 'Upload Images & Finish' is successful or 'Back' from step 1.
    };
  }, [productId, currentStep]); // Depend on productId and currentStep to trigger the Swal logic

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "categoryId") {
      const selectedCategoryId = Number(value);
      const selectedCategory = allFetchedCategories.find(
        (cat) => cat.categoryId === selectedCategoryId
      );

      setBasic((prev) => ({
        ...prev,
        categoryId: selectedCategoryId,
        subCategoryId: null,
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
        [name]:
          type === "checkbox"
            ? checked
            : value === ""
            ? null
            : Number.isNaN(Number(value))
            ? value
            : Number(value),
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

  const handleProductInfoSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { sku, subCategoryId, categoryId, ...restBasic } = basic;
      const finalCategoryId = subCategoryId || categoryId;

      if (!finalCategoryId) {
        Swal.fire(
          "Validation Error",
          "Please select a category or sub-category.",
          "warning"
        );
        setSubmitting(false);
        return;
      }

      const productDetails = {
        name: restBasic.name,
        description: restBasic.description,
        basePrice: Number(restBasic.basePrice),
        minOrderQuantity: Number(restBasic.minOrderQuantity),
        pricingType: restBasic.pricingType,
        isActive: restBasic.isActive,
        categoryId: finalCategoryId || null,
        attributes: attributes,
        tags: tags,
        variations: variations,
        variants: variants.map((v) => ({
          ...v,
          additionalPrice: Number(v.additionalPrice) || 0,
        })),
        discountStart:
          restBasic.discountStart !== null && restBasic.discountStart !== ""
            ? Number(restBasic.discountStart)
            : null,
        discountEnd:
          restBasic.discountEnd !== null && restBasic.discountEnd !== ""
            ? Number(restBasic.discountEnd)
            : null,
        discountPercentage:
          restBasic.discountPercentage !== null &&
          restBasic.discountPercentage !== ""
            ? Number(restBasic.discountPercentage)
            : null,
        maxDiscountPercentage:
          restBasic.maxDiscountPercentage !== null &&
          restBasic.maxDiscountPercentage !== ""
            ? Number(restBasic.maxDiscountPercentage)
            : null,
      };

      const res = await axios.post(
        "https://test.api.dpmsign.com/api/product/create-info-only", // New API endpoint for product info
        productDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // --- DEBUGGING LINES (Keep for now, then remove) ---
      console.log("Full response data for product info creation:", res.data);
      // Access res.data.data.productId directly as per the latest console output structure
      const extractedProductId = res.data?.data?.data?.productId;
      // TARGET THIS PATH
      console.log("Attempting to extract productId from: ", extractedProductId);
      // --- END DEBUGGING LINES ---

      // Now, use the extractedProductId
      if (
        typeof extractedProductId === "number" &&
        !isNaN(extractedProductId)
      ) {
        // Added isNaN check for robustness
        const newProductId = extractedProductId;
        setProductId(newProductId); // Update React state
        sessionStorage.setItem("currentProductId", String(newProductId)); // Store in session storage

        Swal.fire(
          "Success!",
          res.data.message ||
            "Product information saved successfully. Now add images.",
          "success"
        );
        setCurrentStep(2); // Move to the next step (image upload)
      } else {
        console.error(
          "Backend response did not contain a valid productId in res.data.data.productId:",
          res.data
        );
        Swal.fire(
          "Error",
          "Failed to get product ID from server response. Please check server logs.",
          "error"
        );
      }
    } catch (err) {
      console.error(
        "Product info creation error:",
        err.response?.data?.message || err.message || err
      );
      Swal.fire(
        "Error",
        err.response?.data?.message ||
          "Failed to create product information. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUploadSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Retrieve productId from state (which is populated from sessionStorage on mount or from previous step)
    if (!productId) {
      Swal.fire(
        "Error",
        "Product ID is missing. Please go back to step 1 or start a new product.",
        "error"
      );
      setSubmitting(false);
      return;
    }

    if (newImages.length === 0) {
      Swal.fire("Validation", "Please select at least one image.", "warning");
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      newImages.forEach((img) => {
        formData.append("product-images", img); // 'product-images' must match Multer field name
      });

      const imageRes = await axios.post(
        `https://test.api.dpmsign.com/api/product/${productId}/upload-images`, // New API endpoint for image upload
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Axios automatically sets 'Content-Type': 'multipart/form-data'
            // when you pass a FormData object. Do NOT set it manually.
          },
        }
      );

      Swal.fire(
        "Success!",
        imageRes.data.message || "Images uploaded successfully!",
        "success"
      );

      // IMPORTANT: Clear productId from session storage and state after successful completion
      sessionStorage.removeItem("currentProductId");
      setProductId(null); // Clear state as well

      navigate("/products/all"); // Redirect after successful image upload
    } catch (err) {
      console.error(
        "Image upload error:",
        err.response?.data?.message || err.message || err
      );
      Swal.fire(
        "Error",
        err.response?.data?.message ||
          "Failed to upload images. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white shadow-md rounded-md">
      <button
        onClick={() => {
          if (currentStep === 2) setCurrentStep(1); // Go back to info page
          else {
            // If going completely back from step 1, or cancelling from step 2 popup, clear session
            sessionStorage.removeItem("currentProductId");
            setProductId(null);
            navigate(-1); // Go back in history
          }
        }}
        className="btn btn-outline mb-6 px-4 py-2 hover:bg-gray-100 transition"
      >
        ← {currentStep === 2 ? "Back to Product Info" : "Back"}
      </button>
      <h1 className="text-4xl font-extrabold mb-8 text-gray-800">
        Add Product ({currentStep}/2)
        {/* Display productId if available for debugging/user info */}
        {productId && (
          <span className="text-sm text-gray-500 ml-2">(ID: {productId})</span>
        )}
      </h1>

      {/* Step Indicators */}
      <div className="flex justify-center mb-8">
        <ul className="steps steps-horizontal">
          <li className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>
            Product Information
          </li>
          <li className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>
            Upload Images
          </li>
        </ul>
      </div>

      {currentStep === 1 && (
        <form onSubmit={handleProductInfoSubmit} className="space-y-10">
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
                  minLength={5} // Client-side validation for name length
                  placeholder="Enter product name (at least 5 characters)"
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
                  Discount Percentage (Optional)
                </label>
                <input
                  name="discountPercentage"
                  type="number"
                  value={basic.discountPercentage || ""}
                  onChange={handleBasicChange}
                  className="input input-bordered w-full"
                  min={0}
                  max={100}
                  placeholder="Enter discount percentage (0-100)"
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
                  value={basic.categoryId}
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

          {/* Submit Button for Product Info */}
          <button
            type="submit"
            disabled={submitting}
            className={`btn btn-primary w-full py-3 text-lg font-semibold transition ${
              submitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-primary-focus"
            }`}
          >
            {submitting ? "Saving Product Info..." : "Save Product Info & Next"}
          </button>
        </form>
      )}

      {currentStep === 2 && (
        <form onSubmit={handleImageUploadSubmit} className="space-y-10">
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
                      src={URL.createObjectURL(file)} // Displaying File objects
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

          {/* Submit Button for Images */}
          <button
            type="submit"
            disabled={submitting || newImages.length === 0}
            className={`btn btn-primary w-full py-3 text-lg font-semibold transition ${
              submitting || newImages.length === 0
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-primary-focus"
            }`}
          >
            {submitting ? "Uploading Images..." : "Upload Images & Finish"}
          </button>
        </form>
      )}
    </div>
  );
}
