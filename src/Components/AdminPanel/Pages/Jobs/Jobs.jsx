import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function JobsTable() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/job");
      setJobs(res.data.data.jobs || []);
    } catch {
      Swal.fire("Error!", "Failed to load jobs.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (jobId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This job will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    if (!token) {
      Swal.fire("Error!", "You must be logged in as admin to delete jobs.", "error");
      return;
    }

    try {
      await axios.delete(`https://test.api.dpmsign.com/api/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Deleted!", "Job has been deleted.", "success");
      fetchJobs();
    } catch (err) {
      const response = err.response;
      if (response?.status === 404) {
        Swal.fire("Error!", "Job not found or already deleted.", "error");
      } else if (response?.status === 401 || response?.status === 403) {
        Swal.fire("Unauthorized!", "You don't have permission to delete jobs.", "error");
      } else {
        Swal.fire("Error!", response?.data?.message || "Failed to delete job.", "error");
      }
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await axios.put(
        `https://test.api.dpmsign.com/api/job`,
        { jobId, status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Swal.fire("Success!", `Status updated to "${newStatus}".`, "success");
      fetchJobs();
    } catch (err) {
      Swal.fire(
        "Error!",
        err.response?.data?.message || "Failed to update status.",
        "error"
      );
    }
  };

  const truncate = (str, max = 20) =>
    str.length > max ? str.slice(0, max) + "..." : str;

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="p-6 bg-base-200 min-h-screen max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">Job Openings</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/create-job")}
        >
          + Post Job
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-center text-gray-600">No jobs found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Job Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Location</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Change Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">View Details</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Edit</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.jobId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">{job.title}</td>
                  <td className="px-4 py-3">{truncate(job.jobLocation)}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        job.status === "open"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job.jobId, e.target.value)}
                      className="select select-sm select-bordered"
                    >
                      <option value="open">open</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => setSelectedJob(job)}
                    >
                      <FaEye />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => navigate(`/edit-job/${job.jobId}`)}
                    >
                      <FaEdit />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="btn btn-error btn-sm"
                      onClick={() => handleDelete(job.jobId)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for viewing job details */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 mx-4 max-h-[90vh] overflow-y-auto relative">
            <h3 className="text-2xl font-bold mb-4">{selectedJob.title}</h3>
            <p className="mb-2 text-gray-700 font-semibold">
              Location: {selectedJob.jobLocation}
            </p>
            <div
              className="mb-4 text-gray-700"
              dangerouslySetInnerHTML={{
                __html: selectedJob.content.replace(/\n/g, "<br />"),
              }}
            />
            <p className="mb-4">
              <a
                href={selectedJob.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Apply Here
              </a>
            </p>
            <p className="mb-4">
              Status:{" "}
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedJob.status === "open"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedJob.status}
              </span>
            </p>
            <button
              onClick={() => setSelectedJob(null)}
              className="btn btn-secondary absolute top-4 right-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
