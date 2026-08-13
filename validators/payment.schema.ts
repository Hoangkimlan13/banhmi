export class PaymentConfigurationError extends Error {
  status = 500;

  constructor(message: string) {
    super(message);
    this.name = 'PaymentConfigurationError';
  }
}

export function assertStripeServerConfiguration() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey || !secretKey.startsWith('sk_')) {
    throw new PaymentConfigurationError('STRIPE_SECRET_KEY is invalid or missing');
  }

  return {
    exists: true,
    prefix: secretKey.slice(0, 8),
    length: secretKey.length,
  };
}
