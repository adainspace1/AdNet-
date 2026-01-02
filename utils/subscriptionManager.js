const Subscription = require('../models/Subscription');

/**
 * Automatically expire subscriptions that have passed their end date.
 * This function should be run on app startup and potentially via a cron job.
 */
exports.expireSubscriptions = async () => {
    try {
        const now = new Date();

        // Find documents that have active subscriptions needing expiry
        const result = await Subscription.updateMany(
            { 'subscriptions.endDate': { $lt: now }, 'subscriptions.status': 'active' },
            { $set: { 'subscriptions.$[elem].status': 'expired' } },
            {
                arrayFilters: [{ 'elem.endDate': { $lt: now }, 'elem.status': 'active' }],
                multi: true
            }
        );

        console.log(`[SUBSCRIPTION MANAGER] Expired ${result.modifiedCount} subscription items.`);
    } catch (error) {
        console.error('[SUBSCRIPTION MANAGER ERROR] Failed to expire subscriptions:', error);
    }
};
