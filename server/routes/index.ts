import { Router } from 'express';
import stripeRouter from './stripe';
import authRouter from './auth';
import placesRouter from './places';

const router = Router();

router.use('/stripe', stripeRouter);
router.use('/auth', authRouter);
router.use('/places', placesRouter);

export default router;
