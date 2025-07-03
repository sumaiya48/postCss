import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function AdminUpdateForm({ profileData, refreshProfile, onClose }) {
  const [formData, setFormData] = useState({
    name: profileData.name || "",
    phone: profileData.phone || "",
    currentPassword: "",
    newPassword: "",
    keepPreviousAvatar: "true",
    avatar: null,
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData((prev) => ({ ...prev, avatar: files[0], keepPreviousAvatar: "false" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.currentPassword) {
    return Swal.fire("Error", "Current password is required", "error");
  }

  try {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("phone", formData.phone);
    payload.append("currentPassword", formData.currentPassword);
    payload.append("newPassword", formData.newPassword || "");
    payload.append("keepPreviousAvatar", formData.keepPreviousAvatar);
    if (formData.avatar && formData.keepPreviousAvatar === "false") {
      payload.append("avatar", formData.avatar);
    }

    const res = await axios.put("https://test.api.dpmsign.com/api/admin", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    Swal.fire("Success", res.data.message, "success");

    // যেকোনো পরিবর্তনের পর লগআউট করো:
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    onClose();
    window.location.href = "/login";

  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.response?.data?.message || "Update failed", "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="font-semibold">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input input-bordered w-full"
            minLength={2}
            required
          />
        </div>
        <div>
          <label className="font-semibold">Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="017XXXXXXXX"
            required
          />
        </div>
        <div>
          <label className="font-semibold">Current Password</label>
          <div className="relative">
            <input
              type={showCurrentPass ? "text" : "password"}
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="input input-bordered w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPass((prev) => !prev)}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 text-sm"
            >
              {showCurrentPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <div>
          <label className="font-semibold">New Password (optional)</label>
          <div className="relative">
            <input
              type={showNewPass ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="input input-bordered w-full pr-10"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowNewPass((prev) => !prev)}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 text-sm"
            >
              {showNewPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <div>
          <label className="font-semibold">Change Avatar</label>
          <input
            type="file"
            accept="image/*"
            name="avatar"
            onChange={handleChange}
            className="file-input file-input-bordered w-full"
          />
          <label className="inline-flex items-center mt-2">
            <input
              type="checkbox"
              checked={formData.keepPreviousAvatar === "true"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  keepPreviousAvatar: e.target.checked ? "true" : "false",
                  avatar: e.target.checked ? null : prev.avatar,
                }))
              }
              className="checkbox"
            />
            <span className="ml-2">Keep previous avatar</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
