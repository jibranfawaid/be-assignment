const cron = require('node-cron');
const { processRecurringPayments } = require('./controllers/transactionController');

// Schedule to run every day at midnight
cron.schedule('0 0 * * *', () => {
    processRecurringPayments();
});
