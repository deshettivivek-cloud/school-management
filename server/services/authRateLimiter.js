const supabase = require('../config/supabase');

// In-memory store: { email: { attempts: number, lockedUntil: timestamp } }
const failedAttemptsStore = new Map();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

class AuthRateLimiter {
  /**
   * Check if the account is currently locked out
   * @param {string} email
   * @returns {boolean} True if locked
   */
  static isLocked(email) {
    const record = failedAttemptsStore.get(email);
    if (!record) return false;

    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      return true;
    }

    // If lockout has expired, reset it
    if (record.lockedUntil && Date.now() > record.lockedUntil) {
      failedAttemptsStore.delete(email);
      return false;
    }

    return false;
  }

  /**
   * Increment failed attempts for an email and return the progressive delay in ms.
   * If attempts reach MAX, triggers an email reset link in the background.
   * @param {string} email
   * @returns {Promise<number>} Delay to wait before responding (in ms)
   */
  static async incrementAttempt(email) {
    const record = failedAttemptsStore.get(email) || { attempts: 0, lockedUntil: null };
    record.attempts += 1;

    // Trigger lockout on 5th attempt
    if (record.attempts >= MAX_FAILED_ATTEMPTS && !record.lockedUntil) {
      record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      console.warn(`[AUTH_LOCKOUT] Account ${email} locked due to too many failed attempts.`);
      
      // Trigger password reset email via Supabase (fire and forget)
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.CLIENT_URL || 'http://localhost:3000/reset-password',
      }).catch(err => {
        console.error(`[AUTH_LOCKOUT] Failed to send reset email to ${email}:`, err.message);
      });
    }

    failedAttemptsStore.set(email, record);

    // Progressive delay: 1st attempt = 1s, 2nd = 2s, etc. (max 5s)
    const delayMs = Math.min(record.attempts * 1000, 5000);
    return delayMs;
  }

  /**
   * Clear failed attempts upon a successful login
   * @param {string} email
   */
  static clearAttempts(email) {
    failedAttemptsStore.delete(email);
  }
  
  /**
   * Helper to wait for the calculated delay
   * @param {number} ms 
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Cleanup stale records periodically (every 1 hour) to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of failedAttemptsStore.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) {
      failedAttemptsStore.delete(email);
    } else if (!record.lockedUntil && record.attempts > 0) {
      // Clear non-locked attempts after an hour of inactivity (approximate)
      failedAttemptsStore.delete(email);
    }
  }
}, 60 * 60 * 1000);

module.exports = AuthRateLimiter;
