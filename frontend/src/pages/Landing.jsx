import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Spotlight from "../components/Spotlight";
import Footer from "../components/Footer";
import Background from "../components/Background";
import FeatureSection from "../components/FeatureSection";
import Navbar from "../components/Navbar";

function Landing() {
  const navigate = useNavigate();

  return (
    <Background
      className="min-h-screen"
      containerClassName="bg-black text-white relative overflow-hidden"
    >
      <Spotlight
        className="-top-40 left-0 md:-top-20 md:left-60"
        fill="white"
      />

      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative container my-16 mx-auto py-3 px-4 pt-24 pb-16 text-center max-w-4xl"
      >
        <h1
          className="text-5xl md:text-6xl font-bold mb-6 relative z-10 
          font-bricolage bg-gradient-to-b from-neutral-50 to-neutral-400 
          bg-clip-text text-transparent px-4"
        >
          Find your perfect hire in minutes, not months
        </h1>

        <p
          className="text-xl text-neutral-300 max-w-2xl mx-auto mb-8 
          relative z-10 font-inter"
        >
          We can screens thousands of resumes to find your perfect candidates.
        </p>

        <motion.button
          onClick={() => navigate("/resume-parser")}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="bg-indigo-600/50 hover:bg-indigo-500/70 text-white font-semibold 
          py-4 px-10 rounded-full transition duration-300 
          relative z-10 font-inter
          border border-indigo-700/50 font-xl"
        >
          Start Smarter Hiring
        </motion.button>
      </motion.div>

      <FeatureSection />
      

      <Footer />
    </Background>
  );
}

export default Landing;