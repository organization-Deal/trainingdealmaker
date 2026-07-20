import React, { useState } from "react";
import {
  ShieldCheck, Download, Save, ChevronLeft, Video, Unlock, Plus, Trash2, Copy,
} from "lucide-react";
import { CURRICULUM, ADMIN_PIN } from "./content.js";
import {
  BRAND, loadVideoOverrides, saveVideoOverrides, loadAddedLessons, saveAddedLessons,
  loadPreviewUnlock, savePreviewUnlock, getCurriculum, buildContentFile, clearLocalContent,
} from "./lib.js";

const emptyQuiz = () => ({ q: "", choices: ["", "", "", ""], correct: 0 });

export default function Admin() {
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(false);

  if (!ok) {
    return (
      <Shell>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>หลังบ้าน</h1>
        <p style={{ color: BRAND.sub, fontSize: 14, marginBottom: 20 }}>ใส่รหัสผู้ดูแลเพื่อจัดการวิดีโอ/บทเรียน</p>
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setOk(pin === ADMIN_PIN)} placeholder="รหัสผู้ดูแล" style={inp} />
        <button onClick={() => setOk(pin === ADMIN_PIN)} style={btn}>เข้าหลังบ้าน</button>
        {pin && pin !== ADMIN_PIN && <p style={{ color: BRAND.red, fontSize: 13, marginTop: 10 }}>รหัสไม่ถูกต้อง</p>}
        <a href="#" style={back}><ChevronLeft size={15} /> กลับหน้าเรียน</a>
      </Shell>
    );
  }
  return <Panel />;
}

function Panel() {
  const [urls, setUrls] = useState(() => {
    const ov = loadVideoOverrides(); const map = {};
    getCurriculum().forEach((m) => m.lessons.forEach((l) => { map[l.id] = ov[l.id] || l.videoUrl; }));
    return map;
  });
  const [added, setAdded] = useState(loadAddedLessons());
  const [preview, setPreview] = useState(loadPreviewUnlock());
  const [savedMsg, setSavedMsg] = useState("");
  const [form, setForm] = useState({ module: CURRICULUM[0].module, title: "", videoUrl: "", quiz: [emptyQuiz()] });

  const flash = (m) => { setSavedMsg(m); setTimeout(() => setSavedMsg(""), 2000); };

  const saveUrls = () => { saveVideoOverrides(urls); flash("บันทึกลิงก์วิดีโอแล้ว (เครื่องนี้)"); };

  const togglePreview = () => { const v = !preview; setPreview(v); savePreviewUnlock(v); };

  const formValid = form.title.trim() && form.videoUrl.trim() &&
    form.quiz.every((q) => q.q.trim() && q.choices.every((c) => c.trim()));

  const addLesson = () => {
    const id = "custom-" + Date.now();
    const lesson = { module: form.module.trim() || "บทเพิ่มเติม", id, title: form.title.trim(), videoUrl: form.videoUrl.trim(), quiz: form.quiz };
    const next = [...added, lesson];
    setAdded(next); saveAddedLessons(next);
    setUrls({ ...urls, [id]: lesson.videoUrl });
    setForm({ module: CURRICULUM[0].module, title: "", videoUrl: "", quiz: [emptyQuiz()] });
    flash("เพิ่มบทแล้ว");
  };

  const removeAdded = (id) => {
    const next = added.filter((l) => l.id !== id);
    setAdded(next); saveAddedLessons(next);
  };

  const exportFile = () => {
    saveVideoOverrides(urls);
    const text = buildContentFile();
    const blob = new Blob([text], { type: "text/javascript" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "content.js"; a.click();
  };

  const curriculum = getCurriculum();

  return (
    <Shell wide>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <ShieldCheck size={20} color={BRAND.green} />
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>หลังบ้าน</h1>
      </div>

      {/* โหมดทดสอบ */}
      <Card>
        <Row>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}><Unlock size={16} color={BRAND.amber} /> ปลดล็อกสนามซ้อม (โหมดทดสอบ)</div>
            <div style={{ fontSize: 12.5, color: BRAND.sub, marginTop: 2 }}>เปิดเพื่อเข้าสนามซ้อม AI ได้เลยโดยไม่ต้องสอบครบ — มีผลเฉพาะเครื่องนี้ ไม่กระทบเซล</div>
          </div>
          <button onClick={togglePreview} style={{ ...toggle, background: preview ? BRAND.green : BRAND.line }}>
            <span style={{ ...knob, transform: preview ? "translateX(20px)" : "translateX(0)" }} />
          </button>
        </Row>
      </Card>

      {/* แก้ลิงก์วิดีโอบทเดิม */}
      <SecTitle>วิดีโอของแต่ละบท</SecTitle>
      {curriculum.map((m) => (
        <div key={m.module} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.sub, letterSpacing: "0.06em", marginBottom: 8 }}>{m.module}</div>
          {m.lessons.map((l) => (
            <Card key={l.id} tight>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                <Video size={15} color={BRAND.red} /> {l.title}
                {l.id.startsWith("custom-") && <span style={tag}>เพิ่มเอง</span>}
              </div>
              <input value={urls[l.id] || ""} onChange={(e) => setUrls({ ...urls, [l.id]: e.target.value })}
                placeholder="https://…mp4" style={{ ...inp, margin: 0, fontSize: 13.5 }} />
              {l.id.startsWith("custom-") && (
                <button onClick={() => removeAdded(l.id)} style={delBtn}><Trash2 size={13} /> ลบบทนี้</button>
              )}
            </Card>
          ))}
        </div>
      ))}
      <button onClick={saveUrls} style={{ ...btn, marginBottom: 24 }}><Save size={15} /> บันทึกลิงก์ (เครื่องนี้)</button>

      {/* เพิ่มบทใหม่ */}
      <SecTitle>เพิ่มบทใหม่ (คลิปที่ 9–21)</SecTitle>
      <Card>
        <label style={lbl}>หมวด</label>
        <input list="mods" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} style={inp} placeholder="เลือกหมวดเดิม หรือพิมพ์หมวดใหม่" />
        <datalist id="mods">{CURRICULUM.map((m) => <option key={m.module} value={m.module} />)}</datalist>

        <label style={lbl}>ชื่อบท</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inp} placeholder="เช่น ตู้น้ำหอม — วิธีเล่าให้ลูกค้าเห็นภาพ" />

        <label style={lbl}>ลิงก์วิดีโอ</label>
        <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} style={inp} placeholder="https://…mp4" />

        <label style={lbl}>แบบทดสอบ (ต้องตอบถูกทุกข้อถึงผ่าน)</label>
        {form.quiz.map((q, qi) => (
          <div key={qi} style={{ background: "#FaF8F4", border: `1px solid ${BRAND.line}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: BRAND.sub }}>คำถามที่ {qi + 1}</span>
              {form.quiz.length > 1 && <button onClick={() => setForm({ ...form, quiz: form.quiz.filter((_, i) => i !== qi) })} style={delBtn}><Trash2 size={12} /></button>}
            </div>
            <input value={q.q} onChange={(e) => { const nq = [...form.quiz]; nq[qi] = { ...q, q: e.target.value }; setForm({ ...form, quiz: nq }); }} style={{ ...inp, margin: "0 0 8px" }} placeholder="พิมพ์คำถาม" />
            {q.choices.map((c, ci) => (
              <div key={ci} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <input type="radio" checked={q.correct === ci} onChange={() => { const nq = [...form.quiz]; nq[qi] = { ...q, correct: ci }; setForm({ ...form, quiz: nq }); }} />
                <input value={c} onChange={(e) => { const nq = [...form.quiz]; const nc = [...q.choices]; nc[ci] = e.target.value; nq[qi] = { ...q, choices: nc }; setForm({ ...form, quiz: nq }); }}
                  style={{ ...inp, margin: 0, fontSize: 13.5 }} placeholder={`ตัวเลือก ${ci + 1}${q.correct === ci ? " (เฉลย)" : ""}`} />
              </div>
            ))}
          </div>
        ))}
        <button onClick={() => setForm({ ...form, quiz: [...form.quiz, emptyQuiz()] })} style={{ ...btnGhost, marginBottom: 12 }}><Plus size={14} /> เพิ่มคำถาม</button>
        <button onClick={addLesson} disabled={!formValid} style={{ ...btn, width: "100%", opacity: formValid ? 1 : 0.45, cursor: formValid ? "pointer" : "not-allowed" }}>
          <Plus size={15} /> เพิ่มบทนี้
        </button>
      </Card>

      {/* Export */}
      <SecTitle>บันทึกให้ทุกคนเห็นถาวร</SecTitle>
      <Card>
        <p style={{ fontSize: 13.5, color: BRAND.sub, margin: "0 0 12px", lineHeight: 1.6 }}>
          สิ่งที่แก้ด้านบนเห็นเฉพาะเครื่องนี้ก่อน · กด Export จะได้ไฟล์ <b>content.js</b> เอาไปวางทับ <code>src/content.js</code> ใน repo แล้ว <b>git push</b> → เซลทุกคนเห็นเหมือนกัน
        </p>
        <button onClick={exportFile} style={{ ...btn, background: BRAND.ink, width: "100%", marginBottom: 8 }}><Download size={15} /> Export content.js</button>
        <button onClick={() => { clearLocalContent(); location.reload(); }} style={{ ...btnGhost, width: "100%", justifyContent: "center" }}><Copy size={13} /> ล้างข้อมูลชั่วคราวในเครื่อง (ทำหลัง push แล้ว)</button>
      </Card>

      {savedMsg && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: BRAND.green, color: "#fff", padding: "10px 18px", borderRadius: 999, fontSize: 14, fontWeight: 600 }}>{savedMsg}</div>}
      <a href="#" style={back}><ChevronLeft size={15} /> กลับหน้าเรียน</a>
    </Shell>
  );
}

/* ---- small pieces ---- */
function Shell({ children, wide }) {
  return <div style={{ background: BRAND.bg, minHeight: "100vh", color: BRAND.ink }}>
    <div style={{ maxWidth: wide ? 760 : 420, margin: "0 auto", padding: "40px 20px 60px" }}>{children}</div>
  </div>;
}
const Card = ({ children, tight }) => <div style={{ background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 12, padding: tight ? 12 : 16, marginBottom: tight ? 8 : 16 }}>{children}</div>;
const Row = ({ children }) => <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>{children}</div>;
const SecTitle = ({ children }) => <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.sub, textTransform: "uppercase", letterSpacing: "0.08em", margin: "6px 0 10px" }}>{children}</div>;

const inp = { width: "100%", boxSizing: "border-box", padding: "10px 12px", margin: "0 0 12px", borderRadius: 10, border: `1px solid ${BRAND.line}`, fontSize: 14.5, background: "#fff", color: BRAND.ink };
const lbl = { display: "block", fontSize: 13, fontWeight: 600, color: BRAND.sub, marginBottom: 4 };
const btn = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: BRAND.red, color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 14.5, fontWeight: 600, cursor: "pointer" };
const btnGhost = { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${BRAND.line}`, color: BRAND.ink, borderRadius: 10, padding: "9px 14px", fontSize: 13.5, fontWeight: 500, cursor: "pointer" };
const delBtn = { display: "inline-flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: BRAND.red, fontSize: 12.5, cursor: "pointer", marginTop: 6, padding: 0 };
const back = { display: "inline-flex", alignItems: "center", gap: 5, color: BRAND.sub, fontSize: 13.5, textDecoration: "none", marginTop: 20 };
const tag = { fontSize: 11, fontWeight: 600, color: BRAND.amber, background: "#FBF3E3", borderRadius: 6, padding: "1px 6px", marginLeft: 4 };
const toggle = { width: 44, height: 24, borderRadius: 999, border: "none", padding: 2, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" };
const knob = { width: 20, height: 20, borderRadius: "50%", background: "#fff", display: "block", transition: "transform .2s" };
