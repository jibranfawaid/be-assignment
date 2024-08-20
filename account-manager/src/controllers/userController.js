const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL;

// Helper function for email validation
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Helper function for password validation
const isValidPassword = (password) => password.length >= 6;

const register = async (req, reply) => {
    try {
        const { email, password } = req.body;

        // Validate input data
        if (!isValidEmail(email)) {
            return reply.status(400).send({
                message: 'Validation error',
                error: 'Invalid email format',
                data: null
            });
        }
        if (!isValidPassword(password)) {
            return reply.status(400).send({
                message: 'Validation error',
                error: 'Password must be at least 6 characters long',
                data: null
            });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return reply.status(400).send({
                message: 'Registration error',
                error: 'Email already registered',
                data: null
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                accounts: {
                    create: [
                        { type: 'credit', balance: 10000 },
                        { type: 'debit', balance: 10000 },
                        { type: 'loan', balance: 10000 }
                    ]
                }
            },
            include: { accounts: true }
        });

        await addUserToPaymentService(user.id);

        reply.status(201).send({
            message: 'User created successfully',
            error: null,
            data: { id: user.id, email: user.email, accounts: user.accounts }
        });
    } catch (error) {
        console.error('Registration error:', error);
        reply.status(500).send({
            message: 'Internal server error',
            error: 'Internal server error',
            data: null
        });
    }
};

const login = async (req, reply) => {
    try {
        const { email, password } = req.body;

        // Validate input data
        if (!isValidEmail(email)) {
            return reply.status(400).send({
                message: 'Validation error',
                error: 'Invalid email format',
                data: null
            });
        }
        if (!isValidPassword(password)) {
            return reply.status(400).send({
                message: 'Validation error',
                error: 'Password must be at least 6 characters long',
                data: null
            });
        }

        // Find user and validate password
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return reply.status(401).send({
                message: 'Authentication error',
                error: 'Invalid credentials',
                data: null
            });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });

        reply.status(200).send({
            message: 'Login successful',
            error: null,
            data: { token }
        });
    } catch (error) {
        console.error('Login error:', error);
        reply.status(500).send({
            message: 'Internal server error',
            error: 'Internal server error',
            data: null
        });
    }
};

const updateBalance = async (req, reply) => {
    try {
        const { userId, accountType, amount } = req.body;

        // Validate input
        if (!Number.isInteger(userId) || userId <= 0) {
            return reply.status(400).send({
                message: 'Validation error',
                error: 'Invalid user ID',
                data: null
            });
        }
        if (typeof accountType !== 'string' || !['credit', 'debit', 'loan'].includes(accountType)) {
            return reply.status(400).send({
                message: 'Validation error',
                error: 'Invalid account type',
                data: null
            });
        }
        if (typeof amount !== 'number') {
            return reply.status(400).send({
                message: 'Validation error',
                error: 'Amount must be a number',
                data: null
            });
        }

        // Find the account
        const account = await prisma.account.findFirst({
            where: {
                userId: userId,
                type: accountType
            }
        });
        

        if (!account) {
            return reply.status(404).send({
                message: 'Account not found',
                error: 'The specified account does not exist',
                data: null
            });
        }

        // Update the balance
        const updatedAccount = await prisma.account.update({
            where: {
                id: account.id
            },
            data: {
                balance: account.balance + amount
            }
        });

        reply.send({
            message: 'Balance updated successfully',
            error: null,
            data: {
                userId: updatedAccount.userId,
                accountType: updatedAccount.accountType,
                balance: updatedAccount.balance
            }
        });
    } catch (error) {
        console.error('Error updating balance:', error);
        reply.status(500).send({
            message: 'Internal server error',
            error: 'Internal server error',
            data: null
        });
    }
}

const getAllPaymentAccounts = async (req, reply) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Ensure page and limit are valid integers
        if (isNaN(page) || page <= 0) {
            return reply.status(400).send({
                message: 'Validation error',
                error: 'Page must be a positive integer',
                data: null
            });
        }
        if (isNaN(limit) || limit <= 0) {
            return reply.status(400).send({
                message: 'Validation error',
                error: 'Limit must be a positive integer',
                data: null
            });
        }

        const accounts = await prisma.user.findMany({
            skip: parseInt(skip),
            take: parseInt(limit),
        });

        const totalAccounts = await prisma.user.count();

        reply.send({
            message: 'Accounts retrieved successfully',
            error: null,
            data: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalAccounts,
                totalPages: Math.ceil(totalAccounts / limit),
                accounts
            }
        });
    } catch (error) {
        console.error('Error retrieving accounts:', error);
        reply.status(500).send({
            message: 'Internal server error',
            error: 'Internal server error',
            data: null
        });
    }
};

const getPaymentHistory = async (req, page, limit) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            throw new Error('No authorization token provided');
        }

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        const response = await axios.get(`${PAYMENT_SERVICE_URL}/payment-history`, {
            params: { pageNumber, limitNumber },
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching payment history from payment service:', error);
        throw new Error('Unable to fetch payment history');
    }
};

const checkBalance = async (req, res) => {
    try {
        const { userId, accountType } = req.body;

        if (!['credit', 'debit', 'loan'].includes(accountType)) {
            return res.status(400).send({
                message: 'Invalid account type',
                error: 'Account type must be one of "credit", "debit", or "loan"',
                data: null
            });
        }

        const account = await prisma.account.findFirst({
            where: { userId: parseInt(userId), type: accountType }
        });

        if (!account) {
            return res.status(404).send({
                message: 'Account not found',
                error: 'No account found for the specified user and type',
                data: null
            });
        }

        res.send({
            message: 'Account balance retrieved successfully',
            error: null,
            data: account
        });
    } catch (error) {
        console.error('Error retrieving account balance:', error);
        res.status(500).send({
            message: 'Internal server error',
            error: 'Internal server error',
            data: null
        });
    }
};

const addUserToPaymentService = async (userId) => {
    try {
        await axios.post(`${PAYMENT_SERVICE_URL}/users`, { userId });
    } catch (error) {
        console.error('Error adding user to payment service:', error);
        throw new Error('Unable to add user to payment service');
    }
};

module.exports = { register, login, getAllPaymentAccounts, getPaymentHistory, checkBalance, updateBalance };
