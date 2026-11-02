import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Website Requests | SynergyTech', robots: { index: false, follow: false } };

export default function WebsiteRequestsLayout({ children }) {
  const session = verifyAuthToken(cookies().get(AUTH_COOKIE_NAME)?.value || '');
  if (!session || session.role !== 'ADMIN') redirect('/login');
  return children;
}
