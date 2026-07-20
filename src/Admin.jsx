import React, { useState } from "react";
import { ShieldCheck, Download, Save, ChevronLeft, Video } from "lucide-react";
import { CURRICULUM, ADMIN_PIN } from "./content.js";
import { BRAND, loadVideoOverrides, saveVideoOverrides } from "./lib.js";

export default function Admin() {
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(false);
  const [urls, setUrls] = useState(() => {
    const ov = loadVideoOverrides();
    const map = {};
    CURRICULUM.forEach((m) => m.lessons.forEach((l) => { map[l.id] = ov[l.id] || l.videoUrl; }));
    return map;
  });
  const [saved, setSaved] = useState(false);

  if (!ok) {
    return (
      <Shell>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>หลังบ้าน</h1>
        <p style={{ color: BRAND.sub, fontSize: 14, marginBottom: 20 }}>ใส่รหัสผู้ดูแลเพื่อจัดการวิดีโอ</p>
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setOk(pin === ADMIN_PIN)}
          placeholder="รหัสผู้ดูแล" style={inp} />
        <button onClick={() => setOk(pin === ADMIN_PIN)} style={btn}>เข้าหลังบ้าน</button>
        {pin && pin !== ADMIN_PIN && <p style={{ color: BRAND.red, fontSize: 13, marginTop: 10 }}>รหัสไม่ถูกต้อง</p>}
        <a href="#" style={back}><ChevronLeft size={15} /> กลับหน้าเรียน</a>
      </Shell>
    );
  }

  const save = () => { saveVideoOverrides(urls); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const exportContent = () => {
    // สร้าง snippet ให้ก็อปไปวางทับ videoUrl ใน content.js เพื่อ sync ทุกคนถาวร
    const lines = ["// วาง URL เหล่านี้ทับ videoUrl ในแต่ละบทของ content.js แล้ว commit/push"];
    CURRICULUM.forEach((m) => m.lessons.forEach((l) => {
      lines.push(`// ${l.title}\n// ${l.id}: "${urls[l.id]}"`);
    }));
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "video-urls.txt";
    a.click();
  };

  return (
    <Shell wide>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <ShieldCheck size={20} color={BRAND.green} />
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>หลังบ้าน — จัดการวิดีโอ</h1>
      </div>
      <p style={{ color: BRAND.sub, fontSize: 13.5, marginBottom: 18, lineHeight: 1.6 }}>
        ใส่ลิงก์วิดีโอ (.mp4 / ลิงก์ฝัง) ของแต่ละบท กด <b>บันทึก</b> เพื่อดูผลในเครื่องนี้ทันที ·
        ถ้าจะให้ <b>เซลทุกคนเห็นเหมือนกันถาวร</b> กด <b>Export</b> แล้วเอา URL ไปวางใน <code>content.js</code> → push
      </p>

      {CURRICULUM.map((m) => (
        <div key={m.module} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.sub, letterSpacing: "0.06em", marginBottom: 8 }}>{m.module}</div>
          {m.lessons.map((l) => (
            <div key={l.id} style={{ background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14.5, marginBottom: 8 }}>
                <Video size={15} color={BRAND.red} /> {l.title}
              </div>
              <input value={urls[l.id]} onChange={(e) => setUrls({ ...urls, [l.id]: e.target.value })}
                placeholder="https://…mp4" style={{ ...inp, margin: 0, fontSize: 13.5 }} />
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, position: "sticky", bottom: 0, padding: "12px 0", background: BRAND.bg }}>
        <button onClick={save} style={btn}><Save size={16} /> {saved ? "บันทึกแล้ว ✓" : "บันทึก (เครื่องนี้)"}</button>
        <button onClick={exportContent} style={{ ...btn, background: BRAND.ink }}><Download size={16} /> Export ไป push</button>
      </div>
      <a href="#" style={back}><ChevronLeft size={15} /> กลับหน้าเรียน</a>
    </Shell>
  );
}

function Shell({ children, wide }) {
  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh", color: BRAND.ink }}>
      <div style={{ maxWidth: wide ? 760 : 420, margin: "0 auto", padding: "40px 20px 60px" }}>{children}</div>
    </div>
  );
}

const inp = { width: "100%", boxSizing: "border-box", padding: "11px 13px", margin: "0 0 12px", borderRadius: 10, border: `1px solid ${BRAND.line}`, fontSize: 15, background: "#fff", color: BRAND.ink };
const btn = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: BRAND.red, color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 14.5, fontWeight: 600, cursor: "pointer" };
const back = { display: "inline-flex", alignItems: "center", gap: 5, color: BRAND.sub, fontSize: 13.5, textDecoration: "none", marginTop: 20 };
