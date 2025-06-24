import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function ProductReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("authToken");

  const fetchReviews = async () => {
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/product-review", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReviews(res.data.data.reviews || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      Swal.fire("Error!", "Failed to fetch reviews.", "error");
    } finally {
      setLoading(false);
    }
  };

 const handleStatusChange = async (reviewId, currentStatus) => {
  const { value: newStatus } = await Swal.fire({
    title: "Change Review Status",
    input: "select",
    inputOptions: {
      published: "Published",
      unpublished: "Unpublished",
    },
    inputValue: currentStatus,
    showCancelButton: true,
    confirmButtonText: "Update",
  });

  if (!newStatus || newStatus === currentStatus) return;

  try {
    await axios.put(
      "https://test.api.dpmsign.com/api/product-review",
      {
        reviewId: Number(reviewId),  // <-- use reviewId here
        status: newStatus,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    Swal.fire("Updated!", "Review status updated.", "success");
    fetchReviews();
  } catch (err) {
    console.error("Error updating review status:", err?.response?.data || err);
    Swal.fire("Error!", "Failed to update status.", "error");
  }
};



  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-base-200">
      <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>

      {loading ? (
        <p className="text-center">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-center text-gray-500">No reviews found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-300">
              <tr>
                <th>Customer Name</th>
                <th>Email</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Description</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.reviewId}>
                  <td>{review.customer?.name || "N/A"}</td>
                  <td>{review.customer?.email || "N/A"}</td>
                  <td>{review.product?.name || "N/A"}</td>
                  <td>{review.rating} / 5</td>
                  <td className="max-w-xs whitespace-pre-wrap">{review.description}</td>
                  <td>
                    <span
                      className={`badge ${
                        review.status === "published"
                          ? "badge-success"
                          : "badge-error"
                      }`}
                    >
                      {review.status}
                    </span>
                  </td>
                  <td>{new Date(review.createdAt).toLocaleDateString("en-GB")}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline btn-primary"
                      onClick={() => handleStatusChange(review.reviewId, review.status)}
                    >
                      Edit Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-sm text-gray-500 mt-2">
            Showing {reviews.length} reviews
          </p>
        </div>
      )}
    </div>
  );
}
