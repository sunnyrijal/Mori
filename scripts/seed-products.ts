import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('Creating Gozi Premium products...');

    const existing = await stripe.products.search({
      query: "name:'Gozi Premium' AND active:'true'",
    });

    if (existing.data.length > 0) {
      console.log('Products already exist:', existing.data[0].id);
      const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
      prices.data.forEach((p: any) => {
        console.log(`  Price: ${p.id}  ${p.unit_amount! / 100} ${p.currency.toUpperCase()}/${(p.recurring?.interval)}`);
      });
      return;
    }

    const product = await stripe.products.create({
      name: 'Gozi Premium',
      description: 'Unlimited AI Chat, Advanced Suggestions, Partner Sync, Cloud Backup, Exclusive Themes & Priority Support',
    });
    console.log(`Created product: ${product.id}`);

    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: 499,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log(`Monthly price: ${monthly.id}  ($4.99/month)`);

    const annual = await stripe.prices.create({
      product: product.id,
      unit_amount: 4999,
      currency: 'usd',
      recurring: { interval: 'year' },
    });
    console.log(`Annual price: ${annual.id}  ($49.99/year)`);

    console.log('Done! Products created successfully.');
  } catch (err: any) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createProducts();
