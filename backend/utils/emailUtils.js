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

export const sendOtpEmail = async ({ to, name, otp }) => {
  const { oauthClient, user } = createOAuthClient();
  const from = process.env.EMAIL_FROM || user;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #166534;">Verify your ShareSpoon account</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Your OTP for email verification is:</p>
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #111827; margin: 16px 0;">
        ${otp}
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
  `;

  const rawMessage = [
    `From: ${from}`,
    `To: ${to}`,
    'Subject: Your ShareSpoon verification code',
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
