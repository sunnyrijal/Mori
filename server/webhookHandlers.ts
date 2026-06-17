import { stripeService } from './stripeService';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
      console.warn('WARNING: STRIPE_WEBHOOK_SECRET is not defined. Webhook signature verification will fail.');
    }
    await stripeService.handleWebhook(payload, signature, webhookSecret);
  }
}
