import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BriefcaseIcon, MapPinIcon, DollarSignIcon, ClockIcon, ChevronRightIcon } from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase
        .from("job_postings")
        .select("id, title, description, location, salary_range, employment_type, remote_status, companies(name, logo_url), created_at");

      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        setJobs(data);
      }
      setLoading(false);
    }
    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-blue-500 text-2xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-black text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="mb-8">
          <h1 className="text-2xl font-bold text-blue-500">Job Listings</h1>
          <p className="text-gray-400">Explore the latest opportunities</p>
        </motion.div>
        <JobOffers jobs={jobs} navigate={navigate} />
      </div>
    </motion.div>
  );
}

const JobOffers = ({ jobs, navigate }) => {
  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-zinc-900 rounded-xl p-6 shadow-xl border border-zinc-800">
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
              {job.companies?.logo_url && (
                <img src={job.companies.logo_url} alt={job.companies.name} className="h-10 w-10 object-contain mb-3" />
              )}
              <p className="text-blue-400 font-medium mb-3">{job.companies?.name}</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-400 text-sm">
                  <MapPinIcon size={14} className="mr-1.5 text-gray-500" />
                  {job.location}
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                  <DollarSignIcon size={14} className="mr-1.5 text-gray-500" />
                  {job.salary_range || "Competitive salary"}
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                  <ClockIcon size={14} className="mr-1.5 text-gray-500" />
                  {new Date(job.created_at).toLocaleDateString()}
                </div>
              </div>
              <p className="text-gray-300 text-sm line-clamp-2">{job.description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};