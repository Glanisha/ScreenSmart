import React, { useState, useEffect } from "react";
import { Trophy, Star, Briefcase, FileText } from "lucide-react";

const CandidateRankingDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setIsLoading(true);
        // Simple GET request with no parameters
        const response = await fetch("http://localhost:8080/process-and-match-resumes", {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch candidates");
        }

        const data = await response.json();
        setCandidates(data.candidates);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const getMatchColorClass = (matchPercentage) => {
    if (matchPercentage >= 90) return "bg-green-100 border-green-500";
    if (matchPercentage >= 75) return "bg-lime-100 border-lime-500";
    if (matchPercentage >= 60) return "bg-yellow-100 border-yellow-500";
    return "bg-red-100 border-red-500";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Trophy className="w-10 h-10 text-yellow-500 mr-4" />
        <h1 className="text-3xl font-bold text-gray-800">
          Candidate Ranking Dashboard
        </h1>
      </div>

      <div className="grid gap-6">
        {candidates.map((candidate, index) => (
          <div
            key={candidate.name}
            className={`
              border-l-4 rounded-lg shadow-md p-6 transition-all duration-300 
              hover:shadow-xl ${getMatchColorClass(candidate.match)}
            `}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {index === 0 ? (
                  <Star
                    className="w-8 h-8 text-yellow-400"
                    fill="currentColor"
                  />
                ) : (
                  <Briefcase className="w-8 h-8 text-blue-500" />
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {candidate.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-700">
                  {candidate.match}%
                </span>
                <FileText className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="text-center py-10 bg-gray-100 rounded-lg">
          <p className="text-xl text-gray-600">No candidates found</p>
        </div>
      )}
    </div>
  );
};

export default CandidateRankingDashboard;
