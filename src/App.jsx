import React, { useState, useEffect, useRef } from "react";
import {
  Lock, CheckCircle2, Play, Swords, LogOut, ChevronLeft, ChevronRight, RotateCcw, Send,
  ShieldAlert, Award, Circle, AlertTriangle, Settings, GraduationCap, PlayCircle,
} from "lucide-react";
import { SCENARIOS, FORBIDDEN_WORDS, AI_MODEL } from "./content.js";
import {
  BRAND, loadProgress, saveProgress, loadUser, saveUser, clearUser,
  getCurriculum, flatLessons, fmt, loadPreviewUnlock, allExamQuestions,
} from "./lib.js";

async function askAI({ system, messages }) {
  const res = await fetch("/api/ai", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL, max_tokens: 1000, system, messages }),
  });
  const data = await res.json();
  return data.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim() || "";
}

function ytId(url = "") {
  const m = String(url).match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function YouTubePlayer({ videoId, onTime, onMeta, onEnd }) {
  const holder = useRef(null); const player = useRef(null);
  useEffect(() => {
    let poll;
    const build = () => {
      player.current = new window.YT.Player(holder.current, {
        videoId, playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => onMeta(Math.floor(e.target.getDuration())),
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              clearInterval(poll);
              poll = setInterval(() => onTime(Math.floor(player.current.getCurrentTime()), Math.floor(player.current.getDuration())), 1000);
            } else clearInterval(poll);
            if (e.data === window.YT.PlayerState.ENDED) onEnd();
          },
        },
      });
    };
    if (window.YT && window.YT.Player) build();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev && prev(); build(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; document.body.appendChild(s);
      }
    }
    return () => { clearInterval(poll); try { player.current?.destroy(); } catch {} };
  }, [videoId]);
  return <div style={{ aspectRatio: "16/9" }}><div ref={holder} style={{ width: "100%", height: "100%" }} /></div>;
}

export default function App() {
  const [user, setUser] = useState(loadUser());
  const [progress, setProgress] = useState(() => { const u = loadUser(); return u ? loadProgress(u.empId) : {}; });
  const [screen, setScreen] = useState(loadUser() ? "dashboard" : "login");
  const [activeLesson, setActiveLesson] = useState(null);

  const curriculum = getCurriculum();
  const lessons = flatLessons();
  const total = lessons.length;
  const watchedCount = lessons.filter((l) => progress[l.id]?.watched).length;
  const allWatched = total > 0 && watchedCount === total;
  const finalPassed = !!progress.__final?.passed;
  const previewUnlock = loadPreviewUnlock();
  const unlocked = finalPassed || previewUnlock;

  const update = (lessonId, patch) => {
    const next = { ...progress, [lessonId]: { ...(progress[lessonId] || {}), ...patch } };
    setProgress(next); if (user) saveProgress(user.empId, next);
  };
  const setFinal = (passed) => {
    const next = { ...progress, __final: { passed } };
    setProgress(next); if (user) saveProgress(user.empId, next);
  };
  const login = (name, empId) => {
    const u = { name: name.trim(), empId: empId.trim() };
    setUser(u); saveUser(u); setProgress(loadProgress(u.empId)); setScreen("dashboard");
  };
  const logout = () => { clearUser(); setUser(null); setProgress({}); setScreen("login"); };

  return (
    <div style={{ background: BRAND.bg, color: BRAND.ink, minHeight: "100vh" }}>
      <style>{`
        *{font-family:'Plus Jakarta Sans','Anuphan',sans-serif;box-sizing:border-box}
        .f:focus-visible{outline:2px solid ${BRAND.red};outline-offset:2px}
        .wrap{display:flex;max-width:1200px;margin:0 auto;min-height:100vh}
        .side{width:266px;flex-shrink:0;position:sticky;top:0;align-self:flex-start;height:100vh;overflow-y:auto;padding:28px 16px;border-right:1px solid ${BRAND.line}}
        .main{flex:1;min-width:0;padding:40px 44px 90px}
        .shelf{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:4px 2px 16px}
        .shelf::-webkit-scrollbar{height:6px}
        .shelf::-webkit-scrollbar-thumb{background:${BRAND.line};border-radius:99px}
        .shelf::-webkit-scrollbar-track{background:transparent}
        .card{flex:0 0 300px;scroll-snap-align:start}
        .lc{transition:transform .18s cubic-bezier(.2,.8,.2,1),box-shadow .18s}
        .lc:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(43,43,43,.12)}
        .navitem{display:flex;align-items:center;gap:9px;width:100%;text-align:left;padding:7px 9px;border:none;background:transparent;border-radius:9px;cursor:pointer;font-size:12.5px;color:${BRAND.ink};line-height:1.3}
        .navitem:hover{background:#EFEBE4}
        .arrow{width:34px;height:34px;border-radius:50%;border:1px solid ${BRAND.line};background:${BRAND.card};cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:${BRAND.ink}}
        .arrow:hover{background:#F0EEE9}
        @media(max-width:920px){.side{display:none}.main{padding:24px 18px 80px}}
        @media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
      `}</style>

      {screen === "login" && <Login onLogin={login} />}
      {screen === "dashboard" && user && (
        <Dashboard user={user} curriculum={curriculum} progress={progress}
          watchedCount={watchedCount} total={total} allWatched={allWatched}
          finalPassed={finalPassed} unlocked={unlocked} previewUnlock={previewUnlock}
          onOpen={(l) => { setActiveLesson(l); setScreen("lesson"); }}
          onExam={() => setScreen("exam")} onRoleplay={() => setScreen("roleplay")} onLogout={logout} />
      )}
      {screen === "lesson" && activeLesson && (
        <LessonView lesson={activeLesson} st={progress[activeLesson.id] || {}}
          onBack={() => setScreen("dashboard")} onUpdate={(p) => update(activeLesson.id, p)} />
      )}
      {screen === "exam" && (
        <FinalExam allWatched={allWatched} onBack={() => setScreen("dashboard")} onPass={() => setFinal(true)} passedBefore={finalPassed} />
      )}
      {screen === "roleplay" && <Roleplay allPassed={unlocked} onBack={() => setScreen("dashboard")} />}
    </div>
  );
}

/* ---------------- LOGIN ---------------- */
function Login({ onLogin }) {
  const [name, setName] = useState(""); const [emp, setEmp] = useState("");
  const ready = name.trim() && emp.trim();
  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "72px 24px" }}>
      <div style={{ fontWeight: 800, letterSpacing: "0.18em", fontSize: 13, color: BRAND.red }}>DEAL! SALES ACADEMY</div>
      <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.15, margin: "10px 0 6px" }}>สนามซ้อม<br />ก่อนออกสนามจริง</h1>
      <p style={{ color: BRAND.sub, fontSize: 15, marginBottom: 28 }}>ดูคลิปให้ครบทุกบท → สอบใหญ่ผ่าน 100% → ปลดล็อกซ้อมกับลูกค้าจำลอง แล้วถึงพร้อมปิดการขายจริง</p>
      <div style={{ background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 16, padding: 22 }}>
        <label style={lbl}>ชื่อ–สกุล</label>
        <input className="f" style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น มิว สมใจ" />
        <label style={lbl}>รหัสพนักงาน</label>
        <input className="f" style={inp} value={emp} onChange={(e) => setEmp(e.target.value)} placeholder="เช่น DEAL-041" />
        <button className="f" onClick={() => ready && onLogin(name, emp)} disabled={!ready}
          style={{ ...btnP, width: "100%", marginTop: 8, opacity: ready ? 1 : 0.45, cursor: ready ? "pointer" : "not-allowed" }}>เข้าสู่การอบรม</button>
      </div>
      <a href="#admin" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: BRAND.sub, fontSize: 12.5, textDecoration: "none", marginTop: 14 }}>
        <Settings size={13} /> หลังบ้านผู้ดูแล
      </a>
    </div>
  );
}

/* ---------------- DASHBOARD (sidebar + shelves) ---------------- */
const Dot = ({ on }) => <span style={{ width: 8, height: 8, borderRadius: "50%", background: on ? BRAND.green : BRAND.line, flexShrink: 0 }} />;

function Sidebar({ user, curriculum, progress, watchedCount, total, allWatched, finalPassed, unlocked, onOpen, onExam, onRoleplay, onLogout }) {
  const pct = Math.round((watchedCount / total) * 100);
  return (
    <aside className="side">
      <div style={{ fontWeight: 800, letterSpacing: "0.14em", fontSize: 11, color: BRAND.red }}>DEAL! SALES ACADEMY</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{user.name}</div>
      <div style={{ fontSize: 12, color: BRAND.sub, marginBottom: 16 }}>รหัส {user.empId}</div>

      <div style={{ fontSize: 12, color: BRAND.sub, marginBottom: 6 }}>ดูแล้ว {watchedCount}/{total} บท{finalPassed ? " · สอบผ่าน ✓" : ""}</div>
      <div style={{ height: 7, background: BRAND.line, borderRadius: 999, marginBottom: 20 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: allWatched ? BRAND.green : BRAND.red, borderRadius: 999, transition: "width .4s" }} />
      </div>

      {curriculum.map((m) => (
        <div key={m.module} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: BRAND.sub, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, padding: "0 9px" }}>{m.module}</div>
          {m.lessons.map((l) => (
            <button key={l.id} className="navitem f" onClick={() => onOpen(l)}>
              <Dot on={!!progress[l.id]?.watched} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</span>
            </button>
          ))}
        </div>
      ))}

      <div style={{ borderTop: `1px solid ${BRAND.line}`, margin: "10px 0", paddingTop: 10 }}>
        <button className="navitem f" onClick={() => allWatched && onExam()} style={{ opacity: allWatched ? 1 : 0.5 }}>
          {finalPassed ? <CheckCircle2 size={13} color={BRAND.green} /> : <GraduationCap size={13} color={allWatched ? BRAND.red : BRAND.sub} />}
          <span>ข้อสอบใหญ่</span>
        </button>
        <button className="navitem f" onClick={() => unlocked && onRoleplay()} style={{ opacity: unlocked ? 1 : 0.5 }}>
          {unlocked ? <Swords size={13} color={BRAND.green} /> : <Lock size={13} color={BRAND.sub} />}
          <span>สนามซ้อม AI</span>
        </button>
      </div>
      <button className="navitem f" onClick={onLogout} style={{ color: BRAND.sub }}><LogOut size={13} /> ออกจากระบบ</button>
    </aside>
  );
}

function ModuleRow({ mod, progress, onOpen }) {
  const ref = useRef(null);
  const scroll = (d) => ref.current?.scrollBy({ left: d * 336, behavior: "smooth" });
  return (
    <section style={{ marginBottom: 38 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{mod.module}</h3>
        {mod.lessons.length > 2 && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="arrow f" onClick={() => scroll(-1)} aria-label="เลื่อนซ้าย"><ChevronLeft size={18} /></button>
            <button className="arrow f" onClick={() => scroll(1)} aria-label="เลื่อนขวา"><ChevronRight size={18} /></button>
          </div>
        )}
      </div>
      <div className="shelf" ref={ref}>
        {mod.lessons.map((l, i) => (
          <div className="card" key={l.id}>
            <LessonCard lesson={l} idx={i + 1} watched={!!progress[l.id]?.watched} onOpen={() => onOpen(l)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function LessonCard({ lesson, idx, watched, onOpen }) {
  return (
    <button className="f lc" onClick={onOpen}
      style={{ display: "block", textAlign: "left", padding: 0, background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 18, overflow: "hidden", cursor: "pointer", width: "100%" }}>
      <div style={{ position: "relative", aspectRatio: "16/9", background: "linear-gradient(135deg,#2B2B2B,#4a3a3a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {lesson.thumbnail
          ? <img src={lesson.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <PlayCircle size={44} color="rgba(255,255,255,.85)" />}
        {watched
          ? <div style={{ position: "absolute", top: 10, right: 10, background: BRAND.green, color: "#fff", borderRadius: 999, padding: "3px 10px", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> ดูแล้ว</div>
          : <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.55)", color: "#fff", borderRadius: 8, padding: "2px 9px", fontSize: 11.5, fontWeight: 700 }}>บทที่ {idx}</div>}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4, marginBottom: 8, minHeight: 42 }}>{lesson.title}</div>
        <div style={{ fontSize: 12.5, color: watched ? BRAND.green : BRAND.sub, display: "flex", alignItems: "center", gap: 5 }}>
          {watched ? "เรียนจบแล้ว" : <><Play size={12} /> ยังไม่ได้ดู</>}
        </div>
      </div>
    </button>
  );
}

function Dashboard(props) {
  const { curriculum, progress, watchedCount, total, allWatched, finalPassed, unlocked, previewUnlock, onOpen, onExam, onRoleplay } = props;
  return (
    <div className="wrap">
      <Sidebar {...props} />
      <main className="main">
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }}>การอบรมของคุณ</h1>
        <p style={{ color: BRAND.sub, fontSize: 15, margin: "0 0 32px" }}>ดูคลิปให้ครบทุกบท แล้วสอบใหญ่ให้ผ่านเพื่อปลดสนามซ้อม</p>

        {curriculum.map((mod) => <ModuleRow key={mod.module} mod={mod} progress={progress} onOpen={onOpen} />)}

        <section style={{ marginTop: 6, marginBottom: 20, maxWidth: 640 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>ก่อนออกสนาม · ข้อสอบใหญ่</div>
          <div style={{ background: allWatched ? BRAND.card : "#EFEBE4", border: `1px solid ${finalPassed ? BRAND.green : BRAND.line}`, borderRadius: 18, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              {finalPassed ? <CheckCircle2 size={22} color={BRAND.green} /> : allWatched ? <GraduationCap size={22} color={BRAND.red} /> : <Lock size={22} color={BRAND.sub} />}
              <div style={{ fontWeight: 700, fontSize: 17 }}>ข้อสอบใหญ่ (รวมทุกบท)</div>
            </div>
            <p style={{ fontSize: 14, color: BRAND.sub, margin: "0 0 16px" }}>
              {finalPassed ? "ผ่านแล้ว ✓ ปลดล็อกสนามซ้อมด้านล่างแล้ว"
                : allWatched ? "รวมคำถามจากทุกบท ต้องตอบถูก 100% ถึงจะผ่านและปลดสนามซ้อม"
                  : `ต้องดูคลิปให้ครบทุกบทก่อน — ตอนนี้ดูแล้ว ${watchedCount}/${total} บท`}
            </p>
            <button className="f" onClick={() => allWatched && onExam()} disabled={!allWatched}
              style={{ ...btnP, background: finalPassed ? BRAND.green : allWatched ? BRAND.red : "#B9B3AA", cursor: allWatched ? "pointer" : "not-allowed" }}>
              {finalPassed ? "ทำข้อสอบอีกครั้ง" : allWatched ? "เริ่มทำข้อสอบใหญ่" : "ยังล็อกอยู่"}
            </button>
          </div>
        </section>

        <section style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>ด่านสุดท้าย · สนามซ้อมกับลูกค้าจริง</div>
          <div style={{ background: unlocked ? BRAND.card : "#EFEBE4", border: `1px solid ${unlocked ? BRAND.green : BRAND.line}`, borderRadius: 18, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              {unlocked ? <Swords size={22} color={BRAND.green} /> : <Lock size={22} color={BRAND.sub} />}
              <div style={{ fontWeight: 700, fontSize: 17 }}>สนามซ้อม AI — รับมือลูกค้าก่อนของจริง</div>
            </div>
            {previewUnlock && !finalPassed && (
              <div style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: BRAND.amber, background: "#FBF3E3", border: `1px solid ${BRAND.amber}`, borderRadius: 8, padding: "3px 8px", marginBottom: 10 }}>
                โหมดทดสอบ (ปลดล็อกชั่วคราวสำหรับผู้ดูแล)
              </div>
            )}
            <p style={{ fontSize: 14, color: BRAND.sub, margin: "0 0 16px" }}>
              {unlocked ? "ซ้อมคุยกับลูกค้าจำลอง ระบบจับคำต้องห้ามสดๆ และประเมินผลตอนจบ" : "ต้องสอบใหญ่ผ่าน 100% ก่อนถึงจะปลดล็อก"}
            </p>
            <button className="f" onClick={() => unlocked && onRoleplay()} disabled={!unlocked}
              style={{ ...btnP, background: unlocked ? BRAND.green : "#B9B3AA", cursor: unlocked ? "pointer" : "not-allowed" }}>
              {unlocked ? "เข้าสนามซ้อม" : "ยังล็อกอยู่"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------------- LESSON ---------------- */
function LessonView({ lesson, st, onBack, onUpdate }) {
  const vidRef = useRef(null);
  const [watchedSec, setWatchedSec] = useState(st.watchedSec || 0);
  const [duration, setDuration] = useState(st.duration || 0);
  const yt = ytId(lesson.videoUrl);
  const done = st.watched || (duration > 0 && watchedSec >= duration * 0.9);

  const handleTime = (sec, dur) => {
    const w = Math.max(watchedSec, Math.floor(sec || 0));
    setWatchedSec(w); if (dur) setDuration(Math.floor(dur));
    const d = Math.floor(dur || duration);
    const finished = d > 0 && w >= d * 0.9;
    if (w % 3 === 0 || finished) onUpdate({ watchedSec: w, duration: d, watched: st.watched || finished });
  };
  const onVideoTime = () => { const v = vidRef.current; if (v) handleTime(v.currentTime, v.duration); };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 20px 80px" }}>
      <button className="f" onClick={onBack} style={btnG}><ChevronLeft size={16} /> กลับหน้าหลัก</button>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: "16px 0 12px" }}>{lesson.title}</h2>
      <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${BRAND.line}`, background: "#000" }}>
        {yt ? (
          <YouTubePlayer videoId={yt} onTime={(t, d) => handleTime(t, d)} onMeta={(d) => setDuration(d)} onEnd={() => onUpdate({ watched: true, watchedSec, duration })} />
        ) : (
          <video ref={vidRef} src={lesson.videoUrl} controls onTimeUpdate={onVideoTime}
            onLoadedMetadata={() => setDuration(Math.floor(vidRef.current?.duration || 0))}
            onEnded={() => onUpdate({ watched: true, watchedSec, duration })}
            style={{ width: "100%", display: "block", aspectRatio: "16/9" }} />
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: BRAND.sub, margin: "10px 2px 16px" }}>
        <span>ดูไปแล้ว {fmt(watchedSec)}{duration ? ` / ${fmt(duration)}` : ""}</span>
        {done && <span style={{ color: BRAND.green, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={15} /> ดูจบแล้ว</span>}
      </div>
      <button className="f" onClick={onBack} style={{ ...btnP, width: "100%", background: done ? BRAND.green : BRAND.red }}>
        {done ? "เรียบร้อย กลับไปเรียนบทอื่น" : "กลับหน้าหลัก (ยังดูไม่ครบ)"}
      </button>
    </div>
  );
}

/* ---------------- FINAL EXAM ---------------- */
function FinalExam({ allWatched, onBack, onPass, passedBefore }) {
  const questions = allExamQuestions();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const total = questions.length;
  const correct = questions.filter((q, i) => answers[i] === q.correct).length;
  const perfect = submitted && correct === total;
  const submit = () => { setSubmitted(true); if (questions.every((q, i) => answers[i] === q.correct)) onPass(); };
  const retry = () => { setAnswers({}); setSubmitted(false); window.scrollTo(0, 0); };

  if (!allWatched) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
        <button className="f" onClick={onBack} style={btnG}><ChevronLeft size={16} /> กลับ</button>
        <p style={{ marginTop: 20, color: BRAND.sub }}>ต้องดูคลิปให้ครบทุกบทก่อนถึงจะทำข้อสอบใหญ่ได้</p>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 80px" }}>
      <button className="f" onClick={onBack} style={btnG}><ChevronLeft size={16} /> กลับหน้าหลัก</button>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: "16px 0 4px" }}>ข้อสอบใหญ่</h2>
      <p style={{ fontSize: 13.5, color: BRAND.sub, marginBottom: 18 }}>รวม {total} ข้อจากทุกบท · ตอบถูก <b>ทุกข้อ (100%)</b> เท่านั้นถึงจะผ่านและปลดสนามซ้อม{passedBefore ? " · เคยผ่านแล้ว" : ""}</p>
      {questions.map((q, i) => (
        <div key={i} style={{ background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, color: BRAND.sub, marginBottom: 4 }}>{q.from}</div>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>{i + 1}. {q.q}</div>
          {q.choices.map((c, ci) => {
            const chosen = answers[i] === ci;
            const showC = submitted && ci === q.correct;
            const showW = submitted && chosen && ci !== q.correct;
            return (
              <button key={ci} className="f" onClick={() => !submitted && setAnswers({ ...answers, [i]: ci })}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 6, borderRadius: 10, fontSize: 14.5,
                  border: `1px solid ${showC ? BRAND.green : showW ? BRAND.red : chosen ? BRAND.ink : BRAND.line}`,
                  background: showC ? "#EAF3EE" : showW ? "#F7EAEA" : chosen ? "#F0EEE9" : "#fff", cursor: submitted ? "default" : "pointer", color: BRAND.ink }}>
                {showC ? <CheckCircle2 size={16} color={BRAND.green} /> : <Circle size={16} color={chosen ? BRAND.ink : BRAND.line} />}
                {c}
              </button>
            );
          })}
        </div>
      ))}
      {!submitted && (
        <button className="f" onClick={submit} disabled={Object.keys(answers).length < total}
          style={{ ...btnP, width: "100%", opacity: Object.keys(answers).length < total ? 0.45 : 1 }}>ส่งคำตอบ</button>
      )}
      {submitted && !perfect && (
        <div style={{ textAlign: "center" }}>
          <div style={{ color: BRAND.red, fontWeight: 600, margin: "6px 0 12px" }}>ได้ {correct}/{total} — ยังไม่ผ่าน ต้อง 100%</div>
          <button className="f" onClick={retry} style={{ ...btnP, width: "100%" }}><RotateCcw size={16} /> ทำใหม่ทั้งชุด</button>
        </div>
      )}
      {perfect && (
        <div style={{ textAlign: "center", background: "#EAF3EE", border: `1px solid ${BRAND.green}`, borderRadius: 14, padding: 24 }}>
          <Award size={34} color={BRAND.green} />
          <div style={{ fontWeight: 700, fontSize: 18, margin: "8px 0 4px" }}>ผ่าน 100% 🎉 ปลดสนามซ้อมแล้ว</div>
          <button className="f" onClick={onBack} style={{ ...btnP, marginTop: 10 }}>ไปเข้าสนามซ้อม</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- ROLE-PLAY ---------------- */
function Roleplay({ allPassed, onBack }) {
  const [scenario, setScenario] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState([]);
  const [grade, setGrade] = useState(null);
  const [grading, setGrading] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [msgs, loading]);
  if (!allPassed) return null;

  const start = (sc) => { setScenario(sc); setMsgs([]); setViolations([]); setGrade(null); customerTurn(sc, []); };
  const customerTurn = async (sc, history) => {
    setLoading(true);
    const system = `คุณกำลังสวมบทเป็น "ลูกค้าคนไทย" ที่คุยกับพนักงานขายของ DEAL! (ธุรกิจให้คนเป็นเจ้าของร่วมในตู้หยอดเหรียญ เช่น ตู้ชกมวย).
สถานการณ์: ${sc.brief}
กติกา: พูดเหมือนแชท Facebook สั้นๆ ทีละ 1-2 ประโยค · ท้าทายตามสมจริง อย่าเชื่อหรือปิดดีลง่ายๆ · ถ้าพนักงานตอบดีมีหลักฐานค่อยอ่อนลง · อยู่ในบทเสมอ ห้ามหลุดบท ห้ามเฉลยว่าเป็น AI · ตอบภาษาไทยเท่านั้น`;
    const apiMsgs = history.length === 0
      ? [{ role: "user", content: "เริ่มบทสนทนา ทักพนักงานขายมาสั้นๆ ตามสถานการณ์" }]
      : history.map((m) => ({ role: m.role === "customer" ? "assistant" : "user", content: m.text }));
    try {
      const text = await askAI({ system, messages: apiMsgs });
      setMsgs((m) => [...m, { role: "customer", text: text || "…" }]);
    } catch {
      setMsgs((m) => [...m, { role: "customer", text: "(เชื่อมต่อ AI ไม่ได้ — ตรวจว่าตั้ง ANTHROPIC_API_KEY ใน Cloudflare แล้ว)" }]);
    } finally { setLoading(false); }
  };
  const send = () => {
    const text = input.trim(); if (!text || loading) return;
    const hit = FORBIDDEN_WORDS.filter((w) => text.toLowerCase().includes(w.toLowerCase()));
    if (hit.length) setViolations((v) => [...new Set([...v, ...hit])]);
    const next = [...msgs, { role: "sale", text, flagged: hit }];
    setMsgs(next); setInput(""); customerTurn(scenario, next);
  };
  const gradeSession = async () => {
    setGrading(true);
    const transcript = msgs.map((m) => `${m.role === "customer" ? "ลูกค้า" : "เซล"}: ${m.text}`).join("\n");
    const system = `คุณเป็นหัวหน้าทีมขายที่เข้มงวดของ DEAL! ประเมินการซ้อมจาก transcript
เกณฑ์: (1) รับมือ objection ได้ไหม (2) แนบความเสี่ยง/ไม่การันตีผลตอบแทน (3) ไม่ใช้คำต้องห้าม [ลงทุน/นักลงทุน/ปันผล/passive income] (4) ปิดด้วย next action ชัดเจน
ตอบเป็น JSON ล้วน ไม่มี markdown: {"score":<0-100>,"passed":<true ถ้า>=80>,"feedback":["<ไทยสั้นๆ>","...","..."]}`;
    try {
      let t = await askAI({ system, messages: [{ role: "user", content: transcript }] });
      t = t.replace(/```json|```/g, "").trim();
      const g = JSON.parse(t);
      if (violations.length) { g.passed = false; g.score = Math.min(g.score, 50); }
      setGrade(g);
    } catch { setGrade({ score: 0, passed: false, feedback: ["ประเมินไม่สำเร็จ ลองใหม่อีกครั้ง"] }); }
    finally { setGrading(false); }
  };

  if (!scenario) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 80px" }}>
        <button className="f" onClick={onBack} style={btnG}><ChevronLeft size={16} /> กลับ</button>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "16px 0 6px" }}>เลือกสถานการณ์ลูกค้า</h2>
        <p style={{ color: BRAND.sub, fontSize: 14, marginBottom: 20 }}>ลูกค้าจำลองโต้ตอบเหมือนจริง ระบบจับคำต้องห้ามสดๆ และให้หัวหน้า AI ประเมินตอนจบ</p>
        {SCENARIOS.map((sc) => (
          <button key={sc.id} className="f" onClick={() => start(sc)} style={{ ...row, cursor: "pointer" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{sc.label}</div>
              <div style={{ fontSize: 13, color: BRAND.sub }}>{sc.brief}</div>
            </div>
            <Swords size={18} color={BRAND.red} />
          </button>
        ))}
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button className="f" onClick={() => setScenario(null)} style={btnG}><ChevronLeft size={16} /> เปลี่ยนสถานการณ์</button>
        <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.red }}>{scenario.label}</div>
      </div>
      {violations.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F7EAEA", border: `1px solid ${BRAND.red}`, color: BRAND.red, borderRadius: 10, padding: "8px 12px", fontSize: 13, marginBottom: 8 }}>
          <ShieldAlert size={16} /> ใช้คำต้องห้าม: {violations.join(", ")} — ห้ามพูดกับลูกค้าจริง
        </div>
      )}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 14, padding: 14 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "sale" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{ maxWidth: "78%", padding: "9px 13px", borderRadius: 14, fontSize: 14.5, lineHeight: 1.5,
              background: m.role === "sale" ? (m.flagged?.length ? "#F7EAEA" : BRAND.ink) : "#F0EEE9",
              color: m.role === "sale" ? (m.flagged?.length ? BRAND.red : "#fff") : BRAND.ink,
              border: m.flagged?.length ? `1px solid ${BRAND.red}` : "none" }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 13, color: BRAND.sub }}>ลูกค้ากำลังพิมพ์…</div>}
      </div>
      {grade && (
        <div style={{ background: grade.passed ? "#EAF3EE" : "#F7EAEA", border: `1px solid ${grade.passed ? BRAND.green : BRAND.red}`, borderRadius: 14, padding: 16, margin: "10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            {grade.passed ? <Award size={18} color={BRAND.green} /> : <AlertTriangle size={18} color={BRAND.red} />}
            คะแนน {grade.score}/100 — {grade.passed ? "ผ่าน พร้อมออกสนามจริง" : "ยังไม่ผ่าน ซ้อมอีกรอบ"}
          </div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13.5 }}>{grade.feedback?.map((f, i) => <li key={i} style={{ marginBottom: 3 }}>{f}</li>)}</ul>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input className="f" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="พิมพ์ตอบลูกค้า…" style={{ ...inp, margin: 0, flex: 1 }} />
        <button className="f" onClick={send} disabled={loading} style={{ ...btnP, padding: "0 16px" }}><Send size={16} /></button>
      </div>
      {msgs.length >= 4 && !grade && (
        <button className="f" onClick={gradeSession} disabled={grading} style={{ ...btnG, justifyContent: "center", marginTop: 8 }}>
          {grading ? "กำลังประเมิน…" : "จบการซ้อม & ให้หัวหน้า AI ประเมินผล"}
        </button>
      )}
    </div>
  );
}

const inp = { width: "100%", boxSizing: "border-box", padding: "11px 13px", margin: "6px 0 16px", borderRadius: 10, border: `1px solid ${BRAND.line}`, fontSize: 15, background: "#fff", color: BRAND.ink };
const lbl = { fontSize: 13, fontWeight: 600, color: BRAND.sub };
const btnP = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: BRAND.red, color: "#fff", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 15, fontWeight: 600, cursor: "pointer" };
const btnG = { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${BRAND.line}`, color: BRAND.ink, borderRadius: 10, padding: "8px 12px", fontSize: 13.5, fontWeight: 500, cursor: "pointer" };
const row = { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 12, padding: "14px 16px", marginBottom: 8 };
