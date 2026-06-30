require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

async function testSupabase() {
  console.log('--- Testing Supabase API (Storage) ---');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Error: SUPABASE_URL or SUPABASE_KEY missing');
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        console.log('❌ Supabase API Error:', error.message);
      } else {
        console.log('✅ Supabase API (Storage) Connection Successful!');
      }
    } catch (e) {
      console.log('❌ Supabase API Crash:', e.message);
    }
  }

  console.log('\n--- Testing Supabase Database (PostgreSQL) ---');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('❌ Error: DATABASE_URL missing');
  } else {
    const client = new Client({ connectionString: dbUrl });
    try {
      await client.connect();
      console.log('✅ PostgreSQL Database Connection Successful!');
      const res = await client.query('SELECT NOW()');
      console.log('Current DB Time:', res.rows[0].now);
      await client.end();
    } catch (e) {
      console.log('❌ PostgreSQL Connection Error:', e.message);
    }
  }
}

testSupabase();
