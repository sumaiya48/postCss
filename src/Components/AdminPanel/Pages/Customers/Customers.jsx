import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const itemsPerPage = 10;

  const token = localStorage.getItem("authToken");

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/customer", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(res.data.data.customers || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
      Swal.fire("Error!", "Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const match =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    if (filterTab === "verified") return c.verified && match;
    if (filterTab === "nonverified") return !c.verified && match;
    return match;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Customer List</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button className={`btn btn-sm ${filterTab === "all" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilterTab("all")}>All</button>
        <button className={`btn btn-sm ${filterTab === "verified" ? "btn-success" : "btn-outline"}`} onClick={() => setFilterTab("verified")}>Verified</button>
        <button className={`btn btn-sm ${filterTab === "nonverified" ? "btn-error" : "btn-outline"}`} onClick={() => setFilterTab("nonverified")}>Non-Verified</button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, email, or phone"
        className="input input-bordered w-full max-w-md mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <p>Loading...</p>
      ) : filteredCustomers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="table w-full">
            <thead className="bg-base-300 text-gray-700">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Verified</th>
                <th>View Details</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.map((c, index) => (
                <tr key={c.customerId}>
                  <td>{indexOfFirst + index + 1}</td>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>
                    {c.verified ? (
                      <span className="badge badge-success">Yes</span>
                    ) : (
                      <span className="badge badge-error">No</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-4 flex justify-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`btn btn-xs ${currentPage === i + 1 ? "btn-primary" : "btn-outline"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Customer Details</h3>
            <p><strong>Name:</strong> {selectedCustomer.name}</p>
            <p><strong>Email:</strong> {selectedCustomer.email}</p>
            <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
            <p><strong>Verified:</strong> {selectedCustomer.verified ? "Yes" : "No"}</p>
            <p><strong>Billing Address:</strong> {selectedCustomer.billingAddress || "N/A"}</p>
            <p><strong>Shipping Address:</strong> {selectedCustomer.shippingAddress || "N/A"}</p>
            <p><strong>Created At:</strong> {new Date(selectedCustomer.createdAt).toLocaleString()}</p>
            <p><strong>Updated At:</strong> {new Date(selectedCustomer.updatedAt).toLocaleString()}</p>

            <div className="mt-4 text-right">
              <button
                className="btn btn-sm btn-error"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
