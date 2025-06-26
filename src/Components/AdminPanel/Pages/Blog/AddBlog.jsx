import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AddBlog() {
  const [formData, setFormData] = useState({ title: "", content: "", bannerImg: null });
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = new FormData();
    body.append("title", formData.title);
    body.append("content", formData.content);
    if (formData.bannerImg) {
      body.append("bannerImg", formData.bannerImg);
    }

    try {
      await axios.post("https://test.api.dpmsign.com/api/blog", body, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      Swal.fire("Success!", "Blog created successfully.", "success");
      navigate("/blogs");
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", "Failed to create blog.", "error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Add New Blog</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Blog Title"
          required
          className="input input-bordered w-full"
        />
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Content (Markdown supported)"
          required
          rows="10"
          className="textarea textarea-bordered w-full"
        ></textarea>
        <input
          type="file"
          name="bannerImg"
          accept="image/*"
          onChange={handleChange}
          className="file-input file-input-bordered w-full"
        />
        <button type="submit" className="btn btn-primary">Create Blog</button>
      </form>
    </div>
  );
}
