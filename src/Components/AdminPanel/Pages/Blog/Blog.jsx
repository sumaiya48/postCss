import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEye, FaTrash, FaEdit, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    let temp = blogs.filter(b =>
      b.title.toLowerCase().includes(search.toLowerCase())
    );
    switch (sortType) {
      case "az":
        temp.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "za":
        temp.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "oldest":
        temp.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "newest":
        temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
    }
    setFiltered(temp);
    setCurrentPage(1);
  }, [search, sortType, blogs]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://test.api.dpmsign.com/api/blog");
      setBlogs(res.data.data.blogs || []);
    } catch (err) {
      Swal.fire("Error!", "Failed to fetch blogs.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This blog will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`https://test.api.dpmsign.com/api/blog/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Deleted!", "Blog removed.", "success");
      fetchBlogs();
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Delete failed.", "error");
    }
  };

  const formatDate = date =>
    new Date(date).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold">Blogs</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="search"
            placeholder="Search title..."
            className="input input-bordered input-sm w-60"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="select select-bordered select-sm"
            value={sortType}
            onChange={e => setSortType(e.target.value)}
          >
            <option value="default">Sort By</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="oldest">Oldest</option>
            <option value="newest">Newest</option>
          </select>
          {token && (
            <button
              className="btn btn-primary btn-sm flex items-center gap-2"
              onClick={() => navigate("/add-blog")}
            >
              <FaPlus /> Add Blog
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p>Loading...</p>
      ) : !currentData.length ? (
        <p>No blogs found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentData.map(blog => (
            <div
              key={blog.blogId}
              className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
            >
              <img
                src={`https://test.api.dpmsign.com/static/blog-images/${blog.bannerImg}`}
                alt="banner"
                className="h-48 w-full object-cover"
              />
              <div className="p-4 flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-2">
                  {blog.title}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {formatDate(blog.createdAt)}
                </p>
                <div className="mt-auto flex gap-2">
                  <button
                    className="btn btn-info btn-sm flex-1"
                    onClick={() => setSelected(blog)}
                  >
                    <FaEye /> View
                  </button>
                  {token && (
                    <>
                      <button
                        className="btn btn-warning btn-sm flex-1"
                        onClick={() => navigate(`/edit-blog/${blog.blogId}`)}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="btn btn-error btn-sm flex-1"
                        onClick={() => handleDelete(blog.blogId)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`btn btn-sm ${currentPage === i + 1 ? "btn-primary" : "btn-outline"}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-2">{selected.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{formatDate(selected.createdAt)}</p>
            <img
              src={`https://test.api.dpmsign.com/static/blog-images/${selected.bannerImg}`}
              alt="Banner"
              className="w-full h-64 object-cover rounded mb-4"
            />
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: selected.content }}
            />
            <button
              className="btn btn-secondary mt-6"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
