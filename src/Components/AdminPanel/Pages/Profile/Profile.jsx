import React, { useEffect, useState } from "react";
import axios from "axios"; // Import axios for API calls

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base URL for your API
  const API_BASE_URL = "https://test.api.dpmsign.com/api"; // IMPORTANT: Ensure this matches your actual API base URL

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      const savedAuthToken = localStorage.getItem("authToken");
      const savedUserData = localStorage.getItem("userData");

      if (
        !savedAuthToken ||
        !savedUserData ||
        savedUserData === "undefined" ||
        savedUserData === ""
      ) {
        setLoading(false);
        setError("User not logged in or authentication data is missing.");
        return;
      }

      let parsedUserData;
      try {
        parsedUserData = JSON.parse(savedUserData);
      } catch (err) {
        setLoading(false);
        setError(
          "Corrupted user data in local storage. Please clear local storage and try again."
        );
        console.error("Invalid JSON in userData:", err);
        return;
      }

      const { role } = parsedUserData; // Get the role from initial stored data

      try {
        let response;
        if (role === "admin") {
          // Admin can get their own info from /api/admin
          response = await axios.get(`${API_BASE_URL}/admin`, {
            headers: {
              Authorization: `Bearer ${savedAuthToken}`,
            },
          });

          // --- DEBUGGING LOG ---
          console.log("Admin API Response Data:", response.data);
          // --- END DEBUGGING LOG ---

          // Backend /api/admin might return an array of admins, or just the single authenticated admin.
          // We need to handle both cases.
          let fetchedAdminData = null;
          if (Array.isArray(response.data.data)) {
            // If it's an array, find the specific admin by email (or adminId)
            fetchedAdminData = response.data.data.find(
              (admin) => admin.email === parsedUserData.email
            );
          } else if (response.data.data) {
            // If it's a single object, assume it's the current admin's data
            fetchedAdminData = response.data.data;
          }

          if (fetchedAdminData) {
            setProfileData(fetchedAdminData);
          } else {
            setError("Admin profile not found in the response.");
          }
        } else if (role === "agent" || role === "designer") {
          // Staff can get their own info from /api/staff/me
          response = await axios.get(`${API_BASE_URL}/staff/me`, {
            headers: {
              Authorization: `Bearer ${savedAuthToken}`,
            },
          });

          // --- DEBUGGING LOG ---
          console.log("Staff API Response Data:", response.data);
          // --- END DEBUGGING LOG ---

          setProfileData(response.data.data); // Set the staff's own data
        } else {
          setError("Unknown user role. Cannot fetch profile.");
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        if (err.response) {
          // Log the full error response from the server for more details
          console.error("API Error Response:", err.response);
          setError(
            `Error fetching profile: ${
              err.response.data.message || "Failed to fetch data"
            }`
          );
        } else {
          setError(
            "Network error or server unavailable. Please check your internet connection or API server status."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 text-lg font-semibold">{error}</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 text-lg font-semibold">
          No profile data available after fetch.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Profile</h2>

      <div className="space-y-2 bg-base-200 p-4 rounded-md shadow">
        <p>
          <strong>ID:</strong> {profileData.adminId || profileData.staffId}
        </p>{" "}
        <p>
          <strong>Name:</strong> {profileData.name}
        </p>
        <p>
          <strong>Email:</strong> {profileData.email}
        </p>
        <p>
          <strong>Phone:</strong> {profileData.phone}
        </p>
        <p>
          <strong>Role:</strong> {profileData.role}
        </p>
        {/* Display avatar if available */}
        {profileData.avatar && profileData.avatar !== "null" && (
          <p>
            <strong>Avatar:</strong>{" "}
            <img
              src={`${API_BASE_URL.replace("/api", "")}/avatars/${
                profileData.avatar
              }`} // Adjust path to static files
              alt="User Avatar"
              className="w-16 h-16 rounded-full object-cover inline-block ml-2"
            />
          </p>
        )}
        {profileData.role === "admin" ? (
          <p className="text-green-500 font-semibold">
            আপনি একজন অ্যাডমিন, সব তথ্য দেখতে ও আপডেট করতে পারবেন।
          </p>
        ) : (
          <>
            <p>
              <strong>Commission Percentage:</strong>{" "}
              {profileData.commissionPercentage}%
            </p>
            {profileData.role === "designer" && (
              <p>
                <strong>Design Charge:</strong> {profileData.designCharge}
              </p>
            )}
            <p className="text-blue-500 font-semibold">
              আপনি একজন স্টাফ ({profileData.role}), আপনি নিজের প্রোফাইল আপডেট
              করতে পারবেন।
            </p>
          </>
        )}
      </div>
    </div>
  );
}
