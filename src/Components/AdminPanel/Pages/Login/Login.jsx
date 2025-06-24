import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios
import logo from "../../../../../public/assets/logo.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // State to hold login error messages
  const [loading, setLoading] = useState(false); // State to handle loading state
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // The login handler is now an async function
  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true); // Disable button and show loading indicator
    setError(""); // Clear previous errors

    try {
      // Make a POST request to your backend's login endpoint
      const response = await axios.post(
        "https://test.api.dpmsign.com/api/auth/login",
        {
          email: email,
          password: password,
        }
      );

      // **IMPORTANT**: Assuming your backend returns a token in the response data
      // like { success: true, token: "your_jwt_token" }
      const authToken = response.data.data.authToken;

      if (authToken) {
        // Save the token to local storage
        localStorage.setItem("authToken", authToken);
        // Navigate to the dashboard after successful login
        navigate("/dashboard");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      // Handle errors from the API call
      if (err.response && err.response.status === 401) {
        // 401 Unauthorized is a common error for bad credentials
        setError("Invalid email or password.");
      } else {
        // Handle other errors (e.g., server is down)
        setError("An unexpected error occurred. Please try again later.");
        console.error("Login error:", err);
      }
    } finally {
      setLoading(false); // Re-enable the button
    }
  };

  return (
    <div className="hero w-full bg-base-200 min-h-screen">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="card bg-base-100 w-[300px] lg:w-[500px] shadow-2xl">
          <div className="card-body">
            <div className="flex flex-col items-center mb-4">
              <img src={logo} alt="Logo" className="w-40 h-20 mb-2" />
              <h1 className="text-xl font-bold text-center">
                Dhaka Plastic & Metal
              </h1>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input input-bordered w-full pr-10"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-lg text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Display error message if it exists */}
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <div className="text-right">
                <a className="link link-hover text-sm">Forgot password?</a>
              </div>

              <button
                type="submit"
                className="btn btn-neutral w-full mt-2"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
