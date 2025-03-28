import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from 'uuid';
import Background from '../components/Background';
import Spotlight from '../components/Spotlight';
import Navbar from './Navbar'; // Assuming you want to reuse the Navbar from Landing

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Candidate profile state
  const [candidateProfile, setCandidateProfile] = useState({
    phone_number: "",
    location: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });

  // Additional application-specific states
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch job details on component mount
  useEffect(() => {
    const fetchJobDetails = async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) {
        setError("Failed to fetch job details.");
      } else {
        setJob(data);
      }
      setLoading(false);
    };

    fetchJobDetails();
  }, [jobId]);

  // File upload handler
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setResume(file);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  // Extract resume data (simplified mock implementation)
  const extractResumeData = async (file) => {
    // In a real-world scenario, you'd use a backend service or AI to extract data
    return {
      full_name: "Placeholder Name",
      email: "placeholder@email.com",
      phone: candidateProfile.phone_number,
      skills: ["Placeholder Skill 1", "Placeholder Skill 2"],
      education: [],
      experience: [],
      certifications: [],
      languages: []
    };
  };

  // Main application submission handler
  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploading(true);

    try {
      // Get current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error("User not authenticated");
      }
      const userId = authData.user.id;

      // 1. Update/Create Candidate Profile
      const { error: profileError } = await supabase
        .from("candidate_profiles")
        .upsert({
          user_id: userId,
          ...candidateProfile
        }, { 
          onConflict: 'user_id' 
        });

      if (profileError) throw profileError;

      // 2. Upload Resume to Storage
      if (!resume) throw new Error("No resume uploaded");
      const fileName = `${userId}_${uuidv4()}_${resume.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from("resumes")
        .upload(fileName, resume, { 
          contentType: resume.type 
        });

      if (uploadError) throw uploadError;

      // Generate public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from("resumes")
        .getPublicUrl(fileName);

      // 3. Save Resume Record
      const { data: resumeRecord, error: resumeError } = await supabase
        .from("resumes")
        .insert({
          user_id: userId,
          file_url: publicUrl,
          file_name: resume.name,
          file_size: resume.size,
          file_type: resume.type,
          extraction_status: 'processing'
        })
        .select()
        .single();

      if (resumeError) throw resumeError;

      // 4. Extract Resume Data
      const extractedData = await extractResumeData(resume);
      
      // 5. Save Extracted Resume Data
      const { error: extractedDataError } = await supabase
        .from("extracted_resume_data")
        .insert({
          resume_id: resumeRecord.id,
          ...extractedData
        });

      if (extractedDataError) throw extractedDataError;

      // 6. Update Resume with Extracted Data Status
      await supabase
        .from("resumes")
        .update({ 
          extracted_data: extractedData,
          extraction_status: 'completed' 
        })
        .eq('id', resumeRecord.id);

      // 7. Create Job Application
      const { error: applicationError } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          candidate_id: userId,
          resume_id: resumeRecord.id,
          status: 'applied',
          cover_letter: coverLetter
        });

      if (applicationError) throw applicationError;

      alert("Application submitted successfully!");
      setUploading(false);
    } catch (err) {
      console.error("Application submission error:", err);
      alert(`Application submission failed: ${err.message || 'Unknown error'}`);
      setUploading(false);
    }
  };

  if (loading) return (
    <Background className="min-h-screen" containerClassName="bg-black text-white relative overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 text-center">
        <p className="text-neutral-300">Loading job details...</p>
      </div>
    </Background>
  );

  if (error) return (
    <Background className="min-h-screen" containerClassName="bg-black text-white relative overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    </Background>
  );

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
        className="relative container my-16 mx-auto py-3 px-4 pt-24 pb-16 text-center max-w-5xl"
      >
        <h1 
          className="text-5xl md:text-6xl font-bold mb-6 relative z-10 
          font-bricolage bg-gradient-to-b from-neutral-50 to-neutral-400 
          bg-clip-text text-transparent px-4 md:px-8"
        >
          {job.title}
        </h1>
        
        <p 
          className="text-xl text-neutral-300 max-w-2xl mx-auto mb-10 
          relative z-10 font-inter"
        >
          {job.company_name} | {job.location}
        </p>
      </motion.div>

      <div className="container mx-auto px-4 max-w-5xl mb-16">
        <div className="bg-zinc-900/50 backdrop-blur-sm p-8 rounded-xl border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-4 text-white font-inter">Job Description</h2>
          <p className="text-neutral-400 mb-6">{job.description}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Phone Number"
              className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
              value={candidateProfile.phone_number}
              onChange={(e) => setCandidateProfile({ 
                ...candidateProfile, 
                phone_number: e.target.value 
              })}
              required
            />
            <input
              type="text"
              placeholder="Location"
              className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
              value={candidateProfile.location}
              onChange={(e) => setCandidateProfile({ 
                ...candidateProfile, 
                location: e.target.value 
              })}
              required
            />
            <input
              type="url"
              placeholder="LinkedIn Profile"
              className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
              value={candidateProfile.linkedin_url}
              onChange={(e) => setCandidateProfile({ 
                ...candidateProfile, 
                linkedin_url: e.target.value 
              })}
            />
            <input
              type="url"
              placeholder="GitHub Profile"
              className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
              value={candidateProfile.github_url}
              onChange={(e) => setCandidateProfile({ 
                ...candidateProfile, 
                github_url: e.target.value 
              })}
            />
            <input
              type="url"
              placeholder="Portfolio URL"
              className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
              value={candidateProfile.portfolio_url}
              onChange={(e) => setCandidateProfile({ 
                ...candidateProfile, 
                portfolio_url: e.target.value 
              })}
            />
            <textarea
              placeholder="Cover Letter (Optional)"
              className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
            />

            <div className="mb-4">
              <label className="block text-white mb-2">Upload Resume (PDF):</label>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
                className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-neutral-400" 
                required 
              />
            </div>

            <motion.button
              type="submit"
              disabled={uploading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-blue-800/50 hover:bg-blue-800/70 text-white font-bold 
              py-4 px-10 rounded-full transition duration-300 
              relative z-10 font-inter
              shadow-xl hover:shadow-blue-500/40
              transform hover:-translate-y-1
              group overflow-hidden
              border border-blue-900/50"
            >
              <span className="relative z-10">
                {uploading ? "Submitting..." : "Apply Now"}
              </span>
              <span 
                className="absolute inset-0 bg-blue-500 opacity-0 
                group-hover:opacity-20 transition-opacity duration-300 z-0"
              />
            </motion.button>
          </form>
        </div>
      </div>
    </Background>
  );
};

export default JobDetails;