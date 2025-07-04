import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../../../../../public/assets/logo.svg";
export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.username.trim()) errs.username = "Username is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Email is invalid";
    if (!formData.password) errs.password = "Password is required";
    if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    // এখানে তোমার API কল বা রেজিস্ট্রেশন লজিক বসাবে
    setTimeout(() => {
      setLoading(false);
      alert("Registration successful! Redirecting to login...");
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="hero w-full bg-base-200 min-h-screen flex items-center justify-center px-4">
      <div className="card bg-base-100 w-[300px] lg:w-[500px] shadow-2xl">
        <div className="card-body">
            <div className="flex flex-col items-center mb-4">
                          <img src={logo} alt="Logo" className="w-40 h-20 mb-2" />
                          <h1 className="text-xl font-bold text-center">
                            Dhaka Plastic & Metal
                          </h1>
                        </div>
          <h1 className="text-lg font-bold text-center mb-6 text-gray-800">
            Create Account
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div>
              <label className="label">
                <span className="label-text font-semibold">Username</span>
              </label>
              <input
                type="text"
                name="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                className={`input input-bordered w-full ${
                  errors.username ? "input-error" : ""
                }`}
                required
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`input input-bordered w-full ${
                  errors.email ? "input-error" : ""
                }`}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">
                <span className="label-text font-semibold">Password</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className={`input input-bordered w-full ${
                  errors.password ? "input-error" : ""
                }`}
                required
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">
                <span className="label-text font-semibold">Confirm Password</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input input-bordered w-full ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
                required
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-neutral w-full mt-2"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-600 text-sm">
            Already have an account?{" "}
            <a href="/login" className="link link-hover text-neutral font-semibold">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
