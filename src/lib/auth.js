import jwt from 'jsonwebtoken';

const TOKEN_NAME = 'session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function signJwt(payload) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: MAX_AGE });
}

export function verifyJwt(token) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export const cookieName = TOKEN_NAME;
export const cookieMaxAge = MAX_AGE;