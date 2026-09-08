import EventModel from '../../model/event.js';
import EventScoreModel from '../../model/eventScore.js';
import CouponModel from '../../model/coupon.js';
import NotificationModel from '../../model/notification.js';

// Cấu hình mức thưởng theo hạng — muốn đổi % hay số ngày hết hạn thì chỉ sửa ở đây.
const REWARD_TIERS = [
    { rank: 1, discountValue: 30 },
    { rank: 2, discountValue: 20 },
    { rank: 3, discountValue: 10 },
];
const COUPON_EXPIRY_DAYS = 7;

// Sinh code coupon ngẫu nhiên, không trùng với code đã tồn tại trong DB.
async function generateUniqueCouponCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ ký tự dễ nhầm (0/O, 1/I)
    for (let attempt = 0; attempt < 10; attempt++) {
        let code = 'EVENT-';
        for (let i = 0; i < 8; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        const exists = await CouponModel.exists({ code });
        if (!exists) return code;
    }
    throw new Error('Could not generate a unique coupon code after multiple attempts');
}

// Tạo 1 coupon thưởng riêng cho 1 người chơi, dùng 1 lần.
async function generateRewardCoupon(accountId, event, tier) {
    const code = await generateUniqueCouponCode();
    const expiresAt = new Date(Date.now() + COUPON_EXPIRY_DAYS * 86400000);

    await CouponModel.create({
        code,
        discountType: 'percentage',
        discountValue: tier.discountValue,
        maxUses: 1,
        expiresAt,
        isActive: true,
    });

    await NotificationModel.create({
        accountId,
        type: 'event_reward',
        title: 'Congratulations, you won!',
        message: `You ranked #${tier.rank} in the "${event.title}" event — claim your ${tier.discountValue}% discount code: ${code} (expires in ${COUPON_EXPIRY_DAYS} days)`,
        meta: {
            eventId: event._id,
            couponCode: code,
            rank: tier.rank,
            discountValue: tier.discountValue,
        },
    });

    return code;
}

// Tách phần xử lý 1 event ra hàm riêng, để cả cron cũ (nếu còn giữ) lẫn
// lazyEventRewardTrigger.js đều gọi chung logic, tránh lặp code / lệch bug.
export async function distributeEventRewardsForEvent(event) {
    const topScores = await EventScoreModel.find({ eventId: event._id })
        .sort({ totalScore: -1 })
        .limit(3);

    for (let i = 0; i < topScores.length; i++) {
        const score = topScores[i];
        if (!score.attemptsLog || score.attemptsLog.length === 0) continue;
        if (score.rewardCouponCode) continue;

        const tier = REWARD_TIERS[i];
        const code = await generateRewardCoupon(score.accountId, event, tier);

        score.rewardCouponCode = code;
        await score.save();
    }
}

// Giữ lại hàm cũ cho tương thích ngược nếu bạn chưa muốn bỏ hẳn cron ngay —
// nó giờ chỉ là 1 wrapper quét + gọi hàm trên cho từng event.
export async function distributeEventRewards() {
    const now = new Date();
    const endedEvents = await EventModel.find({
        endDate: { $lt: now },
        rewardsDistributed: false,
    });

    for (const event of endedEvents) {
        try {
            await distributeEventRewardsForEvent(event);
            event.rewardsDistributed = true;
            await event.save();
            console.log(`[eventRewardJob] Đã phát thưởng top 3 cho event "${event.title}" (${event._id})`);
        } catch (err) {
            console.error(`[eventRewardJob] Lỗi khi phát thưởng cho event ${event._id}:`, err);
        }
    }
}