import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { 
  BuildingIcon, 
  MapPinIcon, 
  GlobeIcon, 
  PhoneIcon, 
  MailIcon, 
  EditIcon, 
  SaveIcon, 
  XIcon 
} from 'lucide-react';

const HRProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    company_website: '',
    company_address: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/signin');
          return;
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        // Check if user is HR
        if (profileData.role !== 'hr_user') {
          navigate('/dashboard');
          return;
        }

        setProfile({ ...user, ...profileData });
        setFormData({
          full_name: profileData.full_name || '',
          company_name: profileData.company_name || '',
          company_website: profileData.company_website || '',
          company_address: profileData.company_address || '',
          phone: profileData.phone || '',
          bio: profileData.bio || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date()
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      
      // Show success message
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-blue-500 text-2xl">Loading profile...</div>
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
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800"
        >
          {!isEditing ? (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">HR Profile</h1>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors"
                >
                  <EditIcon size={16} />
                  <span>Edit Profile</span>
                </motion.button>
              </div>

              <div className="flex flex-col md:flex-row">
                <div className="mb-6 md:mb-0 md:mr-8 flex-shrink-0">
                  <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
                    {profile.full_name ? profile.full_name[0].toUpperCase() : profile.email[0].toUpperCase()}
                  </div>
                </div>

                <div className="flex-grow">
                  <h2 className="text-2xl font-bold text-white mb-1">{profile.full_name || 'No Name Set'}</h2>
                  <p className="text-blue-400 mb-4">HR Manager</p>
                  
                  <h3 className="text-xl font-semibold mb-3">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start text-gray-300">
                      <BuildingIcon size={18} className="mr-3 text-gray-400 mt-1" />
                      <div>
                        <p className="text-gray-500 text-sm">Company</p>
                        <p>{profile.company_name || 'No company name'}</p>
                      </div>
                    </div>

                    <div className="flex items-start text-gray-300">
                      <MapPinIcon size={18} className="mr-3 text-gray-400 mt-1" />
                      <div>
                        <p className="text-gray-500 text-sm">Location</p>
                        <p>{profile.company_address || 'No address'}</p>
                      </div>
                    </div>

                    <div className="flex items-start text-gray-300">
                      <GlobeIcon size={18} className="mr-3 text-gray-400 mt-1" />
                      <div>
                        <p className="text-gray-500 text-sm">Website</p>
                        <a 
                          href={profile.company_website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {profile.company_website || 'No website'}
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center text-gray-300">
                      <MailIcon size={18} className="mr-3 text-gray-400" />
                      <span>{profile.email}</span>
                    </div>

                    <div className="flex items-center text-gray-300">
                      <PhoneIcon size={18} className="mr-3 text-gray-400" />
                      <span>{profile.phone || 'No phone number'}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-3">About</h3>
                    <div className="bg-zinc-800 p-4 rounded-md text-gray-300">
                      {profile.bio || 'No bio information.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Edit HR Profile</h1>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  className="bg-zinc-700 hover:bg-zinc-600 py-2 px-4 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors"
                >
                  <XIcon size={16} />
                  <span>Cancel</span>
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Company Website</label>
                      <input
                        type="url"
                        name="company_website"
                        value={formData.company_website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Company Address</label>
                      <input
                        type="text"
                        name="company_address"
                        value={formData.company_address}
                        onChange={handleChange}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={5}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Share information about yourself and your company..."
                  />
                </div>

                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 py-2 px-6 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors"
                  >
                    <SaveIcon size={16} />
                    <span>Save Changes</span>
                  </motion.button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HRProfile;