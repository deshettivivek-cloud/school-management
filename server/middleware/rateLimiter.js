const rateLimit = require('express-rate-limit');

// Rate limiting for login routes (10 requests per IP per minute)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 login requests per `window` (here, per minute)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after a minute'
  },
  handler: (req, res, next, options) => {
    console.warn(`[IP_RATE_LIMIT] Too many login attempts from IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  }
});

module.exports = {
  loginLimiter
};
