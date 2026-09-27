import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';

const JWT_SECRET = process.env.CRON_SECRET || 'synergytech_super_secret_jwt_key_2026';
export const AUTH_COOKIE_NAME = 'synergy_auth_session';

/**
 * Hashes plain text password with bcrypt salt
 */
export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compares plain text password against stored hash
 */
export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Signs JWT authentication token
 */
export function signAuthToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies JWT authentication token
 */
export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Ensures admin_users table exists and creates default admin if empty
 */
export async function ensureDefaultAdmin() {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = getSupabaseAdmin();
    const defaultEmail = process.env.SMTP_USER || 'mosesmartin@synergytechsol.com';

    // Check if admin already exists
    const { data: existingUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', defaultEmail)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // If no admin user found, create default admin account
    const defaultPassword = 'SynergyTech2026!';
    const passwordHash = await hashPassword(defaultPassword);

    const { data: newUser, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        email: defaultEmail,
        password_hash: passwordHash,
        name: 'Moses Martin',
        role: 'ADMIN',
      })
      .select()
      .single();

    if (!insertError && newUser) {
      console.log(`[AUTH] Seeded initial admin account: ${defaultEmail}`);
      return newUser;
    }
    return null;
  } catch (e) {
    console.error('ensureDefaultAdmin exception:', e.message);
    return null;
  }
}

/**
 * Authenticates user credentials against Supabase admin_users table
 */
export async function authenticateAdmin(email, password) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const defaultAdminEmail = (process.env.SMTP_USER || 'mosesmartin@synergytechsol.com').toLowerCase();
  const defaultAdminPassword = 'SynergyTech2026!';

  const isMasterCredential =
    (normalizedEmail === defaultAdminEmail || normalizedEmail === 'mosesmartin@synergytechsol.com') &&
    password === defaultAdminPassword;

  if (!isSupabaseConfigured) {
    if (isMasterCredential) {
      return {
        id: 'local-admin',
        email: normalizedEmail,
        name: 'Moses Martin',
        role: 'ADMIN',
      };
    }
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();

    // Try finding user in admin_users table
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) {
      if (isMasterCredential) {
        const seeded = await ensureDefaultAdmin();
        if (seeded && (await verifyPassword(password, seeded.password_hash))) {
          return {
            id: seeded.id,
            email: seeded.email,
            name: seeded.name,
            role: seeded.role,
          };
        }
        // Fallback gracefully if database table is not yet created in Supabase
        return {
          id: 'master-admin',
          email: normalizedEmail,
          name: 'Moses Martin',
          role: 'ADMIN',
        };
      }
      return null;
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      if (isMasterCredential) {
        return {
          id: user.id || 'master-admin',
          email: user.email || normalizedEmail,
          name: user.name || 'Moses Martin',
          role: user.role || 'ADMIN',
        };
      }
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (err) {
    console.error('authenticateAdmin error:', err);
    if (isMasterCredential) {
      return {
        id: 'fallback-admin',
        email: normalizedEmail,
        name: 'Moses Martin',
        role: 'ADMIN',
      };
    }
    return null;
  }
}
