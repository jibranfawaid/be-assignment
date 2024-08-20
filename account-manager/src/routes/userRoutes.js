const middleware = require('../middlewares/userMiddleware');
const userController = require('../controllers/userController');

async function userRoutes(fastify, options) {
    fastify.post('/register', {
        preHandler: middleware.authenticateJWT,
        schema: {
            description: 'Register a new user',
            tags: ['user'],
            summary: 'Register a new user',
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', description: 'User email address' },
                    password: { type: 'string', minLength: 6, description: 'User password' }
                }
            },
            response: {
                201: {
                    description: 'User created successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string', nullable: true },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                email: { type: 'string' }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation or registration error',
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
    }, userController.register);

    fastify.post('/login', {
        preHandler: middleware.authenticateJWT,
        schema: {
            description: 'Login an existing user',
            tags: ['user'],
            summary: 'Login user and receive JWT token',
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', description: 'User email address' },
                    password: { type: 'string', minLength: 6, description: 'User password' }
                }
            },
            response: {
                200: {
                    description: 'Login successful',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string', nullable: true },
                        data: {
                            type: 'object',
                            properties: {
                                token: { type: 'string' }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation or authentication error',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string' },
                        data: { type: 'null' }
                    }
                },
                401: {
                    description: 'Invalid credentials',
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
    }, userController.login);

    fastify.get('/accounts', {
        preHandler: middleware.authenticateJWT,
        schema: {
            description: 'Retrieve all user accounts with pagination',
            tags: ['user'],
            summary: 'List user accounts with optional pagination',
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', default: 1, description: 'Page number for pagination' },
                    limit: { type: 'integer', default: 10, description: 'Number of items per page' }
                }
            },
            response: {
                200: {
                    description: 'Accounts retrieved successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string', nullable: true },
                        data: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer' },
                                limit: { type: 'integer' },
                                totalAccounts: { type: 'integer' },
                                totalPages: { type: 'integer' },
                                accounts: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'integer' },
                                            email: { type: 'string' },
                                            createdAt: { type: 'string', format: 'date-time' }
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
    }, userController.getAllPaymentAccounts);

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
    }, userController.getPaymentHistory);

    fastify.post('/check-balance', {
        preHandler: middleware.authenticateJWT,
        schema: {
            description: 'Retrieve the balance of a specific payment account for a user',
            tags: ['payment'],
            summary: 'Get account balance',
            body: {
                type: 'object',
                required: ['userId', 'accountType'],
                properties: {
                    userId: { type: 'integer', description: 'ID of the user whose account balance is being checked' },
                    accountType: {
                        type: 'string',
                        enum: ['credit', 'debit', 'loan'],
                        description: 'Type of the payment account to check balance for'
                    }
                }
            },
            response: {
                200: {
                    description: 'Account balance retrieved successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string', nullable: true },
                        data: {
                            type: 'object',
                            properties: {
                                userId: { type: 'integer' },
                                accountType: { type: 'string' },
                                balance: { type: 'number' }
                            }
                        }
                    }
                },
                400: {
                    description: 'Invalid input data or account type',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string' },
                        data: { type: 'null' }
                    }
                },
                404: {
                    description: 'Account or user not found',
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
    }, userController.checkBalance);

    fastify.post('/update-balance', {
        schema: {
            description: 'Update the balance of a specific account',
            tags: ['account'],
            summary: 'Update account balance',
            body: {
                type: 'object',
                properties: {
                    userId: { type: 'integer', description: 'User ID whose account balance will be updated' },
                    accountType: { type: 'string', description: 'Type of account (e.g., credit, debit, loan)' },
                    amount: { type: 'number', description: 'Amount to add or subtract from the balance' }
                },
                required: ['userId', 'accountType', 'amount']
            },
            response: {
                200: {
                    description: 'Balance updated successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        error: { type: 'string', nullable: true },
                        data: {
                            type: 'object',
                            properties: {
                                userId: { type: 'integer' },
                                accountType: { type: 'string' },
                                balance: { type: 'number' }
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
    }, userController.updateBalance)
}

module.exports = userRoutes;
