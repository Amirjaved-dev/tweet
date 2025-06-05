// Script to reset and initialize database tables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read the schema file
const schemaPath = path.join(__dirname, '../db/schema.sql');
const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
  try {
    console.log('Connecting to Supabase...');
    
    // Execute the schema SQL (this will create tables if they don't exist)
    console.log('Creating tables...');
    
    // We'll split the SQL into separate commands to handle them individually
    const commands = schemaSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    for (const command of commands) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });
        if (error) {
          console.error('Error executing SQL:', command);
          console.error(error);
        }
      } catch (err) {
        console.error('Error executing command:', command);
        console.error(err);
      }
    }
    
    console.log('Database setup complete!');
    
    // Verify tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error('Error fetching tables:', error);
    } else {
      console.log('Tables in database:');
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('Database reset failed:', error);
  }
}

// Run the reset function
resetDatabase().catch(console.error); 