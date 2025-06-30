import React, { useEffect, useState } from "react";

export default function Profile() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("userData");

    // handle cases like "undefined" or empty string
    if (savedUser && savedUser !== "undefined" && savedUser !== "") {
      try {
        const parsed = JSON.parse(savedUser);
        setUserData(parsed);
      } catch (err) {
        console.error("Invalid JSON in userData:", err);
        setUserData(null);
      }
    }
  }, []);

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 text-lg font-semibold">
          User not logged in or data is corrupted.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Profile</h2>

      <div className="space-y-2 bg-base-200 p-4 rounded-md shadow">
        <p><strong>Name:</strong> {userData.name}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Phone:</strong> {userData.phone}</p>
        <p><strong>Role:</strong> {userData.role}</p>

        {userData.role === "admin" ? (
          <p className="text-green-500 font-semibold">
            আপনি একজন অ্যাডমিন, সব তথ্য আপডেট করতে পারবেন।
          </p>
        ) : (
          <p className="text-blue-500 font-semibold">
            আপনি একজন স্টাফ ({userData.role}), আপনি নিজের প্রোফাইল আপডেট করতে পারবেন।
          </p>
        )}
      </div>
    </div>
  );
}
