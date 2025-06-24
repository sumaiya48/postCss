import {
  FaFileCsv,
  FaFileExcel,
  FaSearch,
  FaPlus,
  FaEllipsisV,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortType, setSortType] = useState("default");
  const [filterTab, setFilterTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/product");
      const data = res.data.data.products;
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", "Failed to fetch products!", "error");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        "https://test.api.dpmsign.com/api/product-category"
      );
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let updatedList = [...products];

    if (filterTab === "active") {
      updatedList = updatedList.filter((item) => item.isActive);
    } else if (filterTab === "inactive") {
      updatedList = updatedList.filter((item) => !item.isActive);
    }

    if (searchTerm.trim()) {
      updatedList = updatedList.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(updatedList);
  }, [searchTerm, filterTab, products]);

  const sortProducts = (type) => {
    let sorted = [...products];
    switch (type) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "priceLow":
        sorted.sort((a, b) => parseFloat(a.basePrice) - parseFloat(b.basePrice));
        break;
      case "priceHigh":
        sorted.sort((a, b) => parseFloat(b.basePrice) - parseFloat(a.basePrice));
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "recent":
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        sorted = [...products];
    }
    setSortType(type);
    setFilteredProducts(sorted);
  };

 const toggleStatus = async (productId, currentStatus) => {
  console.log("Sending productId:", productId);

  const url = `https://test.api.dpmsign.com/api/product/${
    currentStatus ? "inactive" : "active"
  }?productId=${Number(productId)}`;

  try {
    await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    Swal.fire(
      "Success!",
      `Product has been ${
        currentStatus ? "deactivated" : "activated"
      } successfully.`,
      "success"
    );

    fetchProducts(); // Refresh products after status update
  } catch (err) {
    console.error("Failed to update status:", err?.response?.data || err);
    Swal.fire("Error!", "Failed to update product status!", "error");
  }
};

  const handleDeleteProduct = async (productId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        await axios.delete(`https://test.api.dpmsign.com/api/product/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        Swal.fire("Deleted!", "Product has been deleted.", "success");
        fetchProducts();
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
      Swal.fire("Error!", "Failed to delete product!", "error");
    }
  };

  const handleFilterTab = (tab) => {
    setFilterTab(tab);

    if (tab === "active") {
      setFilteredProducts(products.filter((item) => item.isActive));
    } else if (tab === "inactive") {
      setFilteredProducts(products.filter((item) => !item.isActive));
    } else {
      setFilteredProducts(products);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.categoryId === categoryId);
    return category ? category.name : "N/A";
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between border-b-2 pb-8">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-gray-500">All products of your store in one place!</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by product name"
            className="input input-bordered input-sm w-52"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Link to="/products/add">
            <button className="btn btn-info btn-sm">
              <FaPlus className="mr-1" /> Add Product
            </button>
          </Link>
        </div>
      </div>

      {/* Top Actions */}
      <div className="flex flex-wrap justify-between items-center pt-6 mb-4 gap-2">
        <div className="space-x-2">
          <button className="btn btn-success btn-sm">
            <FaFileExcel className="mr-1" /> Export Excel
          </button>
          <button className="btn btn-primary btn-sm">
            <FaFileCsv className="mr-1" /> Export CSV
          </button>
        </div>

        <div className="flex gap-2">
          <select
            className="select select-bordered select-sm"
            value={sortType}
            onChange={(e) => sortProducts(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="name">Sort by Name</option>
            <option value="priceLow">Price (Low to High)</option>
            <option value="priceHigh">Price (High to Low)</option>
            <option value="oldest">Old Items</option>
            <option value="recent">Recent Items</option>
          </select>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="tabs tabs-bordered">
          <a
            className={`tab ${filterTab === "all" ? "tab-active" : ""}`}
            onClick={() => handleFilterTab("all")}
          >
            All
          </a>
          <a
            className={`tab ${filterTab === "active" ? "tab-active" : ""}`}
            onClick={() => handleFilterTab("active")}
          >
            Active
          </a>
          <a
            className={`tab ${filterTab === "inactive" ? "tab-active" : ""}`}
            onClick={() => handleFilterTab("inactive")}
          >
            Inactive
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="table table-sm">
          <thead className="bg-base-200">
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>SKU</th>
              <th>Base Price (Tk)</th>
              <th>Min Order Qty</th>
              <th>Pricing Type</th>
              <th>Category</th>
              <th>Status</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts?.map((item) => (
              <tr key={item.productId}>
                <td>
                  <img
  src={
    item.images?.[0]?.imageName
      ? `https://test.api.dpmsign.com/static/product-images/${item.images[0].imageName}`
      : "/no-image.png"
  }
  alt="product"
  className="w-12 h-12 object-cover rounded"
/>
                </td>
                <td>{item.name}</td>
                <td>{item.sku}</td>
                <td>{item.basePrice} Tk</td>
                <td>{item.minOrderQuantity}</td>
                <td>{item.pricingType}</td>
                <td>{getCategoryName(item.categoryId)}</td>
                <td>
                  <button
                    onClick={() => toggleStatus(item.productId, item.isActive)}
                    className={`btn btn-xs ${
                      item.isActive ? "btn-success" : "btn-error"
                    } text-white`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>{new Date(item.createdAt).toLocaleDateString("en-GB")}</td>
                <td>
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-xs">
                      <FaEllipsisV />
                    </label>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-28 text-sm"
                    >
                      <li>
                        <button className="flex items-center gap-2">
                          <FaSearch /> View
                        </button>
                      </li>
                      <li>
                        <button className="flex items-center gap-2">
                          <FaEdit /> Edit
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleDeleteProduct(item.productId)}
                          className="flex items-center gap-2 text-red-500"
                        >
                          <FaTrash /> Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-2 text-sm text-center text-gray-500">
          Showing {filteredProducts?.length} entries
        </div>
      </div>
    </div>
  );
}
