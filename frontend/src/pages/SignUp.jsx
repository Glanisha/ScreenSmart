import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('candidate');
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const { user, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType
          }
        }
      });

      if (error) throw error;

      // Handle successful signup
      console.log('User signed up:', user);
      // Redirect or show success message
    } catch (error) {
      setError(error.message);
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
              onClick={() => setUserType('candidate')}
              className={`px-4 py-2 rounded-full transition-colors ${
                userType === 'candidate' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              Candidate
            </button>
            <button
              onClick={() => setUserType('hr')}
              className={`px-4 py-2 rounded-full transition-colors ${
                userType === 'hr' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              HR Professional
            </button>
          </div>
        </div>

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
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Account
          </motion.button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-400">
            Already have an account? {' '}
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