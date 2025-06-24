import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Media() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/product");
      setProducts(res.data?.data?.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const filteredProducts = products.filter(
    (item) => item.images?.[0]?.imageName
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Media Gallery</h2>

      {filteredProducts.length === 0 ? (
        <p className="text-gray-500">No product images found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((item) => {
            const imageUrl = `https://test.api.dpmsign.com/static/product-images/${item.images[0].imageName}`;
            return (
              <div
                key={item.productId}
                className="border rounded-lg shadow hover:shadow-md transition overflow-hidden flex flex-col"
              >
                <img
                  src={imageUrl}
                  alt={item.name}
                  className="h-48 w-full object-cover"
                />
                <div className="p-3 flex flex-col justify-between flex-grow">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.name}</h3>
                  <button
                    onClick={() => setSelectedProduct(item)}
                    className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-red-600 text-lg"
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>
            <img
              src={`https://test.api.dpmsign.com/static/product-images/${selectedProduct.images[0].imageName}`}
              alt={selectedProduct.name}
              className="w-full h-48 object-cover rounded mb-4"
            />
            <h3 className="text-xl font-bold mb-2">{selectedProduct.name}</h3>
            <p className="text-gray-600 mb-1">
              <strong>Price:</strong> {selectedProduct.basePrice} Tk
            </p>
            <p className="text-gray-600 mb-1">
              <strong>SKU:</strong> {selectedProduct.sku}
            </p>
            <p className="text-gray-600 mb-1">
              <strong>Minimum Order:</strong> {selectedProduct.minOrderQuantity}
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Pricing Type:</strong> {selectedProduct.pricingType}
            </p>

            <button
              onClick={() => {
                setSelectedProduct(null);
                navigate("/products/all");
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded w-full"
            >
              See All Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
