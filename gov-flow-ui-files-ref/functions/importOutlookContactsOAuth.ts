import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get the access token from the Outlook connector
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('outlook');

    if (!accessToken) {
      return Response.json({ error: 'Outlook not connected' }, { status: 401 });
    }

    // Fetch contacts from Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me/contacts', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch contacts: ${response.statusText}`);
    }

    const data = await response.json();
    const outlookContacts = data.value || [];

    // Check existing users and extract new contacts
    const imported = [];
    const errors = [];

    for (const contact of outlookContacts) {
      try {
        const email = contact.emailAddresses?.[0]?.address;

        if (!email) {
          errors.push(`Skipped contact without email: ${contact.displayName || 'Unknown'}`);
          continue;
        }

        // Check if user already exists
        const existingUsers = await base44.asServiceRole.entities.User.filter({
          email: email.toLowerCase(),
        });

        if (existingUsers.length === 0) {
          imported.push({
            email: email.toLowerCase(),
            name: contact.displayName || email,
            position: contact.jobTitle || '',
            phone: contact.mobilePhone || contact.businessPhones?.[0] || '',
            department: contact.department || 'Tourism Development',
          });
        }
      } catch (error) {
        errors.push(`Error processing ${contact.displayName || 'contact'}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      imported,
      errors,
      count: imported.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});