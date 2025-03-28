import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState("candidate");
  const [companyId, setCompanyId] = useState(""); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      if (!userType) {
        throw new Error("Please select a user type.");
      }
  
      // Step 1: Sign Up User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
  
      if (authError) throw authError;
      if (!authData.user?.id) throw new Error("User ID not available after signup");
  
      console.log("User created with ID:", authData.user.id);
  
      // 🚀 **Step 2: Insert Data into Profiles Table**
      const { error: profileUpsertError } = await supabase
        .from("profiles")
        .upsert([
          {
            id: authData.user.id, 
            email: email, 
            first_name: firstName, 
            last_name: lastName, 
            role: userType 
          }
        ], { onConflict: ['id'] });

if (profileUpsertError) throw profileUpsertError;

  
      // Step 3: Handle HR User Specific Logic
      if (userType === "hr_user") {
        if (!companyId) throw new Error("Company ID is required for HR users");
  
        const { data: existingHR, error: hrCheckError } = await supabase
          .from("hr_users")
          .select("user_id")
          .eq("user_id", authData.user.id)
          .single();
  
        if (hrCheckError && hrCheckError.code !== "PGRST116") {
          throw hrCheckError;
        }
  
        if (!existingHR) {
          const { error: hrInsertError } = await supabase
            .from("hr_users")
            .insert([
              {
                user_id: authData.user.id,
                company_id: companyId,
                position: "HR Manager", 
                department: "Recruitment",
              },
            ]);
  
          if (hrInsertError) throw hrInsertError;
        }
      }
  
      // Step 4: Insert into candidate_profiles if user is a candidate
      if (userType === "candidate") {
        const { error: candidateInsertError } = await supabase
          .from("candidate_profiles")
          .insert([{ user_id: authData.user.id }]);
  
        if (candidateInsertError) throw candidateInsertError;
      }
  
      setSuccessMessage(
        "Account created successfully! Please check your email for verification."
      );
  
      navigate(userType === "hr_user" ? "/hr/dashboard" : "/dashboard");
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
              onClick={() => {
                setUserType("hr_user")
              }}
              className={`px-4 py-2 rounded-full transition-colors ${
                userType === "hr_user"
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
            <label className="block text-gray-300 mb-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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

          {userType === "hr_user" && (
            <div>
              <label className="block text-gray-300 mb-2">Company ID</label>
              <input
                type="text"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required={userType === "hr_user"}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your company's unique ID"
              />
            </div>
          )}

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