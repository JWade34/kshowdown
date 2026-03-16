import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://dgbdmhfuienvpbutodxl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnYmRtaGZ1aWVudnBidXRvZHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjA2MjYsImV4cCI6MjA4OTE5NjYyNn0.8Zk5FugnBf-pQExptZuFpJmkOy-35mnmzc7r7uv3j-Q'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
