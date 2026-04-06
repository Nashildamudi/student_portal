import { connectDB } from './config/db';
import { env } from './config/env';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ApiError } from './utils/ApiError';
import { ApiResponse } from './utils/ApiResponse';

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import facultyRoutes from './routes/faculty.routes';
import studentRoutes from './routes/student.routes';
import commonRoutes from './routes/common.routes';

const app: Express = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/common', commonRoutes);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
    stack: env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export { app };

const startServer = async () => {
  try {
    await connectDB();
    const port = env.PORT || 8001;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server directly
startServer();
