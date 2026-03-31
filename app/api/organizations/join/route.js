import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request) {
  try {
    const { orgId, userId } = await request.json();

    if (!orgId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing Organization ID or User ID' }), { status: 400 });
    }

    // 1. Verify organization exists securely
    const { data: org, error: fetchErr } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single();
      
    if (fetchErr || !org) {
      return new Response(JSON.stringify({ error: 'Organization not found. Please double-check the ID.' }), { status: 404 });
    }

    // 2. Link User to the Organization with base permissions
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ organization_id: org.id, role: 'Organization User' })
      .eq('id', userId);

    if (userError) throw userError;

    return new Response(JSON.stringify({ organization: org }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
