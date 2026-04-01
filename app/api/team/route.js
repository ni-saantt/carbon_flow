import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) return new Response(JSON.stringify({ error: 'Missing organization scope' }), { status: 400 });

    // Fetch users via service role to securely bypass SELECT RLS
    const { data: users, error } = await supabaseAdmin.from('users').select('*').eq('organization_id', orgId);
    if (error) throw error;

    return new Response(JSON.stringify({ users }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { targetUserId, newRole, requesterId } = await request.json();

    // Verify requester is Administrator
    const { data: reqUser } = await supabaseAdmin.from('users').select('role, organization_id').eq('id', requesterId).single();

    if (reqUser?.role !== 'Administrator') {
      return new Response(JSON.stringify({ error: 'Unauthorized. Only Administrators can change roles.' }), { status: 403 });
    }

    // Role updates
    const { error } = await supabaseAdmin.from('users').update({ role: newRole }).eq('id', targetUserId).eq('organization_id', reqUser.organization_id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
