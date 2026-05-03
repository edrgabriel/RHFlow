import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if route is public
  const publicRoutes = [
    { path: '/api/auth/login', method: 'POST' },
    { path: '/api/health', method: 'GET' },
    { path: '/api/db-test', method: 'GET' },
  ];

  const isPublic = publicRoutes.some(
    r => req.path === r.path && req.method === r.method
  );

  if (isPublic) {
    return next();
  }

  // Allow public candidate submission and fetching single recruitment link
  if (req.path === '/api/candidates' && req.method === 'POST') {
    return next();
  }
  if (req.path.startsWith('/api/recruitment/') && req.method === 'GET' && req.path.split('/').length === 4) {
    // Allows /api/recruitment/:id
    return next();
  }

  // For all other routes, verify token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'super-secret-default-key-for-local-dev';
    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
