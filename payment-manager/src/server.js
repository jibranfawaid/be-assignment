require('dotenv').config();

const Fastify = require('fastify');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { authenticateJWT } = require('./middlewares/userMiddleware');

const fastify = Fastify();
const PORT = process.env.PORT || 3001;

fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'default_secret'
});

// Register Swagger plugin
fastify.register(require('@fastify/swagger'), {
    routePrefix: '/documentation',
    swagger: {
        info: {
            title: 'Payment Manager API',
            description: 'API documentation for Payment Manager service',
            version: '1.0.0'
        },
        tags: [
            { name: 'transaction', description: 'Transaction related endpoints' }
        ],
        definitions: {
            Transaction: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    accountId: { type: 'integer' },
                    amount: { type: 'number', format: 'float' },
                    timestamp: { type: 'string', format: 'date-time' },
                    toAddress: { type: 'string' },
                    status: { type: 'string' }
                }
            }
        }
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
fastify.register(require('./routes/transactionRoutes'));

fastify.listen({ port: PORT }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
