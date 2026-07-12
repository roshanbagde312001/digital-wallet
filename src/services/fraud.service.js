const { Op } = require("sequelize");
const { Transaction } = require("../models");
const config = require("../config/wallet.config");
const { getExchangeRate } = require("./exchange.service");

const outgoingTransactionTypes = ["WITHDRAW", "TRANSFER"];

const roundCurrency = (amount) => Number(Number(amount).toFixed(2));

const startOfTodayUtc = () => {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    return start;
};

const createFraudError = (message, details) => {
    const error = new Error(message);
    error.fraudDetails = details;
    return error;
};

const convertToBaseCurrency = async (amount, currency, rateCache) => {
    const sourceCurrency = String(currency).toUpperCase();
    const baseCurrency = String(config.LIMIT_BASE_CURRENCY).toUpperCase();

    if (sourceCurrency === baseCurrency) {
        return roundCurrency(amount);
    }

    const cacheKey = `${sourceCurrency}:${baseCurrency}`;
    if (!rateCache.has(cacheKey)) {
        rateCache.set(
            cacheKey,
            await getExchangeRate(sourceCurrency, baseCurrency)
        );
    }

    return roundCurrency(Number(amount) * Number(rateCache.get(cacheKey)));
};

const getOutgoingTransactions = (walletId, from, transaction) =>
    Transaction.findAll({
        attributes: ["senderAmount", "senderCurrency", "createdAt"],
        where: {
            senderWalletId: walletId,
            transactionType: { [Op.in]: outgoingTransactionTypes },
            status: "SUCCESS",
            createdAt: { [Op.gte]: from }
        },
        transaction
    });

/**
 * Checks outgoing withdrawals and transfers before wallet balances change.
 * All comparisons are converted to LIMIT_BASE_CURRENCY (USD by default), so
 * a user cannot bypass a limit by sending money from a non-USD wallet.
 */
exports.validateOutgoingTransaction = async ({
    walletId,
    amount,
    currency,
    transaction
}) => {
    const now = new Date();
    const todayStart = startOfTodayUtc();
    const suspiciousWindowStart = new Date(
        now.getTime() - config.SUSPICIOUS_TIME_WINDOW * 60 * 1000
    );
    const queryStart = new Date(
        Math.min(todayStart.getTime(), suspiciousWindowStart.getTime())
    );
    const rateCache = new Map();

    const [outgoingTransactions, currentAmountInBase] = await Promise.all([
        getOutgoingTransactions(walletId, queryStart, transaction),
        convertToBaseCurrency(amount, currency, rateCache)
    ]);

    const normalizedTransactions = await Promise.all(
        outgoingTransactions.map(async (record) => ({
            createdAt: record.createdAt,
            amountInBase: await convertToBaseCurrency(
                record.senderAmount,
                record.senderCurrency,
                rateCache
            )
        }))
    );

    const dailyAmountInBase = roundCurrency(
        normalizedTransactions
            .filter((record) => record.createdAt >= todayStart)
            .reduce((total, record) => total + record.amountInBase, 0)
    );
    const projectedDailyAmount = roundCurrency(
        dailyAmountInBase + currentAmountInBase
    );
    const baseCurrency = String(config.LIMIT_BASE_CURRENCY).toUpperCase();

    if (projectedDailyAmount > config.DAILY_TRANSACTION_LIMIT) {
        throw createFraudError(
            `Daily transaction limit of ${baseCurrency} ${config.DAILY_TRANSACTION_LIMIT.toFixed(2)} exceeded`,
            {
                reason: "DAILY_TRANSACTION_LIMIT_EXCEEDED",
                attemptedAmount: currentAmountInBase,
                dailyAmount: dailyAmountInBase,
                projectedDailyAmount,
                limit: config.DAILY_TRANSACTION_LIMIT,
                currency: baseCurrency
            }
        );
    }

    if (currentAmountInBase >= config.HIGH_VALUE_TRANSACTION_LIMIT) {
        const recentHighValueCount = normalizedTransactions.filter(
            (record) =>
                record.createdAt >= suspiciousWindowStart &&
                record.amountInBase >= config.HIGH_VALUE_TRANSACTION_LIMIT
        ).length;
        const projectedHighValueCount = recentHighValueCount + 1;

        if (projectedHighValueCount >= config.SUSPICIOUS_TRANSACTION_COUNT) {
            throw createFraudError(
                "Suspicious activity detected: too many high-value transactions in a short time",
                {
                    reason: "SUSPICIOUS_HIGH_VALUE_ACTIVITY",
                    attemptedAmount: currentAmountInBase,
                    highValueThreshold: config.HIGH_VALUE_TRANSACTION_LIMIT,
                    recentHighValueCount,
                    projectedHighValueCount,
                    timeWindowMinutes: config.SUSPICIOUS_TIME_WINDOW,
                    currency: baseCurrency
                }
            );
        }
    }

    return {
        amountInBase: currentAmountInBase,
        dailyAmountInBase,
        projectedDailyAmount,
        currency: baseCurrency
    };
};
