const jwt = require('jsonwebtoken');


const authenticateJWT = (req, reply, done) => {
    const publicRoutes = ['/register', '/login', '/docs'];
    if (publicRoutes.includes(req.originalUrl) || req.originalUrl.includes("/docs")) {
        return done();
    }


    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return reply.status(401).send({ message: 'Token required', error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
        if (err) {
            return reply.status(403).send({ message: 'Forbidden', error: 'Invalid token' });
        }
        req.user = user;
        done();
    });
};

module.exports = { authenticateJWT };