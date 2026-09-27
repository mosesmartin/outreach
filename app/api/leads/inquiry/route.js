import { NextResponse } from 'next/server';
import { sendColdEmail } from '@/lib/email';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { businessName, city, name, phone, service, note } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required.' },
        { status: 400 }
      );
    }

    const adminEmail = process.env.SMTP_USER || 'mosesmartin@synergytechsol.com';

    const emailSubject = `🔥 HOT INBOUND LEAD: ${name} requested quote for ${businessName || 'Demo Prototype'}`;
    const emailBody = `Hi Moses,

A new customer quote request just arrived from your live prototype demo!

Details:
• Customer Name: ${name}
• Direct Phone: ${phone}
• Service Requested: ${service || 'General Consultation'}
• Target Business: ${businessName || 'Demo Landing Page'}
• City/Location: ${city || 'Local Area'}
• Customer Note: ${note || 'No additional note provided'}
• Submitted At: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}

You can now reach out directly to ${businessName} or the customer to close the acquisition!

Best,
SynergyTech Inbound Engine`;

    // 1. Dispatch real-time alert to Moses
    await sendColdEmail({
      to: adminEmail,
      subject: emailSubject,
      body: emailBody,
    }).catch((e) => console.warn('Inbound alert email notice:', e.message));

    return NextResponse.json({
      success: true,
      message: 'Inquiry recorded and notification dispatched successfully.',
    });
  } catch (error) {
    console.error('Inbound inquiry error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record inquiry' },
      { status: 500 }
    );
  }
}
