import { Router } from 'express';
import stripeRouter from './stripe';
import authRouter from './auth';

const router = Router();

router.use('/stripe', stripeRouter);
router.use('/auth', authRouter);

export default router;
