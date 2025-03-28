import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserIcon, BriefcaseIcon, CheckCircleIcon } from 'lucide-react';

// Navbar Component
function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center max-w-4xl">
        <div className="text-2xl font-bold text-white">
          CareerCraft
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.button 
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-white hover:text-blue-300 transition duration-300"
          >
            Login
          </motion.button>
          
          <motion.button 
            onClick={() => navigate('/signup')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition duration-300"
          >
            Sign Up
          </motion.button>
        </div>
      </div>
    </nav>
  );
}

// Features Component
function FeatureSection() {
  const features = [
    {
      icon: UserIcon,
      title: 'Personalized Matching',
      description: 'Advanced AI-powered matching to connect you with ideal job opportunities.'
    },
    {
      icon: BriefcaseIcon,
      title: 'Comprehensive Listings',
      description: 'Extensive job listings across multiple industries and career levels.'
    },
    {
      icon: CheckCircleIcon,
      title: 'Verified Employers',
      description: 'Rigorous verification process ensures only quality employers are listed.'
    }
  ];

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">
          Why Choose CareerCraft?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.2 
              }}
              className="bg-zinc-900 p-6 rounded-xl text-center hover:bg-zinc-800 transition duration-300"
            >
              <div className="mb-4 flex justify-center">
                <feature.icon 
                  className="w-12 h-12 text-blue-500" 
                  strokeWidth={1.5} 
                />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-zinc-900 py-8">
      <div className="container mx-auto px-4 text-center text-white max-w-4xl">
        <p>&copy; 2024 CareerCraft. All rights reserved.</p>
        <div className="mt-4 space-x-4">
          <a href="#" className="hover:text-blue-300">Privacy Policy</a>
          <a href="#" className="hover:text-blue-300">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

// Landing Page Component
function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Dot Grid Background */}
      <div className="absolute inset-0 pointer-events-none bg-dot-white/[0.1]" />
      
      <Navbar />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative container mx-auto px-4 pt-24 pb-16 text-center max-w-4xl"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6 relative z-10">
          Discover Your Perfect Career Path
        </h1>
        
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 relative z-10">
          CareerCraft connects talented professionals with innovative companies. 
          Your next great opportunity is just a click away.
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button 
            onClick={() => navigate('/signup')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 relative z-10"
          >
            Find Your Dream Job
          </button>
        </motion.div>
      </motion.div>
      
      {/* Features Section */}
      <FeatureSection />
      
      <Footer />
    </div>
  );
}

export default Landing;