import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
} from "react-icons/fi";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";

export default function Categories() {
  const [allCategories, setAllCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [editCategory, setEditCategory] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [subCategoryParentId, setSubCategoryParentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        "https://test.api.dpmsign.com/api/product-category"
      );
      const all = res.data.data.categories;
      setAllCategories(all);
      applyFilters(all, searchTerm, sortOrder);
    } catch (err) {
      Swal.fire("Error", "Could not load categories", "error");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters(allCategories, searchTerm, sortOrder);
  }, [searchTerm, sortOrder]);

  const applyFilters = (data, search, sort) => {
    let filtered = [...data].filter((cat) => cat.parentCategoryId === null);
    if (search) {
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (sort === "asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "desc") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }
    setCategories(filtered);
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      await axios.post(
        "https://test.api.dpmsign.com/api/product-category/create",
        { name: categoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategoryName("");
      fetchCategories();
    } catch {
      Swal.fire("Error", "Failed to add category", "error");
    }
  };

  const handleDelete = async (categoryId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the category.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(
         ` https://test.api.dpmsign.com/api/product-category/${categoryId}`,
          { headers: { Authorization: `Bearer ${token} `} }
        );
        fetchCategories();
        Swal.fire("Deleted!", "Category deleted.", "success");
      } catch {
        Swal.fire("Error", "Delete failed", "error");
      }
    }
  };

  const handleEditCategory = async () => {
    try {
      await axios.put(
        "https://test.api.dpmsign.com/api/product-category/",
        {
          categoryId: editCategory.categoryId,
          name: editCategory.name,
          parentCategoryId: editCategory.parentCategoryId,
        },
        { headers: { Authorization:` Bearer ${token}` } }
      );
      setShowEditModal(false);
      fetchCategories();
    } catch {
      Swal.fire("Error", "Update failed", "error");
    }
  };

  const handleAddSubCategory = async () => {
    if (!subCategoryName.trim()) return;
    try {
      await axios.post(
        "https://test.api.dpmsign.com/api/product-category/create",
        {
          name: subCategoryName,
          parentCategoryId: subCategoryParentId,
        },
        { headers: { Authorization:` Bearer ${token}` } }
      );
      setSubCategoryName("");
      setShowSubCategoryModal(false);
      fetchCategories();
      Swal.fire("Success", "Subcategory added successfully!", "success"); // ✅ Alert added here
    } catch {
      Swal.fire("Error", "Subcategory add failed", "error");
    }
  };

  const csvData = categories.flatMap((cat) => [
    { Category: cat.name, Subcategory: "" },
    ...cat.subCategories.map((sub) => ({
      Category: cat.name,
      Subcategory: sub.name,
    })),
  ]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");
    XLSX.writeFile(workbook, "categories.xlsx");
  };

  const getSortLabel = () => {
    if (sortOrder === "asc") return "Sort A → Z";
    if (sortOrder === "desc") return "Sort Z → A";
    return "Sort: Default";
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-10">
        <h1 className="text-3xl font-extrabold text-center text-indigo-700 mb-10 tracking-wide">
          Manage Categories
        </h1>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
          <div className="flex gap-4">
            <div className="relative w-full md:w-[200px]">
              <input
                type="text"
                placeholder="Search category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-300 pl-12 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm transition"
              />
              <FiSearch
                className="absolute left-4 top-2 text-gray-400"
                size={18}
              />
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-1 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm transition font-semibold text-gray-700 select-none"
              >
                {getSortLabel()}
                {dropdownOpen ? (
                  <FiChevronUp size={18} />
                ) : (
                  <FiChevronDown size={18} />
                )}
              </button>

              {dropdownOpen && (
                <ul className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-xl shadow-lg z-50 divide-y divide-gray-100">
                  <li
                    className="px-4 py-3 cursor-pointer hover:bg-indigo-100 rounded-t-xl"
                    onClick={() => {
                      setSortOrder("default");
                      setDropdownOpen(false);
                    }}
                  >
                    Default
                  </li>
                  <li
                    className="px-4 py-3 cursor-pointer hover:bg-indigo-100"
                    onClick={() => {
                      setSortOrder("asc");
                      setDropdownOpen(false);
                    }}
                  >
                    Sort A → Z
                  </li>
                  <li
                    className="px-4 py-3 cursor-pointer hover:bg-indigo-100 rounded-b-xl"
                    onClick={() => {
                      setSortOrder("desc");
                      setDropdownOpen(false);
                    }}
                  >
                    Sort Z → A
                  </li>
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 shadow-md transition"
            >
              <FiDownload size={18} /> Export Excel
            </button>
            <CSVLink
              data={csvData}
              filename="categories.csv"
              className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 shadow-md transition"
            >
              <FiDownload size={18} /> Export CSV
            </CSVLink>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-xl px-8 py-6 mb-6 border border-indigo-200 shadow-inner">
          <h2 className="text-xl font-semibold text-indigo-800 mb-4">
            ➕ Add New Category
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="input input-bordered w-full max-w-md rounded-xl border-indigo-300 shadow-sm focus:ring-indigo-400"
            />
            <button
              className="btn btn-info text-white rounded-xl shadow-md hover:shadow-lg transition"
              onClick={handleAddCategory}
            >
              Add Category
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map((cat) => (
            <div
              key={cat.categoryId}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition"
            >
              <div
                className="flex justify-between items-center px-8 py-5 cursor-pointer"
                onClick={() =>
                  setExpandedCategoryId(
                    expandedCategoryId === cat.categoryId
                      ? null
                      : cat.categoryId
                  )
                }
              >
                <span className="text-xl font-semibold text-indigo-800">
                  {cat.name}
                  {cat.subCategories?.length > 0 && (
                    <span className="ml-2 text-sm text-indigo-500">
                      ({cat.subCategories.length} Subcategories)
                    </span>
                  )}
                </span>

                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditCategory(cat);
                      setShowEditModal(true);
                    }}
                    className="btn btn-sm btn-outline rounded-xl shadow-sm hover:shadow-md transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cat.categoryId);
                    }}
                    className="btn btn-sm btn-error rounded-xl shadow-sm hover:shadow-md transition"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubCategoryParentId(cat.categoryId);
                      setShowSubCategoryModal(true);
                    }}
                    className="btn btn-sm btn-accent rounded-xl shadow-sm hover:shadow-md transition"
                  >
                    ➕ Subcategory
                  </button>
                </div>
              </div>
              {expandedCategoryId === cat.categoryId &&
                cat.subCategories?.length > 0 && (
                  <div className="bg-indigo-50 px-10 py-6 text-gray-700 rounded-b-2xl border-t border-indigo-300 space-y-2">
                    <ul className="list-disc pl-6 space-y-2">
                      {cat.subCategories.map((sub) => (
                        <li
                          key={sub.categoryId}
                          className="flex justify-between items-center"
                        >
                          <span>{sub.name}</span>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-xs btn-outline rounded-xl shadow-sm"
                              onClick={() => {
                                setEditCategory(sub);
                                setShowEditModal(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-xs btn-error rounded-xl shadow-sm"
                              onClick={() => handleDelete(sub.categoryId)}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-6 rounded w-[300px] space-y-4">
              <h3 className="text-lg font-semibold">Edit Category</h3>
              <input
                value={editCategory.name}
                onChange={(e) =>
                  setEditCategory({ ...editCategory, name: e.target.value })
                }
                className="input input-bordered w-full"
              />
              <div className="flex justify-end gap-2">
                <button className="btn" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleEditCategory}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subcategory Modal */}
        {showSubCategoryModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-6 rounded w-[300px] space-y-4">
              <h3 className="text-lg font-semibold">Add Subcategory</h3>
              <input
                value={subCategoryName}
                onChange={(e) => setSubCategoryName(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Subcategory Name"
              />
              <div className="flex justify-end gap-2">
                <button
                  className="btn"
                  onClick={() => setShowSubCategoryModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddSubCategory}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}