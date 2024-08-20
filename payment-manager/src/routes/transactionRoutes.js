const middleware = require('../middlewares/userMiddleware');
const transactionController = require('../controllers/transactionController');
const prisma = require('../prismaClient');

async function transactionRoutes(fastify, options) {
    fastify.post('/send', {
        preHandler: middleware.authenticateJWT,
        schema: {
            description: 'Send a transaction to a specified address',
            tags: ['payment'],
            summary: 'Send transaction',
            body: {
                type: 'object',
                required: ['amount', 'toAddress'],
                properties: {
                    amount: { type: 'number', description: 'Amount to be sent' },
                    toAddress: { type: 'string', description: 'Recipient address' }
                }
            },
            response: {
                200: {
                    description: 'Transaction processed successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string', nullable: true },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                amount: { type: 'number' },
                                toAddress: { type: 'string' },
                                status: { type: 'string' },
                                userId: { type: 'integer' },
                                createdAt: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation error',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string' },
                        data: { type: 'null' }
                    }
                },
                500: {
                    description: 'Internal server error',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string' },
                        data: { type: 'null' }
                    }
                }
            }
        }
    }, transactionController.send);
    fastify.post('/withdraw', {
        preHandler: middleware.authenticateJWT,
        schema: {
            description: 'Withdraw a specified amount to a given address',
            tags: ['payment'],
            summary: 'Withdraw transaction',
            body: {
                type: 'object',
                required: ['amount', 'toAddress'],
                properties: {
                    amount: { type: 'number', description: 'Amount to withdraw' },
                    toAddress: { type: 'string', description: 'Withdrawal address' }
                }
            },
            response: {
                200: {
                    description: 'Transaction processed successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string', nullable: true },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                amount: { type: 'number' },
                                toAddress: { type: 'string' },
                                status: { type: 'string' },
                                userId: { type: 'integer' },
                                createdAt: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation error',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string' },
                        data: { type: 'null' }
                    }
                },
                500: {
                    description: 'Internal server error',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string' },
                        data: { type: 'null' }
                    }
                }
            }
        }
    }, transactionController.withdraw);
    fastify.post('/setup-recurring-payments', {
        preHandler: middleware.authenticateJWT,
        schema: {
            description: 'Set up recurring payments for a user',
            tags: ['payment'],
            summary: 'Setup recurring payments',
            body: {
                type: 'object',
                properties: {
                    amount: { type: 'number', description: 'Amount to be paid in each installment' },
                    toAddress: { type: 'string', description: 'Recipient address for recurring payments' },
                    userId: { type: 'integer', description: 'ID of the user setting up recurring payments' },
                    interval: { type: 'string', description: 'Payment interval (e.g., daily, weekly, monthly)' }
                },
                required: ['amount', 'toAddress', 'interval']
            },
            response: {
                200: {
                    description: 'Recurring payment setup successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string', nullable: true },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                amount: { type: 'number' },
                                toAddress: { type: 'string' },
                                userId: { type: 'integer' },
                                interval: { type: 'string' },
                                status: { type: 'string' },
                                nextPaymentDate: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation error',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string' },
                        data: { type: 'null' }
                    }
                },
                500: {
                    description: 'Internal server error',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string' },
                        data: { type: 'null' }
                    }
                }
            }
        }
    }, transactionController.setupRecurringPayments);

    fastify.get('/payment-history', {
        preHandler: middleware.authenticateJWT,
        schema: {
            description: 'Retrieve payment history for a user with pagination',
            tags: ['payment'],
            summary: 'Get payment history',
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', description: 'Page number for pagination', default: 1 },
                    limit: { type: 'integer', description: 'Number of items per page', default: 10 }
                },
                required: []
            },
            response: {
                200: {
                    description: 'Payment history retrieved successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string', nullable: true },
                        data: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer' },
                                limit: { type: 'integer' },
                                totalTransactions: { type: 'integer' },
                                totalPages: { type: 'integer' },
                                transactions: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'integer' },
                                            amount: { type: 'number' },
                                            toAddress: { type: 'string' },
                                            status: { type: 'string' },
                                            userId: { type: 'integer' },
                                            timestamp: { type: 'string', format: 'date-time' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation error',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string' },
                        data: { type: 'null' }
                    }
                },
                500: {
                    description: 'Internal server error',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string' },
                        data: { type: 'null' }
                    }
                }
            }
        }
    }, transactionController.getPaymentHistory);

    fastify.post('/users', async (req, reply) => {
        try {
            const { userId } = req.body;

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).send({
                    message: 'Invalid user ID',
                    error: 'User ID must be a positive integer',
                    data: null
                });
            }

            await prisma.user.create({
                data: {
                    id: userId
                }
            });

            reply.send({
                message: 'Transaction processed successfully',
                error: null,
                data: null
            });
        } catch (error) {
            console.error('Error processing transaction:', error);
            reply.status(500).send({
                message: 'Internal server error',
                error: 'Internal server error',
                data: null
            });
        }
    });
}

module.exports = transactionRoutes;
