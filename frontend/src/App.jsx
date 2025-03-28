import ResumeParserTest from "./ResumeParserTest";
import Landing from "./pages/Landing";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  BrowserRouter,
} from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/SignIn";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import JobDetails from "./components/JobDetails";
import JobApplication from "./components/JobApplication";
import CandidateRankingDashboard from "./pages/CandidateRankingDashboard";

// HR routes
import HRDashboard from "./pages/hr/HRDashboard";
import HRProfile from "./pages/hr/HRProfile";
import AddJobListing from "./pages/hr/AddJobListing";
import EditJobListing from "./pages/hr/EditJobListing";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/candidate-ranking"
            element={<CandidateRankingDashboard />}
          />
          <Route path="/" element={<Landing />} />
          <Route path="/resume-parser" element={<ResumeParserTest />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<Login />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/job/:jobId" element={<JobDetails />} />

          <Route path="/job/:jobId/apply" element={<JobApplication />} />

          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/hr/profile" element={<HRProfile />} />
          <Route path="/hr/jobs/new" element={<AddJobListing />} />
          <Route path="/hr/jobs/:jobId/edit" element={<EditJobListing />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
