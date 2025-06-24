import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const token = localStorage.getItem("authToken");

  const fetchSubscribers = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/newsletter", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSubscribers(res.data?.data?.subscribers || []);
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      Swal.fire("Error!", err?.response?.data?.message || "Failed to load subscribers", "error");
    }
  };

  const handleDelete = async (email) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete subscriber ${email}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete("https://test.api.dpmsign.com/api/newsletter", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: { email },
        });

        Swal.fire("Deleted!", "Subscriber removed successfully!", "success");
        fetchSubscribers();
      } catch (err) {
        console.error("Delete failed:", err);
        Swal.fire("Error!", err?.response?.data?.message || "Delete failed!", "error");
      }
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Newsletter Subscribers</h2>

      <div className="overflow-x-auto border rounded-lg">
        <table className="table table-zebra table-sm">
          <thead className="bg-base-200">
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Verified</th>
              <th>Subscribed At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber, index) => (
              <tr key={subscriber.email}>
                <td>{index + 1}</td>
                <td>{subscriber.email}</td>
                <td>
                  <span className={`badge ${subscriber.isVerified ? "badge-success" : "badge-error"}`}>
                    {subscriber.isVerified ? "Yes" : "No"}
                  </span>
                </td>
                <td>{new Date(subscriber.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleDelete(subscriber.email)}
                    className="btn btn-xs btn-error text-white"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  No subscribers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
