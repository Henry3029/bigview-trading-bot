import express, { Request, Response } from 'express';

const router = express.Router();

// Store temporary auth codes (expires in a few minutes in production)
const authCodesStore = new Map<string, string>(); // code -> userId

// 1. Authorization Endpoint
router.get('/authorize', async (req: Request, res: Response): Promise<any> => {
  const { client_id, redirect_uri, state, response_type } = req.query;

  // Ensure request came from Alexa
  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  // Grab the logged-in user's ID from session or query
  const userId = (req.query.userId as string) || (req as any).session?.userId; 

  if (!userId) {
    // If not logged in on the web, redirect to your login page with the redirect info
    const redirectUriStr = typeof redirect_uri === 'string' ? redirect_uri : '';
    return res.redirect(`/login?alexa_redirect=${encodeURIComponent(redirectUriStr)}&state=${state}`);
  }

  // Generate a temporary authorization code (valid for 5 minutes)
  const authCode = Math.random().toString(36).substring(2) + Date.now().toString(36);
  authCodesStore.set(authCode, userId);

  // Clean up code after 5 minutes
  setTimeout(() => authCodesStore.delete(authCode), 5 * 60 * 1000);

  // Redirect back to Amazon's redirect URI with the code and original state
  const redirectUrl = `${redirect_uri}?code=${authCode}&state=${state}`;
  return res.redirect(redirectUrl);
});


// 2. Access Token Endpoint
router.post('/token', async (req: Request, res: Response): Promise<any> => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // Verify the authorization code exists
  const userId = authCodesStore.get(code);
  if (!userId) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // Code can only be used once, delete it now
  authCodesStore.delete(code);

  // Issue the final Access Token (using MongoDB ID as the token)
  const accessToken = userId.toString(); 
  const refreshToken = 'ref_' + Math.random().toString(36).substring(2);

  // Return the token payload expected by Amazon Alexa
  return res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600, // 1 hour
    refresh_token: refreshToken
  });
});

export default router;
