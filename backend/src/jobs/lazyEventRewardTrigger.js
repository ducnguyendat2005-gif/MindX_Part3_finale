import EventModel from '../../model/event.js';
import { distributeEventRewardsForEvent } from './eventRewardJob.js';

/**
 * Lazy trigger — được gọi (không await) từ 1 route có traffic đều đặn
 * (GET /events). Thay thế cho node-cron chạy nền trên Render.
 *
 * Nguyên tắc chống bug:
 * 1. Atomic claim bằng findOneAndUpdate — chỉ 1 request duy nhất "thắng"
 *    quyền xử lý mỗi event, tránh race condition khi nhiều user cùng load
 *    trang events sau khi event vừa kết thúc.
 * 2. Chỉ quét những event đã ended và chưa phát thưởng — KHÔNG quét toàn
 *    bộ collection.
 * 3. Lỗi ở 1 event không làm hỏng việc xử lý các event khác.
 * 4. Hàm này được gọi fire-and-forget từ controller, không được throw ra
 *    ngoài làm hỏng response của user.
 */
export async function checkAndDistributeEndedEvents() {
    const now = new Date();

    // Chỉ lấy _id — tránh load nguyên document nặng (questions, scoringConfig...)
    // vì mục đích chỉ để claim rồi xử lý riêng từng event.
    const candidates = await EventModel.find({
        endDate: { $lt: now },
        rewardsDistributed: false,
    }).select('_id');

    if (candidates.length === 0) return;

    for (const { _id } of candidates) {
        // Atomic claim: findOneAndUpdate với { new: false } trả về document
        // TRƯỚC khi update. Nếu null → event này vừa bị 1 request khác
        // (chạy song song) claim mất trong lúc ta đang query ở trên → bỏ qua.
        const claimed = await EventModel.findOneAndUpdate(
            { _id, rewardsDistributed: false },
            { $set: { rewardsDistributed: true } },
            { new: false }
        );

        if (!claimed) continue; // đã có request khác claim, không xử lý lại

        try {
            await distributeEventRewardsForEvent(claimed);
            console.log(`[lazyTrigger] Đã phát thưởng cho event "${claimed.title}" (${claimed._id})`);
        } catch (err) {
            // QUAN TRỌNG: đã set rewardsDistributed = true ở trên rồi, nếu job
            // lỗi giữa chừng thì event coi như "đã xử lý" nhưng có thể phát
            // thiếu/phát sai. Log rõ ràng để admin biết mà xử lý thủ công
            // (xem endpoint redistribute bên dưới), KHÔNG tự động rollback
            // rewardsDistributed vì có thể đã tạo 1 phần coupon rồi — rollback
            // sẽ khiến lần sau chạy lại từ đầu và có nguy cơ tạo trùng.
            console.error(
                `[lazyTrigger] LỖI khi phát thưởng event ${claimed._id} — cần admin kiểm tra thủ công:`,
                err
            );
        }
    }
}