// PosLeftPanel.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import Swal from "sweetalert2";

const customSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: 40,
    height: 40,
  }),
  valueContainer: (base) => ({
    ...base,
    height: 40,
    padding: "0 6px",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: 40,
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: 2000,
    overflowY: "auto",
  }),
};

export default function POSLeftPanel({
  products,
  filters,
  setFilters,
  searchText,
  setSearchText,
  onProductClick, // ADD THIS PROP: Callback to open the product details modal
}) {
  const navigate = useNavigate();

  const [allFetchedCategories, setAllFetchedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const res = await axios.get(
          "https://test.api.dpmsign.com/api/product-category"
        );
        const all = res.data.data.categories;
        setAllFetchedCategories(all);

        const topLevel = all.filter((cat) => cat.parentCategoryId === null);
        setCategories(topLevel);

        if (filters.categoryId) {
          const selected = all.find(
            (cat) => cat.categoryId === filters.categoryId
          );
          setSubCategories(selected?.subCategories || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        Swal.fire("Error", "Could not load categories.", "error");
      }
    };
    fetchAllCategories();
  }, []);

  const handleCategoryChange = (selectedOption) => {
    const categoryId = selectedOption ? selectedOption.value : null;
    const selected = allFetchedCategories.find(
      (cat) => cat.categoryId === categoryId
    );
    setFilters({
      categoryId,
      subCategoryId: null,
    });
    setSubCategories(selected?.subCategories || []);
  };

  const handleSubCategoryChange = (selectedOption) => {
    const subCategoryId = selectedOption ? selectedOption.value : null;
    setFilters((prev) => ({
      ...prev,
      subCategoryId,
    }));
  };

  // MODIFIED: This now calls the prop onProductClick to open the modal
  const handleProductClick = (product) => {
    if (onProductClick) {
      onProductClick(product); // Pass the product to the parent to open the modal
    }
  };

  const getImageUrl = (product) => {
    if (!product.images || product.images.length === 0)
      return "/placeholder.png";
    const imgName = product.images[0].imageName;
    if (!imgName || typeof imgName !== "string") return "/placeholder.png";
    return `https://test.api.dpmsign.com/static/product-images/${imgName}`;
  };

  const filteredProducts = products.filter((product) => {
    const matchSearch = product.name
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const matchCategory =
      !filters.categoryId || product.categoryId === filters.categoryId;

    const matchSubCategory =
      !filters.subCategoryId || product.categoryId === filters.subCategoryId;

    return matchSearch && matchCategory && matchSubCategory;
  });

  return (
    <div className="col-span-7 bg-gray-100 border-r p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <button className="btn btn-sm btn-primary" onClick={() => navigate(-1)}>
          Go Back
        </button>

        <input
          type="text"
          placeholder="Search Here"
          className="input input-bordered w-full"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">
          Filter by Category:
        </label>
        <Select
          styles={customSelectStyles}
          options={[
            { value: null, label: "All Categories" },
            ...categories.map((cat) => ({
              value: cat.categoryId,
              label: cat.name,
            })),
          ]}
          value={
            filters.categoryId
              ? {
                  value: filters.categoryId,
                  label:
                    categories.find((c) => c.categoryId === filters.categoryId)
                      ?.name || "Unknown",
                }
              : { value: null, label: "All Categories" }
          }
          onChange={handleCategoryChange}
          isClearable={false}
          placeholder="Select category"
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </div>

      {subCategories.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">
            Filter by Sub-Category:
          </label>
          <Select
            styles={customSelectStyles}
            options={[
              { value: null, label: "All Subcategories" },
              ...subCategories.map((sub) => ({
                value: sub.categoryId,
                label: sub.name,
              })),
            ]}
            value={
              filters.subCategoryId
                ? {
                    value: filters.subCategoryId,
                    label:
                      subCategories.find(
                        (s) => s.categoryId === filters.subCategoryId
                      )?.name || "Unknown",
                  }
                : { value: null, label: "All Subcategories" }
            }
            onChange={handleSubCategoryChange}
            isClearable={false}
            placeholder="Select sub-category"
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mt-10">
        {filteredProducts.map((product) => (
          <div
            key={product.productId}
            className="border p-3 rounded text-center bg-white shadow hover:shadow-lg cursor-pointer"
            onClick={() => handleProductClick(product)}
          >
            <img
              src={getImageUrl(product)}
              onError={(e) => (e.target.src = "/placeholder.png")}
              alt={product.name}
              className="w-16 h-16 mx-auto mb-2 object-contain"
            />
            <p className="text-xs font-semibold truncate">{product.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
