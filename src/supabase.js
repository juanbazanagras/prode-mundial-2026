import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fyhlzwgxvfnvpxehqmkz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aGx6d2d4dmZudnB4ZWhxbWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjcyODUsImV4cCI6MjA5NjI0MzI4NX0.aGe7MPSgXV9f0Vi50vCJSYkGGexisxkn7LB8wDRQVn8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
