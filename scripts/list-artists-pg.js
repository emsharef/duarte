const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION,
});

async function listArtists() {
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM artists');
        console.log('Artists:', res.rows);
    } catch (err) {
        console.error('Error fetching artists:', err);
    } finally {
        await client.end();
    }
}

listArtists();
