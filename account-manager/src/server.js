require('dotenv').config();

const Fastify = require('fastify');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { authenticateJWT } = require('./middlewares/userMiddleware');

const fastify = Fastify();
const PORT = process.env.PORT || 3000;

fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'default_secret'
});

// Register Swagger with Fastify
fastify.register(require('@fastify/swagger'), {
    routePrefix: '/documentation',
    swagger: {
        info: {
            title: 'Account Manager API',
            description: 'API documentation for Account Manager service',
            version: '1.0.0'
        },
        tags: [
            { name: 'user', description: 'User related endpoints' },
        ],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        email: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                TokenResponse: {
                    type: 'object',
                    properties: {
                        token: { type: 'string' }
                    }
                },
                PaginatedUserResponse: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        totalAccounts: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        accounts: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/User' }
                        }
                    }
                }
            }
        },
    },
    exposeRoute: true
});

// Register Swagger UI for a better documentation experience
fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'full',
        deepLinking: true
    },
    staticCSP: true
});

fastify.addHook('onRequest', authenticateJWT);
fastify.register(require('./routes/userRoutes'));

fastify.listen({ port: PORT }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});