import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function StaffList({ staffList, userRole }) {
  const [loadingAvatarId, setLoadingAvatarId] = useState(null);
  const savedAuthToken = localStorage.getItem("authToken");

  const handleAvatarChange = async (e, staffId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("keepPreviousAvatar", "false");

    setLoadingAvatarId(staffId);
    try {
      const res = await axios.put(
        `https://test.api.dpmsign.com/api/staff/${staffId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${savedAuthToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      Swal.fire("Success", "Avatar updated successfully", "success");
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to update avatar",
        "error"
      );
    } finally {
      setLoadingAvatarId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h3 className="text-xl font-bold mb-4 text-gray-800">🧑‍💼 Staff List</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="table w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Avatar</th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Role</th>
              {userRole === "admin" && <th className="p-3">Commission %</th>}
              {userRole !== "admin" && <th className="p-3">Update Avatar</th>}
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff, index) => (
              <tr key={staff.staffId} className="hover:bg-gray-50 border-b">
                <td className="p-3 font-medium text-gray-700">{staff.staffId}</td>
                <td className="p-3">
                  {staff.avatar && staff.avatar !== "null" ? (
                    <img
                      src={`https://test.api.dpmsign.com/avatars/${staff.avatar}`}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full border border-blue-500 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                      {staff.name?.charAt(0)}
                    </div>
                  )}
                </td>
                <td className="p-3 text-gray-800">{staff.name}</td>
                <td className="p-3 text-gray-600">{staff.email}</td>
                <td className="p-3 text-gray-600">{staff.phone}</td>
                <td className="p-3 capitalize text-gray-700">{staff.role}</td>

                {userRole === "admin" ? (
                  <td className="p-3 text-gray-700">{staff.commissionPercentage}%</td>
                ) : (
                  <td className="p-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                      onChange={(e) => handleAvatarChange(e, staff.staffId)}
                      disabled={loadingAvatarId === staff.staffId}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
