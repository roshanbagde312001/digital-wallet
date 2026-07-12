const config = require("../config/wallet.config");

/*
 * Fixed-window, in-memory rate limiter.
 * Authenticated requests are keyed by user ID; unauthenticated requests use
 * the client IP address. For a multi-instance deployment, replace the Map
 * store with a shared Redis-backed implementation.
 */
const createRateLimiter = ({ name, windowMs, maxRequests, keyGenerator }) => {
    const requests = new Map();
    let cleanupCounter = 0;

    return (req, res, next) => {
        const now = Date.now();

        // Keep the in-memory store bounded as old IP/user windows expire.
        if (++cleanupCounter % 100 === 0) {
            for (const [storedKey, storedEntry] of requests) {
                if (now >= storedEntry.resetAt) {
                    requests.delete(storedKey);
                }
            }
        }

        const key = keyGenerator(req);
        const entry = requests.get(key);
        const isExpired = !entry || now >= entry.resetAt;
        const current = isExpired
            ? { count: 0, resetAt: now + windowMs }
            : entry;

        current.count += 1;
        requests.set(key, current);

        const remaining = Math.max(0, maxRequests - current.count);
        const retryAfterSeconds = Math.max(
            1,
            Math.ceil((current.resetAt - now) / 1000)
        );

        res.set({
            [`X-RateLimit-${name}-Limit`]: String(maxRequests),
            [`X-RateLimit-${name}-Remaining`]: String(remaining),
            [`X-RateLimit-${name}-Reset`]: String(Math.ceil(current.resetAt / 1000))
        });

        if (current.count > maxRequests) {
            res.set("Retry-After", String(retryAfterSeconds));
            return res.status(429).json({
                success: false,
                message: "Too many requests. Please try again later.",
                limit: name,
                retryAfterSeconds
            });
        }

        return next();
    };
};

const clientIp = (req) => req.ip || req.socket?.remoteAddress || "unknown";
const userKey = (req) => `user:${req.user.id}`;

const authRateLimiter = createRateLimiter({
    name: "Auth",
    windowMs: config.AUTH_RATE_LIMIT_WINDOW_MS,
    maxRequests: config.AUTH_RATE_LIMIT_MAX,
    keyGenerator: clientIp
});

const userMinuteRateLimiter = createRateLimiter({
    name: "User-Minute",
    windowMs: 60 * 1000,
    maxRequests: config.USER_RATE_LIMIT_PER_MINUTE,
    keyGenerator: userKey
});

const userHourRateLimiter = createRateLimiter({
    name: "User-Hour",
    windowMs: 60 * 60 * 1000,
    maxRequests: config.USER_RATE_LIMIT_PER_HOUR,
    keyGenerator: userKey
});

const transactionRateLimiter = createRateLimiter({
    name: "Transaction-Minute",
    windowMs: 60 * 1000,
    maxRequests: config.TRANSACTION_RATE_LIMIT_PER_MINUTE,
    keyGenerator: userKey
});

module.exports = {
    authRateLimiter,
    userMinuteRateLimiter,
    userHourRateLimiter,
    transactionRateLimiter
};
