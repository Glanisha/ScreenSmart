import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { 
  PlusCircleIcon, 
  ListIcon, 
  Edit3Icon, 
  Trash2Icon, 
  EyeIcon,
  BriefcaseIcon,
  UsersIcon,
  ClipboardListIcon
} from 'lucide-react';

const HRDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0
  });

  useEffect(() => {
    const fetchUserAndJobs = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          navigate('/signin');
          return;
        }

        // Get HR profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError) throw profileError;
        
        // // Check if user is HR
        // if (profileData.role !== 'hr_user') {
        //   navigate('/dashboard');
        //   return;
        // }

        setUser({ ...currentUser, ...profileData });

        // Get jobs created by this HR
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select(`
            *,
            applications: applications(count)
          `)
          .eq('created_by', currentUser.id);

        if (jobsError) throw jobsError;
        
        setJobs(jobsData || []);
        
        // Calculate stats
        const activeJobsCount = jobsData ? jobsData.filter(job => job.status === 'active').length : 0;
        const totalApplicationsCount = jobsData ? jobsData.reduce((sum, job) => sum + (job.applications?.[0]?.count || 0), 0) : 0;
        
        setStats({
          totalJobs: jobsData?.length || 0,
          activeJobs: activeJobsCount,
          totalApplications: totalApplicationsCount
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndJobs();
  }, [navigate]);

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job listing? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      
      // Update local state
      setJobs(jobs.filter(job => job.id !== jobId));
      setStats(prev => ({
        ...prev,
        totalJobs: prev.totalJobs - 1,
        activeJobs: jobs.find(job => job.id === jobId)?.status === 'active' 
          ? prev.activeJobs - 1 
          : prev.activeJobs
      }));
      
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job listing.');
    }
  };

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
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">HR Dashboard</h1>
            <p className="text-gray-400">Manage your job listings and applications</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to="/hr/jobs/new">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-md transition-colors"
              >
                <PlusCircleIcon size={16} className="mr-2" />
                <span>Add New Job</span>
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          >
            <div className="flex items-center">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <BriefcaseIcon size={24} className="text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total Job Listings</p>
                <h3 className="text-3xl font-bold">{stats.totalJobs}</h3>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          >
            <div className="flex items-center">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <ListIcon size={24} className="text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Active Jobs</p>
                <h3 className="text-3xl font-bold">{stats.activeJobs}</h3>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          >
            <div className="flex items-center">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <UsersIcon size={24} className="text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total Applications</p>
                <h3 className="text-3xl font-bold">{stats.totalApplications}</h3>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Job Listings Table */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
        >
          <div className="flex items-center mb-6">
            <ClipboardListIcon className="text-blue-500 mr-3" size={24} />
            <h2 className="text-xl font-bold">Your Job Listings</h2>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-zinc-800/50 rounded-lg">
              <BriefcaseIcon size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No job listings yet</h3>
              <p className="text-gray-500 mb-6">Create your first job listing to start receiving applications</p>
              <Link to="/hr/jobs/new">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 hover:bg-blue-700 py-2 px-6 rounded-md transition-colors"
                >
                  Create Job Listing
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-left text-gray-400 border-b border-zinc-800">
                  <tr>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Posted Date</th>
                    <th className="pb-3 font-medium">Applications</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-zinc-800/50">
                      <td className="py-4">
                        <div className="font-medium">{job.title}</div>
                        <div className="text-gray-500 text-sm">{job.company}</div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          job.status === 'active' 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {job.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <Link 
                          to={`/hr/jobs/${job.id}/applications`}
                          className="text-blue-400 hover:underline"
                        >
                          {job.applications?.[0]?.count || 0} applications
                        </Link>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(`/job/${job.id}`)}
                            className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-md text-gray-300"
                            title="View"
                          >
                            <EyeIcon size={16} />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(`/hr/jobs/${job.id}/edit`)}
                            className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-md text-blue-400"
                            title="Edit"
                          >
                            <Edit3Icon size={16} />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-md text-red-400"
                            title="Delete"
                          >
                            <Trash2Icon size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HRDashboard;