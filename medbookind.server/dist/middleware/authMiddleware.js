import { verifyToken } from '../jwt.js';
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        const payload = verifyToken(token);
        req.userId = payload.sub;
        req.userRole = payload.role;
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid token' });
    }
}
