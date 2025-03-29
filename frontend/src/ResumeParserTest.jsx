import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileIcon,
  UsersIcon,
  StarIcon,
  FileTextIcon,
  AlertCircleIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BrainIcon,
  LoaderIcon,
  MailIcon,
} from "lucide-react";
import Background from "./components/Background";
import Footer from "./components/Footer";
import ComparisonView from "./ComparisonView";

const ResumeParser = () => {
  // Normalization function to inflate scores
  const normalizeAndInflateScore = (score, minScore = 15, maxScore = 25) => {
    // Edge cases
    if (score >= 100) return 100;
    if (score <= 0) return 5;
    
    // Normalize to 0-1 range based on observed min/max
    const normalized = (score - minScore) / (maxScore - minScore);
    
    // Scale to 50-95 range (adjust these values as needed)
    const inflated = 50 + (normalized * 45);
    
    // Round to nearest integer and ensure within bounds
    return Math.min(100, Math.max(5, Math.round(inflated)));
  };

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);

  const sendConfirmationEmail = async () => {
    if (!selectedCandidate || !selectedCandidate.fullDetails) {
      setEmailStatus({ type: 'error', message: 'No candidate selected' });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus(null);
    setIsSendingEmail(true);
    setEmailStatus(null);

    try {
      const candidateData = selectedCandidate.fullDetails.processed_data;
      const email = selectedCandidate.fullDetails.processed_data.personal_information.email;
      console.log(selectedCandidate.fullDetails.processed_data.personal_information.email)
      if (!email) {
        setEmailStatus({ type: 'error', message: 'Candidate has no email address' });
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/send-confirmation-email",
        {
          candidate_data: candidateData,
          email: email
        }
      );

      if (response.data.message) {
        setEmailStatus({ type: 'success', message: response.data.message });
      } else {
        setEmailStatus({ type: 'error', message: response.data.error || 'Email sent but no confirmation received' });
      }
    } catch (err) {
      const errorDetails = err.response?.data || err.message;
      console.error("Full error details:", errorDetails);
      
      setEmailStatus({ 
        type: 'error', 
        message: err.response?.data?.detail || 
                err.response?.data?.message || 
                'Failed to send confirmation email' 
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const fetchCandidateAnalysis = async (candidate) => {
    if (!candidate || !candidate.fullDetails) return;

    setIsAnalysisLoading(true);
    setAiAnalysis(null);
    setAnalysisError(null);

    try {
      const response = await axios.post(
        "http://localhost:8000/analyze-candidate",
        {
          candidate_data: JSON.stringify(candidate.fullDetails.processed_data),
        }
      );

      if (response.data.analysis) {
        try {
          const parsedAnalysis =
            typeof response.data.analysis === "string"
              ? JSON.parse(response.data.analysis)
              : response.data.analysis;
          setAiAnalysis(parsedAnalysis);
        } catch (err) {
          setAnalysisError("Failed to parse AI analysis");
          console.error("Analysis parsing error:", err);
        }
      } else if (response.data.error) {
        setAnalysisError(response.data.error);
      }
    } catch (err) {
      setAnalysisError("Failed to get AI analysis");
      console.error("Analysis fetch error:", err);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedResults, setProcessedResults] = useState([]);
  const [candidateRankings, setCandidateRankings] = useState([]);
  const [activeTab, setActiveTab] = useState("uploaded");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [alreadyParsedFiles, setAlreadyParsedFiles] = useState([]);
  const [expandedSkillCategories, setExpandedSkillCategories] = useState({});

  // Comparison state
  const [candidatesForComparison, setCandidatesForComparison] = useState([]);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [showComparisonView, setShowComparisonView] = useState(false);

  const CANDIDATES_PER_PAGE = 10;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
    setAlreadyParsedFiles([]);
  };

  const getMatchColorClass = (matchPercentage) => {
    const normalized = normalizeAndInflateScore(matchPercentage);
    
    if (normalized >= 85) return "border-green-800 bg-green-900/20";
    if (normalized >= 70) return "border-lime-800 bg-lime-900/20";
    if (normalized >= 55) return "border-yellow-800 bg-yellow-900/20";
    return "border-red-800 bg-red-900/20";
  };

  const extractNameFromRawText = (rawText) => {
    const lines = rawText.split("\n");
    return lines[0].trim();
  };

  const handleCandidateComparisonToggle = (candidate) => {
    if (candidatesForComparison.some((c) => c.name === candidate.name)) {
      setCandidatesForComparison((prev) =>
        prev.filter((c) => c.name !== candidate.name)
      );
    } else {
      if (candidatesForComparison.length < 2) {
        setCandidatesForComparison((prev) => [...prev, candidate]);
      }
    }
  };

  const startComparison = () => {
    if (candidatesForComparison.length === 2) {
      setShowComparisonView(true);
    }
  };

  const handleBackFromComparison = () => {
    setShowComparisonView(false);
  };

  const resetComparisonState = () => {
    setShowComparisonView(false);
    setCandidatesForComparison([]);
    setIsComparisonMode(false);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    resetComparisonState();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one PDF file");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProcessedResults([]);
    setCandidateRankings([]);
    setSelectedCandidate(null);
    setAlreadyParsedFiles([]);
    resetComparisonState();

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(
          "http://localhost:8000/send-data",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        return {
          fileName: file.name,
          ...response.data,
        };
      });

      const uploadResults = await Promise.all(uploadPromises);

      const alreadyParsed = uploadResults
        .filter(
          (result) =>
            result.processed_data &&
            result.processed_data.note === "Resume already exists in database"
        )
        .map((result) => result.fileName);

      if (alreadyParsed.length > 0) {
        setAlreadyParsedFiles(alreadyParsed);
      }

      setProcessedResults(uploadResults);

      const rankingResponse = await axios.get(
        "http://localhost:8080/process-and-match-resumes"
      );

      const combinedCandidates = rankingResponse.data.candidates.map(
        (ranking) => {
          const matchedResume = uploadResults.find((result) => {
            const extractedName = extractNameFromRawText(result.raw_text);
            return extractedName.toLowerCase() === ranking.name.toLowerCase();
          });

          return {
            ...ranking,
            fullDetails: matchedResume
              ? {
                  raw_text: matchedResume.raw_text,
                  processed_data: matchedResume.processed_data,
                }
              : null,
          };
        }
      );

      setCandidateRankings(combinedCandidates);
      setActiveTab("rankings");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to process resumes");
      console.error("Error processing resumes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    fetchCandidateAnalysis(candidate);
    setExpandedSkillCategories({});
  };

  const toggleSkillCategory = (category) => {
    setExpandedSkillCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const tabs = [
    {
      name: "uploaded",
      icon: FileIcon,
      label: "Uploaded Resumes",
      count: files.length,
    },
    {
      name: "rankings",
      icon: StarIcon,
      label: "Candidate Rankings",
      count: candidateRankings.length,
    },
  ];

  return (
    <Background
      className="min-h-screen"
      containerClassName="bg-black text-white relative overflow-hidden"
    >
      <div className="container mx-auto px-4 py-16 max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-8 shadow-xl"
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold font-bricolage bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
              HR Resume Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-xl font-inter text-neutral-300"></span>
            </div>
          </div>

          <div className="flex mb-6 space-x-4 border-b border-zinc-800 pb-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.name}
                onClick={() => handleTabChange(tab.name)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition duration-300 ${
                  activeTab === tab.name
                    ? "bg-blue-800/50 text-white"
                    : "bg-zinc-800/50 text-neutral-400 hover:bg-zinc-800/70"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-inter">{tab.label}</span>
                <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded-full ml-2">
                  {tab.count}
                </span>
              </motion.button>
            ))}

            {activeTab === "rankings" && candidateRankings.length >= 2 && (
              <motion.button
                onClick={() => setIsComparisonMode(!isComparisonMode)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition duration-300 ${
                  isComparisonMode
                    ? "bg-purple-800/50 text-white"
                    : "bg-zinc-800/50 text-neutral-400 hover:bg-zinc-800/70"
                }`}
              >
                <UsersIcon className="w-5 h-5" />
                <span className="font-inter">Compare Candidates</span>
                {candidatesForComparison.length > 0 && (
                  <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-0.5 rounded-full ml-2">
                    {candidatesForComparison.length}/2
                  </span>
                )}
              </motion.button>
            )}
          </div>

          {isComparisonMode && candidatesForComparison.length === 2 && (
            <motion.div
              className="flex justify-end mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.button
                onClick={startComparison}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-purple-700 text-white px-4 py-2 rounded-full flex items-center"
              >
                <span className="mr-2">Start Comparison</span>
              </motion.button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Upload Resume PDFs (Multiple)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  multiple
                  className="block w-full text-sm text-neutral-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-800/50 file:text-white
                    hover:file:bg-blue-800/70"
                  disabled={isLoading}
                />
              </div>

              <motion.button
                type="submit"
                disabled={files.length === 0 || isLoading}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-full text-white font-inter font-bold transition duration-300 
                  ${
                    files.length === 0 || isLoading
                      ? "bg-zinc-800 cursor-not-allowed"
                      : "bg-blue-800/50 hover:bg-blue-800/70 shadow-xl hover:shadow-blue-500/40"
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing {files.length}{" "}
                    {files.length === 1 ? "resume" : "resumes"}...
                  </span>
                ) : (
                  `Process ${files.length} ${
                    files.length === 1 ? "Resume" : "Resumes"
                  }`
                )}
              </motion.button>
            </div>
          </form>

          {alreadyParsedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-amber-900/30 border border-amber-800 rounded-lg p-4 flex items-start"
            >
              <InfoIcon className="w-6 h-6 text-amber-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <p className="text-amber-300 font-medium">
                  The following{" "}
                  {alreadyParsedFiles.length === 1 ? "resume" : "resumes"}{" "}
                  {alreadyParsedFiles.length === 1 ? "has" : "have"} already
                  been parsed and stored in the database:
                </p>
                <ul className="mt-2 text-amber-200 list-disc list-inside pl-2">
                  {alreadyParsedFiles.map((fileName, index) => (
                    <li key={index} className="text-sm">
                      {fileName}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-900/30 border border-red-800 rounded-lg p-4 flex items-start"
            >
              <AlertCircleIcon className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-300 font-medium">Error</p>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          <div className="space-y-6">
            {activeTab === "uploaded" &&
              files.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`flex items-center justify-between p-4 rounded-lg
                  ${
                    alreadyParsedFiles.includes(file.name)
                      ? "bg-amber-900/20 border border-amber-800"
                      : "bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <FileIcon
                      className={`w-6 h-6 ${
                        alreadyParsedFiles.includes(file.name)
                          ? "text-amber-500"
                          : "text-blue-500"
                      }`}
                    />
                    <div>
                      <span className="text-neutral-300">{file.name}</span>
                      {alreadyParsedFiles.includes(file.name) && (
                        <span className="ml-3 text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full">
                          Already in database
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </motion.div>
              ))}

            {activeTab === "rankings" && (
              <>
                {showComparisonView ? (
                  <ComparisonView
                    candidates={candidatesForComparison}
                    onBack={handleBackFromComparison}
                  />
                ) : (
                  <div className="grid md:grid-cols-[1fr_2fr] gap-6">
                    <div className="space-y-4">
                      {candidateRankings.length > 0 ? (
                        candidateRankings.map((candidate, index) => (
                          <motion.div
                            key={candidate.name}
                            onClick={() => handleCandidateSelect(candidate)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                            className={`
                              border-l-4 rounded-lg cursor-pointer
                              ${getMatchColorClass(candidate.match)}
                              ${
                                selectedCandidate?.name === candidate.name
                                  ? "ring-2 ring-blue-500"
                                  : ""
                              }
                              bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 
                              p-6 transition-all duration-300 relative
                              hover:shadow-xl hover:border-opacity-70
                            `}
                          >
                            {isComparisonMode && (
                              <div
                                className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 cursor-pointer
                                  ${
                                    candidatesForComparison.some(
                                      (c) => c.name === candidate.name
                                    )
                                      ? "bg-purple-500 border-purple-300"
                                      : "bg-transparent border-neutral-400"
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCandidateComparisonToggle(candidate);
                                }}
                              />
                            )}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <h2 className="text-xl font-semibold text-neutral-100">
                                    {candidate.name}
                                  </h2>
                                  {candidate.fullDetails?.processed_data
                                    ?.note ===
                                    "Resume already exists in database" && (
                                    <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full">
                                      Previously parsed
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span
                                  className={`
                                  text-2xl font-bold 
                                  ${
                                    normalizeAndInflateScore(candidate.match) >= 85
                                      ? "text-green-400"
                                      : normalizeAndInflateScore(candidate.match) >= 70
                                      ? "text-lime-400"
                                      : normalizeAndInflateScore(candidate.match) >= 55
                                      ? "text-yellow-400"
                                      : "text-red-400"
                                  }
                                `}
                                >
                                  {normalizeAndInflateScore(candidate.match)}%
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-zinc-800/50 rounded-lg">
                          <p className="text-xl text-neutral-400">
                            No candidate rankings available
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedCandidate && selectedCandidate.fullDetails && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-zinc-800/50 rounded-lg p-6 space-y-6"
                      >
                        <div className="flex justify-between items-center border-b border-zinc-700 pb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                              {selectedCandidate.name}
                            </h2>
                            {selectedCandidate.fullDetails?.processed_data
                              ?.note ===
                              "Resume already exists in database" && (
                              <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full">
                                Previously parsed
                              </span>
                            )}
                          </div>
                          <span
                            className={`
                            text-2xl font-bold 
                            ${
                              normalizeAndInflateScore(selectedCandidate.match) >= 85
                                ? "text-green-400"
                                : normalizeAndInflateScore(selectedCandidate.match) >= 70
                                ? "text-lime-400"
                                : normalizeAndInflateScore(selectedCandidate.match) >= 55
                                ? "text-yellow-400"
                                : "text-red-400"
                            }
                          `}
                          >
                            {normalizeAndInflateScore(selectedCandidate.match)}% Match
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-neutral-400 mb-2 text-lg font-semibold">
                              Personal Information
                            </h3>
                            {selectedCandidate.fullDetails.processed_data
                              .personal_information ? (
                              <>
                                <p className="text-neutral-200">
                                  <strong>Name:</strong>{" "}
                                  {selectedCandidate.fullDetails.processed_data
                                    .personal_information.name || "N/A"}
                                </p>
                                <p className="text-neutral-300 text-sm">
                                  <strong>Email:</strong>{" "}
                                  {selectedCandidate.fullDetails.processed_data
                                    .personal_information.email || "No email"}
                                </p>
                                <p className="text-neutral-300 text-sm">
                                  <strong>Location:</strong>{" "}
                                  {selectedCandidate.fullDetails.processed_data
                                    .personal_information.location || "N/A"}
                                </p>
                              </>
                            ) : (
                              <p className="text-neutral-300">
                                No personal information available
                              </p>
                            )}
                          </div>

                          <div>
                            <h3 className="text-neutral-400 mb-2 text-lg font-semibold">
                              Education
                            </h3>
                            {selectedCandidate.fullDetails.processed_data
                              .education &&
                            selectedCandidate.fullDetails.processed_data
                              .education.length > 0 ? (
                              selectedCandidate.fullDetails.processed_data.education.map(
                                (edu, index) => (
                                  <div key={index} className="mb-2">
                                    <p className="text-neutral-200">
                                      <strong>{edu.degree}</strong>
                                    </p>
                                    <p className="text-neutral-300 text-sm">
                                      {edu.institution}
                                    </p>
                                    <p className="text-neutral-300 text-sm">
                                      {edu.graduation_year}
                                    </p>
                                  </div>
                                )
                              )
                            ) : (
                              <p className="text-neutral-300">
                                No education details
                              </p>
                            )}
                          </div>

                          <div>
                            <h3 className="text-neutral-400 mb-2 text-lg font-semibold">
                              Work Experience
                            </h3>
                            {selectedCandidate.fullDetails.processed_data
                              .work_experience &&
                            selectedCandidate.fullDetails.processed_data
                              .work_experience.length > 0 ? (
                              selectedCandidate.fullDetails.processed_data.work_experience.map(
                                (job, index) => (
                                  <div key={index} className="mb-2">
                                    <p className="text-neutral-200">
                                      <strong>{job.title}</strong>
                                    </p>
                                    <p className="text-neutral-300 text-sm">
                                      {job.company}
                                    </p>
                                    <p className="text-neutral-300 text-sm">
                                      {job.start_date} -{" "}
                                      {job.end_date || "Present"}
                                    </p>
                                  </div>
                                )
                              )
                            ) : (
                              <p className="text-neutral-300">
                                No work experience details
                              </p>
                            )}
                          </div>
                            <div>
                              <h3 className="text-neutral-400 mb-2 text-lg font-semibold">ATS Score</h3>
                              <h6>{selectedCandidate.fullDetails.processed_data.ats_score}/100</h6>
                            </div>

                          <div>
                            <h3 className="text-neutral-400 mb-2 text-lg font-semibold">
                              Skills
                            </h3>
                            {selectedCandidate.fullDetails.processed_data
                              .skills ? (
                              <div className="space-y-2">
                                {Object.entries(
                                  selectedCandidate.fullDetails.processed_data
                                    .skills
                                ).map(([category, skills]) => (
                                  <div key={category} className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                      <p className="text-neutral-300 text-sm font-semibold capitalize">
                                        {category}:
                                      </p>
                                      {skills.length > 8 && (
                                        <motion.button
                                          onClick={() =>
                                            toggleSkillCategory(category)
                                          }
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          className="text-blue-400 text-xs flex items-center"
                                        >
                                          {expandedSkillCategories[category] ? (
                                            <>
                                              Show Less{" "}
                                              <ChevronUpIcon className="w-4 h-4 ml-1" />
                                            </>
                                          ) : (
                                            <>
                                              Show All{" "}
                                              <ChevronDownIcon className="w-4 h-4 ml-1" />
                                            </>
                                          )}
                                        </motion.button>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      <AnimatePresence>
                                        {(expandedSkillCategories[category]
                                          ? skills
                                          : skills.slice(0, 8)
                                        ).map((skill, idx) => (
                                          <motion.span
                                            key={idx}
                                            initial={
                                              idx >= 8
                                                ? { opacity: 0, scale: 0.8 }
                                                : false
                                            }
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2 }}
                                            className="inline-block px-2 py-0.5 bg-blue-900/30 text-blue-300 text-xs rounded-full"
                                          >
                                            {skill}
                                          </motion.span>
                                        ))}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-neutral-300">
                                No skills listed
                              </p>
                            )}
                          </div>
                        </div>

                        {selectedCandidate && (
                          <div className="mt-6 border-t border-zinc-700 pt-4">
                            <div className="flex items-center gap-2 mb-4">
                              <BrainIcon className="w-6 h-6 text-purple-400" />
                              <h3 className="text-xl font-semibold text-purple-300">
                                AI Candidate Analysis
                              </h3>
                            </div>

                            {isAnalysisLoading ? (
                              <div className="flex items-center justify-center p-6 bg-zinc-900/50 rounded-lg">
                                <LoaderIcon className="w-6 h-6 text-purple-400 animate-spin mr-2" />
                                <span className="text-neutral-300">
                                  Analyzing candidate profile...
                                </span>
                              </div>
                            ) : analysisError ? (
                              <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                                <p className="text-red-300 text-sm">
                                  {analysisError}
                                </p>
                              </div>
                            ) : aiAnalysis ? (
                              <div className="bg-zinc-900/50 rounded-lg p-4">
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="text-green-400 font-medium mb-2 flex items-center">
                                      <StarIcon
                                        className="w-4 h-4 mr-1"
                                        fill="currentColor"
                                      />{" "}
                                      Key Strengths
                                    </h4>
                                    <ul className="space-y-1">
                                      {aiAnalysis.strengths &&
                                        aiAnalysis.strengths.map(
                                          (strength, idx) => (
                                            <li
                                              key={idx}
                                              className="text-neutral-200 text-sm flex items-start"
                                            >
                                              <span className="text-green-500 mr-2">
                                                •
                                              </span>
                                              <span>{strength}</span>
                                            </li>
                                          )
                                        )}
                                    </ul>
                                  </div>

                                  <div>
                                    <h4 className="text-amber-400 font-medium mb-2 flex items-center">
                                      <InfoIcon className="w-4 h-4 mr-1" />{" "}
                                      Areas for Growth
                                    </h4>
                                    <ul className="space-y-1">
                                      {aiAnalysis.improvements &&
                                        aiAnalysis.improvements.map(
                                          (area, idx) => (
                                            <li
                                              key={idx}
                                              className="text-neutral-200 text-sm flex items-start"
                                            >
                                              <span className="text-amber-500 mr-2">
                                                •
                                              </span>
                                              <span>{area}</span>
                                            </li>
                                          )
                                        )}
                                    </ul>
                                  </div>
                                </div>

                                <div className="mt-4 border-t border-zinc-800 pt-4">
                                  <h4 className="text-blue-400 font-medium mb-2">
                                    Overall Assessment
                                  </h4>
                                  <p className="text-neutral-200 text-sm bg-zinc-800/50 p-3 rounded">
                                    {aiAnalysis.suitability}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-zinc-800/50 rounded-lg text-center">
                                <p className="text-neutral-400">
                                  Select a candidate to see AI analysis
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Add this after the email status section, right before closing the selected candidate display */}
                       



                        {/* <div>
                          <h3 className="text-neutral-400 mb-2 text-lg font-semibold border-t border-zinc-700 pt-4">
                            Raw Resume Text
                          </h3>
                          <pre className="bg-zinc-900 p-4 rounded-lg text-neutral-300 text-sm overflow-x-auto max-h-40 overflow-y-auto">
                            {selectedCandidate.fullDetails.raw_text}
                          </pre>
                        </div> */}
                        <div className="mt-6 space-y-2">
                          <motion.button
                            onClick={sendConfirmationEmail}
                            disabled={
                              isSendingEmail ||
                              !selectedCandidate?.fullDetails?.processed_data
                                ?.personal_information?.email
                            }
                            whileHover={{ scale: isSendingEmail ? 1 : 1.05 }}
                            whileTap={{ scale: isSendingEmail ? 1 : 0.95 }}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                              isSendingEmail
                                ? "bg-gray-600 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            } ${
                              !selectedCandidate?.fullDetails?.processed_data
                                ?.personal_information?.email
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {isSendingEmail ? (
                              <>
                                <LoaderIcon className="w-4 h-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <MailIcon className="w-4 h-4" />
                                Send Confirmation Email
                              </>
                            )}
                          </motion.button>

                          {emailStatus && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-3 rounded-lg text-sm ${
                                emailStatus.type === "success"
                                  ? "bg-green-900/30 border border-green-800 text-green-200"
                                  : "bg-red-900/30 border border-red-800 text-red-200"
                              }`}
                            >
                              {emailStatus.message}
                            </motion.div>
                          )}

                          {selectedCandidate?.fullDetails?.processed_data
                            ?.personal_information?.email ? (
                            <p className="text-neutral-400 text-sm mt-1">
                              Will be sent to:{" "}
                              {
                                selectedCandidate.fullDetails.processed_data
                                  .personal_information.email
                              }
                            </p>
                          ) : (
                            <p className="text-amber-500 text-sm mt-1">
                              No email address found for this candidate
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />
    </Background>
  );
};

export default ResumeParser;