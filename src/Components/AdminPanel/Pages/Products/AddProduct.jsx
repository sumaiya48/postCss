import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AddProduct() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    minOrderQuantity: 1,
    pricingType: "flat",
    isActive: true,
    categoryId: "",
    subCategoryId: null,
    attributes: [],
    variations: [],
    variants: [],
    tags: [],
  });

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("https://test.api.dpmsign.com/api/product-category");
        setCategories(res.data.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = (e) => {
    const categoryId = Number(e.target.value);
    const category = categories.find((cat) => cat.categoryId === categoryId);
    setFormData({ ...formData, categoryId, subCategoryId: null });
    setSubCategories(category?.subCategories || []);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    setSelectedImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Submit product
      const productBody = {
        name: formData.name,
        description: formData.description,
        basePrice: Number(formData.basePrice),
        minOrderQuantity: Number(formData.minOrderQuantity),
        pricingType: formData.pricingType,
        categoryId: formData.subCategoryId || formData.categoryId,
        isActive: formData.isActive,
        attributes: [],
        tags: [],
        variations: [],
        variants: [],
      };

      const productRes = await axios.post(
        "https://test.api.dpmsign.com/api/product/create",
        productBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const productId = productRes.data.data.product.productId;

      // 2. Upload images
      if (selectedImages.length > 0) {
        const imageForm = new FormData();
        imageForm.append("productId", productId);
        selectedImages.forEach((img) => imageForm.append("product-images", img));

        await axios.post("https://test.api.dpmsign.com/api/product/upload-image", imageForm, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      alert("Product added successfully!");
      setFormData({
        name: "",
        description: "",
        basePrice: "",
        minOrderQuantity: 1,
        pricingType: "flat",
        isActive: true,
        categoryId: "",
        subCategoryId: null,
        attributes: [],
        variations: [],
        variants: [],
        tags: [],
      });
      setSelectedImages([]);
    } catch (error) {
      console.error("Error adding product:", error);
      alert(error?.response?.data?.message || "Failed to add product.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block mb-1 font-medium">Product Name</label>
          <input
            type="text"
            name="name"
            className="input input-bordered w-full"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            name="description"
            className="textarea textarea-bordered w-full"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        {/* Base Price */}
        <div>
          <label className="block mb-1 font-medium">Base Price</label>
          <input
            type="number"
            name="basePrice"
            className="input input-bordered w-full"
            value={formData.basePrice}
            onChange={handleChange}
            required
          />
        </div>

        {/* Minimum Order Quantity */}
        <div>
          <label className="block mb-1 font-medium">Minimum Order Quantity</label>
          <input
            type="number"
            name="minOrderQuantity"
            className="input input-bordered w-full"
            value={formData.minOrderQuantity}
            onChange={handleChange}
            required
          />
        </div>

        {/* Pricing Type */}
        <div>
          <label className="block mb-1 font-medium">Pricing Type</label>
          <select
            name="pricingType"
            value={formData.pricingType}
            onChange={handleChange}
            className="select select-bordered w-full"
          >
            <option value="flat">Flat</option>
            <option value="square-feet">Square Feet</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block mb-1 font-medium">Category</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleCategoryChange}
            className="select select-bordered w-full"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-category */}
        {subCategories.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">Sub-category</label>
            <select
              name="subCategoryId"
              value={formData.subCategoryId || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  subCategoryId: Number(e.target.value),
                }))
              }
              className="select select-bordered w-full"
            >
              <option value="">Select Sub-category</option>
              {subCategories.map((sub) => (
                <option key={sub.categoryId} value={sub.categoryId}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Image Upload */}
        <div>
          <label className="block mb-1 font-medium">Product Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="file-input file-input-bordered w-full"
          />
        </div>

        {/* Is Active */}
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Is Active?</span>
            <input
              type="checkbox"
              name="isActive"
              className="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Add Product
        </button>
      </form>
    </div>
  );
}
