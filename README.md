# DEAL! Sales Academy

ระบบสอนเซลแบบ scale ได้ — วิดีโอบทเรียน + login + log เวลาดู + แบบทดสอบผ่าน 100% + สนามซ้อม AI (ลูกค้าจำลอง)
Deploy เป็น **Cloudflare Worker + static assets**

---

## Deploy ขึ้น GitHub + Cloudflare (ครั้งเดียวจบ)

### 1. เอาขึ้น GitHub
    cd deal-sales-academy
    git init
    git add .
    git commit -m "init deal sales academy"
    git branch -M main
    git remote add origin https://github.com/<user>/<repo>.git
    git push -u origin main

### 2. Cloudflare อ่านค่าจาก wrangler.jsonc ให้เอง
โปรเจกต์ตั้ง deploy แบบ Worker + assets ไว้แล้ว ค่าที่ Cloudflare ใช้:
- Build command: npm run build
- Deploy command: npx wrangler deploy
- Worker name: trainingdealmaker (แก้ได้ใน wrangler.jsonc)

ถ้ามึงตั้ง Worker นี้ไว้แล้ว (ชื่อ trainingdealmaker) แค่ git push ทับ มันจะ build + deploy รอบใหม่ให้เอง

### 3. ใส่กุญแจ AI (สำคัญ ไม่ใส่ สนามซ้อม AI จะไม่ทำงาน)
1. เอา API key จาก https://console.anthropic.com  API Keys
2. Cloudflare  Worker trainingdealmaker  Settings  Variables and Secrets  Add
   - ชนิด: Secret
   - ชื่อ: ANTHROPIC_API_KEY
   - ค่า: sk-ant-...
3. Deploy ใหม่หนึ่งครั้งให้ค่ามีผล (push อีกที หรือกด Retry deployment)

key อยู่ใน Worker ฝั่ง server เท่านั้น ไม่โผล่หน้าเว็บ
ทุกครั้งที่เซลซ้อมกับลูกค้า AI มีค่า token ตาม usage ดูราคา/ชื่อรุ่นล่าสุดที่ https://docs.claude.com

---

## ใส่วิดีโอ (หลังบ้าน) 2 ทาง

### ทาง A (แนะนำ, sync ทุกคนถาวร): แก้ src/content.js
เปิด src/content.js วาง URL วิดีโอที่ videoUrl ของแต่ละบท

    {
      id: "m1-model",
      title: "DEAL คืออะไร + Co-ownership vs Full ownership",
      videoUrl: "https://…ลิงก์วิดีโอจริง.mp4",   // <- วางตรงนี้
      quiz: [ ... ]
    }

แก้เสร็จ git commit git push Cloudflare deploy เอง เซลทุกคนเห็นเหมือนกัน
(รองรับ .mp4 โดยตรง แนะนำอัปขึ้น Cloudflare Stream / YouTube unlisted / Google Drive แบบลิงก์ไฟล์)

### ทาง B (แก้ในเว็บ): หน้า /#admin
เปิดเว็บแล้วต่อท้าย URL ด้วย #admin ใส่รหัสผู้ดูแล (ตั้งที่ ADMIN_PIN ใน content.js) ใส่ URL วิดีโอ บันทึก (เห็นผลทันทีในเครื่องนี้) Export เอา URL ไปวางใน content.js ให้ถาวร

---

## ทำอะไรได้บ้าง
- Login ด้วยชื่อ + รหัสพนักงาน แยกความคืบหน้ารายคน
- Log เวลาดู จับว่าดูคลิปไหนกี่นาที บทไหนยังไม่ดู บังคับดูครบ 90% ก่อนทำแบบทดสอบ
- แบบทดสอบกากบาท ต้องผ่าน 100% ทุกบท ถึงปลดล็อกด่านปิดการขาย
- สนามซ้อม AI ลูกค้าจำลอง 4 สถานการณ์ + จับคำต้องห้ามสดๆ + หัวหน้า AI ให้คะแนนตอนจบ

## เพิ่มบทให้ครบ 21 คลิป
เปิด src/content.js เพิ่ม object บทใน lessons ของ module ที่ต้องการ (id ไม่ซ้ำ, title, videoUrl, quiz)

---

## ข้อจำกัดเวอร์ชันนี้
- Login ยังไม่มีรหัสผ่านจริง (แค่พิมพ์ชื่อ+รหัสเข้า) และ log เก็บในเบราว์เซอร์แต่ละเครื่อง ผู้บริหารยังดู log รวมของเซลทุกคนจากที่เดียวไม่ได้
- อยากได้ auth จริง + log กลาง + admin dashboard + leaderboard เฟสถัดไปต่อ Cloudflare D1 (มี Worker อยู่แล้ว ต่อ D1 ได้เลย) ให้ /api/ เขียน-อ่านแทน localStorage

## รันในเครื่อง
    npm install
    npm run build
    npx wrangler dev

สร้างไฟล์ .dev.vars (อย่า commit) ใส่ ANTHROPIC_API_KEY=sk-ant-... เพื่อทดสอบสนามซ้อมในเครื่อง

## โครงไฟล์
    src/content.js   <- หลังบ้านหลัก: วิดีโอ + quiz
    src/Admin.jsx    <- หน้า /#admin
    src/App.jsx      <- เว็บสอน (login/วิดีโอ/quiz/สนามซ้อม)
    worker.js        <- Worker: /api/ai proxy + เสิร์ฟไฟล์เว็บ
    wrangler.jsonc   <- ตั้งค่า Worker + assets
