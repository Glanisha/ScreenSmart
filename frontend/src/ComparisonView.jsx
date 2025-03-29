import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  XIcon,
  BarChart4Icon,
  PieChartIcon
} from 'lucide-react';
import Chart from 'chart.js/auto';

const ComparisonView = ({ candidates, onBack }) => {
  // References for charts
  const skillChartRef = useRef(null);
  const matchScoreChartRef = useRef(null);
  const expEducationChartRef = useRef(null);
  
  if (!candidates || candidates.length !== 2) {
    return (
      <div className="text-center py-10 bg-zinc-800/50 rounded-lg">
        <p className="text-xl text-neutral-400">Please select exactly 2 candidates to compare</p>
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-lg flex items-center mx-auto"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to candidates
        </button>
      </div>
    );
  }

  const [candidate1, candidate2] = candidates;

  // Extract categories from both candidates skills
  const allSkillCategories = new Set([
    ...Object.keys(candidate1.fullDetails?.processed_data?.skills || {}),
    ...Object.keys(candidate2.fullDetails?.processed_data?.skills || {})
  ]);

  // Helper for skill comparison
  const hasSkill = (candidate, category, skill) => {
    if (!candidate.fullDetails?.processed_data?.skills?.[category]) return false;
    return candidate.fullDetails.processed_data.skills[category].includes(skill);
  };

  // Get all unique skills from both candidates for a category
  const getAllSkillsForCategory = (category) => {
    const skills = new Set();
    
    // Add skills from candidate 1
    if (candidate1.fullDetails?.processed_data?.skills?.[category]) {
      candidate1.fullDetails.processed_data.skills[category].forEach(skill => skills.add(skill));
    }
    
    // Add skills from candidate 2
    if (candidate2.fullDetails?.processed_data?.skills?.[category]) {
      candidate2.fullDetails.processed_data.skills[category].forEach(skill => skills.add(skill));
    }
    
    return Array.from(skills);
  };

  // Get skill count by category for a candidate
  const getSkillCountByCategory = (candidate) => {
    const counts = {};
    
    if (candidate.fullDetails?.processed_data?.skills) {
      Object.keys(candidate.fullDetails.processed_data.skills).forEach(category => {
        counts[category] = candidate.fullDetails.processed_data.skills[category].length;
      });
    }
    
    return counts;
  };

  // Calculate experience years (very basic estimation)
  const calculateExperienceYears = (candidate) => {
    if (!candidate.fullDetails?.processed_data?.work_experience || 
        candidate.fullDetails.processed_data.work_experience.length === 0) {
      return 0;
    }
    
    let totalYears = 0;
    candidate.fullDetails.processed_data.work_experience.forEach(job => {
      const startYear = parseInt(job.start_date.split(' ')[1]) || 0;
      const endYear = job.end_date ? 
        parseInt(job.end_date.split(' ')[1]) || new Date().getFullYear() : 
        new Date().getFullYear();
      
      totalYears += endYear - startYear;
    });
    
    return totalYears;
  };

  // Initialize charts when component mounts
  useEffect(() => {
    let skillChart = null;
    let matchChart = null;
    let expEducationChart = null;
    
    if (skillChartRef.current) {
      // Destroy existing chart if it exists
      if (skillChartRef.current.chart) {
        skillChartRef.current.chart.destroy();
      }
      
      // Prepare data for skills radar chart
      const categories = Array.from(allSkillCategories);
      const candidate1Skills = categories.map(category => {
        return candidate1.fullDetails?.processed_data?.skills?.[category]?.length || 0;
      });
      const candidate2Skills = categories.map(category => {
        return candidate2.fullDetails?.processed_data?.skills?.[category]?.length || 0;
      });
      
      // Create radar chart for skills comparison
      skillChart = new Chart(skillChartRef.current, {
        type: 'radar',
        data: {
          labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
          datasets: [
            {
              label: candidate1.name,
              data: candidate1Skills,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgba(59, 130, 246, 1)',
              pointBackgroundColor: 'rgba(59, 130, 246, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
            },
            {
              label: candidate2.name,
              data: candidate2Skills,
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              borderColor: 'rgba(168, 85, 247, 1)',
              pointBackgroundColor: 'rgba(168, 85, 247, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(168, 85, 247, 1)'
            }
          ]
        },
        options: {
          scales: {
            r: {
              angleLines: {
                color: 'rgba(255, 255, 255, 0.15)'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              pointLabels: {
                color: 'rgba(255, 255, 255, 0.7)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                backdropColor: 'rgba(0, 0, 0, 0)'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }
        }
      });
      
      // Store chart instance for cleanup
      skillChartRef.current.chart = skillChart;
    }
    
    if (matchScoreChartRef.current) {
      // Destroy existing chart if it exists
      if (matchScoreChartRef.current.chart) {
        matchScoreChartRef.current.chart.destroy();
      }
      
      // Create bar chart for match score comparison
      matchChart = new Chart(matchScoreChartRef.current, {
        type: 'bar',
        data: {
          labels: [candidate1.name, candidate2.name],
          datasets: [{
            data: [candidate1.match, candidate2.match],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(168, 85, 247, 0.8)'
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(168, 85, 247, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            },
            y: {
              grid: {
                display: false
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Match: ${context.raw}%`;
                }
              }
            }
          }
        }
      });
      
      // Store chart instance for cleanup
      matchScoreChartRef.current.chart = matchChart;
    }
    
    if (expEducationChartRef.current) {
      // Destroy existing chart if it exists
      if (expEducationChartRef.current.chart) {
        expEducationChartRef.current.chart.destroy();
      }
      
      // Calculate education level (very basic - just count degrees)
      const educationLevel1 = candidate1.fullDetails?.processed_data?.education?.length || 0;
      const educationLevel2 = candidate2.fullDetails?.processed_data?.education?.length || 0;
      
      // Calculate years of experience
      const experienceYears1 = calculateExperienceYears(candidate1);
      const experienceYears2 = calculateExperienceYears(candidate2);
      
      // Create grouped bar chart for experience and education
      expEducationChart = new Chart(expEducationChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Work Experience (Years)', 'Education (Degrees)'],
          datasets: [
            {
              label: candidate1.name,
              data: [experienceYears1, educationLevel1],
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1
            },
            {
              label: candidate2.name,
              data: [experienceYears2, educationLevel2],
              backgroundColor: 'rgba(168, 85, 247, 0.8)',
              borderColor: 'rgba(168, 85, 247, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }
        }
      });
      
      // Store chart instance for cleanup
      expEducationChartRef.current.chart = expEducationChart;
    }
    
    // Cleanup function
    return () => {
      if (skillChart) skillChart.destroy();
      if (matchChart) matchChart.destroy();
      if (expEducationChart) expEducationChart.destroy();
    };
  }, [candidates, allSkillCategories]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-8 shadow-xl"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
          Candidate Comparison
        </h1>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>

      {/* Comparison Header */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-1"></div>
        <div className="col-span-1 text-center">
          <h2 className="text-2xl font-bold text-neutral-100 bg-blue-900/30 py-2 px-4 rounded-lg">
            {candidate1.name}
            <span className="ml-2 text-sm bg-blue-800/50 text-blue-300 px-2 py-0.5 rounded-full">
              {candidate1.match}%
            </span>
          </h2>
        </div>
        <div className="col-span-1 text-center">
          <h2 className="text-2xl font-bold text-neutral-100 bg-purple-900/30 py-2 px-4 rounded-lg">
            {candidate2.name}
            <span className="ml-2 text-sm bg-purple-800/50 text-purple-300 px-2 py-0.5 rounded-full">
              {candidate2.match}%
            </span>
          </h2>
        </div>
      </div>

      {/* Match Score Chart Visualization */}
      <div className="mb-8 bg-zinc-800/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-neutral-200 mb-4 flex items-center">
          <BarChart4Icon className="w-5 h-5 mr-2" />
          Match Score Comparison
        </h3>
        <div className="h-32">
          <canvas ref={matchScoreChartRef}></canvas>
        </div>
      </div>

      {/* Skills Radar Chart */}
      <div className="mb-8 bg-zinc-800/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-neutral-200 mb-4 flex items-center">
          <PieChartIcon className="w-5 h-5 mr-2" />
          Skills Comparison
        </h3>
        <div className="h-64 w-full">
          <canvas ref={skillChartRef}></canvas>
        </div>
      </div>

      {/* Experience & Education Chart */}
      <div className="mb-8 bg-zinc-800/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-neutral-200 mb-4 flex items-center">
          <BarChart4Icon className="w-5 h-5 mr-2" />
          Experience & Education
        </h3>
        <div className="h-64 w-full">
          <canvas ref={expEducationChartRef}></canvas>
        </div>
      </div>

      {/* Personal Information Comparison */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-neutral-200 border-b border-zinc-700 pb-2 mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 font-medium text-neutral-400">
            <p className="py-2">Email</p>
            <p className="py-2">Location</p>
          </div>
          <div className="col-span-1 text-neutral-200">
            <p className="py-2">{candidate1.fullDetails?.processed_data?.personal_information?.email || 'N/A'}</p>
            <p className="py-2">{candidate1.fullDetails?.processed_data?.personal_information?.location || 'N/A'}</p>
          </div>
          <div className="col-span-1 text-neutral-200">
            <p className="py-2">{candidate2.fullDetails?.processed_data?.personal_information?.email || 'N/A'}</p>
            <p className="py-2">{candidate2.fullDetails?.processed_data?.personal_information?.location || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Education Comparison */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-neutral-200 border-b border-zinc-700 pb-2 mb-4">
          Education
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-blue-900/20 rounded-lg p-4">
            {candidate1.fullDetails?.processed_data?.education && 
              candidate1.fullDetails.processed_data.education.length > 0 ? (
              <div className="space-y-4">
                {candidate1.fullDetails.processed_data.education.map((edu, index) => (
                  <div key={index} className="border-b border-blue-800 pb-3 last:border-0">
                    <p className="font-semibold text-neutral-200">{edu.degree}</p>
                    <p className="text-sm text-neutral-300">{edu.institution}</p>
                    <p className="text-sm text-neutral-400">{edu.graduation_year}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400">No education details available</p>
            )}
          </div>
          <div className="bg-purple-900/20 rounded-lg p-4">
            {candidate2.fullDetails?.processed_data?.education && 
              candidate2.fullDetails.processed_data.education.length > 0 ? (
              <div className="space-y-4">
                {candidate2.fullDetails.processed_data.education.map((edu, index) => (
                  <div key={index} className="border-b border-purple-800 pb-3 last:border-0">
                    <p className="font-semibold text-neutral-200">{edu.degree}</p>
                    <p className="text-sm text-neutral-300">{edu.institution}</p>
                    <p className="text-sm text-neutral-400">{edu.graduation_year}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400">No education details available</p>
            )}
          </div>
        </div>
      </div>

      {/* Work Experience Comparison */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-neutral-200 border-b border-zinc-700 pb-2 mb-4">
          Work Experience
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-blue-900/20 rounded-lg p-4">
            {candidate1.fullDetails?.processed_data?.work_experience && 
              candidate1.fullDetails.processed_data.work_experience.length > 0 ? (
              <div className="space-y-4">
                {candidate1.fullDetails.processed_data.work_experience.map((job, index) => (
                  <div key={index} className="border-b border-blue-800 pb-3 last:border-0">
                    <p className="font-semibold text-neutral-200">{job.title}</p>
                    <p className="text-sm text-neutral-300">{job.company}</p>
                    <p className="text-sm text-neutral-400">{job.start_date} - {job.end_date || 'Present'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400">No work experience available</p>
            )}
          </div>
          <div className="bg-purple-900/20 rounded-lg p-4">
            {candidate2.fullDetails?.processed_data?.work_experience && 
              candidate2.fullDetails.processed_data.work_experience.length > 0 ? (
              <div className="space-y-4">
                {candidate2.fullDetails.processed_data.work_experience.map((job, index) => (
                  <div key={index} className="border-b border-purple-800 pb-3 last:border-0">
                    <p className="font-semibold text-neutral-200">{job.title}</p>
                    <p className="text-sm text-neutral-300">{job.company}</p>
                    <p className="text-sm text-neutral-400">{job.start_date} - {job.end_date || 'Present'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400">No work experience available</p>
            )}
          </div>
        </div>
      </div>

      {/* Skills Comparison Table */}
      <div>
        <h3 className="text-xl font-semibold text-neutral-200 border-b border-zinc-700 pb-2 mb-4">
          Skills Detail
        </h3>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          {allSkillCategories.size > 0 ? (
            <div className="space-y-6">
              {Array.from(allSkillCategories).map(category => (
                <div key={category} className="mb-4">
                  <h4 className="text-lg font-medium text-neutral-300 capitalize mb-3">{category}</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-zinc-900/50 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-zinc-800/50">
                          <th className="py-2 px-4 text-left text-sm font-medium text-neutral-400">Skill</th>
                          <th className="py-2 px-4 text-center text-sm font-medium text-blue-400">{candidate1.name}</th>
                          <th className="py-2 px-4 text-center text-sm font-medium text-purple-400">{candidate2.name}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getAllSkillsForCategory(category).map((skill, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-zinc-800/20' : 'bg-zinc-800/10'}>
                            <td className="py-2 px-4 text-sm text-neutral-300">{skill}</td>
                            <td className="py-2 px-4 text-center">
                              {hasSkill(candidate1, category, skill) ? (
                                <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <XIcon className="w-5 h-5 text-red-500 mx-auto" />
                              )}
                            </td>
                            <td className="py-2 px-4 text-center">
                              {hasSkill(candidate2, category, skill) ? (
                                <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <XIcon className="w-5 h-5 text-red-500 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400 text-center py-4">No skills data available for comparison</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ComparisonView;