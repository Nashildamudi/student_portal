import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import facultyRoutes from './faculty.routes';
import studentRoutes from './student.routes';
import commonRoutes from './common.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/faculty', facultyRoutes);
router.use('/student', studentRoutes);
router.use('/common', commonRoutes);

export default router;
