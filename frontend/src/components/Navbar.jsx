import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserIcon, LogOutIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const NavBar = () => {
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div>
            <Link to="/dashboard" className="text-xl font-bold text-blue-500 hover:text-blue-400 transition-colors">
              CareerCraft
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <LogOutIcon size={20} className="mr-2" />
              Sign Out
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;