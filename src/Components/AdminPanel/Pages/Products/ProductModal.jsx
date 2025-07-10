import axios from "axios";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function ProductModal({
  product,
  onClose,
  refreshProducts,
  getCategoryName,
}) {
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
    // New: Add discount fields to formData [new feature]
    discountStart: null,
    discountEnd: null,
    // REMOVED: discountPercentage: null,
    maxDiscountPercentage: null,
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
        // New: Initialize discount fields from product data [new feature]
        discountStart: product.discountStart || null,
        discountEnd: product.discountEnd || null,
        // REMOVED: discountPercentage: product.discountPercentage || null,
        maxDiscountPercentage: product.maxDiscountPercentage || null,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // New: Handle numeric input for optional fields to store null for empty string [new feature]
    const newValue =
      type === "number" && value === ""
        ? null
        : type === "checkbox"
        ? checked
        : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const token = localStorage.getItem("authToken");

  const handleSave = async () => {
    try {
      // Prepare data to send - adjust as per your API structure
      const payload = {
        productId: product.productId, // Ensure productId is sent for update
        name: formData.name,
        description: formData.description,
        // SKU is read-only on update, so no need to send it in the payload.
        // If your API expects it, uncomment the line below.
        // sku: formData.sku,
        basePrice: parseFloat(formData.basePrice),
        minOrderQuantity: parseInt(formData.minOrderQuantity),
        pricingType: formData.pricingType,
        isActive: formData.isActive,
        categoryId: formData.categoryId,
        // New: Include discount fields in the payload [new feature]
        discountStart: formData.discountStart,
        discountEnd: formData.discountEnd,
        // REMOVED: discountPercentage: formData.discountPercentage,
        maxDiscountPercentage: formData.maxDiscountPercentage,
        // tags, attributes, variations, variants require specific handling for PUT/PATCH,
        // this simple save only covers basic fields for now.
        // For a full update, you'd send these as JSON.stringify if using FormData
        // or as direct objects if using application/json
        tags: formData.tags.map((t) => t.tag), // Assuming tags might be objects, convert to string array
        attributes: formData.attributes.map(({ attributeId, ...a }) => a), // Remove attributeId for consistency with API
        variations: formData.variations.map(
          ({ variationItems, variationId, ...v }) => ({
            ...v,
            variationItems: variationItems.map(
              ({ variationItemId, ...vi }) => vi
            ),
          })
        ),
        variants: formData.variants.map(
          ({ productVariantId, variantDetails, ...v }) => ({
            ...v,
            additionalPrice: Number(v.additionalPrice) || 0,
            variantDetails: variantDetails.map(
              ({ productVariantDetailId, ...d }) => d
            ),
          })
        ),
      };

      // Create FormData to mimic UpdateProduct's submission (if your /api/product PUT expects FormData)
      const submitFormData = new FormData();
      // Append productId separately if your backend's PUT route expects it as a top-level form field
      submitFormData.append("productId", product.productId);
      submitFormData.append("productData", JSON.stringify(payload)); // Stringify the product details

      // Since images are not directly editable in this modal's save,
      // you would typically not send 'product-images' or 'existingImageIds'
      // via this modal's save unless you add image management here.
      // Assuming images are handled by `UpdateProduct.jsx` or a separate image endpoint.

      await axios.put(
        `https://test.api.dpmsign.com/api/product/`, // Your PUT route for product update
        submitFormData, // Send as FormData
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Axios automatically sets 'Content-Type': 'multipart/form-data'
          },
        }
      );

      Swal.fire("Success", "Product updated successfully!", "success");
      setEditMode(false);
      refreshProducts(); // Refresh list in parent
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to update product!",
        "error"
      );
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formData.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                  {formData.description}
                </p>
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

            {/* Discount fields */}
            {/* New: Discount Start [new feature] */}
            <label className="font-semibold mt-4 block">Discount Start:</label>
            {editMode ? (
              <input
                type="number"
                name="discountStart"
                value={formData.discountStart || ""}
                onChange={handleChange}
                className="input input-bordered w-full"
                step="0.01"
              />
            ) : (
              <p>
                {formData.discountStart !== null
                  ? formData.discountStart
                  : "N/A"}
              </p>
            )}

            {/* New: Discount End [new feature] */}
            <label className="font-semibold mt-4 block">Discount End:</label>
            {editMode ? (
              <input
                type="number"
                name="discountEnd"
                value={formData.discountEnd || ""}
                onChange={handleChange}
                className="input input-bordered w-full"
                step="0.01"
              />
            ) : (
              <p>
                {formData.discountEnd !== null ? formData.discountEnd : "N/A"}
              </p>
            )}

            {/* REMOVED: Discount Percentage display/input */}
            {/*
            <label className="font-semibold mt-4 block">
              Discount Percentage:
            </label>
            {editMode ? (
              <input
                type="number"
                name="discountPercentage"
                value={formData.discountPercentage || ""}
                onChange={handleChange}
                className="input input-bordered w-full"
                step="0.01"
                min="0"
                max="100"
              />
            ) : (
              <p>
                {formData.discountPercentage !== null
                  ? `${formData.discountPercentage}%`
                  : "N/A"}
              </p>
            )}
            */}

            {/* New: Max Discount Percentage [new feature] */}
            <label className="font-semibold mt-4 block">
              Max Discount Percentage:
            </label>
            {editMode ? (
              <input
                type="number"
                name="maxDiscountPercentage"
                value={formData.maxDiscountPercentage || ""}
                onChange={handleChange}
                className="input input-bordered w-full"
                step="0.01"
                min="0"
                max="100"
              />
            ) : (
              <p>
                {formData.maxDiscountPercentage !== null
                  ? `${formData.maxDiscountPercentage}%`
                  : "N/A"}
              </p>
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
                {/* categories array needed here for options */}
                {/* Example: Replace with actual categories passed as prop */}
                {/* {categories.map(cat => <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>)} */}
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

          {/* Attributes */}
          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Attributes:</p>
            {formData.attributes && formData.attributes.length > 0 ? (
              // New: Always display attributes as a table in ProductModal [new feature]
              <div className="overflow-x-auto">
                <table className="table w-full table-bordered border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 border-r border-gray-300">
                        Property
                      </th>
                      <th className="px-4 py-2">Description</th>
                      {editMode && <th className="px-4 py-2">Actions</th>}{" "}
                      {/* Only show Actions column in edit mode */}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.attributes.map((attr, idx) => (
                      <tr key={attr.attributeId || idx}>
                        <td className="px-4 py-2 border-r border-gray-300">
                          {editMode ? (
                            <input
                              type="text"
                              value={attr.property}
                              onChange={(e) => {
                                const newAttributes = [...formData.attributes];
                                newAttributes[idx].property = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  attributes: newAttributes,
                                }));
                              }}
                              className="input input-bordered w-full input-xs"
                            />
                          ) : (
                            attr.property
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {editMode ? (
                            <input
                              type="text"
                              value={attr.description}
                              onChange={(e) => {
                                const newAttributes = [...formData.attributes];
                                newAttributes[idx].description = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  attributes: newAttributes,
                                }));
                              }}
                              className="input input-bordered w-full input-xs"
                            />
                          ) : (
                            attr.description
                          )}
                        </td>
                        {editMode && ( // Only show Remove button in edit mode
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  attributes: prev.attributes.filter(
                                    (_, i) => i !== idx
                                  ),
                                }));
                              }}
                              className="btn btn-sm btn-error"
                              title="Remove Attribute"
                            >
                              ×
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {editMode && ( // Only show Add Attribute button in edit mode
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        attributes: [
                          ...prev.attributes,
                          { property: "", description: "" },
                        ],
                      }))
                    }
                    className="btn btn-sm btn-secondary mt-2"
                  >
                    + Add Attribute
                  </button>
                )}
              </div>
            ) : (
              <p>N/A</p>
            )}
          </div>

          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Variations:</p>
            {formData.variations && formData.variations.length > 0 ? (
              // New: Conditionally render variations based on editMode [new feature]
              editMode ? (
                // Edit mode for variations (simplified for brevity, actual implementation needs full edit fields)
                <div className="space-y-4">
                  {formData.variations.map((v, i) => (
                    <div
                      key={v.variationId || i}
                      className="mb-4 p-4 border rounded-lg shadow-sm bg-gray-50"
                    >
                      <div className="flex flex-wrap gap-3 items-end mb-3">
                        <input
                          placeholder="Name"
                          value={v.name}
                          onChange={(e) => {
                            const newVariations = [...formData.variations];
                            newVariations[i].name = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              variations: newVariations,
                            }));
                          }}
                          className="input input-bordered flex-grow min-w-[150px]"
                        />
                        <input
                          placeholder="Unit"
                          value={v.unit}
                          onChange={(e) => {
                            const newVariations = [...formData.variations];
                            newVariations[i].unit = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              variations: newVariations,
                            }));
                          }}
                          className="input input-bordered w-36"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              variations: prev.variations.filter(
                                (_, idx) => idx !== i
                              ),
                            }))
                          }
                          className="btn btn-sm btn-error ml-auto"
                        >
                          Remove Variation
                        </button>
                      </div>
                      <div>
                        <label className="block mb-1 font-medium">Items</label>
                        {v.variationItems.map((vi, j) => (
                          <div
                            key={vi.variationItemId || j}
                            className="flex gap-3 items-center mb-2"
                          >
                            <input
                              placeholder="Value"
                              value={vi.value}
                              onChange={(e) => {
                                const newVariations = [...formData.variations];
                                newVariations[i].variationItems[j].value =
                                  e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  variations: newVariations,
                                }));
                              }}
                              className="input input-bordered flex-grow"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newVariations = [...formData.variations];
                                newVariations[i].variationItems = newVariations[
                                  i
                                ].variationItems.filter((_, idx) => idx !== j);
                                setFormData((prev) => ({
                                  ...prev,
                                  variations: newVariations,
                                }));
                              }}
                              className="btn btn-sm btn-error"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newVariations = [...formData.variations];
                            newVariations[i].variationItems.push({ value: "" });
                            setFormData((prev) => ({
                              ...prev,
                              variations: newVariations,
                            }));
                          }}
                          className="btn btn-xs btn-secondary mt-1"
                        >
                          + Add Item
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        variations: [
                          ...prev.variations,
                          { name: "", unit: "", variationItems: [] },
                        ],
                      }))
                    }
                    className="btn btn-sm btn-secondary"
                  >
                    + Add Variation
                  </button>
                </div>
              ) : (
                // View mode for variations
                <ul className="list-disc list-inside">
                  {formData.variations.map((variation) => (
                    <li key={variation.variationId || variation.name}>
                      <strong>{variation.name}</strong>{" "}
                      {variation.unit && `(${variation.unit})`} -{" "}
                      {variation.variationItems &&
                      variation.variationItems.length > 0
                        ? variation.variationItems
                            .map((v) => v.value)
                            .join(", ")
                        : "N/A"}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <p>N/A</p>
            )}
          </div>

          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Variants:</p>
            {formData.variants && formData.variants.length > 0 ? (
              // New: Conditionally render variants based on editMode [new feature]
              editMode ? (
                // Edit mode for variants (simplified for brevity, actual implementation needs full edit fields)
                <div className="space-y-4">
                  {formData.variants.map((vt, i) => (
                    <div
                      key={vt.productVariantId || i}
                      className="mb-4 p-4 border rounded-lg shadow-sm bg-gray-50"
                    >
                      <div className="flex flex-wrap gap-3 items-end mb-3">
                        <input
                          type="number"
                          placeholder="Additional Price"
                          value={vt.additionalPrice}
                          onChange={(e) => {
                            const newVariants = [...formData.variants];
                            newVariants[i].additionalPrice = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              variants: newVariants,
                            }));
                          }}
                          className="input input-bordered w-40"
                          min={0}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              variants: prev.variants.filter(
                                (_, idx) => idx !== i
                              ),
                            }))
                          }
                          className="btn btn-sm btn-error ml-auto"
                        >
                          Remove Variant
                        </button>
                      </div>
                      <div>
                        <label className="block mb-1 font-medium">
                          Details
                        </label>
                        {vt.variantDetails.map((d, j) => (
                          <div
                            key={d.productVariantDetailId || j}
                            className="flex gap-3 items-center mb-2"
                          >
                            <select
                              value={d.variationName}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[i].variantDetails[j].variationName =
                                  e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: newVariants,
                                }));
                              }}
                              className="select select-bordered flex-grow"
                              required
                            >
                              <option value="">Select Variation Name</option>
                              {formData.variations.map(
                                (variationOption, idx) => (
                                  <option
                                    key={idx}
                                    value={variationOption.name}
                                  >
                                    {variationOption.name}
                                  </option>
                                )
                              )}
                            </select>
                            <select
                              value={d.variationItemValue}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[i].variantDetails[
                                  j
                                ].variationItemValue = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: newVariants,
                                }));
                              }}
                              className="select select-bordered flex-grow"
                              required
                            >
                              <option value="">Select Item Value</option>
                              {formData.variations
                                .find((v) => v.name === d.variationName)
                                ?.variationItems.map((item, idx) => (
                                  <option key={idx} value={item.value}>
                                    {item.value}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const newVariants = [...formData.variants];
                                newVariants[i].variantDetails = newVariants[
                                  i
                                ].variantDetails.filter((_, idx) => idx !== j);
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: newVariants,
                                }));
                              }}
                              className="btn btn-sm btn-error"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newVariants = [...formData.variants];
                            newVariants[i].variantDetails.push({
                              variationName: "",
                              variationItemValue: "",
                            });
                            setFormData((prev) => ({
                              ...prev,
                              variants: newVariants,
                            }));
                          }}
                          className="btn btn-xs btn-secondary mt-1"
                        >
                          + Add Detail
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        variants: [
                          ...prev.variants,
                          { additionalPrice: "", variantDetails: [] },
                        ],
                      }))
                    }
                    className="btn btn-sm btn-secondary"
                  >
                    + Add Variant
                  </button>
                </div>
              ) : (
                // View mode for variants
                <ul className="list-disc list-inside">
                  {formData.variants.map((variant, idx) => (
                    <li key={variant.productVariantId || idx}>
                      Additional Price: Tk {variant.additionalPrice || "0.00"} -{" "}
                      {variant.variantDetails &&
                      variant.variantDetails.length > 0
                        ? variant.variantDetails
                            .map(
                              (detail) =>
                                detail.variationItem?.value ||
                                detail.variationItemValue ||
                                ""
                            )
                            .join(", ")
                        : "N/A"}
                    </li>
                  ))}
                </ul>
              )
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
            <button onClick={() => setEditMode(true)} className="btn btn-info">
              Edit Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
