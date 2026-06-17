import { storage } from './storage';
import { getUncachableStripeClient } from './stripeClient';
import { supabaseAdmin } from './supabaseClient';
import Stripe from 'stripe';

export class StripeService {
  async createCustomer(name: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      name,
      metadata: { userId },
    });
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getProductsWithPrices() {
    return await storage.listProductsWithPrices();
  }

  async handleWebhook(payload: Buffer, signature: string, webhookSecret: string) {
    const stripe = await getUncachableStripeClient();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      throw new Error(`Webhook Error: ${err.message}`);
    }

    console.log(`Processing Stripe Webhook Event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

          const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
              is_premium: true,
              subscription_tier: 'Premium',
              stripe_subscription_id: subscriptionId,
              trial_ends_at: trialEndsAt,
            })
            .eq('stripe_customer_id', customerId)
            .select()
            .single();

          if (error) {
            console.error('Error updating user subscription via webhook:', error.message);
          } else {
            console.log(`Stripe Webhook: Successfully activated Premium for profile ${data.id}`);
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionId = subscription.id;
        const status = subscription.status;
        const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

        const isPremium = status === 'active' || status === 'trialing';
        const tier = isPremium ? 'Premium' : 'Free';

        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_premium: isPremium,
            subscription_tier: tier,
            stripe_subscription_id: subscriptionId,
            trial_ends_at: trialEndsAt,
          })
          .eq('stripe_customer_id', customerId)
          .select()
          .single();

        if (error) {
          console.error(`Error updating user status on ${event.type}:`, error.message);
        } else {
          console.log(`Stripe Webhook: Updated status for profile ${data.id} to ${tier}`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_premium: false,
            subscription_tier: 'Free',
            stripe_subscription_id: null,
            trial_ends_at: null,
          })
          .eq('stripe_customer_id', customerId)
          .select()
          .single();

        if (error) {
          console.error('Error revoking user subscription via webhook:', error.message);
        } else {
          console.log(`Stripe Webhook: Revoked premium status for profile ${data.id}`);
        }
        break;
      }
      default:
        console.log(`Stripe Webhook: Unhandled event type ${event.type}`);
    }
  }
}

export const stripeService = new StripeService();
