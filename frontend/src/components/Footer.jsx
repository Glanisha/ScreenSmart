import React from "react";
import { motion } from "framer-motion";

function Footer() {
  return (
    <footer className="bg-zinc-900/20 backdrop-blur-sm py-8 border-t border-zinc-800 relative overflow-hidden">
      <div className="container mx-auto px-4 text-white max-w-5xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-inter mt-4 md:mt-0 text-zinc-400 text-sm"
          >
            &copy; 2025 ScreenSmart. All rights reserved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center space-x-6"
          >
            {/* Social icons could go here */}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="font-inter mt-4 md:mt-0 text-zinc-400 text-sm"
          >
            Crafted by Team SOS
          </motion.p>
        </div>
      </div>

      {/* Animated Background Elements */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{
          opacity: [0, 0.1, 0],
          x: [-100, 0, 100],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
        }}
        className="absolute -left-20 top-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{
          opacity: [0, 0.1, 0],
          x: [100, 0, -100],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          delay: 2.5,
        }}
        className="absolute -right-20 bottom-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"
      />
    </footer>
  );
}

export default Footer;
