import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { vCardText } = await req.json();
    if (!vCardText) {
      return Response.json({ error: 'vCard text required' }, { status: 400 });
    }

    const contacts = parseVCard(vCardText);
    const imported = [];
    const errors = [];

    for (const contact of contacts) {
      try {
        if (!contact.email) {
          errors.push(`Skipped contact without email: ${contact.name || 'Unknown'}`);
          continue;
        }

        // Check if user already exists
        const existingUsers = await base44.asServiceRole.entities.User.filter({ email: contact.email });
        
        if (existingUsers.length === 0) {
          // Note: We can't directly create users, but we can collect the data
          // The admin will need to invite them via the invite dialog
          imported.push({
            email: contact.email,
            name: contact.name || contact.email,
            department: contact.department || 'Tourism Development',
            position: contact.position || contact.jobTitle || '',
            phone: contact.phone || ''
          });
        }
      } catch (error) {
        errors.push(`Error processing ${contact.name || 'contact'}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      imported,
      errors,
      count: imported.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function parseVCard(vCardText) {
  const contacts = [];
  const vCards = vCardText.split('BEGIN:VCARD').slice(1);

  for (const vCardData of vCards) {
    const contact = {
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      department: '',
      position: ''
    };

    const lines = vCardData.split('\n');
    
    for (const line of lines) {
      if (line.includes('FN:') || line.includes('FN;')) {
        contact.name = extractValue(line);
      } else if (line.includes('EMAIL:') || line.includes('EMAIL;')) {
        contact.email = extractValue(line);
      } else if (line.includes('TEL:') || line.includes('TEL;')) {
        contact.phone = extractValue(line);
      } else if (line.includes('TITLE:') || line.includes('TITLE;')) {
        contact.jobTitle = extractValue(line);
        contact.position = contact.jobTitle;
      } else if (line.includes('ORG:') || line.includes('ORG;')) {
        const value = extractValue(line);
        const parts = value.split(';');
        if (parts.length > 1) {
          contact.department = parts[1].trim();
        }
      } else if (line.includes('X-DEPARTMENT:') || line.includes('X-DEPARTMENT;')) {
        contact.department = extractValue(line);
      }
    }

    if (contact.email || contact.name) {
      contacts.push(contact);
    }
  }

  return contacts;
}

function extractValue(line) {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return '';
  
  let value = line.substring(colonIndex + 1).trim();
  
  // Handle quoted values
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  
  // Decode escaped characters
  value = value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\\\/g, '\\');
  
  return value;
}