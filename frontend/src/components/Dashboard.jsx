import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { BriefcaseIcon, ChevronRightIcon, ClockIcon, MapPinIcon, DollarSignIcon } from 'lucide-react';

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

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          navigate('/signin');
          return;
        }

        // Get user profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
          
        setUser({ ...currentUser, ...profileData });
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/signin');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-blue-500 text-2xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white pt-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold">
            Welcome, <span className="text-blue-500">{user?.full_name || user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-gray-400">Find your next career opportunity below</p>
        </motion.div>

        <JobOffers jobs={jobs} />
      </div>
    </motion.div>
  );
};

const JobOffers = ({ jobs }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-zinc-900 rounded-xl p-6 shadow-xl border border-zinc-800"
    >
      <div className="flex items-center mb-6">
        <BriefcaseIcon className="text-blue-500 mr-3" size={24} />
        <h2 className="text-xl font-bold">Job Offers</h2>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400">No job offers available at the moment.</p>
          <p className="text-sm text-gray-500 mt-2">Check back later for new opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              whileHover={{ y: -4 }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => navigate(`/job/${job.id}`)}
              className="bg-zinc-800 rounded-lg p-5 cursor-pointer hover:border-blue-500 border border-zinc-700 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                <ChevronRightIcon className="text-blue-500" size={18} />
              </div>

              <p className="text-blue-400 font-medium mb-3">{job.company}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-400 text-sm">
                  <MapPinIcon size={14} className="mr-1.5 text-gray-500" />
                  {job.location}
                </div>
                
                <div className="flex items-center text-gray-400 text-sm">
                  <DollarSignIcon size={14} className="mr-1.5 text-gray-500" />
                  {job.salary || 'Competitive salary'}
                </div>
                
                <div className="flex items-center text-gray-400 text-sm">
                  <ClockIcon size={14} className="mr-1.5 text-gray-500" />
                  {new Date(job.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <p className="text-gray-300 text-sm line-clamp-2">
                {job.description}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;