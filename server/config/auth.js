const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

/**
 * Hash a plain-text password using bcrypt.
 * @param {string} password - The plain-text password
 * @returns {Promise<string>} The hashed password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plain-text password with a hashed password.
 * @param {string} password - The plain-text password
 * @param {string} hash - The bcrypt hash to compare against
 * @returns {Promise<boolean>} True if the password matches
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user.
 * @param {Object} payload - The data to include in the token
 * @param {string} payload.id - The user's ID
 * @param {string} payload.email - The user's email
 * @param {string} payload.role - The user's role
 * @param {string|null} payload.schoolId - The user's school ID (null for super admins)
 * @returns {string} The signed JWT token
 */
function generateToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      schoolId: payload.schoolId || null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode a JWT token.
 * @param {string} token - The JWT token to verify
 * @returns {Object} The decoded payload
 * @throws {Error} If the token is invalid or expired
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Generate a random temporary password.
 * @param {number} length - The length of the password (default: 12)
 * @returns {string} The random password
 */
function generateTempPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateTempPassword,
  JWT_SECRET,
};
