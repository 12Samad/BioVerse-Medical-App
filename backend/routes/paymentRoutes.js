const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Stripe = require("stripe"); // Replace with your actual secret key
const User = require("../models/User");
const StripeCustomer = require("../models/StripeCustomer");
const bodyParser = require("body-parser");
const Subscription = require("../models/Subscription");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

// Replace with your actual Stripe Price IDs
const PLAN_PRICES = {
  basic: "price_1QzLWlCdnEIbMtsyCIiTFngr", // example
  premium: "price_1QzLXCCdnEIbMtsyTXcaU1u7", // example
  ultimate: "price_1QzLXSCdnEIbMtsy6ifePiuG", // example
};

// Optionally, if you have plan-based limits
const PLAN_LIMITS = {
  prod_R2a36EttXKfVZC: 10, // example limit for basic
  prod_R2a3UHysXPc9Hr: 25, // example limit for premium
  prod_R2a4iQZmAPHuYB: 50, // example limit for ultimate
};

// Utility function to validate emails (simple example)
function isValidEmail(email) {
  // You could use a more robust check or a library
  return /\S+@\S+\.\S+/.test(email);
}

/**
 * 1) CREATE CHECKOUT SESSION
 *    POST /create-checkout-session
 */
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { user_id, selected_plan } = req.body;
    const email = "hassan.aidevgen@gmail.com";
    const userIdStr = req.body.user_id;
    console.log(req.body);

    if (!user_id || !selected_plan) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!PLAN_PRICES[selected_plan]) {
      return res.status(400).json({ error: "Invalid plan selected." });
    }
    //   if (!isValidEmail(email)) {
    //     return res.status(400).json({ error: 'Invalid email format.' });
    //   }

    // 1. Check if the user is in your DB (not strictly required if you're storing data differently)
    const userId = new mongoose.Types.ObjectId(userIdStr);
    let user = await User.findOne({ _id: userId });
    if (!user) {
      // Create a new user if not existing. (Optional, depends on your logic)
      return res.status(400).json({ error: "User not found." });
    }

    // 2. Check or Create StripeCustomer
    let existingCustomer = await StripeCustomer.findOne({ userId: user_id });

    if (!existingCustomer) {
      // we can also see if there's a stripe customer with same email
      // but that might cause collisions if multiple users share email
      // so let's just create a new one here
      const customer = await stripe.customers.create({ email });
      const newStripeCustomer = new StripeCustomer({
        userId: user_id,
        email,
        stripeCustomerId: customer.id,
      });
      existingCustomer = await newStripeCustomer.save();
    }

    const customerId = existingCustomer.stripeCustomerId;

    // 3. Check if there's already an active subscription for this user
    const activeSub = await Subscription.findOne({
      stripeCustomerId: customerId,
      subscriptionStatus: "active",
    });

    if (activeSub) {
      return res
        .status(400)
        .json({ error: "You already have an active subscription." });
    }

    // 4. Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: PLAN_PRICES[selected_plan],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: "https://medical-frontend-phi.vercel.app/dashboard/success", // e.g. https://your-frontend.com/payment-success
      cancel_url: "https://medical-frontend-phi.vercel.app/dashboard/cancel", // e.g. https://your-frontend.com/payment-cancel
    });

    // 5. Insert a new subscription doc in "pending" (so we know user started checkout)
    //    or upsert if we want to handle new plan upgrade logic.
    await Subscription.updateOne(
      { stripeCustomerId: customerId },
      {
        $set: {
          userId: user_id,
          subscriptionId: session.subscription, // subscription ID from Stripe (might be null until payment completes)
          subscriptionStatus: "pending",
          planName: selected_plan,
        },
      },
      { upsert: true }
    );

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * 2) CHECK CUSTOMER SUBSCRIPTION
 *    POST /check-customer
 */
router.post("/check-customer", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id." });
    }

    // Find the Stripe Customer
    const existingCustomer = await StripeCustomer.findOne({ userId: user_id });
    if (!existingCustomer) {
      // Not an existing Stripe customer
      return res.json({ is_existing_customer: false });
    }

    const customerId = existingCustomer.stripeCustomerId;
    // Find active subscription
    const subscription = await Subscription.findOne({
      stripeCustomerId: customerId,
      subscriptionStatus: "active",
    });

    if (subscription) {
      // Return relevant data
      return res.json({
        is_existing_customer: true,
        subscription_status: "active",
        current_plan: subscription.planId || "Unknown Plan ID",
        current_plan_name: subscription.planName || "Unknown Plan Name",
        subscription_id: subscription.subscriptionId || "N/A",
        plan_limit: subscription.planLimit || 0,
        generated_videos: subscription.generatedVideos || 0,
      });
    } else {
      return res.json({
        is_existing_customer: true,
        subscription_status: "inactive",
      });
    }
  } catch (error) {
    console.error("Error checking customer:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * 3) CREATE PORTAL SESSION
 *    POST /create-portal-session
 */
router.post("/create-portal-session", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id." });
    }

    const existingCustomer = await StripeCustomer.findOne({ userId: user_id });
    console.log("existingCustomer:", existingCustomer);
    if (!existingCustomer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const customerId = existingCustomer.stripeCustomerId;
    // Create a Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://medical-frontend-phi.vercel.app/dashboard/success", // e.g. https://your-frontend.com/payment
    });

    return res.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * 4) WEBHOOK
 *    POST /webhook
 */
const handleWebhook = async (req, res) => {
  let event;
  const signature = req.headers["stripe-signature"];
  console.log("webhooksccret:", process.env.STRIPE_WEBHOOK_SECRET);

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created": {
        const subscriptionId = event.data.object.id;
        const customerId = event.data.object.customer;
        const planId = event.data.object.items.data[0].price.product;
        const product = await stripe.products.retrieve(planId);
        const planName = product.name;
        const startDate = event.data.object.current_period_start;
        const endDate = event.data.object.current_period_end;

        // Map plan limit if you have it
        const planLimit = PLAN_LIMITS[planId] || 0;

        await Subscription.updateOne(
          { stripeCustomerId: customerId },
          {
            $set: {
              subscriptionStatus: "active",
              subscriptionId: subscriptionId,
              planId: planId,
              planName: planName,
              planLimit,
              startDate: new Date(startDate * 1000),
              endDate: new Date(endDate * 1000),
            },
          }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscriptionId = event.data.object.id;
        await Subscription.updateOne(
          { subscriptionId },
          {
            $set: {
              subscriptionStatus: "canceled",
              planLimit: 0,
            },
          }
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscriptionId = event.data.object.id;
        const planId = event.data.object.items.data[0].price.product;
        const product = await stripe.products.retrieve(planId);
        const planName = product.name;
        const startDate = event.data.object.current_period_start;
        const endDate = event.data.object.current_period_end;
        const planLimit = PLAN_LIMITS[planId] || 0;

        await Subscription.updateOne(
          { subscriptionId },
          {
            $set: {
              planId: planId,
              planName: planName,
              planLimit,
              startDate: new Date(startDate * 1000),
              endDate: new Date(endDate * 1000),
            },
          }
        );
        break;
      }

      case "invoice.payment_succeeded": {
        // This means a payment for a subscription was successful
        const subscriptionId = event.data.object.subscription;
        const customerId = event.data.object.customer;

        await Subscription.updateOne(
          { stripeCustomerId: customerId, subscriptionId },
          {
            $set: { subscriptionStatus: "active" },
          }
        );
        break;
      }

      // Handle any other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.json({ status: "success" });
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = router;

// Then, export the handleWebhook as a named export
module.exports.handleWebhook = handleWebhook;
