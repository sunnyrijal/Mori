import { Router } from 'express';
import { storage } from '../storage';
import { stripeService } from '../stripeService';

const router = Router();

router.post('/sync', async (req, res) => {
  try {
    const { id, email, name } = req.body;
    
    if (!id || !email) {
      return res.status(400).json({ error: 'Missing required user sync data' });
    }

    let user = await storage.getUser(id);
    if (!user) {
      user = await storage.upsertUser(id, name, email);
      const customer = await stripeService.createCustomer(name || email, id);
      await storage.updateUserStripeInfo(id, { stripeCustomerId: customer.id });
    }

    res.json({ success: true, user });
  } catch (err: any) {
    console.error('Auth sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
