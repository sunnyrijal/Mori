import { Router } from 'express';
import { storage } from '../storage';
import { stripeService } from '../stripeService';

const router = Router();

router.get('/products', async (_req, res) => {
  try {
    const rows = await storage.listProductsWithPrices();
    const productsMap = new Map<string, any>();
    for (const row of rows) {
      if (!productsMap.has(row.product_id as string)) {
        productsMap.set(row.product_id as string, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id as string).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }
    res.json({ data: Array.from(productsMap.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/checkout', async (req, res) => {
  try {
    const { priceId, userId, userName } = req.body as {
      priceId: string;
      userId: string;
      userName?: string;
    };

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'priceId and userId are required' });
    }

    let user = await storage.getUser(userId);
    if (!user) {
      user = await storage.upsertUser(userId, userName);
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(
        userName || userId,
        userId
      );
      await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const session = await stripeService.createCheckoutSession(
      customerId,
      priceId,
      `${baseUrl}/?checkout=success`,
      `${baseUrl}/?checkout=cancel`
    );

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/portal', async (req, res) => {
  try {
    const { userId } = req.body as { userId: string };
    const user = await storage.getUser(userId);

    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const portalSession = await stripeService.createCustomerPortalSession(
      user.stripeCustomerId,
      baseUrl
    );

    res.json({ url: portalSession.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await storage.getUser(userId);

    if (!user?.stripeSubscriptionId) {
      return res.json({ subscription: null, isPremium: false });
    }

    const subscription = await storage.getSubscription(user.stripeSubscriptionId);
    res.json({
      subscription,
      isPremium: user.isPremium,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
