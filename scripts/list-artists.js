const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS for debugging
);

async function listArtists() {
    const { data, error } = await supabase.from('artists').select('*');
    if (error) {
        console.error('Error fetching artists:', error);
        return;
    }
    console.log('Artists:', data);
}

listArtists();
