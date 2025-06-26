import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate, useParams, Link } from "react-router-dom";

export default function EditBlog() {
  const { blogId } = useParams();
  const [formData, setFormData] = useState({ title: "", content: "", bannerImg: null });
  const [existingImg, setExistingImg] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get("https://test.api.dpmsign.com/api/blog");
        const blog = res.data.data.blogs.find((b) => b.blogId === parseInt(blogId));
        if (!blog) {
          return Swal.fire("Not Found", "Blog not found", "warning");
        }
        setFormData({ title: blog.title, content: blog.content, bannerImg: null });
        setExistingImg(blog.bannerImg);
      } catch (err) {
        console.error(err);
        Swal.fire("Error!", "Failed to fetch blog.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [blogId]);

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
    body.append("blogId", blogId);
    body.append("title", formData.title);
    body.append("content", formData.content);
    if (formData.bannerImg) {
      body.append("bannerImg", formData.bannerImg);
    }

    try {
      await axios.put("https://test.api.dpmsign.com/api/blog", body, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      Swal.fire("Success!", "Blog updated successfully.", "success");
      navigate("/blogs");
    } catch (err) {
      console.error(err);
      Swal.fire("Error!", err.response?.data?.message || "Failed to update blog.", "error");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Edit Blog</h2>
        <div className="flex gap-2">
          <Link to="/blogs">
            <button className="btn btn-sm btn-outline btn-secondary">See All Blogs</button>
          </Link>
          <Link to="/add-blog">
            <button className="btn btn-sm btn-outline btn-primary">Create Blog</button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter blog title"
            required
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Enter content (Markdown supported)"
            rows="10"
            required
            className="textarea textarea-bordered w-full"
          ></textarea>
        </div>

        {existingImg && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Banner</label>
            <img
              src={`https://test.api.dpmsign.com/static/blog-images/${existingImg}`}
              alt="Current Banner"
              className="w-full max-h-64 object-cover rounded border"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Banner (Optional)</label>
          <input
            type="file"
            name="bannerImg"
            accept="image/*"
            onChange={handleChange}
            className="file-input file-input-bordered w-full"
          />
        </div>

        <button type="submit" className="btn btn-success w-full mt-4">
          Update Blog
        </button>
      </form>
    </div>
  );
}
