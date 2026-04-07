import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update roles
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
      return Response.json({ error: 'Missing userId or newRole' }, { status: 400 });
    }

    // Update the user role using the users API
    await base44.asServiceRole.users.updateUser(userId, { role: newRole });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});