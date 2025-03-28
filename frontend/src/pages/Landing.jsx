import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserIcon, BriefcaseIcon, CheckCircleIcon } from 'lucide-react';
import Spotlight from '../components/Spotlight'; 
import Footer from '../components/Footer';
import Background  from '../components/Background';
import FileUpload from '../components/FileUpload';


// Navbar Component
function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center max-w-5xl">
        <div className="text-2xl font-bold text-white font-bricolage">
          CareerCraft
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.button 
            onClick={() => navigate('/login')}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 15px rgba(59, 130, 246, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            className="text-neutral-300 hover:text-white font-inter 
            px-4 py-2 rounded-full 
            border border-neutral-800 hover:border-blue-500/50
            bg-zinc-900/50 hover:bg-zinc-800/50
            shadow-sm hover:shadow-blue-500/30 
            transform transition-all duration-300 ease-in-out"
          >
            Login
          </motion.button>
          
          <motion.button 
            onClick={() => navigate('/signup')}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-800/50 hover:bg-blue-800/70 text-white 
            px-6 py-3 rounded-full 
            transition duration-300 font-inter
            transform hover:-translate-y-1
            shadow-xl hover:shadow-blue-500/40
            relative overflow-hidden group
            border border-blue-900/50"
          >
            <span className="relative z-10">Sign Up</span>
            <span 
              className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-0"
            />
          </motion.button>
        </div>
      </div>
    </nav>
  );
}

// Features Component (Unchanged)
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
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-white font-bricolage">
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
              className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-xl text-center hover:bg-zinc-800/50 transition duration-300 border border-zinc-800"
            >
              <div className="mb-4 flex justify-center">
                <feature.icon 
                  className="w-12 h-12 text-blue-500" 
                  strokeWidth={1.5} 
                />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white font-inter">
                {feature.title}
              </h3>
              <p className="text-neutral-400 font-inter">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Landing Page Component
function Landing() {
  const navigate = useNavigate();

  return (
    <Background 
      className="min-h-screen" 
      containerClassName="bg-black text-white relative overflow-hidden"
    >
      {/* Spotlight Effect */}
      <Spotlight 
        className="-top-40 left-0 md:-top-20 md:left-60" 
        fill="white" 
      />
      
      <Navbar />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative container my-16 mx-auto py-3 px-4 pt-24 pb-16 text-center max-w-5xl"
      >
        <h1 
          className="text-5xl md:text-6xl font-bold mb-6 relative z-10 
          font-bricolage bg-gradient-to-b from-neutral-50 to-neutral-400 
          bg-clip-text text-transparent px-4 md:px-8"
        >
          Discover Your Perfect Career Path
        </h1>
        
        <p 
          className="text-xl text-neutral-300 max-w-2xl mx-auto mb-10 
          relative z-10 font-inter"
        >
          CareerCraft connects talented professionals with innovative companies. 
          Your next great opportunity is just a click away.
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button 
            onClick={() => navigate('/signup')}
            className="bg-blue-800/50 hover:bg-blue-800/70 text-white font-bold 
            py-4 px-10 rounded-full transition duration-300 
            relative z-10 font-inter
            shadow-xl hover:shadow-blue-500/40
            transform hover:-translate-y-1
            group overflow-hidden
            border border-blue-900/50"
          >
            <span className="relative z-10">
              Find Your Dream Job
            </span>
            <span 
              className="absolute inset-0 bg-blue-500 opacity-0 
              group-hover:opacity-20 transition-opacity duration-300 z-0"
            />
          </button>
        </motion.div>
      </motion.div>
      
      {/* Features Section */}
      <FeatureSection />
      
      {/* File Upload Section */}
      <section className="py-16 relative bg-black">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-4xl font-bold text-center mb-12 text-white font-bricolage">
            Upload Your Resume
          </h2>
          
          <div className="max-w-xl mx-auto">
            <FileUpload 
              onChange={(files) => {
                // Optional: Handle file upload logic here
                console.log('Uploaded files:', files);
              }}
              maxFiles={3}
            />
          </div>
        </div>
      </section>
      
      <Footer />
    </Background>
  );
}

export default Landing;