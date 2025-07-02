// POSLeftPanel.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

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
    zIndex: 9999, // menu যাতে অন্য কিছুর নিচে না পড়ে
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: 2000, // এখানেই dropdown height কন্ট্রোল হয়
    overflowY: "auto",
  }),
};

export default function POSLeftPanel({
  products,
  categories,
  filters,
  setFilters,
  setSelectedItems,
  searchText,
  setSearchText,
}) {
  const handleProductClick = (product) => {
    setSelectedItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) => item.productId === product.productId
      );

      if (existingItemIndex !== -1) {
        const updated = [...prev];
        updated[existingItemIndex] = {
          ...updated[existingItemIndex],
          quantity: updated[existingItemIndex].quantity + 1,
        };
        return updated;
      } else {
        const initialQuantity = 1;
        const initialUnitPrice = Number(product.basePrice || 0);

        return [
          ...prev,
          {
            ...product,
            quantity: initialQuantity,
            productVariantId: null,
            selectedVariantDetails: null,
            pricingType: product.pricingType,
            widthInch: null,
            heightInch: null,
            customUnitPrice: initialUnitPrice,
            availableVariants: product.variants || [],
          },
        ];
      }
    });
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

    return matchSearch && matchCategory;
  });

  const navigate = useNavigate();
  return (
    <div className="col-span-7 bg-gray-100 border-r p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <button
          className="btn btn-sm btn-primary"
          onClick={() => navigate(-1)} // আগের পেজে ফেরত নেয়
        >
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

      <div className="mb-4 h-full ">
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
          onChange={(selectedOption) =>
            setFilters((prev) => ({
              ...prev,
              categoryId: selectedOption ? selectedOption.value : null,
            }))
          }
          isClearable={false}
          placeholder="Select category"
          menuPortalTarget={document.body} // render menu in body
          menuPosition="fixed" // prevent it being cut off
        />
      </div>

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
