import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserIcon, LogOutIcon, BriefcaseIcon, ChevronDownIcon } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const NavBar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (currentUser) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          setUser({ ...currentUser, ...profileData });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setUser({ ...session.user, ...profileData });
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const userInitial = user?.full_name
    ? user.full_name[0].toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : "U";

  const displayName = user?.full_name || user?.email?.split("@")[0] || "User";

  const profileLink =
    user?.role === "candidate"
      ? "/profile"
      : user?.role === "hr"
      ? "/hr/profile"
      : "/profile";

  return (
    <header className="fixed top-0 w-full z-50 py-4">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="
          backdrop-blur-xl 
          w-full
          bg-white/15 
          border 
          border-white/20 
          rounded-full 
          py-3 
          px-6 
          flex 
          justify-between 
          items-center 
          shadow-2xl 
          transition-all 
          duration-300 
          hover:bg-white/20 
          hover:border-white/30
        ">
          <Link to="/dashboard">
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="
                font-bricolage 
                text-xl 
                font-bold 
                text-white 
                cursor-pointer 
                drop-shadow-md
              "
            >
              CareerCraft
            </motion.h1>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="hidden md:flex items-center text-sm font-medium text-white hover:text-blue-300 transition-colors mr-4"
            >
              <BriefcaseIcon size={16} className="mr-1.5" />
              Browse Jobs
            </Link>

            {user ? (
              // If user is logged in, show Profile dropdown & Logout
              <motion.div className="relative">
                <motion.button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="
                    flex 
                    items-center 
                    space-x-2 
                    bg-white/90 
                    text-black 
                    rounded-full 
                    py-2 
                    px-3 
                    hover:bg-white 
                    transition-all 
                    shadow-md 
                    hover:shadow-lg
                  "
                >
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {userInitial}
                  </div>
                  <span className="hidden md:block">{displayName}</span>
                  <ChevronDownIcon size={16} className={`transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </motion.button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-2 w-60 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/20">
                        <p className="font-medium">{displayName}</p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                      </div>

                      <Link
                        to={profileLink}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center px-4 py-3 hover:bg-white/20 transition-colors"
                      >
                        <UserIcon size={16} className="mr-2 text-gray-600" />
                        <span>Profile</span>
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left flex items-center px-4 py-3 hover:bg-white/20 text-red-600 transition-colors"
                      >
                        <LogOutIcon size={16} className="mr-2" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              // If user is not logged in, show Sign In & Sign Up buttons
              <div className="flex space-x-3">
                <Link
                  to="/signin"
                  className="text-white bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-full text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-white border border-white/30 hover:bg-white hover:text-black transition px-4 py-2 rounded-full text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
