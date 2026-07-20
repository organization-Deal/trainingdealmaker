# DEAL! Sales Academy

ระบบสอนเซลแบบ scale ได้ — วิดีโอบทเรียน + login + log เวลาดู + แบบทดสอบผ่าน 100% + สนามซ้อม AI (ลูกค้าจำลอง)

---

## ⚡ Deploy ขึ้น GitHub + Cloudflare Pages (ครั้งเดียวจบ)

### 1. เอาขึ้น GitHub
```bash
cd deal-sales-academy
git init
git add .
git commit -m "init deal sales academy"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

### 2. ต่อกับ Cloudflare Pages
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. เลือก repo นี้
3. ตั้งค่า build:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. กด **Save and Deploy** — เว็บขึ้นแล้ว (โฟลเดอร์ `functions/` จะกลายเป็น API อัตโนมัติ)

### 3. ใส่กุญแจ AI (สำคัญ — ไม่ใส่ สนามซ้อม AI จะไม่ทำงาน)
1. เอา API key จาก https://console.anthropic.com → API Keys
2. Cloudflare → โปรเจกต์นี้ → **Settings** → **Environment variables** → **Add**
   - ชื่อ: `ANTHROPIC_API_KEY`
   - ค่า: `sk-ant-...` (คีย์ของมึง)
3. **Re-deploy** หนึ่งครั้งให้ค่ามีผล

> 🔒 key อยู่ฝั่ง Cloudflare เท่านั้น ไม่โผล่หน้าเว็บ ปลอดภัย
> 💸 ทุกครั้งที่เซลซ้อมกับลูกค้า AI จะมีค่า token ตาม pricing — ดูราคา/ชื่อรุ่นล่าสุดที่ https://docs.claude.com

---

## 🎬 ใส่วิดีโอ (หลังบ้าน) — 2 ทาง

### ทาง A (แนะนำ, sync ทุกคนถาวร): แก้ที่ `src/content.js`
เปิด `src/content.js` → หาแต่ละบท → วาง URL วิดีโอที่ `videoUrl`
```js
{
  id: "m1-model",
  title: "DEAL คืออะไร + Co-ownership vs Full ownership",
  videoUrl: "https://…ลิงก์วิดีโอจริง.mp4",   // ← วางตรงนี้
  quiz: [ ... ]
}
```
แก้เสร็จ → `git commit` → `git push` → Cloudflare rebuild เอง → เซลทุกคนเห็นเหมือนกัน

รองรับไฟล์ `.mp4` โดยตรง (แนะนำอัปขึ้น **Cloudflare Stream** หรือ **YouTube unlisted**/ **Google Drive** ที่แชร์เป็นลิงก์ไฟล์)

### ทาง B (แก้ในเว็บ, เห็นเฉพาะเครื่องนี้ก่อน): หน้า `/admin`
เปิดเว็บแล้วต่อท้าย URL ด้วย `#admin` → ใส่รหัสผู้ดูแล (ตั้งใน `content.js` ที่ `ADMIN_PIN`) → ใส่ URL วิดีโอแต่ละบท → **บันทึก** (เห็นผลทันทีในเครื่องนี้) → กด **Export** เพื่อเอา URL ไปวางใน `content.js` ให้ถาวร

---

## ✅ ทำอะไรได้บ้าง
- **Login** ด้วยชื่อ + รหัสพนักงาน แยกความคืบหน้ารายคน
- **Log เวลาดู** จับว่าดูคลิปไหนกี่นาที บทไหนยังไม่ดู — บังคับดูครบ 90% ก่อนทำแบบทดสอบ
- **แบบทดสอบกากบาท** ต้องผ่าน **100% ทุกบท** ถึงปลดล็อกด่านปิดการขาย
- **สนามซ้อม AI** ลูกค้าจำลอง 4 สถานการณ์ + จับคำต้องห้ามสดๆ + หัวหน้า AI ให้คะแนนตอนจบ

## ➕ เพิ่มบทให้ครบ 21 คลิป
เปิด `src/content.js` → เพิ่ม object บทใน `lessons` ของ module ที่ต้องการ (มี `id` ไม่ซ้ำ, `title`, `videoUrl`, `quiz`)

---

## ⚠️ ข้อจำกัดเวอร์ชันนี้ (อ่านก่อน)
- **Login ยังไม่มีรหัสผ่านจริง** (แค่พิมพ์ชื่อ+รหัสเข้า) และ **log เก็บในเบราว์เซอร์แต่ละเครื่อง** → ผู้บริหารยัง**ดู log รวมของเซลทุกคนจากที่เดียวไม่ได้**
- อยากได้ **auth จริง + log กลาง + หน้า admin เห็นทุกคน + leaderboard** → เฟสถัดไปต่อ database (Cloudflare D1/KV หรือ Supabase) แล้วให้ `/api/` เขียน-อ่านแทน localStorage

## 🧑‍💻 รันในเครื่อง (ถ้าอยากลองก่อน push)
```bash
npm install
npm run dev      # เปิด http://localhost:5173
```
> หมายเหตุ: `/api/ai` ทำงานเต็มตอนอยู่บน Cloudflare — ตอน `npm run dev` เฉยๆ สนามซ้อม AI จะยังไม่ตอบ (ใช้ `npx wrangler pages dev dist` ถ้าจะทดสอบ function ในเครื่อง)
