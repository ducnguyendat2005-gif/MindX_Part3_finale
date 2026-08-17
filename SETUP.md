#EN:
# Byway — Local Development Setup

This document explains how to start the project from scratch (e.g. after restarting your machine), including the MoMo/VNPay payment testing setup with ngrok.

## Prerequisites

- Node.js installed
- MongoDB installed (Community Server), with data directory at `E:\mongoDB_data`
- [ngrok](https://ngrok.com/download) installed and authenticated (`ngrok config add-authtoken <TOKEN>`)

## Startup order

You need **4 terminals** running in parallel, in this order.

### 1. Start MongoDB

```bash
mongod --dbpath="E:\mongoDB_data"
```

Keep this terminal open. Wait until you see the log confirming MongoDB is listening (default port `27017`).

> Tip: You can also view/manage the data visually using **MongoDB Compass**, connecting to `mongodb://localhost:27017`.

### 2. Start the backend

```bash
cd E:\MindX-final-partIII-project\backend
npm run dev
```

Wait for the log `Server is running!`. The backend runs on `http://localhost:5000`.

### 3. Start the frontend

```bash
cd E:\MindX-final-partIII-project\frontend
npm run dev
```

Wait for the Vite dev server URL, usually `http://localhost:5173`.

### 4. Start ngrok (only needed to test MoMo/VNPay payment callbacks)

```bash
ngrok http 5000
```

This exposes your local backend (`localhost:5000`) to a public HTTPS URL, which is required because MoMo/VNPay servers call back into your backend (IPN/return callback) to confirm a payment — they cannot reach `localhost` directly.

You'll see a line like:

```
Forwarding    https://xxxx-xx-xx.ngrok-free.dev -> http://localhost:5000
```

⚠️ **Important:** On the ngrok free plan, this URL changes every time you restart ngrok. After getting a new URL, you must:

1. Open `backend/.env`
2. Update the callback URL(s), e.g.:
   ```
   MOMO_IPN_URL=https://xxxx-xx-xx.ngrok-free.dev/account/momo/ipn
   VNPAY_RETURN_URL=https://xxxx-xx-xx.ngrok-free.dev/account/vnpay/return
   ```
3. Go back to the backend terminal (step 2), stop it (`Ctrl+C`), and restart it with `npm run dev` — the backend does **not** hot-reload `.env` changes.

> If you only need to test the UI, checkout flow, pricing/coupon logic, etc. (not the actual "payment confirmed" callback), you can skip ngrok — steps 1–3 are enough for most local development.

## Environment variables (`backend/.env`)

```
PORT=...
MONGO_URI=mongodb://localhost:27017/final3
JWT_SECRET_ACCESS=...
JWT_SECRET_REFRESH=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# MoMo (public sandbox test credentials — provided by MoMo for developer testing)
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:5173/payment-result
MOMO_IPN_URL=https://<your-ngrok-url>/account/momo/ipn

# VNPay (requires registering a sandbox merchant account at https://sandbox.vnpayment.vn/devreg/)
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://<your-ngrok-url>/account/vnpay/return

FRONTEND_URL=http://localhost:5173
```

`.env` is git-ignored — never commit real secrets.

## Quick checklist after a machine restart

- [ ] `mongod --dbpath="E:\mongoDB_data"` running
- [ ] Backend running (`backend`, `npm run dev`)
- [ ] Frontend running (`frontend`, `npm run dev`)
- [ ] (If testing payments) `ngrok http 5000` running, and `.env` callback URLs updated to the new ngrok URL, backend restarted

## Payment testing notes

- **MoMo**: works immediately with the public sandbox credentials above — no account registration needed. After creating an order, the API returns `data.payUrl`; open it in a browser to complete the test payment (QR code / MoMo Test App).
- **VNPay**: requires registering a sandbox merchant account first (see link above) to obtain `VNPAY_TMN_CODE` and `VNPAY_HASH_SECRET`. Until configured, VNPay checkout will return an error — use MoMo for testing in the meantime.
- Orders are stored in MongoDB, collection `Orders`, with status `pending` → `succeeded`/`failed` once the payment callback is received.

#VN:

# Byway — Hướng dẫn khởi động dự án (sau khi restart máy)

Mỗi lần bật lại máy, cần mở **4 terminal riêng biệt**, chạy theo đúng thứ tự dưới đây.

---

## Terminal 1 — MongoDB

```bash
mongod --dbpath="E:\mongoDB_data"
```

Giữ terminal này chạy suốt quá trình dev. Nếu đóng, backend sẽ không kết nối được DB (`MongoDB error: ...`).

---

## Terminal 2 — Backend

```bash
cd E:\MindX-final-partIII-project\backend
npm run dev
```

Đợi thấy log:
```
Server is running!
MongoDB connected!
```

Backend chạy ở `http://localhost:5000`.

---

## Terminal 3 — Frontend

```bash
cd E:\MindX-final-partIII-project\frontend
npm run dev
```

Đợi thấy link:
```
http://localhost:5173
```

---

## Terminal 4 — Ngrok (chỉ cần khi test thanh toán MoMo/VNPay)

```bash
ngrok http 5000
```

Sẽ hiện ra dòng:
```
Forwarding    https://xxxx-xx-xx.ngrok-free.dev -> http://localhost:5000
```

Copy đúng URL `https://xxxx-xx-xx.ngrok-free.dev` đó.

### ⚠️ Quan trọng: cập nhật `.env` mỗi lần chạy lại ngrok

Bản ngrok free **đổi URL mới mỗi lần chạy `ngrok http 5000`** — không giữ nguyên URL cũ.

1. Mở `backend/.env`, sửa dòng:
   ```
   MOMO_IPN_URL=https://xxxx-xx-xx.ngrok-free.dev/account/momo/ipn
   ```
   (nếu có dùng VNPay thì sửa thêm `VNPAY_RETURN_URL` tương tự)

2. Quay lại **Terminal 2** (backend), bấm `Ctrl+C`, chạy lại `npm run dev`
   → **bắt buộc restart backend mỗi lần sửa `.env`**, sửa xong không tự load lại.

### Không cần ngrok khi nào?

Nếu chỉ test giao diện, tính tiền, coupon, tạo đơn hàng (chưa cần xác nhận thanh toán tự động từ MoMo) — có thể bỏ qua Terminal 4, chỉ cần Terminal 1–3.

---

## Tóm tắt thứ tự khởi động

| # | Terminal | Lệnh | Bắt buộc? |
|---|----------|------|-----------|
| 1 | MongoDB | `mongod --dbpath="E:\mongoDB_data"` | ✅ luôn cần |
| 2 | Backend | `cd backend && npm run dev` | ✅ luôn cần |
| 3 | Frontend | `cd frontend && npm run dev` | ✅ luôn cần |
| 4 | Ngrok | `ngrok http 5000` | ⚠️ chỉ cần khi test MoMo/VNPay IPN thật |

Sau bước 4 (nếu có dùng), nhớ **cập nhật `.env` + restart backend** trước khi test thanh toán.

---

## Checklist `.env` (backend)

```env
PORT=...
MONGO_URI=mongodb://localhost:27017/final3
JWT_SECRET_ACCESS=...
JWT_SECRET_REFRESH=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# MoMo — test credentials công khai, dùng ngay không cần đăng ký
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:5173/payment-result
MOMO_IPN_URL=<URL_NGROK_MỚI_NHẤT>/account/momo/ipn

# VNPay — cần đăng ký sandbox tại https://sandbox.vnpayment.vn/devreg/ (chưa dùng, để trống tạm)
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=<URL_NGROK_MỚI_NHẤT>/account/vnpay/return

FRONTEND_URL=http://localhost:5173
```

---

## Test nhanh flow MoMo qua Postman

1. **Login:**
   ```
   POST http://localhost:5000/login
   Body: { "Email": "...", "pass": "..." }
   ```
   → copy `ATtoken`

2. **Tạo giao dịch MoMo:**
   ```
   POST http://localhost:5000/account/momo/create
   Headers: Authorization: Bearer <ATtoken>
   Body: { "courseIds": ["<id1>"], "couponCode": null }
   ```
   → response trả `data.payUrl`, dán vào trình duyệt để thanh toán demo

3. **Check kết quả:** MongoDB Compass → database `final3` → collection `Orders` → xem `status` chuyển từ `pending` → `succeeded` sau khi thanh toán xong trên trang MoMo (cần Terminal 4 - ngrok đang chạy để nhận được callback).