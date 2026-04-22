import express from 'express';
import cors from 'cors';
import { prisma } from './prisma';

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

import employeeRoutes from './routes/employees';
import examRoutes from './routes/exams';
import loanRoutes from './routes/loans';
import vacationRoutes from './routes/vacations';
import settingsRoutes from './routes/settings';

app.use('/api/employees', employeeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/vacations', vacationRoutes);
app.use('/api/settings', settingsRoutes);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
