import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState(null);
  const [newParentName, setNewParentName] = useState("");

  const token = localStorage.getItem("authToken");

  const fetchCategories = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/product-category");
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", "Failed to fetch categories!", "error");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddOrUpdateCategory = async () => {
    try {
      const payload = {
        name: newCategoryName.trim(),
        parentCategoryId: parentCategoryId ? Number(parentCategoryId) : null
      };

      if (editingCategory) {
        await axios.put("https://test.api.dpmsign.com/api/product-category", {
          categoryId: editingCategory.categoryId,
          name: payload.name,
          parentCategoryId: payload.parentCategoryId
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        Swal.fire("Success!", "Category updated successfully!", "success");
      } else {
        await axios.post("https://test.api.dpmsign.com/api/product-category/create", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        Swal.fire("Success!", "Category added successfully!", "success");
      }

      fetchCategories();
      resetForm();
    } catch (err) {
      console.error("Failed to save category:", err?.response?.data || err);
      Swal.fire("Error!", err?.response?.data?.message || "Failed to save category!", "error");
    }
  };

  const handleAddParentCategory = async () => {
  try {
    const payload = {
      name: newParentName.trim()
      // parentCategoryId will not be sent for parent
    };

    await axios.post("https://test.api.dpmsign.com/api/product-category/create", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    Swal.fire("Success!", "Parent category added!", "success");
    fetchCategories();
    setNewParentName("");
  } catch (err) {
    console.error("Failed to save parent category:", err?.response?.data || err);
    Swal.fire("Error!", err?.response?.data?.message || "Failed to save parent category!", "error");
  }
};


  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setParentCategoryId(category.parentCategoryId || null);
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "This category will be deleted!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
      });

      if (result.isConfirmed) {
        await axios.delete(`https://test.api.dpmsign.com/api/product-category/${categoryId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        Swal.fire("Deleted!", "Category deleted!", "success");
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to delete category:", err?.response?.data || err);
      Swal.fire("Error!", err?.response?.data?.message || "Failed to delete category!", "error");
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setNewCategoryName("");
    setParentCategoryId(null);
  };

  const renderSubCategories = (parentId) => {
    return categories
      .filter((cat) => cat.parentCategoryId === parentId)
      .map((sub) => (
        <div key={sub.categoryId} className="ml-6 mt-2 border-l pl-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{sub.name}</p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEditCategory(sub)}
                className="btn btn-xs btn-warning"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteCategory(sub.categoryId)}
                className="btn btn-xs btn-error"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Add/Edit Category */}
      <div className="border p-4 rounded">
        <h2 className="text-xl font-bold mb-3">
          {editingCategory ? "Edit Category" : "Add New Subcategory"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <input
            type="text"
            placeholder="Category Name"
            className="input input-bordered"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <select
            className="select select-bordered"
            value={parentCategoryId || ""}
            onChange={(e) => setParentCategoryId(e.target.value ? Number(e.target.value) : null)}
          >
           <option value="">-- Parent Category --</option>
{[...new Map(
    categories
      .filter(cat => cat.parentCategory)   // only category jeta te parent ache
      .map(cat => [cat.parentCategory.categoryId, cat.parentCategory])  // map to [id, obj]
  ).values()]  // Map e unique hoye jabe
  .map((parent) => (
    <option key={parent.categoryId} value={parent.categoryId}>
      {parent.name}
    </option>
  ))}

          </select>
        </div>
        <div className="space-x-2">
          <button
            onClick={handleAddOrUpdateCategory}
            className="btn btn-primary"
          >
            {editingCategory ? "Update" : "Add"}
          </button>
          {editingCategory && (
            <button onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Add Parent Category */}
      <div className="border p-4 rounded">
        <h2 className="text-xl font-bold mb-3">Add Parent Category</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Parent Category Name"
            className="input input-bordered flex-1"
            value={newParentName}
            onChange={(e) => setNewParentName(e.target.value)}
          />
          <button
            onClick={handleAddParentCategory}
            className="btn btn-primary"
          >
            Add Parent
          </button>
        </div>
      </div>


      {/* Category List Table */}  
<div className="mt-10 border rounded shadow">
  <h2 className="text-xl font-bold p-4 border-b">All Categories</h2>
  <div className="overflow-x-auto">
    <table className="table table-zebra w-full">
      <thead className="bg-base-200">
        <tr>
          <th>#</th>
          <th>Category Name</th>
          <th>Parent Category</th>
          <th>Products Count</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((cat, index) => (
          <tr key={cat.categoryId}>
            <td>{index + 1}</td>
            <td className="font-semibold">{cat.name}</td>
            <td>
              {cat.parentCategory
                ? cat.parentCategory.name
                : "No Parent"}
            </td>
            <td>{cat.products?.length || 0}</td>
            <td className="space-x-2">
              <button
                onClick={() => handleEditCategory(cat)}
                className="btn btn-xs btn-warning"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.categoryId)}
                className="btn btn-xs btn-error"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {categories.length === 0 && (
      <div className="p-6 text-center text-gray-500">
        No categories found!
      </div>
    )}
  </div>
</div>

    </div>
  );
}
