import jwt from 'jsonwebtoken';

export const createToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `token=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax', // Changed from Strict to Lax to allow cookies on navigation
    `Max-Age=${7 * 24 * 60 * 60}`,
    isProduction ? 'Secure' : ''
  ].filter(Boolean).join('; ');
  
  res.setHeader('Set-Cookie', cookieOptions);
};

export const removeTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    'token=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    isProduction ? 'Secure' : ''
  ].filter(Boolean).join('; ');
  
  res.setHeader('Set-Cookie', cookieOptions);
};