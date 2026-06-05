import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export async function POST(request: Request) {
  try {
    const { amount, metadata } = await request.json();
    console.log("Stripe key:", process.env.STRIPE_SECRET_KEY?.substring(0, 15));
    console.log("Amount:", amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      metadata: metadata || {},
      automatic_payment_methods: { enabled: true },
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error Stripe:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}