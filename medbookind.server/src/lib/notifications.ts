import nodemailer from 'nodemailer';

const APP_NAME = process.env.APP_NAME ?? 'MedBookInd';

function purposeLabel(purpose: string): string {
  switch (purpose) {
    case 'password_reset':
      return 'password reset';
    case 'register_email':
    case 'register_phone':
      return 'account registration';
    case 'verify_email':
      return 'email verification';
    case 'verify_phone':
      return 'phone verification';
    default:
      return 'verification';
  }
}

export async function sendEmailOtp(
  to: string,
  otp: string,
  purpose: string
): Promise<void> {
  const label = purposeLabel(purpose);
  const subject = `${APP_NAME} — Your verification code`;
  const text = `Your ${label} code is: ${otp}\n\nThis code expires in 15–30 minutes. Do not share it with anyone.`;
  const html = `<p>Your <strong>${label}</strong> code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${otp}</p><p>This code expires soon. Do not share it.</p>`;

  const host = process.env.SMTP_HOST?.trim();
  if (host) {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return;
  }

  console.log(`[EMAIL OTP] to=${to} purpose=${purpose} code=${otp}`);
}

export async function sendSmsOtp(
  to: string,
  otp: string,
  purpose: string
): Promise<void> {
  const label = purposeLabel(purpose);
  const body = `${APP_NAME}: Your ${label} code is ${otp}. Valid for 15 minutes.`;

  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (sid && token && from) {
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const params = new URLSearchParams({ To: to, From: from, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`SMS delivery failed: ${errText}`);
    }
    return;
  }

  console.log(`[SMS OTP] to=${to} purpose=${purpose} code=${otp}`);
}
