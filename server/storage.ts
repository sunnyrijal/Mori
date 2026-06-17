import { pool } from './db';
import { supabaseAdmin } from './supabaseClient';

const mockProducts = [
  {
    product_id: 'prod_premium_annual',
    product_name: 'Gozi Premium (Annual)',
    product_description: 'Full access to all premium features, billed yearly',
    product_active: true,
    product_metadata: {},
    price_id: 'price_premium_annual',
    unit_amount: 4999,
    currency: 'usd',
    recurring: { interval: 'year' },
    price_active: true
  },
  {
    product_id: 'prod_premium_monthly',
    product_name: 'Gozi Premium (Monthly)',
    product_description: 'Full access to all premium features, billed monthly',
    product_active: true,
    product_metadata: {},
    price_id: 'price_premium_monthly',
    unit_amount: 499,
    currency: 'usd',
    recurring: { interval: 'month' },
    price_active: true
  }
];

export class Storage {
  private mockUsersMap = new Map<string, any>();

  async getUser(id: string) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder-key') {
      return this.mockUsersMap.get(id) || null;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user from Supabase:', error.message);
        return this.mockUsersMap.get(id) || null;
      }
      if (!data) return null;

      const user = {
        id: data.id,
        name: data.name,
        email: data.email,
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        isPremium: data.is_premium,
        subscriptionTier: data.subscription_tier,
        lastSurveyDate: data.last_survey_date,
        trialEndsAt: data.trial_ends_at,
        createdAt: data.created_at
      };
      this.mockUsersMap.set(id, user);
      return user;
    } catch (err: any) {
      console.error('Exception fetching user from Supabase, falling back to memory:', err.message);
      return this.mockUsersMap.get(id) || null;
    }
  }

  async upsertUser(id: string, name?: string, email?: string) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder-key') {
      const existing = this.mockUsersMap.get(id);
      const user = {
        id,
        name: name !== undefined ? name : (existing?.name || null),
        email: email !== undefined ? email : (existing?.email || null),
        stripeCustomerId: existing?.stripeCustomerId || null,
        stripeSubscriptionId: existing?.stripeSubscriptionId || null,
        isPremium: existing?.isPremium || false,
        subscriptionTier: existing?.subscriptionTier || 'Free',
        lastSurveyDate: existing?.lastSurveyDate || null,
        trialEndsAt: existing?.trialEndsAt || null,
        createdAt: existing?.createdAt || new Date().toISOString()
      };
      this.mockUsersMap.set(id, user);
      return user;
    }

    try {
      const existing = await this.getUser(id);

      const updateData: any = {};
      if (name !== undefined && name !== null) updateData.name = name;
      if (email !== undefined && email !== null) updateData.email = email;

      let result;
      if (existing) {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .insert({
            id,
            name: name || null,
            email: email || null,
            subscription_tier: 'Free',
            is_premium: false
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      const user = {
        id: result.id,
        name: result.name,
        email: result.email,
        stripeCustomerId: result.stripe_customer_id,
        stripeSubscriptionId: result.stripe_subscription_id,
        isPremium: result.is_premium,
        subscriptionTier: result.subscription_tier,
        lastSurveyDate: result.last_survey_date,
        trialEndsAt: result.trial_ends_at,
        createdAt: result.created_at
      };
      this.mockUsersMap.set(id, user);
      return user;
    } catch (err: any) {
      console.warn('Supabase upsert failed, falling back to memory storage:', err.message);
      const existing = this.mockUsersMap.get(id);
      const user = {
        id,
        name: name !== undefined ? name : (existing?.name || null),
        email: email !== undefined ? email : (existing?.email || null),
        stripeCustomerId: existing?.stripeCustomerId || null,
        stripeSubscriptionId: existing?.stripeSubscriptionId || null,
        isPremium: existing?.isPremium || false,
        subscriptionTier: existing?.subscriptionTier || 'Free',
        lastSurveyDate: existing?.lastSurveyDate || null,
        trialEndsAt: existing?.trialEndsAt || null,
        createdAt: existing?.createdAt || new Date().toISOString()
      };
      this.mockUsersMap.set(id, user);
      return user;
    }
  }

  async updateUserStripeInfo(userId: string, info: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    isPremium?: boolean;
    subscriptionTier?: string;
    trialEndsAt?: Date | null;
  }) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder-key') {
      const existing = this.mockUsersMap.get(userId);
      if (!existing) throw new Error('User not found in local memory');
      const updated = {
        ...existing,
        stripeCustomerId: info.stripeCustomerId !== undefined ? info.stripeCustomerId : existing.stripeCustomerId,
        stripeSubscriptionId: info.stripeSubscriptionId !== undefined ? info.stripeSubscriptionId : existing.stripeSubscriptionId,
        isPremium: info.isPremium !== undefined ? info.isPremium : existing.isPremium,
        subscriptionTier: info.subscriptionTier !== undefined ? info.subscriptionTier : existing.subscriptionTier,
        trialEndsAt: info.trialEndsAt !== undefined ? info.trialEndsAt : existing.trialEndsAt,
      };
      this.mockUsersMap.set(userId, updated);
      return updated;
    }

    try {
      const updateData: any = {};
      if (info.stripeCustomerId !== undefined) updateData.stripe_customer_id = info.stripeCustomerId;
      if (info.stripeSubscriptionId !== undefined) updateData.stripe_subscription_id = info.stripeSubscriptionId;
      if (info.isPremium !== undefined) updateData.is_premium = info.isPremium;
      if (info.subscriptionTier !== undefined) updateData.subscription_tier = info.subscriptionTier;
      if (info.trialEndsAt !== undefined) updateData.trial_ends_at = info.trialEndsAt;

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error(`Error updating stripe info for user ${userId}:`, error.message);
        throw error;
      }

      const user = {
        id: data.id,
        name: data.name,
        email: data.email,
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        isPremium: data.is_premium,
        subscriptionTier: data.subscription_tier,
        lastSurveyDate: data.last_survey_date,
        trialEndsAt: data.trial_ends_at,
        createdAt: data.created_at
      };
      this.mockUsersMap.set(userId, user);
      return user;
    } catch (err: any) {
      console.warn('Supabase stripe update failed, updating local memory storage:', err.message);
      const existing = this.mockUsersMap.get(userId);
      if (!existing) throw new Error('User not found in local memory');
      const updated = {
        ...existing,
        stripeCustomerId: info.stripeCustomerId !== undefined ? info.stripeCustomerId : existing.stripeCustomerId,
        stripeSubscriptionId: info.stripeSubscriptionId !== undefined ? info.stripeSubscriptionId : existing.stripeSubscriptionId,
        isPremium: info.isPremium !== undefined ? info.isPremium : existing.isPremium,
        subscriptionTier: info.subscriptionTier !== undefined ? info.subscriptionTier : existing.subscriptionTier,
        trialEndsAt: info.trialEndsAt !== undefined ? info.trialEndsAt : existing.trialEndsAt,
      };
      this.mockUsersMap.set(userId, updated);
      return updated;
    }
  }

  async getProduct(productId: string) {
    if (!pool) {
      return mockProducts.find(p => p.product_id === productId) || null;
    }
    try {
      const { rows } = await pool.query(
        'SELECT * FROM stripe.products WHERE id = $1',
        [productId]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('Error fetching product from DB, using fallback:', err);
      return mockProducts.find(p => p.product_id === productId) || null;
    }
  }

  async listProductsWithPrices() {
    if (!pool) {
      return mockProducts;
    }
    try {
      const { rows } = await pool.query(`
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
      return rows.length > 0 ? rows : mockProducts;
    } catch (err) {
      console.error('Error listing products from DB, using fallback:', err);
      return mockProducts;
    }
  }

  async getSubscription(subscriptionId: string) {
    if (!pool) {
      return null;
    }
    try {
      const { rows } = await pool.query(
        'SELECT * FROM stripe.subscriptions WHERE id = $1',
        [subscriptionId]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('Error fetching subscription from DB:', err);
      return null;
    }
  }
}

export const storage = new Storage();
