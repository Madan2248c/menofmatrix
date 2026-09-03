import jwt from 'jsonwebtoken';
import 'dotenv/config';

/**
 * Bearer-JWT guard for owner-only endpoints.
 *
 * Verifies the signature AND that the token was minted for an owner. Member
 * tokens (POST /api/auth/google) are signed with the same JWT_SECRET, so a
 * signature-only check would let any signed-in member reach admin routes.
 * The role claim is the boundary: owner tokens carry role:'owner', member
 * tokens carry the member's DB role ('member' for everyone by default).
 */
export function requireOwner(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  try {
    const payload = jwt.verify(token || '', process.env.JWT_SECRET);
    if (payload.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.owner = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
