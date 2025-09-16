const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Use anon key for server-side
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create client for general operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Create service client for admin operations (if service key is available)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connection established successfully');
    }
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
};

// Test connection on startup
testConnection();

module.exports = {
  supabase,
  supabaseAdmin
};