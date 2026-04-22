import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import { profiles } from '../shared/schema';

export class Storage {
  async getUser(id: string) {
    const [user] = await db.select().from(profiles).where(eq(profiles.id, id));
    return user || null;
  }

  async upsertUser(id: string, name?: string, email?: string) {
    const [user] = await db
      .insert(profiles)
      .values({ id, name, email })
      .onConflictDoUpdate({
        target: profiles.id,
        set: { name, email },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, info: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    isPremium?: boolean;
    subscriptionTier?: string;
  }) {
    const [user] = await db
      .update(profiles)
      .set(info)
      .where(eq(profiles.id, userId))
      .returning();
    return user;
  }

  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProductsWithPrices() {
    const result = await db.execute(sql`
      WITH paginated_products AS (
        SELECT id, name, description, metadata, active
        FROM stripe.products
        WHERE active = true
        ORDER BY id
      )
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.active as product_active,
        p.metadata as product_metadata,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active as price_active
      FROM paginated_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY p.id, pr.unit_amount
    `);
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }
}

export const storage = new Storage();
