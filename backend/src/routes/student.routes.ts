import { Router } from 'express';
import { studentController } from '../controllers';
import { authenticate, authorize } from '../middlewares';

const router = Router();

// All routes require student authentication
router.use(authenticate, authorize('student'));

router.get('/profile', studentController.getMyProfile);
router.get('/attendance', studentController.getMyAttendance);
router.get('/marks', studentController.getMyMarks);
router.get('/materials', studentController.getMyMaterials);

export default router;
