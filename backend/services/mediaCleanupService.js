import FoodPost from '../models/FoodPost.js';
import { deleteFromCloudinary } from '../utils/cloudinaryUtils.js';

const COMPLETED_RETENTION_DAYS = Number(process.env.MEDIA_CLEANUP_COMPLETED_DAYS || 7);
const EXPIRED_RETENTION_DAYS = Number(process.env.MEDIA_CLEANUP_EXPIRED_DAYS || 3);
const INTERVAL_HOURS = Number(process.env.MEDIA_CLEANUP_INTERVAL_HOURS || 6);

let isRunning = false;

const cleanupPostImages = async (post) => {
  if (!post.images?.length) {
    post.mediaCleaned = true;
    post.mediaCleanedAt = new Date();
    await post.save();
    return 0;
  }

  let deletedCount = 0;
  for (const image of post.images) {
    if (!image?.publicId) continue;

    try {
      await deleteFromCloudinary(image.publicId);
      deletedCount += 1;
    } catch (error) {
      console.error(`Cloudinary cleanup failed for ${image.publicId}:`, error.message);
    }
  }

  post.images = [];
  post.mediaCleaned = true;
  post.mediaCleanedAt = new Date();
  await post.save();

  return deletedCount;
};

export const runMediaCleanup = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = Date.now();
    const completedCutoff = new Date(now - COMPLETED_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const expiredCutoff = new Date(now - EXPIRED_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const [completedPosts, expiredPosts] = await Promise.all([
      FoodPost.find({
        status: 'completed',
        mediaCleaned: { $ne: true },
        completedAt: { $lte: completedCutoff },
        'images.0': { $exists: true }
      }),
      FoodPost.find({
        status: 'expired',
        mediaCleaned: { $ne: true },
        'images.0': { $exists: true },
        $or: [
          { expiredAt: { $lte: expiredCutoff } },
          { expiredAt: { $exists: false }, updatedAt: { $lte: expiredCutoff } }
        ]
      })
    ]);

    const targets = [...completedPosts, ...expiredPosts];
    if (!targets.length) return;

    let totalDeleted = 0;
    for (const post of targets) {
      totalDeleted += await cleanupPostImages(post);
    }

    console.log(
      `🧹 Media cleanup complete: ${targets.length} posts processed, ${totalDeleted} Cloudinary images deleted`
    );
  } catch (error) {
    console.error('Media cleanup job failed:', error.message);
  } finally {
    isRunning = false;
  }
};

export const startMediaCleanupJob = () => {
  runMediaCleanup();

  const intervalMs = Math.max(1, INTERVAL_HOURS) * 60 * 60 * 1000;
  setInterval(runMediaCleanup, intervalMs);

  console.log(
    `🧹 Media cleanup job started (completed: ${COMPLETED_RETENTION_DAYS}d, expired: ${EXPIRED_RETENTION_DAYS}d, interval: ${INTERVAL_HOURS}h)`
  );
};
