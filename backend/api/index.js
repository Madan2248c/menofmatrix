/**
 * Vercel serverless entry point.
 * The Express app is used directly as the request handler (compatible signature).
 */
import app from '../src/server-app.js';

export const config = {
  // Longest allowed on Hobby; gives RSS/sync jobs room to finish
  maxDuration: 60,
};

export default app;
