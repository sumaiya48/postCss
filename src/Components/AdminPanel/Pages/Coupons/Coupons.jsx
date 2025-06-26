import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEdit, FaTrash, FaPlus, FaFileExcel, FaFileCsv, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);

  const [form, setForm] = useState({
    name: "",
    code: "",
    discountType: "flat",
    amount: "",
    minimumAmount: "",
    startDate: "",
    startHour: "06",
    startMinute: "00",
    startPeriod: "AM",
    endDate: "",
    endHour: "06",
    endMinute: "00",
    endPeriod: "PM",
    isActive: true,
  });

  const token = localStorage.getItem("authToken");

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://test.api.dpmsign.com/api/coupon", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoupons(res.data?.data?.coupons || []);
    } catch {
      Swal.fire("Error!", "Failed to fetch coupons", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const combineDateTime = (date, hour, minute, period) => {
    const h = parseInt(hour);
    const finalHour = period === "PM" ? (h < 12 ? h + 12 : h) : h === 12 ? 0 : h;
    return new Date(`${date}T${finalHour.toString().padStart(2, "0")}:${minute}:00`).toISOString();
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm({
      name: "",
      code: "",
      discountType: "flat",
      amount: "",
      minimumAmount: "",
      startDate: "",
      startHour: "06",
      startMinute: "00",
      startPeriod: "AM",
      endDate: "",
      endHour: "06",
      endMinute: "00",
      endPeriod: "PM",
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);
    const to12HourFormat = (date) => {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return { hour: hours.toString().padStart(2, "0"), minute: minutes.toString().padStart(2, "0"), period };
    };
    const s = to12HourFormat(start);
    const e = to12HourFormat(end);
    setEditingCoupon(coupon);
    setForm({
      name: coupon.name,
      code: coupon.code,
      discountType: coupon.discountType,
      amount: coupon.amount,
      minimumAmount: coupon.minimumAmount,
      startDate: start.toISOString().slice(0, 10),
      startHour: s.hour,
      startMinute: s.minute,
      startPeriod: s.period,
      endDate: end.toISOString().slice(0, 10),
      endHour: e.hour,
      endMinute: e.minute,
      endPeriod: e.period,
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      discountType: form.discountType,
      amount: Number(form.amount),
      minimumAmount: Number(form.minimumAmount),
      startDate: combineDateTime(form.startDate, form.startHour, form.startMinute, form.startPeriod),
      endDate: combineDateTime(form.endDate, form.endHour, form.endMinute, form.endPeriod),
      isActive: form.isActive,
    };
    if (!editingCoupon) payload.code = form.code;
    try {
      if (editingCoupon) {
        await axios.put("https://test.api.dpmsign.com/api/coupon", { ...payload, couponId: editingCoupon.couponId }, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire("Updated!", "Coupon updated", "success");
      } else {
        await axios.post("https://test.api.dpmsign.com/api/coupon/create", payload, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire("Created!", "Coupon created", "success");
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      Swal.fire("Error!", err?.response?.data?.message || "Submit failed", "error");
    }
  };

  const handleDelete = async (couponId) => {
    const confirm = await Swal.fire({ title: "Are you sure?", icon: "warning", showCancelButton: true, confirmButtonText: "Yes" });
    if (confirm.isConfirmed) {
      await axios.delete(`https://test.api.dpmsign.com/api/coupon/${couponId}`, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire("Deleted!", "Coupon removed", "success");
      fetchCoupons();
    }
  };

  const handleStatusChange = async (couponId, newStatus) => {
    try {
      await axios.put("https://test.api.dpmsign.com/api/coupon", { couponId, isActive: newStatus === "Active" }, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire("Success!", "Coupon status updated", "success");
      fetchCoupons();
    } catch (error) {
      Swal.fire("Error!", "Failed to update status", "error");
    }
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const term = searchTerm.toLowerCase();
      const match = c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term);
      if (filterStatus === "active") return match && c.isActive;
      if (filterStatus === "inactive") return match && !c.isActive;
      return match;
    });
  }, [coupons, searchTerm, filterStatus]);

  const sortedCoupons = useMemo(() => {
    if (!sortField) return filteredCoupons;
    const sorted = [...filteredCoupons].sort((a, b) => {
      if (typeof a[sortField] === "string") {
        return sortDirection === "asc" ? a[sortField].localeCompare(b[sortField]) : b[sortField].localeCompare(a[sortField]);
      }
      return sortDirection === "asc" ? a[sortField] - b[sortField] : b[sortField] - a[sortField];
    });
    return sorted;
  }, [filteredCoupons, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedCoupons.length / rowsPerPage);
  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedCoupons.slice(start, start + rowsPerPage);
  }, [sortedCoupons, currentPage, rowsPerPage]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sortedCoupons);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Coupons");
    XLSX.writeFile(wb, "coupons.xlsx");
  };

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(sortedCoupons);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "coupons.csv";
    link.click();
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const changeTab = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold">Coupon Management</h2>
        <button className="btn btn-success flex items-center gap-2" onClick={openCreateModal}>
          <FaPlus /> Add Coupon
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Search by Name or Code..."
          className="input input-bordered w-full md:w-1/3"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="select select-bordered w-full md:w-1/4"
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
        >
          <option value="">Sort By (Select)</option>
          <option value="name">Name</option>
          <option value="code">Code</option>
          <option value="amount">Amount</option>
          <option value="minimumAmount">Minimum Purchase</option>
          <option value="discountType">Discount Type</option>
        </select>

        {/* Sort Direction */}
        <button
          onClick={toggleSortDirection}
          className={`btn btn-outline btn-sm ${!sortField && "opacity-50 cursor-not-allowed"}`}
          disabled={!sortField}
          title="Toggle Sort Direction"
        >
          {sortDirection === "asc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
        </button>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn btn-primary flex items-center gap-2">
            <FaFileExcel /> Export Excel
          </button>
          <button onClick={exportCSV} className="btn btn-secondary flex items-center gap-2">
            <FaFileCsv /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 pl-2 mt-8 mb-4">
        <button className={`btn btn-sm ${filterStatus === "all" ? "btn-primary" : "btn-outline"}`} onClick={() => changeTab("all")}>All</button>
        <button className={`btn btn-sm ${filterStatus === "active" ? "btn-success" : "btn-outline"}`} onClick={() => changeTab("active")}>Active</button>
        <button className={`btn btn-sm ${filterStatus === "inactive" ? "btn-error" : "btn-outline"}`} onClick={() => changeTab("inactive")}>Inactive</button>
      </div>
      <div className="p-6 max-w-7xl mx-auto">
      
      {loading ? (
        <p>Loading...</p>
      ) : paginatedCoupons.length === 0 ? (
        <p>No coupons found.</p>
      ) : (
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Minimum</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCoupons.map((coupon, idx) => (
              <tr key={coupon.couponId}>
                <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                <td>{coupon.name}</td>
                <td>{coupon.code}</td>
                <td>{coupon.discountType}</td>
                <td>{coupon.amount}</td>
                <td>{coupon.minimumAmount}</td>
                <td>{new Date(coupon.startDate).toLocaleString()}</td>
                <td>{new Date(coupon.endDate).toLocaleString()}</td>
                <td className="relative">
                  <details className="dropdown">
                    <summary
                      className={`btn btn-xs ${
                        coupon.isActive ? "btn-success" : "btn-error"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </summary>
                    <ul className="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-32">
                      <li>
                        <button
                          onClick={() => handleStatusChange(coupon.couponId, "Active")}
                          className="text-green-600 hover:bg-green-100"
                        >
                          Active
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleStatusChange(coupon.couponId, "Inactive")}
                          className="text-red-600 hover:bg-red-100"
                        >
                          Inactive
                        </button>
                      </li>
                    </ul>
                  </details>
                </td>
                <td className="flex gap-2">
                  <button
                    onClick={() => openEditModal(coupon)}
                    className="btn btn-sm btn-warning"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.couponId)}
                    className="btn btn-sm btn-error"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2">
        <button
          className="btn btn-sm"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`btn btn-sm ${currentPage === i + 1 ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="btn btn-sm"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[95vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold">Coupon Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Coupon Name"
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Coupon Code</label>
                <input
                  name="code"
                  value={form.code}
                  onChange={handleInputChange}
                  placeholder="Coupon Code"
                  className="input input-bordered w-full"
                  required
                  disabled={!!editingCoupon}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Discount Type</label>
                <select
                  name="discountType"
                  value={form.discountType}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                >
                  <option value="flat">Flat</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold">Discount Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleInputChange}
                  placeholder="Discount Amount"
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Minimum Purchase</label>
                <input
                  type="number"
                  name="minimumAmount"
                  value={form.minimumAmount}
                  onChange={handleInputChange}
                  placeholder="Minimum Purchase"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              {/* Start Date and Time */}
              <div>
                <label className="block mb-1 font-semibold">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="startHour"
                  min="1"
                  max="12"
                  value={form.startHour}
                  onChange={handleInputChange}
                  className="input input-bordered w-1/3"
                  required
                />
                <input
                  type="number"
                  name="startMinute"
                  min="0"
                  max="59"
                  value={form.startMinute}
                  onChange={handleInputChange}
                  className="input input-bordered w-1/3"
                  required
                />
                <select
                  name="startPeriod"
                  value={form.startPeriod}
                  onChange={handleInputChange}
                  className="select select-bordered w-1/3"
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>

              {/* End Date and Time */}
              <div>
                <label className="block mb-1 font-semibold">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="endHour"
                  min="1"
                  max="12"
                  value={form.endHour}
                  onChange={handleInputChange}
                  className="input input-bordered w-1/3"
                  required
                />
                <input
                  type="number"
                  name="endMinute"
                  min="0"
                  max="59"
                  value={form.endMinute}
                  onChange={handleInputChange}
                  className="input input-bordered w-1/3"
                  required
                />
                <select
                  name="endPeriod"
                  value={form.endPeriod}
                  onChange={handleInputChange}
                  className="select select-bordered w-1/3"
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleInputChange}
                  className="checkbox"
                />
                Active
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCoupon ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

  
