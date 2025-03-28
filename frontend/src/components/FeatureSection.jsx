import React from "react";
import { motion } from "framer-motion";
import { UserIcon, BriefcaseIcon, CheckCircleIcon } from "lucide-react";

function FeatureSection() {
  const features = [
    {
      icon: UserIcon,
      title: "AI-Powered Candidate Matching",
      description:
        "Our XGBoost model analyzes resumes with 94% accuracy, identifying the most qualified candidates for your specific needs.",
    },
    {
      icon: BriefcaseIcon,
      title: "Context-Aware Skill Mapping",
      description:
        "Advanced skill graph technology recognizes relationships between competencies that traditional keyword systems miss.",
    },
    {
      icon: CheckCircleIcon,
      title: "Real-Time Processing API",
      description:
        "FastAPI integration enables lightning-fast resume processing with instant results and seamless ATS integration.",
    },
  ];

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4 max-w-4xl mb-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-white font-bricolage">
          Why Choose ScreenSmart?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -8 }}
              className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-xl text-center 
                          hover:bg-zinc-800/50 transition duration-300 border border-zinc-800"
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

export default FeatureSection;
