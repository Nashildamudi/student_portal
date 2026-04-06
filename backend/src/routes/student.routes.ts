import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { getProfile, getAttendance, getMarks, getMaterials } from '../controllers/student.controller';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('student'));

router.get('/profile', getProfile);
router.get('/attendance', getAttendance);
router.get('/marks', getMarks);
router.get('/materials', getMaterials);

export default router;
