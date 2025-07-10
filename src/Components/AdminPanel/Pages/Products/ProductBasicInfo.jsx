// ProductBasicInfo.jsx
import React from "react";

export default function ProductBasicInfo({
  basic,
  handleBasicChange,
  categories,
  subCategories,
  allFetchedCategories,
}) {
  return (
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
        {/* REMOVED: Discount Percentage input field */}
        {/*
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
        */}
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
  );
}
