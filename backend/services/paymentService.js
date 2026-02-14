const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
    async createSubscription(userId, plan, paymentMethodId) {
        try {
            // Create or retrieve customer
            let customer;
            const existingCustomers = await stripe.customers.list({
                email: user.email,
                limit: 1
            });

            if (existingCustomers.data.length > 0) {
                customer = existingCustomers.data[0];
            } else {
                customer = await stripe.customers.create({
                    email: user.email,
                    name: user.name,
                    metadata: { userId }
                });
            }

            // Attach payment method
            await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customer.id
            });

            // Set as default payment method
            await stripe.customers.update(customer.id, {
                invoice_settings: {
                    default_payment_method: paymentMethodId
                }
            });

            // Create subscription
            const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [{ price: this.getPlanPriceId(plan) }],
                payment_settings: {
                    payment_method_types: ['card'],
                    save_default_payment_method: 'on_subscription'
                },
                expand: ['latest_invoice.payment_intent']
            });

            return {
                success: true,
                subscriptionId: subscription.id,
                clientSecret: subscription.latest_invoice.payment_intent.client_secret,
                status: subscription.status
            };
        } catch (error) {
            console.error('Subscription error:', error);
            throw error;
        }
    }

    getPlanPriceId(plan) {
        const plans = {
            'basic': 'price_basic_monthly',
            'premium': 'price_premium_monthly',
            'enterprise': 'price_enterprise_yearly'
        };
        return plans[plan];
    }

    async createCheckoutSession(userId, templateId, price) {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Premium Check Template',
                        description: `Template: ${templateId}`
                    },
                    unit_amount: price * 100, // Convert to cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            metadata: {
                userId,
                templateId
            }
        });

        return session;
    }
}

module.exports = new PaymentService();
