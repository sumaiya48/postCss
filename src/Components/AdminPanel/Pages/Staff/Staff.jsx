import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "agent",
    commissionPercentage: 1,
    designCharge: null,
    status: "offline",
  });

  const [editingStaff, setEditingStaff] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  const fetchStaff = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/staff", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStaffList(res.data?.data?.staff || []);
      setCurrentPage(1); // reset to first page on new data
    } catch (err) {
      console.error("Error fetching staff:", err);
      Swal.fire(
        "Error!",
        err?.response?.data?.message || "Failed to fetch staff!",
        "error"
      );
    }
  };

  useEffect(() => {
    if (!token) {
      Swal.fire("Unauthorized", "Please login first!", "error");
      navigate("/login");
    } else {
      fetchStaff();
    }
  }, [token]);

  // Existing add/update/delete handlers (unchanged) ...
  const handleAddStaff = async () => {
    try {
      const payload = { ...newStaff };
      delete payload.status;

      if (payload.role === "designer") {
        if (!payload.designCharge || Number(payload.designCharge) <= 0) {
          Swal.fire("Error", "Designer must have a designCharge.", "warning");
          return;
        }
      } else {
        delete payload.designCharge;
      }

      await axios.post("https://test.api.dpmsign.com/api/staff/register", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.fire("Success!", "Staff added successfully!", "success");
      fetchStaff();
      setNewStaff({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "agent",
        commissionPercentage: 1,
        designCharge: null,
        status: "offline",
      });
    } catch (err) {
      console.error("Failed to add staff:", err);
      Swal.fire("Error!", err?.response?.data?.message || "Failed to add staff!", "error");
    }
  };

  const handleUpdateStaff = async () => {
    try {
      const payload = {
        name: editingStaff.name,
        email: editingStaff.email,
        phone: editingStaff.phone,
        role: editingStaff.role,
        commissionPercentage: editingStaff.commissionPercentage,
        designCharge: editingStaff.role === "designer" ? editingStaff.designCharge : null,
      };

      await axios.put("https://test.api.dpmsign.com/api/staff/update", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      Swal.fire("Success!", "Staff updated successfully!", "success");
      setEditingStaff(null);
      fetchStaff();
    } catch (err) {
      console.error("Failed to update staff:", err);
      Swal.fire("Error!", err?.response?.data?.message || "Failed to update staff!", "error");
    }
  };

  const handleDeleteStaff = async (staffToDelete) => {
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
        const deletePayload = {
          staffId: Number(staffToDelete.staffId),
          email: staffToDelete.email,
          role: staffToDelete.role,
        };

        await axios.post(
          "https://test.api.dpmsign.com/api/staff/delete-verified",
          deletePayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        Swal.fire("Deleted!", "Staff removed successfully!", "success");
        fetchStaff();
      }
    } catch (err) {
      console.error("Failed to delete staff:", err);
      Swal.fire("Error!", err?.response?.data?.message || "Failed to delete staff!", "error");
    }
  };

  // Calculate total pages and slice staff for current page
  const totalPages = Math.ceil(staffList.length / itemsPerPage);
  const displayedStaff = staffList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pagination navigation buttons (Previous, Next, and page numbers)
  const renderPagination = () => {
    if (totalPages <= 1) return null; // No pagination if only 1 page

    // Helper: create an array of page numbers for buttons (e.g. 1, 2, 3 ... totalPages)
    // For large number of pages, could add more logic to limit page buttons shown,
    // but here let's show all for simplicity.
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <nav className="mt-6 flex justify-center items-center space-x-2" aria-label="Pagination">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Previous
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded-md border border-gray-300 ${
              page === currentPage
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Next
        </button>
      </nav>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Add New Staff Form */}
      <h2 className="text-2xl font-bold mb-4">Add New Staff</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Input fields for newStaff */}
        <input
          type="text"
          placeholder="Name"
          value={newStaff.name}
          onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={newStaff.email}
          onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Phone"
          value={newStaff.phone}
          onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={newStaff.password}
          onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={newStaff.role}
          onChange={(e) =>
            setNewStaff({
              ...newStaff,
              role: e.target.value,
              designCharge: e.target.value === "designer" ? "" : null,
            })
          }
          className="border p-2 rounded"
        >
          <option value="agent">Agent</option>
          <option value="designer">Designer</option>
        </select>
        <input
          type="number"
          placeholder="Commission %"
          value={newStaff.commissionPercentage}
          onChange={(e) =>
            setNewStaff({
              ...newStaff,
              commissionPercentage: Number(e.target.value),
            })
          }
          className="border p-2 rounded"
          min={0}
          max={100}
        />
        {newStaff.role === "designer" && (
          <input
            type="number"
            placeholder="Design Charge"
            value={newStaff.designCharge || ""}
            onChange={(e) =>
              setNewStaff({
                ...newStaff,
                designCharge: Number(e.target.value),
              })
            }
            className="border p-2 rounded"
            min={0}
          />
        )}
        <select
          value={newStaff.status}
          onChange={(e) => setNewStaff({ ...newStaff, status: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="offline">Offline</option>
          <option value="online">Online</option>
        </select>
      </div>
      <button
        onClick={handleAddStaff}
        className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
      >
        Add Staff
      </button>

      <hr className="my-8" />

      {/* Edit Staff Form */}
      {editingStaff && (
        <div className="border p-4 rounded bg-gray-50 mb-6 shadow">
          <h2 className="text-xl font-bold mb-3">Update Staff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <input
              type="text"
              placeholder="Name"
              value={editingStaff.name}
              onChange={(e) =>
                setEditingStaff({ ...editingStaff, name: e.target.value })
              }
              className="border p-2 rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={editingStaff.email}
              onChange={(e) =>
                setEditingStaff({ ...editingStaff, email: e.target.value })
              }
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Phone"
              value={editingStaff.phone}
              onChange={(e) =>
                setEditingStaff({ ...editingStaff, phone: e.target.value })
              }
              className="border p-2 rounded"
            />
            <select
              value={editingStaff.role}
              onChange={(e) =>
                setEditingStaff({
                  ...editingStaff,
                  role: e.target.value,
                  designCharge:
                    e.target.value === "designer"
                      ? editingStaff.designCharge || ""
                      : null,
                })
              }
              className="border p-2 rounded"
            >
              <option value="agent">Agent</option>
              <option value="designer">Designer</option>
            </select>
            <input
              type="number"
              placeholder="Commission %"
              value={editingStaff.commissionPercentage}
              onChange={(e) =>
                setEditingStaff({
                  ...editingStaff,
                  commissionPercentage: Number(e.target.value),
                })
              }
              className="border p-2 rounded"
              min={0}
              max={100}
            />
            {editingStaff.role === "designer" && (
              <input
                type="number"
                placeholder="Design Charge"
                value={editingStaff.designCharge || ""}
                onChange={(e) =>
                  setEditingStaff({
                    ...editingStaff,
                    designCharge: Number(e.target.value),
                  })
                }
                className="border p-2 rounded"
                min={0}
              />
            )}
          </div>
          <button
            onClick={handleUpdateStaff}
            className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition"
          >
            Update Staff
          </button>
          <button
            onClick={() => setEditingStaff(null)}
            className="ml-3 bg-gray-400 text-white px-5 py-2 rounded hover:bg-gray-500 transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Staff List */}
      <h2 className="text-2xl font-bold mb-4">Staff List</h2>
      <div className="space-y-3">
        {displayedStaff.length > 0 ? (
          displayedStaff.map((staff) => (
            <div
              key={staff.staffId}
              className="border p-4 rounded flex justify-between items-center shadow-sm hover:shadow-md transition"
            >
              <div>
                <p className="font-semibold text-lg">{staff.name}</p>
                <p className="text-gray-700">{staff.email}</p>
                <p className="text-gray-700">Phone: {staff.phone}</p>
                <p className="text-gray-700">Role: {staff.role}</p>
                <p className="text-gray-700">
                  Status:{" "}
                  <span
                    className={
                      staff.status === "online"
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {staff.status}
                  </span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingStaff(staff)}
                  className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteStaff(staff)}
                  className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-10">No staff found.</p>
        )}
      </div>

      {/* Pagination Controls */}
      {renderPagination()}
    </div>
  );
}
