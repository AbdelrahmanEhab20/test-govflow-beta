import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type !== 'update') {
      return Response.json({ success: true });
    }

    const user = data;
    if (!user || !user.id) {
      return Response.json({ success: true });
    }

    // Check if this was updated by an admin (different from current user)
    const currentUser = await base44.auth.me();
    if (currentUser.id === user.id || currentUser.role !== 'admin') {
      return Response.json({ success: true });
    }

    // Check notification preferences
    const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({
      user_id: user.id
    });

    const preference = prefs[0];
    if (!preference || !preference.notify_profile_updated) {
      return Response.json({ success: true });
    }

    // Determine what was changed
    const changes = [];
    if (old_data?.full_name !== user.full_name) changes.push('name');
    if (old_data?.phone !== user.phone) changes.push('phone');
    if (old_data?.department !== user.department) changes.push('department');
    if (old_data?.position !== user.position) changes.push('position');
    if (old_data?.role !== user.role) changes.push('role');

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: user.id,
      type: 'status_change',
      title: 'Profile Updated',
      message: `Your profile was updated by an admin. Changes: ${changes.join(', ')}`,
      entity_type: 'ticket',
      entity_id: user.id,
      is_read: false,
      is_email_sent: false
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in notifyProfileUpdate:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});