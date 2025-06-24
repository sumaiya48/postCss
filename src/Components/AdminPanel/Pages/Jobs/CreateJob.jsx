import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function CreateJob() {
  const [form, setForm] = useState({
    title: "",
    content: "",
    jobLocation: "",
    applicationUrl: "",
    status: "open", // default value
  });

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = { ...form };

      await axios.post("https://test.api.dpmsign.com/api/job", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.fire("Success!", "Job posted successfully.", "success");
      navigate("/jobs");
    } catch (err) {
      console.error("Create job error:", err.response?.data || err.message);
      Swal.fire(
        "Error!",
        err.response?.data?.message || "Failed to post job.",
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Post a New Job</h2>
          <button
            onClick={() => navigate("/jobs")}
            className="btn btn-outline btn-sm"
          >
            See All Jobs
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="label font-medium text-gray-700">Job Title</label>
            <input
              name="title"
              className="input input-bordered w-full"
              placeholder="Enter job title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label font-medium text-gray-700">Description</label>
            <textarea
              name="content"
              className="textarea textarea-bordered w-full"
              placeholder="Enter job description"
              value={form.content}
              onChange={handleChange}
              rows={6}
              required
            />
          </div>

          <div>
            <label className="label font-medium text-gray-700">Location</label>
            <input
              name="jobLocation"
              className="input input-bordered w-full"
              placeholder="Enter job location"
              value={form.jobLocation}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label font-medium text-gray-700">Application URL</label>
            <input
              name="applicationUrl"
              className="input input-bordered w-full"
              placeholder="Paste application URL"
              value={form.applicationUrl}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label font-medium text-gray-700">Status</label>
            <select
              name="status"
              className="select select-bordered w-full"
              value={form.status}
              onChange={handleChange}
              required
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <button type="submit" className="btn btn-primary w-full">
              Post Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
