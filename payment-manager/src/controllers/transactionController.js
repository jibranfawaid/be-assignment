const prisma = require('../prismaClient');
const axios = require('axios');

const ACCOUNT_SERVICE_URL = process.env.ACCOUNT_SERVICE_URL;

const send = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const { amount, toAddress, accountType } = req.body;
        const token = req.headers['authorization']?.split(' ')[1];

        // Validate input
        if (typeof amount !== 'number' || amount <= 0) {
            return reply.status(400).send({
                message: 'Invalid amount',
                error: 'Amount must be a positive number',
                data: null
            });
        }

        if (typeof toAddress !== 'string' || toAddress.trim() === '') {
            return reply.status(400).send({
                message: 'Invalid address',
                error: 'To address must be a non-empty string',
                data: null
            });
        }

        if (!['credit', 'debit', 'loan'].includes(accountType)) {
            return reply.status(400).send({
                message: 'Invalid account type',
                error: 'Account type must be one of "credit", "debit", or "loan"',
                data: null
            });
        }

        const balance = await checkBalance(userId, accountType, token);

        if (balance < amount) {
            return reply.status(400).send({
                message: 'Insufficient balance',
                error: 'You do not have enough balance for this transaction',
                data: null
            });
        }

        const transaction = await prisma.transaction.create({
            data: { amount, toAddress, type: "SEND", status: 'PENDING', userId },
        });

        const processedTransaction = await processTransaction(transaction);

        await updateBalance(userId, accountType, -amount, token);

        await prisma.transaction.update({
            where: { id: processedTransaction.id },
            data: { status: 'SUCCESS' },
        });

        reply.send({
            message: 'Transaction processed successfully',
            error: null,
            data: processedTransaction
        });
    } catch (error) {
        console.error('Error processing transaction:', error);
        reply.status(500).send({
            message: 'Internal server error',
            error: 'Internal server error',
            data: null
        });
    }
};

const withdraw = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const { amount, toAddress, accountType } = req.body;
        const token = req.headers['authorization']?.split(' ')[1];

        // Validate input
        if (typeof amount !== 'number' || amount <= 0) {
            return reply.status(400).send({
                message: 'Invalid amount',
                error: 'Amount must be a positive number',
                data: null
            });
        }
        if (typeof toAddress !== 'string' || toAddress.trim() === '') {
            return reply.status(400).send({
                message: 'Invalid address',
                error: 'To address must be a non-empty string',
                data: null
            });
        }
        if (!['credit', 'debit', 'loan'].includes(accountType)) {
            return reply.status(400).send({
                message: 'Invalid account type',
                error: 'Account type must be one of "credit", "debit", or "loan"',
                data: null
            });
        }

        const balance = await checkBalance(userId, accountType, token);

        if (balance < amount) {
            return reply.status(400).send({
                message: 'Insufficient funds',
                error: 'Account balance is insufficient for this transaction',
                data: null
            });
        }

        const transaction = await prisma.transaction.create({
            data: { amount, toAddress, type: "WITHDRAW", status: 'PENDING', userId },
        });

        const processedTransaction = await processTransaction(transaction);

        await updateBalance(userId, accountType, -amount, token);

        await prisma.transaction.update({
            where: { id: processedTransaction.id },
            data: { status: 'SUCCESS' },
        });

        reply.send({
            message: 'Transaction processed successfully',
            error: null,
            data: processedTransaction
        });
    } catch (error) {
        console.error('Error processing transaction:', error);
        reply.status(500).send({
            message: 'Internal server error',
            error: 'Internal server error',
            data: null
        });
    }
};

const getPaymentHistory = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch transactions with pagination
        const transactions = await prisma.transaction.findMany({
            where: { userId: parseInt(userId) },
            skip: skip,
            take: limit,
            orderBy: { timestamp: 'desc' }
        });

        const totalTransactions = await prisma.transaction.count({
            where: { userId: parseInt(userId) }
        });

        reply.send({
            message: 'Payment history retrieved successfully',
            error: null,
            data: {
                page: page,
                limit: limit,
                totalTransactions,
                totalPages: Math.ceil(totalTransactions / limit),
                transactions
            }
        });
    } catch (error) {
        console.error('Error retrieving payment history:', error);
        reply.status(500).send({
            message: 'Internal server error',
            error: 'Internal server error',
            data: null
        });
    }
};

const setupRecurringPayments = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const { amount, toAddress, interval } = req.body;

        // Validate input
        if (typeof amount !== 'number' || amount <= 0) {
            return reply.status(400).send({
                message: 'Invalid amount',
                error: 'Amount must be a positive number',
                data: null
            });
        }
        if (typeof toAddress !== 'string' || toAddress.trim() === '') {
            return reply.status(400).send({
                message: 'Invalid address',
                error: 'To address must be a non-empty string',
                data: null
            });
        }
        if (typeof interval !== 'string' || !['daily', 'weekly', 'monthly'].includes(interval)) {
            return reply.status(400).send({
                message: 'Invalid interval',
                error: 'Interval must be one of "daily", "weekly", or "monthly"',
                data: null
            });
        }
        if (typeof userId !== 'number' || userId <= 0) {
            return reply.status(400).send({
                message: 'Invalid user ID',
                error: 'User ID must be a positive integer',
                data: null
            });
        }

        // Save recurring payment schedule
        const recurringPayment = await prisma.recurringPayment.create({
            data: {
                amount,
                toAddress,
                interval,
                userId
            }
        });

        reply.send({
            message: 'Recurring payment schedule set up successfully',
            error: null,
            data: recurringPayment
        });
    } catch (error) {
        console.error('Error setting up recurring payment:', error);
        reply.status(500).send({
            message: 'Internal server error',
            error: 'Internal server error',
            data: null
        });
    }
};

const processTransaction = async (transaction) => {
    return new Promise((resolve, reject) => {
        console.log('Transaction processing started for:', transaction);

        setTimeout(() => {
            console.log('Transaction processed for:', transaction);
            resolve(transaction);
        }, 30000); // 30 seconds
    });
};

const processRecurringPayments = async () => {
    try {
        const now = new Date();
        const recurringPayments = await prisma.recurringPayment.findMany({
            where: {
                nextPaymentDate: { lte: now }
            }
        });

        for (const payment of recurringPayments) {
            // Process payment (you would replace this with actual payment logic)
            console.log(`Processing payment for ${payment.toAddress} of amount ${payment.amount}`);

            // Assuming payment is successful
            await prisma.transaction.create({
                data: {
                    amount: payment.amount,
                    toAddress: payment.toAddress,
                    status: 'SUCCESS',
                    userId: payment.userId
                }
            });

            // Update the next payment date based on the interval
            let nextPaymentDate;
            switch (payment.interval) {
                case 'daily':
                    nextPaymentDate = new Date(now.setDate(now.getDate() + 1));
                    break;
                case 'weekly':
                    nextPaymentDate = new Date(now.setDate(now.getDate() + 7));
                    break;
                case 'monthly':
                    nextPaymentDate = new Date(now.setMonth(now.getMonth() + 1));
                    break;
                default:
                    throw new Error('Invalid interval');
            }

            await prisma.recurringPayment.update({
                where: { id: payment.id },
                data: { nextPaymentDate }
            });
        }
    } catch (error) {
        console.error('Error processing recurring payments:', error);
    }
};

const checkBalance = async (userId, accountType, token) => {
    try {
        const response = await axios.post(`${ACCOUNT_SERVICE_URL}/check-balance`,
            { userId, accountType },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        return response.data.data.balance;
    } catch (error) {
        console.error('Error checking balance:', error);
        throw new Error('Failed to check balance');
    }
};

const updateBalance = async (userId, accountType, amount, token) => {
    try {
        const response = await axios.post(`${ACCOUNT_SERVICE_URL}/update-balance`,
            { userId, accountType, amount },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating balance:', error);
        throw new Error('Failed to update balance');
    }
};

module.exports = { send, withdraw, getPaymentHistory, setupRecurringPayments, processRecurringPayments };
