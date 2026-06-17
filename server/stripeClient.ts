import Stripe from 'stripe';

let connectionSettings: any;

async function getCredentials() {
  if (process.env.STRIPE_SECRET_KEY) {
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock',
      secretKey: process.env.STRIPE_SECRET_KEY,
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl and STRIPE_SECRET_KEY not set');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X-Replit-Token': xReplitToken,
    },
  });

  const data = await response.json() as { items?: any[] };
  connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable as string,
    secretKey: connectionSettings.settings.secret as string,
  };
}

const mockStripe = {
  customers: {
    create: async (params: any) => ({
      id: `cus_mock_${Date.now()}`,
      ...params
    })
  },
  checkout: {
    sessions: {
      create: async (params: any) => ({
        id: `cs_mock_${Date.now()}`,
        url: params.success_url,
        ...params
      })
    }
  },
  billingPortal: {
    sessions: {
      create: async (params: any) => ({
        id: `bps_mock_${Date.now()}`,
        url: params.return_url,
        ...params
      })
    }
  }
};

export async function getUncachableStripeClient() {
  try {
    const { secretKey } = await getCredentials();
    return new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil' as any,
    });
  } catch (err) {
    console.warn('Stripe credentials not found, using mock Stripe client:', (err as Error).message);
    return mockStripe as any;
  }
}

export async function getStripePublishableKey() {
  try {
    const { publishableKey } = await getCredentials();
    return publishableKey;
  } catch (err) {
    return 'pk_test_mock';
  }
}

export async function getStripeSecretKey() {
  try {
    const { secretKey } = await getCredentials();
    return secretKey;
  } catch (err) {
    return 'sk_test_mock';
  }
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!stripeSync) {
    try {
      const { StripeSync } = await import('stripe-replit-sync');
      const secretKey = await getStripeSecretKey();
      stripeSync = new StripeSync({
        poolConfig: {
          connectionString: process.env.DATABASE_URL!,
          max: 2,
        },
        stripeSecretKey: secretKey,
      });
    } catch (err) {
      console.warn('Could not initialize stripeSync:', (err as Error).message);
      return null;
    }
  }
  return stripeSync;
}
