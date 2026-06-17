import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import app from './app';

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set — Stripe features disabled');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    console.log('Webhook configured');

    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: Error) => console.error('Sync error (non-fatal):', err.message));

  } catch (err: any) {
    console.warn('Stripe init skipped (not connected yet):', err.message);
  }
}

const port = Number(process.env.API_PORT) || 3001;

await initStripe();

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
