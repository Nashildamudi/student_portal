import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate } from '../middlewares';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);

export default router;
