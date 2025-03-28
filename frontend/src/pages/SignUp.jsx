import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Background from '../components/Background';

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState("candidate");
  const [companyId, setCompanyId] = useState(""); // Only for HR users
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
            first_name: firstName,
            last_name: lastName,
            role: userType
          }
        }
      });

      if (authError) throw authError;

      // Make sure user exists before continuing
      if (!authData.user?.id) {
        throw new Error("User ID not available after signup");
      }

      console.log("User created with ID:", authData.user.id);

      // 2. Add a small delay to ensure user creation has propagated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 3. For HR users, add to hr_users table
      if (userType === "hr") {
        if (!companyId) {
          throw new Error("Company ID is required for HR users");
        }

        const { error: hrError } = await supabase
          .from("hr_users")
          .insert([{ 
            user_id: authData.user.id, 
            company_id: companyId 
          }]);

        if (hrError) throw hrError;
      }

      // 4. For candidates, add to candidate_profiles table
      if (userType === "candidate") {
        const { error: profileError } = await supabase
          .from("candidate_profiles")
          .insert([{ 
            user_id: authData.user.id 
          }]);

        if (profileError) throw profileError;
      }

      // Handle successful signup
      navigate(userType === "hr" ? "/hr/dashboard" : "/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background 
      className="min-h-screen flex items-center justify-center pt-24" 
      containerClassName="bg-black text-white relative overflow-hidden"
    >
      <div className="w-full max-w-md relative z-10 px-4">
        <div className="
          backdrop-blur-xl 
          bg-white/15 
          border 
          border-white/20 
          rounded-2xl 
          shadow-2xl 
          p-8 
          space-y-6 
          transition-all 
          duration-300 
          hover:bg-white/20 
          hover:border-white/30
        ">
          <h2 className="
            text-4xl 
            font-bold 
            mb-6 
            text-center 
            font-bricolage 
            bg-gradient-to-b 
            from-neutral-50 
            to-neutral-800 
            bg-clip-text 
            text-transparent
          ">
            Sign Up
          </h2>

          {/* User Type Selection */}
          <div className="flex justify-center mb-6">
            <div className="
              bg-white/10 
              rounded-full 
              p-1 
              flex 
              items-center 
              border 
              border-white/20
            ">
              <button
                type="button"
                onClick={() => setUserType('candidate')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  userType === 'candidate' 
                    ? 'bg-blue-800/70 text-white' 
                    : 'text-neutral-400 hover:bg-white/10'
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setUserType('hr')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  userType === 'hr' 
                    ? 'bg-blue-800/70 text-white' 
                    : 'text-neutral-400 hover:bg-white/10'
                }`}
              >
                HR Professional
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="
              bg-red-600/20 
              border 
              border-red-600 
              text-red-400 
              p-3 
              rounded-md 
              mb-4 
              text-center
            ">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-300 mb-2 font-inter">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="
                    w-full 
                    px-3 
                    py-3 
                    bg-white/10 
                    text-white 
                    rounded-md 
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-blue-500 
                    border 
                    border-white/20 
                    transition 
                    duration-300
                  "
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-2 font-inter">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="
                    w-full 
                    px-3 
                    py-3 
                    bg-white/10 
                    text-white 
                    rounded-md 
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-blue-500 
                    border 
                    border-white/20 
                    transition 
                    duration-300
                  "
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 mb-2 font-inter">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="
                  w-full 
                  px-3 
                  py-3 
                  bg-white/10 
                  text-white 
                  rounded-md 
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-blue-500 
                  border 
                  border-white/20 
                  transition 
                  duration-300
                "
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-2 font-inter">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                className="
                  w-full 
                  px-3 
                  py-3 
                  bg-white/10 
                  text-white 
                  rounded-md 
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-blue-500 
                  border 
                  border-white/20 
                  transition 
                  duration-300
                "
              />
            </div>

            {userType === "hr" && (
              <div>
                <label className="block text-neutral-300 mb-2 font-inter">Company ID</label>
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  required={userType === "hr"}
                  className="
                    w-full 
                    px-3 
                    py-3 
                    bg-white/10 
                    text-white 
                    rounded-md 
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-blue-500 
                    border 
                    border-white/20 
                    transition 
                    duration-300
                  "
                  placeholder="Your company's unique ID"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full 
                bg-blue-800/50 
                hover:bg-blue-800/70 
                text-white 
                py-4 
                rounded-full 
                transition 
                duration-300 
                font-inter 
                font-bold 
                shadow-xl 
                hover:shadow-blue-500/40 
                transform 
                hover:-translate-y-1 
                group 
                overflow-hidden 
                border 
                border-blue-900/50
              "
            >
              <span className="relative z-10">
                {loading ? "Creating Account..." : "Create Account"}
              </span>
              <span 
                className="
                  absolute 
                  inset-0 
                  bg-blue-500 
                  opacity-0 
                  group-hover:opacity-20 
                  transition-opacity 
                  duration-300 
                  z-0
                "
              />
            </button>
          </form>

          <div className="text-center mt-6 space-y-4 font-inter">
            <p className="text-neutral-400">
              Already have an account? {' '}
              <Link 
                to="/signin" 
                className="text-blue-400 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Background>
    
  );
}

export default SignUp;