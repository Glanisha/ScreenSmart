import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, UploadIcon, CheckIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Hardcoded jobs data
const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
  },
  {
    id: 'job-2',
    title: 'Backend Developer',
    company: 'DataSystems LLC',
  },
  {
    id: 'job-3',
    title: 'Full Stack Engineer',
    company: 'Growth Startup',
  }
];

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [job, setJob] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
  });
  const [resume, setResume] = useState(null);
  const [resumeName, setResumeName] = useState('');

  useEffect(() => {
    const fetchJobAndUser = async () => {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
          navigate('/signin');
          return;
        }

        // Get user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError) throw profileError;

        const userData = { ...currentUser, ...profileData };
        setUser(userData);

        // Prefill form data
        setFormData({
          fullName: userData.full_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          coverLetter: '',
        });

        // Find job from mock data
        const foundJob = MOCK_JOBS.find(j => j.id === jobId);
        setJob(foundJob);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndUser();
  }, [jobId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Maximum allowed size is 5MB.');
        return;
      }
      setResume(file);
      setResumeName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resume) {
      alert('Please upload your resume.');
      return;
    }

    setSubmitting(true);

    try {
      // Upload resume file
      const fileExt = resume.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('applications')
        .upload(filePath, resume);

      if (uploadError) throw uploadError;

      // Create application record
      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          job_id: jobId,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          cover_letter: formData.coverLetter,
          resume_path: filePath,
          status: 'pending',
          created_at: new Date(),
        });

      if (applicationError) throw applicationError;

      alert('Your application has been successfully submitted!');
      navigate('/dashboard');

    } catch (error) {
      console.error('Error submitting application:', error);
      alert('There was an error submitting your application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-blue-500 text-2xl">Loading application form...</div>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/job/${jobId}`)}
          className="flex items-center text-gray-400 hover:text-white mb-6"
        >
          <ChevronLeftIcon size={20} className="mr-1" />
          <span>Back to Job Details</span>
        </motion.button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-900 rounded-xl p-8 border border-zinc-800"
        >
          <h1 className="text-2xl font-bold mb-2">Apply for Position</h1>
          <p className="text-blue-400 mb-6">{job.title} at {job.company}</p>

          <form onSubmit={handleSubmit}>
            {/* Name, Email, Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name*</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="input-field"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address*</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field"/>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-1">Upload Resume*</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx" hidden />
              <p>{resumeName || 'Click to upload (Max 5MB)'}</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button type="submit" disabled={submitting || !resume} className="px-8 py-3 bg-blue-600 rounded-md font-medium">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default JobApplication;
