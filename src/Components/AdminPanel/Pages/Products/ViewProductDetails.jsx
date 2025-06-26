import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function ViewProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchProductDetails(productId);
    }
  }, [productId]);

  // Fetch product details
  const fetchProductDetails = async (id) => {
    try {
      const res = await axios.get(`https://test.api.dpmsign.com/api/product/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProduct(res.data.data.product);
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", "Failed to fetch product details!", "error");
    }
  };

  // Fetch categories with subcategories
  const fetchCategories = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/product-category");
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Get category name & subcategory if exists
  const getCategoryFullName = (categoryId) => {
    // Find the main category
    const mainCat = categories.find((cat) => cat.categoryId === categoryId);
    if (!mainCat) return "N/A";

    // Check if it has a parent category (subcategory)
    if (mainCat.parentCategoryId) {
      const parentCat = categories.find((cat) => cat.categoryId === mainCat.parentCategoryId);
      return parentCat
        ? `${parentCat.name} > ${mainCat.name}`
        : mainCat.name;
    }
    return mainCat.name;
  };

  if (!product) {
    return <div className="p-8 text-center text-lg font-semibold">Loading product details...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline mb-8"
      >
        ← Back to Products
      </button>

      {/* Product Title */}
      <h1 className="text-4xl font-extrabold mb-6">{product.name}</h1>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Left: Large Product Image */}
        <div className="md:w-1/2">
          <img
            src={
              product.images?.[0]?.imageName
                ? `https://test.api.dpmsign.com/static/product-images/${product.images[0].imageName}`
                : "/no-image.png"
            }
            alt={product.name}
            className="w-full h-auto rounded-lg shadow-lg object-cover"
            style={{ maxHeight: "450px" }}
          />
        </div>

        {/* Right: Product Details */}
        <div className="md:w-1/2 space-y-5">
          <div className="text-lg">
            <p><span className="font-semibold">SKU:</span> {product.sku}</p>
            <p><span className="font-semibold">Base Price:</span> {product.basePrice} Tk</p>
            <p><span className="font-semibold">Minimum Order Quantity:</span> {product.minOrderQuantity}</p>
            <p><span className="font-semibold">Pricing Type:</span> {product.pricingType}</p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              <span className={product.isActive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {product.isActive ? "Active" : "Inactive"}
              </span>
            </p>
            <p><span className="font-semibold">Category:</span> {getCategoryFullName(product.categoryId)}</p>
            <p><span className="font-semibold">Created At:</span> {new Date(product.createdAt).toLocaleString()}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed">{product.description || "No description available."}</p>
          </div>
        </div>
      </div>

      {/* Attributes */}
      {product.attributes && product.attributes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Attributes</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            {product.attributes.map((attr) => (
              <li key={attr.attributeId}>
                <span className="font-medium">{attr.property}:</span> {attr.description}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Tags</h2>
          <div className="flex flex-wrap gap-3">
            {product.tags.map((tag) => (
              <span
                key={tag.tagId}
                className="inline-block bg-blue-200 text-blue-900 px-4 py-1 rounded-full text-sm font-semibold"
              >
                {tag.tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Variations */}
      {product.variations && product.variations.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-6">Variations</h2>
          {product.variations.map((variation) => (
            <div key={variation.variationId} className="mb-8 border border-gray-300 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">{variation.name}</h3>
              {variation.variationItems && variation.variationItems.length > 0 ? (
                variation.variationItems.map((item) => (
                  <div key={item.variationItemId} className="mb-4 pl-4">
                    <p className="font-medium mb-2">Variation Item ID: {item.variationItemId}</p>

                    {item.variants && item.variants.length > 0 ? (
                      <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-1">Variant ID</th>
                            <th className="border border-gray-300 px-3 py-1">Additional Price</th>
                            <th className="border border-gray-300 px-3 py-1">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.variants.map((variant) => (
                            <tr key={variant.productVariantId} className="text-center">
                              <td className="border border-gray-300 px-3 py-1">{variant.productVariantId}</td>
                              <td className="border border-gray-300 px-3 py-1">{variant.additionalPrice} Tk</td>
                              <td className="border border-gray-300 px-3 py-1">
                                {variant.variantDetails && variant.variantDetails.length > 0 ? (
                                  variant.variantDetails.map((detail) => (
                                    <div key={detail.productVariantDetailId}>
                                      <span>
                                        {detail.variationItem?.value || "No detail"}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  "No variant details"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No variants available.</p>
                    )}
                  </div>
                ))
              ) : (
                <p>No variation items.</p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
