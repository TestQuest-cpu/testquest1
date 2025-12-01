export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the actual domain from the request headers
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // Get accountType from query params, default to 'tester' if not provided
  const accountType = req.query.accountType || 'tester';

  // Encode accountType in state parameter to preserve it through OAuth flow
  const state = Buffer.from(JSON.stringify({ accountType })).toString('base64');

  const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent('openid profile email')}&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${encodeURIComponent(state)}`;

  res.redirect(googleOAuthUrl);
}