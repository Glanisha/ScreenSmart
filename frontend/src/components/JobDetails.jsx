import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, MapPinIcon, ClockIcon, DollarSignIcon, BuildingIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Hardcoded jobs data
const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$120,000 - $150,000',
    created_at: '2023-06-15T10:00:00Z',
    description: 'We are looking for an experienced frontend developer to join our team and help us build amazing user experiences.\n\nYou will be responsible for implementing visual elements and their behaviors with user interactions. You will work with both frontend and backend web developers to build all client-side logic.',
    requirements: 'Bachelor\'s degree in Computer Science or related field\nAt least 5 years of experience with JavaScript\nStrong knowledge of React.js\nExperience with modern frontend build pipelines and tools\nFamiliarity with RESTful APIs',
    benefits: 'Health, dental, and vision insurance\n401(k) matching\nFlexible work arrangements\nUnlimited PTO\nContinuing education stipend'
  },
  {
    id: 'job-2',
    title: 'Backend Developer',
    company: 'DataSystems LLC',
    location: 'Remote',
    salary: '$110,000 - $140,000',
    created_at: '2023-06-17T14:30:00Z',
    description: 'DataSystems is hiring a backend developer to help us build scalable and efficient server-side applications.\n\nYou\'ll be working with our engineering team to develop and maintain our core services and APIs, ensuring they\'re performant and reliable.',
    requirements: 'Strong experience with Node.js or Python\nExperience with SQL and NoSQL databases\nKnowledge of API design and development\nUnderstanding of cloud services (AWS/Azure/GCP)\nCI/CD experience a plus',
    benefits: 'Competitive salary\nRemote-first culture\nHealthcare benefits\nEquity options\nPaid parental leave'
  },
  {
    id: 'job-3',
    title: 'Full Stack Engineer',
    company: 'Growth Startup',
    location: 'New York, NY',
    salary: '$130,000 - $160,000',
    created_at: '2023-06-20T09:15:00Z',
    description: 'Join our fast-growing team as a Full Stack Engineer and help us build the next generation of our platform.\n\nYou\'ll be involved in all aspects of development, from database design to frontend implementation, working closely with our product and design teams.',
    requirements: 'Experience with both frontend and backend technologies\nProficient with React.js and Node.js\nKnowledge of database design and optimization\nFamiliarity with cloud infrastructure\nExcellent problem-solving skills',
    benefits: 'Competitive compensation package\nFlexible working hours\nHealth, dental, and vision coverage\nGenerous equity package\nRegular team events and retreats'
  }
];

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and fetching job details
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/signin');
          return;
        }
        
        // Find job by ID from mock data
        const foundJob = MOCK_JOBS.find(j => j.id === jobId);
        setJob(foundJob);
        setLoading(false);
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/signin');
      }
    };
    
    checkAuth();
  }, [jobId, navigate]);

  const handleApply = () => {
    navigate(`/job/${jobId}/apply`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-blue-500 text-2xl">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-2xl mb-4">Job not found</div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-md text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white pt-8"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-400 hover:text-white mb-6"
        >
          <ChevronLeftIcon size={20} className="mr-1" />
          <span>Back to Dashboard</span>
        </motion.button>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-900 rounded-xl p-8 border border-zinc-800"
        >
          <div className="flex flex-col md:flex-row justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <div className="flex items-center mt-2">
                <BuildingIcon size={16} className="text-blue-500 mr-1.5" />
                <span className="text-blue-400 font-medium">{job.company}</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApply}
              className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md font-medium transition-colors"
            >
              Add Resume
            </motion.button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-zinc-800 p-4 rounded-md">
            <div className="flex items-center">
              <MapPinIcon size={18} className="text-gray-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Location</p>
                <p className="text-white">{job.location}</p>
              </div>
            </div>
            <div className="flex items-center">
              <DollarSignIcon size={18} className="text-gray-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Salary</p>
                <p className="text-white">{job.salary || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <ClockIcon size={18} className="text-gray-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Posted On</p>
                <p className="text-white">{new Date(job.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <div className="text-gray-300 space-y-4">
              {job.description.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
          
          {job.requirements && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                {job.requirements.split('\n').map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          
          {job.benefits && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Benefits</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                {job.benefits.split('\n').map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
          
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="flex justify-center mt-10"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApply}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-md font-medium transition-colors"
            >
              Apply Now
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default JobDetails;