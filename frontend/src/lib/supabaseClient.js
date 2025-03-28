import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authHelpers = {
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error.message);
  },

  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  onAuthStateChange: (callback) => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session);
      }
    );

    return authListener;
  },

  // Add this function to properly get user role
  getUserRole: async (userId = null) => {
    try {
      // If no userId provided, get the current logged in user
      if (!userId) {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;
        userId = userData.user.id;
      }

      // Query the user_roles table to get the role
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return data.role; // Returns 'candidate' or 'hr'
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  },
};
