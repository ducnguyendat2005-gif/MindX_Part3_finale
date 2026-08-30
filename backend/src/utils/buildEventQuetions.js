// Helper giữ _id ổn định cho câu hỏi event, cùng pattern với buildQuizFromInput
// dùng cho quiz trong course — tránh Mongoose sinh _id mới mỗi lần update.
//
// gameType quyết định field nào được build vào payload — event chỉ có 1
// gameType duy nhất áp dụng cho MỌI câu hỏi trong sự kiện đó.
export const buildEventQuestions = (inputQuestions = [], existingQuestions = [], gameType = 'quiz') => {
    return inputQuestions.map((q) => {
        const existing = q._id
            ? existingQuestions.find((eq) => eq._id.toString() === q._id.toString())
            : null;

        const base = {
            ...(existing ? { _id: existing._id } : {}), // giữ _id cũ nếu có, không set thì Mongoose tự sinh mới (câu hỏi mới thêm)
            basePoints: q.basePoints ?? 100,
            timeLimitSeconds: q.timeLimitSeconds ?? 30,
        };

        if (gameType === 'unscramble') {
            return {
                ...base,
                word: (q.word || '').trim().toUpperCase(),
                hint: (q.hint || '').trim(),
            };
        }

        if (gameType === 'matching') {
            return {
                ...base,
                pairs: (q.pairs || []).map((p) => ({
                    left: (p.left || '').trim(),
                    right: (p.right || '').trim(),
                })),
            };
        }

        // default: quiz
        return {
            ...base,
            questionText: q.questionText,
            options: q.options,
            correctIndex: q.correctIndex,
        };
    });
};