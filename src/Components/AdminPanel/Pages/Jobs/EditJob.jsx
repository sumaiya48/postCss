import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function EditJob() {
  const [form, setForm] = useState({
    jobId: "",
    title: "",
    content: "",
    jobLocation: "",
    applicationUrl: "",
    status: "open",
  });

  const { jobId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get("https://test.api.dpmsign.com/api/job");
        const job = res.data.data.jobs.find((j) => j.jobId === Number(jobId));
        if (job) setForm(job);
        else Swal.fire("Not Found", "Job not found", "error");
      } catch {
        Swal.fire("Error!", "Failed to load job.", "error");
      }
    };

    if (jobId) fetchJob();
  }, [jobId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      jobId: Number(form.jobId),
      title: form.title,
      content: form.content,
      jobLocation: form.jobLocation,
      applicationUrl: form.applicationUrl,
      status: form.status,
    };

    try {
      await axios.put("https://test.api.dpmsign.com/api/job", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Updated!", "Job updated successfully.", "success");
      navigate("/jobs");
    } catch (err) {
      console.error("Update job error:", err.response?.data || err.message);
      Swal.fire(
        "Error!",
        err.response?.data?.message || "Failed to update job.",
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Edit Job</h2>
          <div className="space-x-2">
            <button
              onClick={() => navigate("/jobs")}
              className="btn btn-outline btn-sm"
            >
              See All Jobs
            </button>
            <button
              onClick={() => navigate("/create-job")}
              className="btn btn-outline btn-sm"
            >
              Post New Job
            </button>
          </div>
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
              placeholder="Enter location"
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
              placeholder="Enter application URL"
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
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <button type="submit" className="btn btn-primary w-full">
              Update Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
