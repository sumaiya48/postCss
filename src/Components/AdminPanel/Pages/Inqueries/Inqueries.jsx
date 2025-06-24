import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEye, FaTrash } from "react-icons/fa";

export default function Inqueries() {
  const [inqueries, setInqueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const itemsPerPage = 10;
  const token = localStorage.getItem("authToken");

  const fetchInqueries = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/inquery", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInqueries(res.data?.data?.inqueries || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", "Failed to load inquiries.", "error");
    } finally {
      setLoading(false);
    }
  };
 
  const toggleStatus = async (inqueryId, currentStatus) => {
    try {
      const newStatus = currentStatus === "open" ? "close" : "open";
      await axios.get(`https://test.api.dpmsign.com/api/inquery/${newStatus}?inqueryId=${inqueryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Success!", `Inquiry marked as ${newStatus}.`, "success");
      fetchInqueries();
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", "Failed to update status.", "error");
    }
  };

  const handleDelete = async (inqueryId, phone) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `This inquiry will be deleted.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        await axios.delete("https://test.api.dpmsign.com/api/inquery", {
          headers: { Authorization: `Bearer ${token}` },
          data: { inqueryId: Number(inqueryId), phone },
        });
        Swal.fire("Deleted!", "Inquiry removed.", "success");
        fetchInqueries();
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", "Failed to delete inquiry.", "error");
    }
  };

  useEffect(() => {
    fetchInqueries();
  }, []);

  // Search & pagination
  const filteredInqueries = inqueries
  .filter(
    (i) =>
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.email?.toLowerCase().includes(search.toLowerCase()) ||
      i.phone?.includes(search)
  )
  .filter((i) => (statusFilter === "all" ? true : i.status === statusFilter));


  const totalPages = Math.ceil(filteredInqueries.length / itemsPerPage);
  const currentData = filteredInqueries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
  <h2 className="text-2xl font-bold">All Inquiries</h2>

  <div className="flex gap-2">
    <input
      type="text"
      className="input input-bordered input-sm w-64"
      placeholder="Search name/email/phone"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="select select-bordered select-sm"
    >
      <option value="all">All</option>
      <option value="open">Open</option>
      <option value="closed">Closed</option>
    </select>
  </div>
</div>

      

      {loading ? (
        <p>Loading...</p>
      ) : currentData.length === 0 ? (
        <p>No inquiries found.</p>
      ) : (
        <div className="overflow-x-auto shadow border rounded-lg">
          <table className="min-w-full bg-white divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-center">Change Status</th>
                <th className="px-4 py-2 text-center">View</th>
                <th className="px-4 py-2 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentData.map((inq, idx) => (
                <tr key={inq.inqueryId} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td className="px-4 py-2">{inq.name || "null"}</td>
                  <td className="px-4 py-2">{inq.email || "null"}</td>
                  <td className="px-4 py-2">{inq.phone || "null"}</td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        inq.status === "open"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {inq.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <select
                      value={inq.status}
                      onChange={() => toggleStatus(inq.inqueryId, inq.status)}
                      className="select select-sm select-bordered"
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => setSelected(inq)}
                    >
                      <FaEye />
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => handleDelete(inq.inqueryId, inq.phone)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`btn btn-sm ${
                  currentPage === i + 1 ? "btn-primary" : "btn-outline"
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-lg p-6 shadow-lg relative max-h-[90vh] overflow-y-auto text-left">
            <h3 className="text-xl font-bold mb-2">Inquiry Details</h3>
            <p><strong>Name:</strong> {selected.name || "null"}</p>
            <p><strong>Email:</strong> {selected.email || "null"}</p>
            <p><strong>Phone:</strong> {selected.phone || "null"}</p>
            <p><strong>Company:</strong> {selected.company || "null"}</p>
            <p><strong>Inquiry Type:</strong> {selected.inqueryType || "null"}</p>
            <p><strong>Status:</strong> {selected.status}</p>
            <p><strong>Created At:</strong> {formatDate(selected.createdAt)}</p>
            <p><strong>Updated At:</strong> {formatDate(selected.updatedAt)}</p>
            <p className="mt-2 whitespace-pre-line"><strong>Message:</strong><br />{selected.message || "null"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.images?.length > 0 ? (
                selected.images.map((img) => (
                  <img
                    key={img.imageId}
                    src={`https://test.api.dpmsign.com/static/inqueries/${img.imageName}`}
                    alt="design"
                    className="w-24 h-24 object-cover rounded"
                  />
                ))
              ) : (
                <p>No images</p>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="btn btn-secondary mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
