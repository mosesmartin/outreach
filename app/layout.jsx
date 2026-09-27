import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SynergyTech Solutions | B2B Cold Outreach & Acquisition Engine',
  description: 'Automated Dual Funnel B2B Outreach and Dynamic Prototype Engine',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
