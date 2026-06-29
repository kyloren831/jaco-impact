import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
// We will use a default verified sender email. For local development, Resend requires you to use a verified domain or 'onboarding@resend.dev'.
// Jaco Impact probably has a domain, but we can default to onboarding@resend.dev if missing.
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    const data = await resend.emails.send({
      from: `Jaco Impact <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
    return { success: false, error };
  }
}
