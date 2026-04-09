import { supabase } from './src/lib/supabase';

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@suporteagricola.com.br',
    password: 'Admin123!'
  });
  if (error) {
    console.error('Error signing up user:', error.message);
  } else {
    console.log('User created:', data.user?.id);
  }
}

run();
