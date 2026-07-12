const positiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

module.exports = {
    DAILY_TRANSACTION_LIMIT: 10000,
    HIGH_VALUE_TRANSACTION_LIMIT: 5000,
    SUSPICIOUS_TRANSACTION_COUNT: 5,
    SUSPICIOUS_TIME_WINDOW: 10,

    // API request controls. Values can be overridden in .env.
    AUTH_RATE_LIMIT_MAX: positiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 10),
    AUTH_RATE_LIMIT_WINDOW_MS: positiveInteger(
        process.env.AUTH_RATE_LIMIT_WINDOW_MS,
        15 * 60 * 1000
    ),
    USER_RATE_LIMIT_PER_MINUTE: positiveInteger(
        process.env.USER_RATE_LIMIT_PER_MINUTE,
        60
    ),
    USER_RATE_LIMIT_PER_HOUR: positiveInteger(
        process.env.USER_RATE_LIMIT_PER_HOUR,
        1000
    ),
    TRANSACTION_RATE_LIMIT_PER_MINUTE: positiveInteger(
        process.env.TRANSACTION_RATE_LIMIT_PER_MINUTE,
        10
    )
};
