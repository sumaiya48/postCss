import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AdminUpdateForm from "./AdminUpdateForm";
import StaffList from "./StaffList";

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const API_BASE_URL = "https://test.api.dpmsign.com/api";

  const savedAuthToken = localStorage.getItem("authToken");
  const savedUserData = localStorage.getItem("userData");

  // useCallback দিয়ে fetchData বানানো - যেটা রিফ্রেশে ব্যবহার করা যাবে
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!savedAuthToken || !savedUserData || savedUserData === "undefined") {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(savedUserData);
    } catch (err) {
      setError("Corrupted user data. Please re-login.");
      localStorage.removeItem("userData");
      setLoading(false);
      return;
    }

    const { role } = parsedUser;

    try {
      if (role === "admin") {
        // Get admin profile
        const res = await axios.get(`${API_BASE_URL}/admin`, {
          headers: { Authorization: `Bearer ${savedAuthToken}` },
        });

        let fetched = res.data.data;
        if (Array.isArray(fetched)) {
          fetched = fetched.find((admin) => admin.email === parsedUser.email);
        }

        setProfileData(fetched || null);
      }

      if (role === "agent" || role === "designer") {
        setProfileData(null);
      }

      // Get staff list for all
      const staffRes = await axios.get(`${API_BASE_URL}/staff`, {
        headers: { Authorization: `Bearer ${savedAuthToken}` },
      });

      setStaffList(staffRes.data.data.staff || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [savedAuthToken, savedUserData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {profileData && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <div className="flex items-center gap-6">
            <div>
              {profileData.avatar && profileData.avatar !== "null" ? (
                <img
                  src={`https://test.api.dpmsign.com/avatars/${profileData.avatar}`}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-500">
                  {profileData.name?.charAt(0) || "A"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{profileData.name}</h2>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Email:</strong> {profileData.email}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Phone:</strong> {profileData.phone}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Role:</strong>{" "}
                <span className="capitalize">{profileData.role}</span>
              </p>
              <p className="text-green-600 font-medium mt-2">
                ✅ আপনি একজন অ্যাডমিন। আপনি নিজের তথ্য আপডেট করতে পারবেন।
              </p>
            </div>
            <div>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-outline btn-sm"
              >
                ✏️ Update Profile
              </button>
            </div>
          </div>

        {showModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
      <button
        className="absolute top-2 right-2 text-gray-600"
        onClick={() => setShowModal(false)}
      >
        ❌
      </button>
      <AdminUpdateForm
        profileData={profileData}
        refreshProfile={fetchData}
        onClose={() => setShowModal(false)}
      />
    </div>
  </div>
)}

        </div>
      )}

      {/* Staff List */}
      <StaffList 
      staffList={staffList}
      userRole={profileData?.role || JSON.parse(savedUserData)?.role}
      ></StaffList>
    </div>
  );
}
