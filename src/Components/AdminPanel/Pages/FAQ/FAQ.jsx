import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FiSearch, FiDownload, FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [faqTitle, setFaqTitle] = useState("");
  const [faqItems, setFaqItems] = useState([{ question: "", answer: "" }]);
  const [editingFaq, setEditingFaq] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("default"); // 'default', 'asc', 'desc'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const token = localStorage.getItem("authToken");
  const dropdownRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await axios.get(
        `https://test.api.dpmsign.com/api/faq?page=${page}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFaqs(res.data.data.faqs);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch FAQs", "error");
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [page]);

  useEffect(() => {
    let filtered = [...faqs];
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((faq) =>
        faq.faqTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortOrder === "asc") {
      filtered.sort((a, b) => a.faqTitle.localeCompare(b.faqTitle));
    } else if (sortOrder === "desc") {
      filtered.sort((a, b) => b.faqTitle.localeCompare(a.faqTitle));
    }
    setFilteredFaqs(filtered);
  }, [faqs, searchTerm, sortOrder]);

  const toggleCollapse = (faqId) => {
    setOpenFaqId((prev) => (prev === faqId ? null : faqId));
  };

  const handleAddFaqItem = () => {
    setFaqItems([...faqItems, { question: "", answer: "" }]);
  };

  const handleRemoveFaqItem = (index) => {
    if (faqItems.length === 1) return;
    const items = [...faqItems];
    items.splice(index, 1);
    setFaqItems(items);
  };

  const handleFaqItemChange = (index, field, value) => {
    const updatedItems = [...faqItems];
    updatedItems[index][field] = value;
    setFaqItems(updatedItems);
  };

  const resetForm = () => {
    setFaqTitle("");
    setFaqItems([{ question: "", answer: "" }]);
    setEditingFaq(null);
  };

  const handleCreateOrUpdateFaq = async () => {
    try {
      const payload = {
        faqTitle,
        faqItems,
      };

      if (editingFaq) {
        payload.faqId = editingFaq.faqId;
        payload.faqItems = faqItems.map((item, i) => ({
          ...item,
          faqItemId: editingFaq.faqItems[i]?.faqItemId,
        }));
        await axios.put("https://test.api.dpmsign.com/api/faq", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Updated!", "FAQ updated successfully!", "success");
      } else {
        await axios.post(
          "https://test.api.dpmsign.com/api/faq/create",
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        Swal.fire("Created!", "FAQ created successfully!", "success");
      }

      resetForm();
      fetchFaqs();
      setIsModalOpen(false);
    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message || "Failed to save FAQ",
        "error"
      );
    }
  };

  const handleDeleteFaq = async (faqId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to undo this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`https://test.api.dpmsign.com/api/faq/${faqId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Deleted!", "FAQ has been deleted.", "success");
        fetchFaqs();
      } catch (err) {
        Swal.fire("Error", "Failed to delete FAQ", "error");
      }
    }
  };

  const handleEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqTitle(faq.faqTitle);
    setFaqItems(
      faq.faqItems.map((item) => ({
        question: item.question,
        answer: item.answer,
      }))
    );
    setIsModalOpen(true);
  };

  const exportToExcel = () => {
    if (filteredFaqs.length === 0) {
      Swal.fire("Info", "No data to export", "info");
      return;
    }
    const dataToExport = filteredFaqs.map((faq) => ({
      "FAQ Title": faq.faqTitle,
      "Questions & Answers": faq.faqItems
        .map((item) => `${item.question}: ${item.answer}`)
        .join("; "),
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FAQs");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "FAQs.xlsx");
  };

  const exportToCSV = () => {
    if (filteredFaqs.length === 0) {
      Swal.fire("Info", "No data to export", "info");
      return;
    }
    const dataToExport = filteredFaqs.map((faq) => ({
      faqTitle: faq.faqTitle,
      faqItems: faq.faqItems
        .map((item) => `${item.question}: ${item.answer}`)
        .join("; "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "FAQs.csv");
  };

  const getSortLabel = () => {
    if (sortOrder === "asc") return "Sort: A → Z";
    if (sortOrder === "desc") return "Sort: Z → A";
    return "Sort: Default";
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-10">
        <h1 className="text-3xl font-extrabold text-center text-indigo-700 mb-10 tracking-wide">
          Frequently Asked Questions
        </h1>

        {/* Search + Sort + Export */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
          <div className="flex gap-4">
            <div className="relative w-full md:w-[200px]">
              <input
                type="text"
                placeholder="Search FAQs by Title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-300 pl-12 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm transition"
              />
              <FiSearch className="absolute left-4 top-2 text-gray-400" size={18} />
            </div>


            {/* Dropdown */}
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
                    className={`px-4 py-3 cursor-pointer hover:bg-indigo-100 rounded-t-xl ${sortOrder === "default" ? "font-semibold bg-indigo-50" : ""
                      }`}
                    onClick={() => {
                      setSortOrder("default");
                      setDropdownOpen(false);
                    }}
                  >
                    Default
                  </li>
                  <li
                    className={`px-4 py-3 cursor-pointer hover:bg-indigo-100 ${sortOrder === "asc" ? "font-semibold bg-indigo-50" : ""
                      }`}
                    onClick={() => {
                      setSortOrder("asc");
                      setDropdownOpen(false);
                    }}
                  >
                    Sort A → Z
                  </li>
                  <li
                    className={`px-4 py-3 cursor-pointer hover:bg-indigo-100 rounded-b-xl ${sortOrder === "desc" ? "font-semibold bg-indigo-50" : ""
                      }`}
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

          {/* Export buttons */}
          <div className="flex gap-4">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 shadow-md transition"
              title="Export to Excel"
            >
              <FiDownload size={18} />
              Export Excel
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 shadow-md transition"
              title="Export to CSV"
            >
              <FiDownload size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Create FAQ Form */}
        <div className="bg-indigo-50 rounded-xl px-8 py-4 mb-4 border border-indigo-200 shadow-inner">
          <h2 className="text-xl font-semibold text-indigo-800 mb-6">
            ➕ Create FAQ
          </h2>

          <input
            type="text"
            placeholder="Enter FAQ Title"
            value={faqTitle}
            onChange={(e) => setFaqTitle(e.target.value)}
            className="input input-bordered w-full rounded-xl mb-6 border-indigo-300 shadow-sm focus:ring-indigo-400"
            disabled={editingFaq !== null}
          />

          <div className="space-y-4 max-h-72 overflow-y-auto mb-6">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-4 items-center"
              >
                <input
                  type="text"
                  placeholder="Question"
                  value={item.question}
                  onChange={(e) =>
                    handleFaqItemChange(index, "question", e.target.value)
                  }
                  className="input input-bordered w-full rounded-xl border-indigo-300 shadow-sm"
                  disabled={editingFaq !== null}
                />
                <input
                  type="text"
                  placeholder="Answer"
                  value={item.answer}
                  onChange={(e) =>
                    handleFaqItemChange(index, "answer", e.target.value)
                  }
                  className="input input-bordered w-full rounded-xl border-indigo-300 shadow-sm"
                  disabled={editingFaq !== null}
                />
                <button
                  onClick={() => handleRemoveFaqItem(index)}
                  className="btn bg-rose-200 btn-sm rounded-xl shadow-md hover:shadow-lg transition"
                  disabled={faqItems.length === 1 || editingFaq !== null}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={handleAddFaqItem}
              className="btn btn-outline btn-sm rounded-xl px-6 shadow-md hover:shadow-lg transition"
              disabled={editingFaq !== null}
            >
              ➕ Add FAQ Item
            </button>
            <button
              onClick={handleCreateOrUpdateFaq}
              className="btn btn-info text-white btn-sm rounded-xl px-8 shadow-md hover:shadow-lg transition"
              disabled={editingFaq !== null}
            >
              Create FAQ
            </button>
            {editingFaq && (
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
                className="btn btn-outline btn-sm rounded-xl px-6 shadow-md hover:shadow-lg transition"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-indigo-700 mb-6">
            📋 All FAQs
          </h2>

          {filteredFaqs.length === 0 && (
            <p className="text-center text-gray-500 text-lg font-light">
              No FAQs found.
            </p>
          )}

          {filteredFaqs.map((faq) => (
            <div
              key={faq.faqId}
              className="bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <div
                className="flex justify-between items-center px-8 py-5"
                onClick={() => toggleCollapse(faq.faqId)}
              >
                <span className="text-xl font-semibold text-indigo-800">
                  {faq.faqTitle}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditFaq(faq);
                    }}
                    className="btn btn-sm btn-outline rounded-xl shadow-sm hover:shadow-md transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFaq(faq.faqId);
                    }}
                    className="btn btn-sm btn-error rounded-xl shadow-sm hover:shadow-md transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              {openFaqId === faq.faqId && (
                <div className="bg-indigo-50 px-10 py-6 text-gray-700 rounded-b-2xl border-t border-indigo-300 space-y-3 text-base font-medium select-text">
                  <ul className="list-disc pl-8 space-y-2">
                    {faq.faqItems.map((item, index) => (
                      <li key={index}>
                        <strong className="text-indigo-900">{item.question}</strong>
                        : {item.answer}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-6 mt-14">
          <button
            className={`rounded-full w-14 h-14 text-lg font-semibold transition ${page === 1
                ? "bg-gray-300 cursor-not-allowed text-gray-600"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              }`}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            ⬅
          </button>
          <span className="text-xl font-semibold text-indigo-700 select-none">
            Page {page} of {totalPages}
          </span>
          <button
            className={`rounded-full w-14 h-14 text-lg font-semibold transition ${page === totalPages
                ? "bg-gray-300 cursor-not-allowed text-gray-600"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              }`}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            ➡
          </button>
        </div>

        {/* Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-2xl max-w-3xl max-h-[90vh] overflow-auto shadow-xl">
              <h2 className="text-2xl font-semibold mb-6 text-indigo-700">
                ✏️ Edit FAQ
              </h2>

              <input
                type="text"
                placeholder="Enter FAQ Title"
                value={faqTitle}
                onChange={(e) => setFaqTitle(e.target.value)}
                className="input input-bordered w-full rounded-xl mb-6 border-indigo-300 shadow-sm focus:ring-indigo-400"
              />

              <div className="space-y-4 max-h-72 overflow-y-auto mb-6">
                {faqItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-4 items-center"
                  >
                    <input
                      type="text"
                      placeholder="Question"
                      value={item.question}
                      onChange={(e) =>
                        handleFaqItemChange(index, "question", e.target.value)
                      }
                      className="input input-bordered w-full rounded-xl border-indigo-300 shadow-sm"
                    />
                    <input
                      type="text"
                      placeholder="Answer"
                      value={item.answer}
                      onChange={(e) =>
                        handleFaqItemChange(index, "answer", e.target.value)
                      }
                      className="input input-bordered w-full rounded-xl border-indigo-300 shadow-sm"
                    />
                    <button
                      onClick={() => handleRemoveFaqItem(index)}
                      className="btn bg-rose-200 btn-sm rounded-xl shadow-md hover:shadow-lg transition"
                      disabled={faqItems.length === 1}
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-5">
                <button
                  onClick={handleAddFaqItem}
                  className="btn btn-outline btn-sm rounded-xl px-6 shadow-md hover:shadow-lg transition"
                >
                  ➕ Add FAQ Item
                </button>
                <button
                  onClick={handleCreateOrUpdateFaq}
                  className="btn btn-info text-white btn-sm rounded-xl px-8 shadow-md hover:shadow-lg transition"
                >
                  Update FAQ
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="btn btn-outline btn-sm rounded-xl px-6 shadow-md hover:shadow-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
