import Request from '../models/Request.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import FoodPost from '../models/FoodPost.js';
import { sendPickupRatingReminderEmail } from '../utils/emailUtils.js';

const INTERVAL_MINUTES = Number(process.env.RATING_REMINDER_INTERVAL_MINUTES || 1);

let isRunning = false;

export const runRatingReminderJob = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const dueRequests = await Request.find({
      status: 'completed',
      pickupConfirmed: true,
      ratingReminderSent: { $ne: true },
      ratingReminderDueAt: { $lte: new Date() }
    }).select('requester donor post ratingReminderSent ratingReminderDueAt');

    if (!dueRequests.length) return;

    let sentCount = 0;
    for (const request of dueRequests) {
      try {
        const requesterReview = await Review.findOne({
          request: request._id,
          reviewer: request.requester,
        }).select('_id');

        if (requesterReview) {
          request.ratingReminderSent = true;
          request.ratingReminderSentAt = new Date();
          await request.save();
          continue;
        }

        const [requester, donor, post] = await Promise.all([
          User.findById(request.requester).select('name email'),
          User.findById(request.donor).select('name'),
          FoodPost.findById(request.post).select('title')
        ]);

        if (requester?.email) {
          await sendPickupRatingReminderEmail({
            to: requester.email,
            requesterName: requester.name,
            donorName: donor?.name,
            postTitle: post?.title,
            requestId: request._id.toString(),
          });
        }

        request.ratingReminderSent = true;
        request.ratingReminderSentAt = new Date();
        await request.save();
        sentCount += 1;
      } catch (error) {
        console.error(`Rating reminder failed for request ${request._id}:`, error.message);
      }
    }

    if (sentCount > 0) {
      console.log(`📨 Rating reminder job: ${sentCount} email(s) sent`);
    }
  } catch (error) {
    console.error('Rating reminder job failed:', error.message);
  } finally {
    isRunning = false;
  }
};

export const startRatingReminderJob = () => {
  runRatingReminderJob();

  const intervalMs = Math.max(1, INTERVAL_MINUTES) * 60 * 1000;
  setInterval(runRatingReminderJob, intervalMs);

  console.log(`📨 Rating reminder job started (interval: ${INTERVAL_MINUTES}m)`);
};
