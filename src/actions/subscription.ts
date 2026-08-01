// This file is intentionally left minimal.
// All subscription-related actions have been consolidated:
// - Redeem code: src/actions/auth.ts → redeemSubscriptionCode
// - Subscribe to plan: src/lib/actions/subscriptions.ts → subscribeToPlan
// - Cancel subscription: src/lib/actions/subscriptions.ts → cancelMySubscription
// - Reactivate: src/lib/actions/subscriptions.ts → reactivateMySubscription