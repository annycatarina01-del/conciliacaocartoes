import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yvdeduqhdlcgltkdbmpx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2ZGVkdXFoZGxjZ2x0a2RibXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzMzNjEsImV4cCI6MjA5MTI0OTM2MX0.py0kAO9qSWL12y2hGROYU_6VAGvC4K9xAP49RWofAlk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@suporteagricola.com.br',
    password: 'Admin123!',
    options: {
      data: {
         role: 'admin'
      }
    }
  });

  if (error) {
    console.error('ERROR:', error.message);
  } else {
    console.log('SUCCESS:', data.user?.id);
  }
}

run();
