"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const index_1 = require("../index");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    // Simple token format: simple-token-{userId}-{timestamp}
    if (token.startsWith('simple-token-')) {
        const parts = token.split('-');
        if (parts.length === 4) {
            const userId = parseInt(parts[2]);
            // Verify user exists
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId },
                include: { client: true }
            });
            if (user) {
                req.userId = userId;
                req.userRole = user.role;
                req.clientId = user.clientId || undefined;
                return next();
            }
        }
    }
    return res.status(403).json({ error: 'Invalid token' });
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.js.map