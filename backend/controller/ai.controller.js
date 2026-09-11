const OUT_OF_SCOPE_REPLY = {
  VIE: 'Mình là Byway AI, chỉ hỗ trợ các tính năng của website Byway như tài khoản, khóa học, tìm kiếm, đăng ký học, thanh toán, tiến độ học, hồ sơ, nhắn tin, sự kiện và quản trị. Bạn hãy hỏi lại về một trong các chức năng này nhé.',
  ENG: 'I am Byway AI. I only support Byway website features such as accounts, courses, search, enrollment, payments, learning progress, profiles, messaging, events, and administration. Please ask me about one of these features.',
};

const BYWAY_SYSTEM_INSTRUCTION = (language) => `${language === 'ENG'
  ? 'Respond only in English.'
  : 'Chỉ trả lời bằng tiếng Việt.'}
Bạn là Byway AI, trợ lý hướng dẫn sử dụng website học trực tuyến Byway.
CHỈ trả lời về các chức năng và quy trình có trong website Byway: đăng ký, đăng nhập, tài khoản, tìm kiếm khóa học, xem chi tiết khóa học, đăng ký/mua khóa học, giỏ hàng, mã giảm giá, thanh toán MoMo/VNPay, học khóa học, tiến độ, quiz, đánh giá, wishlist, hồ sơ, giáo viên, học viên, nhắn tin, bạn bè, sự kiện, bảng xếp hạng và khu vực quản trị.
Nếu câu hỏi ngoài phạm vi website Byway, hãy từ chối lịch sự và nhắc người dùng hỏi về các chức năng trên.
Chỉ hướng dẫn thao tác; không khẳng định bạn đã thanh toán, thay đổi tài khoản, gửi tin nhắn hoặc thực hiện hành động thay người dùng.
Nếu không chắc một tính năng có tồn tại, hãy nói rõ bạn không chắc và hướng dẫn người dùng kiểm tra trên giao diện.
Trả lời ngắn gọn, theo từng bước khi phù hợp.
`;

const WEBSITE_TERMS = [
  'byway', 'website', 'trang web', 'tài khoản', 'dang ky', 'dang nhap', 'mat khau',
  'khoa hoc', 'course', 'hoc', 'giang vien', 'giao vien', 'hoc vien', 'tim kiem',
  'gio hang', 'thanh toan', 'momo', 'vnpay', 'ma giam gia', 'coupon', 'tien do',
  'quiz', 'bai kiem tra', 'danh gia', 'review', 'wishlist', 'yeu thich', 'ho so',
  'tin nhan', 'nhan tin', 'ban be', 'su kien', 'xep hang', 'admin', 'quan tri',
  'dang ky hoc', 'mua khoa hoc', 'giup toi', 'huong dan', 'loi', 'khong vao duoc',
  'login', 'sign in', 'register', 'password', 'account', 'payment', 'pay', 'cart',
  'profile', 'message', 'event', 'search', 'teacher', 'student', 'progress',
  'learning', 'enroll', 'enrollment', 'course', 'review',
];

const normalize = (value) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd');

const isBywayQuestion = (text) => {
  const normalized = normalize(text);
  return WEBSITE_TERMS.some(term => normalized.includes(term));
};

const cleanMessages = (messages) => messages
  .filter(message => message && (message.role === 'user' || message.role === 'model'))
  .map(message => ({
    role: message.role,
    parts: [{ text: String(message.text || '').trim().slice(0, 4000) }],
  }))
  .filter(message => message.parts[0].text);

const chat = async (req, res) => {
  const language = req.body?.language === 'ENG' ? 'ENG' : 'VIE';
  const messages = Array.isArray(req.body?.messages) ? cleanMessages(req.body.messages) : [];
  const latestUserMessage = [...messages].reverse().find(message => message.role === 'user');

  if (!latestUserMessage) {
    return res.status(400).json({
      message: language === 'ENG' ? 'Invalid message.' : 'Tin nhắn không hợp lệ.',
    });
  }

  const latestText = latestUserMessage.parts[0].text;
  if (!isBywayQuestion(latestText)) {
    return res.json({ reply: OUT_OF_SCOPE_REPLY[language], inScope: false });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      message: language === 'ENG'
        ? 'Byway AI is not configured on the server yet. Please contact the administrator.'
        : 'Byway AI chưa được cấu hình API key trên server. Vui lòng liên hệ quản trị viên.',
    });
  }

  // Gemini conversation history must begin with a user turn.
  const firstUserIndex = messages.findIndex(message => message.role === 'user');
  const contents = messages.slice(firstUserIndex).slice(-10);

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: BYWAY_SYSTEM_INSTRUCTION(language) }] },
          contents,
        }),
      },
    );

    const data = await geminiResponse.json().catch(() => ({}));
    if (!geminiResponse.ok) {
      const status = geminiResponse.status === 429 ? 429 : 502;
      return res.status(status).json({
        message: status === 429
          ? language === 'ENG'
            ? 'Byway AI is busy right now. Please try again later.'
            : 'Byway AI đang quá tải. Bạn hãy thử lại sau nhé.'
          : language === 'ENG'
            ? 'Byway AI is unavailable right now. Please try again later.'
            : 'Không thể kết nối Byway AI lúc này. Vui lòng thử lại sau.',
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.json({ reply: reply || 'Mình chưa có câu trả lời phù hợp.', inScope: true });
  } catch (error) {
    console.error('Byway AI error:', error.message);
    return res.status(502).json({
      message: language === 'ENG'
        ? 'Byway AI is unavailable right now. Please try again later.'
        : 'Không thể kết nối Byway AI lúc này. Vui lòng thử lại sau.',
    });
  }
};

export default { chat };
