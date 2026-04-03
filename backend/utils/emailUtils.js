import { google } from 'googleapis';

const createOAuthClient = () => {
  const user = process.env.EMAIL;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const refreshToken = process.env.REFRESH_TOKEN;

  if (!user || !clientId || !clientSecret || !refreshToken) {
    throw new Error('EMAIL, CLIENT_ID, CLIENT_SECRET and REFRESH_TOKEN must be configured for Gmail API OTP emails');
  }

  const oauthClient = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauthClient.setCredentials({ refresh_token: refreshToken });
  return { oauthClient, user };
};

const base64UrlEncode = (value) => {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const sendHtmlEmail = async ({ to, subject, html }) => {
  const { oauthClient, user } = createOAuthClient();
  const from = process.env.EMAIL_FROM || user;

  const rawMessage = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');

  const gmail = google.gmail({ version: 'v1', auth: oauthClient });
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: base64UrlEncode(rawMessage),
    },
  });
};

export const sendOtpEmail = async ({ to, name, otp }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #166534;">Verify your Share Spoon account</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Your OTP for email verification is:</p>
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #111827; margin: 16px 0;">
        ${otp}
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
  `;

  await sendHtmlEmail({
    to,
    subject: 'Your Share Spoon verification code',
    html,
  });
};

export const sendPickupRatingReminderEmail = async ({
  to,
  requesterName,
  donorName,
  postTitle,
  requestId,
}) => {
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const ratingUrl = `${baseUrl}/requests?tab=sent&rateRequest=${requestId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #166534;">How was your Share Spoon pickup?</h2>
      <p>Hi ${requesterName || 'there'},</p>
      <p>Your pickup for <strong>${postTitle || 'your food request'}</strong> has been marked as completed.</p>
      <p>Please rate your experience with donor <strong>${donorName || 'the donor'}</strong>.</p>
      <p style="margin: 20px 0;">
        <a href="${ratingUrl}" style="background: #16a34a; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Rate this pickup
        </a>
      </p>
      <p style="font-size: 12px; color: #6b7280;">If the button does not work, copy this link: ${ratingUrl}</p>
    </div>
  `;

  await sendHtmlEmail({
    to,
    subject: 'Rate your completed pickup on Share Spoon',
    html,
  });
};
