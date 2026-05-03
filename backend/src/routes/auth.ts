import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', (req, res) => {
  const { login, password } = req.body;

  const expectedLogin = process.env.ADMIN_LOGIN || 'luciagestaorh';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'gestaorh231';

  if (login === expectedLogin && password === expectedPassword) {
    // User authenticated successfully
    const token = jwt.sign(
      { role: 'admin' }, 
      process.env.JWT_SECRET || 'super-secret-default-key-for-local-dev', 
      { expiresIn: '24h' }
    );
    
    return res.json({ token, success: true });
  }

  return res.status(401).json({ error: 'Credenciais inválidas' });
});

export default router;
