import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy load all components
const Landing = lazy(() => import("./pages/Landing"));
const ResumeParserTest = lazy(() => import("./ResumeParserTest"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Login = lazy(() => import("./pages/SignIn"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const Profile = lazy(() => import("./components/Profile"));
const JobDetails = lazy(() => import("./components/JobDetails"));
const JobApplication = lazy(() => import("./components/JobApplication"));
const CandidateRankingDashboard = lazy(() => import("./pages/CandidateRankingDashboard"));

// HR components
const HRDashboard = lazy(() => import("./pages/hr/HRDashboard"));
const HRProfile = lazy(() => import("./pages/hr/HRProfile"));
const AddJobListing = lazy(() => import("./pages/hr/AddJobListing"));
const EditJobListing = lazy(() => import("./pages/hr/EditJobListing"));

// Loading spinner component using Tailwind
const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-50">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/resume-parser" element={<ResumeParserTest />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<Login />} />
          
          {/* Candidate routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/job/:jobId" element={<JobDetails />} />
          <Route path="/job/:jobId/apply" element={<JobApplication />} />
          
          {/* HR routes */}
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/hr/profile" element={<HRProfile />} />
          <Route path="/hr/jobs/new" element={<AddJobListing />} />
          <Route path="/hr/jobs/:jobId/edit" element={<EditJobListing />} />
          
          {/* Utility routes */}
          <Route path="/candidate-ranking" element={<CandidateRankingDashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;