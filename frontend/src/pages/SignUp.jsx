import React, { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("candidate");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  // In the handleSignUp function

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create user authentication record
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
          },
        },
      });

      if (authError) throw authError;

      // Make sure user exists before continuing
      if (!authData.user?.id) {
        throw new Error("User ID not available after signup");
      }

      console.log("User created with ID:", authData.user.id);

      // 2. IMPORTANT: Add a small delay to ensure user creation has propagated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 3. Try to insert the role, with retry logic
      let roleError = null;
      let retries = 3;

      while (retries > 0) {
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: authData.user.id, role: userType }]);

        if (!error) {
          // Success! No error
          roleError = null;
          break;
        }

        roleError = error;
        console.log(
          `Role insertion attempt failed, retrying... (${retries} left)`
        );
        retries--;

        // Wait a bit longer before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (roleError) {
        console.error(
          "Could not assign role after multiple attempts:",
          roleError
        );
        // Continue anyway, but note the issue
      }

      // Handle successful signup
      setSuccessMessage(
        "Account created successfully! Please check your email for verification."
      );
    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Sign Up for CareerCraft
        </h2>

        {/* User Type Selection */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-700 rounded-full p-1 flex items-center">
            <button
              type="button"
              onClick={() => setUserType("candidate")}
              className={`px-4 py-2 rounded-full transition-colors ${
                userType === "candidate"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-600"
              }`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setUserType("hr")}
              className={`px-4 py-2 rounded-full transition-colors ${
                userType === "hr"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-600"
              }`}
            >
              HR Professional
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-600/20 border border-green-600 text-green-400 p-3 rounded-md mb-4">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength="6"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className={`w-full text-white py-3 rounded-md transition-colors ${
              loading
                ? "bg-blue-800 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </motion.button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-400">
            Already have an account?{" "}
            <a href="/signin" className="text-blue-400 hover:underline">
              Sign In
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default SignUp;
