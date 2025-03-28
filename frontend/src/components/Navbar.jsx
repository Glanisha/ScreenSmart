import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const NavBar = () => {
  const navigate = useNavigate();

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center max-w-4xl">
        <div className="text-2xl font-bold text-white font-bricolage">
          ScreenSmart
        </div>

        <div className="flex items-center">
          <motion.button
            onClick={() => navigate("/resume-parser")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-800/70 to-indigo-700/70 text-white 
                px-6 py-3 rounded-full 
                transition duration-300 font-inter
                border border-blue-700/50 hover:border-indigo-500/80
                hover:shadow-md hover:shadow-blue-900/30"
          >
            <span className="relative z-10">Resume Parser</span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
