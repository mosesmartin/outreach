const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const ws = require('ws');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
});

const newEmail = process.argv[2];
const newPassword = process.argv[3];
const newName = process.argv[4] || 'Admin';

if (!newEmail || !newPassword) {
  console.log('Usage: node scripts/update_admin.js <new_email> <new_password> [name]');
  process.exit(1);
}

async function updateAdmin() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws }
  });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  const normalizedEmail = newEmail.trim().toLowerCase();

  // Check if admin user exists
  const { data: existingUsers } = await supabase.from('admin_users').select('*');

  if (existingUsers && existingUsers.length > 0) {
    // Update existing admin
    const adminId = existingUsers[0].id;
    const { data, error } = await supabase
      .from('admin_users')
      .update({
        email: normalizedEmail,
        password_hash: passwordHash,
        name: newName,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
      .select();

    if (error) {
      console.error('Error updating admin:', error.message);
    } else {
      console.log(`✅ Admin credentials updated successfully!`);
      console.log(`Email: ${normalizedEmail}`);
      console.log(`Password: (Updated)`);
    }
  } else {
    // Insert new admin
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        name: newName,
        role: 'ADMIN'
      })
      .select();

    if (error) {
      console.error('Error creating admin:', error.message);
    } else {
      console.log(`✅ Admin user created successfully!`);
      console.log(`Email: ${normalizedEmail}`);
    }
  }
}

updateAdmin();
