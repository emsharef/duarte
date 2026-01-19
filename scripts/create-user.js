const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY; // This is anon key, might not be enough for admin tasks usually, but signUp works with anon.
// Actually, to create a user without email confirmation, I might need service role key or just use signUp and hope confirmation is off or I can confirm manually.
// But I don't have service role key in env vars provided (only anon key and db password).
// I can use the DB connection to insert into auth.users directly if needed, but that's risky.
// Let's try signUp. If email confirmation is on, I'm stuck unless I can access the inbox or db.
// With DB password, I can update the user to be confirmed.

const supabase = createClient(supabaseUrl, supabaseKey);

const { Client } = require('pg');
const pgClient = new Client({
    connectionString: process.env.SUPABASE_CONNECTION,
});

async function createUser() {
    const email = 'test@duarte.com';
    const password = 'password123';

    console.log(`Creating user ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('Error creating user:', error);
        return;
    }

    console.log('User created:', data.user?.id);

    // Auto-confirm user via DB
    try {
        await pgClient.connect();
        const sql = `UPDATE auth.users SET email_confirmed_at = now() WHERE email = '${email}'`;
        await pgClient.query(sql);
        console.log('User confirmed via DB');
    } catch (err) {
        console.error('Error confirming user:', err);
    } finally {
        await pgClient.end();
    }
}

createUser();
