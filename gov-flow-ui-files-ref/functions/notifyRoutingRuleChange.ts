import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!['create', 'update'].includes(event.type)) {
      return Response.json({ success: true });
    }

    const rule = data;
    if (!rule || !rule.name) {
      return Response.json({ success: true });
    }

    // Get all users with editor/admin roles who should be notified
    const allUsers = await base44.asServiceRole.entities.User.list();
    const adminAndEditors = allUsers.filter(u => ['admin', 'editor'].includes(u.role));

    // Notify each admin/editor
    for (const user of adminAndEditors) {
      const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({
        user_id: user.id
      });

      const preference = prefs[0];
      if (!preference || !preference.notify_routing_rule_changes) {
        continue;
      }

      await base44.asServiceRole.entities.Notification.create({
        user_id: user.id,
        type: 'status_change',
        title: `Routing Rule ${event.type === 'create' ? 'Created' : 'Modified'}`,
        message: `Routing rule "${rule.name}" was ${event.type === 'create' ? 'created' : 'modified'}`,
        entity_type: 'ticket',
        entity_id: rule.id,
        is_read: false,
        is_email_sent: false
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in notifyRoutingRuleChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});