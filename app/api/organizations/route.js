import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Using the service_role key bypasses Row Level Security (RLS) for secure backend ops
const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '');

export async function POST(request) {
  try {
    const { name, industry, userId } = await request.json();

    if (!userId || !name) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    // Insert Organization (bypasses RLS limits)
    const { data: newOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert([{ name, industry }])
      .select()
      .single();

    if (orgError) throw orgError;

    // Link User to the Organization and set as Administrator
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ organization_id: newOrg.id, role: 'Administrator' })
      .eq('id', userId);

    if (userError) throw userError;

    return new Response(JSON.stringify({ organization: newOrg }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { orgId, name, industry } = await request.json();
    
    // Update Organization (bypasses RLS securely)
    const { error } = await supabaseAdmin
      .from('organizations')
      .update({ name, industry })
      .eq('id', orgId);
      
    if (error) throw error;
    
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
