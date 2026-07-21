import React, { useState, useEffect, useRef } from "react";
import {
  Lock, CheckCircle2, Play, Swords, LogOut, ChevronLeft, ChevronRight, RotateCcw, Send,
  ShieldAlert, Award, Circle, AlertTriangle, Settings, GraduationCap, PlayCircle,
  Clock, XCircle, User, Handshake, Check,
} from "lucide-react";
import { SCENARIOS, FORBIDDEN_WORDS, AI_MODEL, BUSINESS_CONTEXT } from "./content.js";
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
        .nav2{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:8px 9px;border:none;background:transparent;border-radius:10px;cursor:pointer;line-height:1.3}
        .nav2:hover{background:#EFEBE4}
        .arrow{width:34px;height:34px;border-radius:50%;border:1px solid ${BRAND.line};background:${BRAND.card};cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:${BRAND.ink}}
        .arrow:hover{background:#F0EEE9}
        .typing{display:inline-flex;gap:4px;align-items:center;padding:11px 15px}
        .typing i{width:7px;height:7px;border-radius:50%;background:#B9B3AA;display:block;animation:tb 1.1s infinite}
        .typing i:nth-child(2){animation-delay:.18s}
        .typing i:nth-child(3){animation-delay:.36s}
        @keyframes tb{0%,60%,100%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}
        .bin{animation:bin .28s cubic-bezier(.2,.8,.2,1)}
        @keyframes bin{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
        .rp-msgs::-webkit-scrollbar{width:6px}
        .rp-msgs::-webkit-scrollbar-thumb{background:${BRAND.line};border-radius:99px}
        .pcard{transition:transform .15s,box-shadow .15s}
        .pcard:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(43,43,43,.10)}
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
const badgeIcon = (bg) => ({ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: bg });

function Sidebar({ user, curriculum, progress, watchedCount, total, allWatched, finalPassed, unlocked, onOpen, onExam, onRoleplay, onLogout }) {
  const pct = Math.round((watchedCount / total) * 100);
  return (
    <aside className="side">
      <div style={{ fontWeight: 800, letterSpacing: "0.14em", fontSize: 11, color: BRAND.red }}>DEAL! SALES ACADEMY</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{user.name}</div>
      <div style={{ fontSize: 12, color: BRAND.sub, marginBottom: 16 }}>รหัส {user.empId}</div>

      <div style={{ fontSize: 12, color: BRAND.sub, marginBottom: 6 }}>ดูแล้ว {watchedCount}/{total} บท{finalPassed ? " · สอบผ่าน ✓" : ""}</div>
      <div style={{ height: 7, background: BRAND.line, borderRadius: 999, marginBottom: 18 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: allWatched ? BRAND.green : BRAND.red, borderRadius: 999, transition: "width .4s" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {curriculum.flatMap((m) => m.lessons).map((l, i) => {
          const done = !!progress[l.id]?.watched;
          return (
            <button key={l.id} className="nav2 f" onClick={() => onOpen(l)}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 700, background: done ? BRAND.green : "#EDE9E2", color: done ? "#fff" : BRAND.sub }}>
                {done ? <Check size={13} /> : i + 1}
              </span>
              <span style={{ fontSize: 13, fontWeight: done ? 600 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: done ? BRAND.ink : BRAND.sub }}>{l.title}</span>
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${BRAND.line}`, margin: "14px 0 4px", paddingTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
        <button className="nav2 f" onClick={onExam}>
          <span style={badgeIcon(finalPassed ? BRAND.green : "#EDE9E2")}>{finalPassed ? <Check size={13} color="#fff" /> : <GraduationCap size={13} color={BRAND.red} />}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>ข้อสอบใหญ่</span>
        </button>
        <button className="nav2 f" onClick={() => unlocked && onRoleplay()} style={{ opacity: unlocked ? 1 : 0.5 }}>
          <span style={badgeIcon(unlocked ? BRAND.green : "#EDE9E2")}>{unlocked ? <Swords size={13} color="#fff" /> : <Lock size={13} color={BRAND.sub} />}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>สนามซ้อม AI</span>
        </button>
        <button className="nav2 f" onClick={onLogout}>
          <span style={badgeIcon("#EDE9E2")}><LogOut size={13} color={BRAND.sub} /></span>
          <span style={{ fontSize: 13, color: BRAND.sub }}>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}

function AllLessonsRow({ curriculum, progress, onOpen }) {
  const ref = useRef(null);
  const scroll = (d) => ref.current?.scrollBy({ left: d * 336, behavior: "smooth" });
  const lessons = curriculum.flatMap((m) => m.lessons.map((l) => ({ ...l, __module: m.module })));
  return (
    <section style={{ marginBottom: 38 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>บทเรียนทั้งหมด · {lessons.length} บท</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="arrow f" onClick={() => scroll(-1)} aria-label="เลื่อนซ้าย"><ChevronLeft size={18} /></button>
          <button className="arrow f" onClick={() => scroll(1)} aria-label="เลื่อนขวา"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="shelf" ref={ref}>
        {lessons.map((l, i) => (
          <div className="card" key={l.id}>
            <LessonCard lesson={l} idx={i + 1} moduleName={l.__module} watched={!!progress[l.id]?.watched} onOpen={() => onOpen(l)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function LessonCard({ lesson, idx, moduleName, watched, onOpen }) {
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
        {moduleName && <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.sub, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{moduleName}</div>}
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

        <AllLessonsRow curriculum={curriculum} progress={progress} onOpen={onOpen} />

        <section style={{ marginTop: 6, marginBottom: 20, maxWidth: 640 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>ก่อนออกสนาม · ข้อสอบใหญ่</div>
          <div style={{ background: BRAND.card, border: `1px solid ${finalPassed ? BRAND.green : BRAND.line}`, borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(43,43,43,.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              {finalPassed ? <CheckCircle2 size={22} color={BRAND.green} /> : <GraduationCap size={22} color={BRAND.red} />}
              <div style={{ fontWeight: 700, fontSize: 17 }}>ข้อสอบใหญ่ (รวมทุกบท)</div>
            </div>
            <p style={{ fontSize: 14, color: BRAND.sub, margin: "0 0 16px" }}>
              {finalPassed ? "ผ่านแล้ว ✓ ปลดล็อกสนามซ้อมด้านล่างแล้ว" : "รวมคำถามจากทุกบท ตอบถูก 100% เพื่อปลดสนามซ้อม"}
            </p>
            <button className="f" onClick={onExam} style={{ ...btnP, background: finalPassed ? BRAND.green : BRAND.red }}>
              {finalPassed ? "ทำข้อสอบอีกครั้ง" : "เริ่มทำข้อสอบใหญ่"}
            </button>
          </div>
        </section>

        <section style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>ด่านสุดท้าย · สนามซ้อมกับลูกค้าจริง</div>
          <div style={{ background: unlocked ? BRAND.card : "#EFEBE4", border: `1px solid ${unlocked ? BRAND.green : BRAND.line}`, borderRadius: 20, padding: 24, boxShadow: unlocked ? "0 4px 20px rgba(43,43,43,.05)" : "none" }}>
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

/* ---------------- ROLE-PLAY (เลือกลูกค้าในห้องแชท) ---------------- */
const MOODS = [
  "อารมณ์ดี เปิดใจฟัง แต่ยังอยากได้เหตุผลชัดๆ ก่อนเชื่อ",
  "ระแวงหนัก เพิ่งเห็นข่าวคนโดนหลอกลงทุน จับผิดทุกอย่าง",
  "รีบมาก มีเวลาน้อย ถ้าเซลเยิ่นเย้อหรือตอบไม่ตรงจะหมดอารมณ์",
  "กำลังเทียบกับอีกเจ้าอยู่ ชอบยกเจ้าอื่นมาเปรียบเทียบ",
  "มีเงินพร้อมจ่าย แต่กลัวตัดสินใจผิดเลยลังเลไปมา",
  "เคยลงอะไรแล้วเจ๊งมาก่อน เลยกลัวเสียเงินเป็นพิเศษ",
  "อารมณ์กลางๆ ฟังไปเรื่อยๆ แต่ต้องโดนใจจริงถึงจะยอมเอา",
];

function Roleplay({ allPassed, onBack }) {
  const [scenario, setScenario] = useState(null);
  const [mood, setMood] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState([]);
  const [decision, setDecision] = useState(null);
  const [grade, setGrade] = useState(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [msgs, loading, decision, grade]);
  if (!allPassed) return null;

  const saleTurns = msgs.filter((m) => m.role === "sale").length;
  const decided = !!decision;

  const custSystem = (sc, m) => `คุณสวมบทเป็น "ลูกค้าคนไทย" ที่แชทกับพนักงานขายของ DEAL! (เป็นเจ้าของร่วม % ในตู้หยอดเหรียญ บริษัทบริหารให้ รับส่วนแบ่งกำไรรายเดือน)
บทที่คุณเล่น: ${sc.persona}
อารมณ์วันนี้ (สำคัญ ให้มีผลต่อวิธีตอบจริงๆ): ${m}
${BUSINESS_CONTEXT}
คุณมีสภาวะในใจที่เปลี่ยนได้ตลอดบทสนทนา: ความสนใจ · ความเชื่อใจ · ความกังวลที่ยังไม่ถูกแก้
ประเมินคำตอบพนักงานเงียบๆ ทุกครั้ง แล้วปรับท่าที:
- ตอบตรง มีหลักฐาน จริงใจ แนบความเสี่ยงตามตรง → เชื่อใจ/สนใจเพิ่ม ค่อยๆ อ่อนลง ถามลึกขึ้น
- เลี่ยงคำถาม/มั่วตัวเลข/กดดัน/พูดโอเวอร์/การันตีเว่อร์ → กังวลขึ้น เริ่มเย็นชาหรือกดดันกลับ
- ใช้คำต้องห้าม หรือทำให้รู้สึกเหมือนโดนหลอก → เสียความเชื่อใจหนัก
กติกา: พูดสั้นเหมือนแชท LINE 1-2 ประโยค ใช้คำลูกค้าจริง ("อ่อครับๆ" "เท่าไหร่ครับ" "ขอดูก่อน") อย่าปิดดีลง่ายๆ ต้องให้เซลทำงานจนคุณมั่นใจจริง อยู่ในบทเสมอ ห้ามบอกว่าเป็น AI ตอบภาษาไทยเท่านั้น`;

  const customerTurn = async (history, sc, m) => {
    setLoading(true);
    const apiMsgs = history.length === 0
      ? [{ role: "user", content: `เริ่มบทสนทนา ทักพนักงานขายมาสั้นๆ ตามบทและอารมณ์${sc.opening ? ` แนวๆ "${sc.opening}"` : ""}` }]
      : history.map((x) => ({ role: x.role === "customer" ? "assistant" : "user", content: x.text }));
    try {
      const text = await askAI({ system: custSystem(sc, m), messages: apiMsgs });
      setMsgs((prev) => [...prev, { role: "customer", text: text || "…" }]);
    } catch {
      setMsgs((prev) => [...prev, { role: "customer", text: "(เชื่อมต่อ AI ไม่ได้ — ตรวจว่าตั้ง ANTHROPIC_API_KEY ใน Cloudflare แล้ว)" }]);
    } finally { setLoading(false); }
  };

  const start = (sc) => {
    const m = MOODS[Math.floor(Math.random() * MOODS.length)];
    setScenario(sc); setMood(m); setMsgs([]); setViolations([]); setDecision(null); setGrade(null);
    customerTurn([], sc, m);
  };
  const changeCustomer = () => { setScenario(null); setMsgs([]); setViolations([]); setDecision(null); setGrade(null); setInput(""); };

  const send = () => {
    const text = input.trim(); if (!text || loading || busy) return;
    const hit = FORBIDDEN_WORDS.filter((w) => text.toLowerCase().includes(w.toLowerCase()));
    if (hit.length) setViolations((v) => [...new Set([...v, ...hit])]);
    const next = [...msgs, { role: "sale", text, flagged: hit }];
    setMsgs(next); setInput(""); customerTurn(next, scenario, mood);
  };

  const decide = async () => {
    if (busy || loading) return;
    setBusy(true);
    const transcript = msgs.map((m) => `${m.role === "customer" ? "ลูกค้า" : "เซล"}: ${m.text}`).join("\n");
    const sys = `${custSystem(scenario, mood)}

ตอนนี้บทสนทนากำลังจะจบ (พนักงานลองปิดการขายหรือหมดมุกแล้ว) ให้คุณตัดสินใจขั้นสุดท้ายตาม logic จากทั้งบทสนทนาอย่างซื่อตรง — อย่าลำเอียงให้ผ่านหรือไม่ผ่าน ตัดสินตามที่เกิดขึ้นจริง:
- ถ้า concern สำคัญถูกแก้ + เชื่อใจพอ + ไม่โดนกดดันจนอึดอัด → "buy"
- ถ้ายังมี concern ค้าง หรืออยากได้ข้อมูล/เวลาเพิ่มก่อนตัดสินใจ → "think"
- ถ้า concern สำคัญไม่ถูกแก้ / เสียความเชื่อใจ / เจอคำต้องห้าม / โดนกดดันเกินไป → "reject"
ตอบเป็น JSON ล้วนไม่มี markdown: {"decision":"buy|think|reject","customerLine":"<ประโยคปิดท้ายที่ลูกค้าพูด in-character ไทย>","reason":"<เหตุผลจริงในใจว่าทำไมตัดสินใจแบบนี้ ไทย 1-2 ประโยค>","unresolved":["<เรื่องที่ยังค้างใจ ถ้ามี>"]}`;
    try {
      let t = await askAI({ system: sys, messages: [{ role: "user", content: transcript || "(ยังไม่ได้คุยอะไรเป็นชิ้นเป็นอัน)" }] });
      t = t.replace(/```json|```/g, "").trim();
      const d = JSON.parse(t);
      if (d.customerLine) setMsgs((prev) => [...prev, { role: "customer", text: d.customerLine }]);
      setDecision(d);
    } catch {
      setDecision({ decision: "think", reason: "ประมวลผลไม่สำเร็จ ลองใหม่อีกครั้ง", unresolved: [] });
    } finally { setBusy(false); }
  };

  const gradeSession = async () => {
    if (busy) return;
    setBusy(true);
    const transcript = msgs.map((m) => `${m.role === "customer" ? "ลูกค้า" : "เซล"}: ${m.text}`).join("\n");
    const outcome = decision ? `\n\nผลลัพธ์จริง: ลูกค้า${decision.decision === "buy" ? "ตัดสินใจซื้อ" : decision.decision === "think" ? "ขอคิดดูก่อน (ยังไม่ปิด)" : "ไม่ซื้อ"} — เหตุผล: ${decision.reason}` : "";
    const system = `คุณเป็นหัวหน้าทีมขายที่เข้มงวดของ DEAL! ประเมินการซ้อมของพนักงานจาก transcript และผลลัพธ์การตัดสินใจของลูกค้า
${BUSINESS_CONTEXT}
เกณฑ์ให้คะแนน:
(1) รับมือ objection ได้ไหม โดยเฉพาะ ค่าใช้จ่ายหัก / รายได้-ขอหลักฐาน / โลเคชั่น
(2) แนบความเสี่ยง ไม่การันตีผลตอบแทน
(3) ไม่ใช้คำต้องห้าม [ลงทุน/นักลงทุน/ผู้ลงทุน/หารลงทุน/ปันผล/เงินปันผล/passive income] — ใช้แม้คำเดียว = passed=false
(4) ไม่มั่วข้อมูลที่ยังไม่ยืนยัน ต้องบอกว่าจะเช็คให้
(5) qualify ก่อนเสนอราคา / ปิดด้วย next action ชัด (ขอเบอร์นัดโทร)
(6) ถ้าลูกค้าติดด่านหลังตกลง ต้องไม่ปล่อยค้าง / handoff ชัด / scarcity พอดี
ให้คะแนนสอดคล้องกับผลลัพธ์จริง (ปิดได้=ทำได้ดี, ไม่ซื้อ=ต้องวิเคราะห์ว่าพลาดตรงไหน)
ตอบ JSON ล้วนไม่มี markdown: {"score":<0-100>,"passed":<true ถ้า>=80>,"feedback":["<ไทยสั้นๆ ชี้จุดดี/ต้องแก้>","...","..."]}`;
    try {
      let t = await askAI({ system, messages: [{ role: "user", content: transcript + outcome }] });
      t = t.replace(/```json|```/g, "").trim();
      const g = JSON.parse(t);
      if (violations.length) { g.passed = false; g.score = Math.min(g.score, 50); }
      setGrade(g);
    } catch { setGrade({ score: 0, passed: false, feedback: ["ประเมินไม่สำเร็จ ลองใหม่อีกครั้ง"] }); }
    finally { setBusy(false); }
  };

  const decoIcon = decision?.decision === "buy" ? <Handshake size={22} color={BRAND.green} />
    : decision?.decision === "reject" ? <XCircle size={22} color={BRAND.red} /> : <Clock size={22} color={BRAND.amber} />;
  const decoColor = decision?.decision === "buy" ? BRAND.green : decision?.decision === "reject" ? BRAND.red : BRAND.amber;
  const decoLabel = decision?.decision === "buy" ? "ลูกค้าตัดสินใจ: ซื้อ! ✅" : decision?.decision === "reject" ? "ลูกค้าตัดสินใจ: ไม่ซื้อ" : "ลูกค้า: ขอคิดดูก่อน";
  const decoBg = decision?.decision === "buy" ? "#EAF3EE" : decision?.decision === "reject" ? "#F7EAEA" : "#FBF3E3";

  return (
    <div style={{ maxWidth: 740, margin: "0 auto", padding: "14px 16px 20px", display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button className="f" onClick={onBack} style={{ ...btnG, padding: "8px 10px" }}><ChevronLeft size={16} /></button>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: scenario ? "#F0EEE9" : "#EDE9E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {scenario ? <User size={20} color={BRAND.red} /> : <Swords size={20} color={BRAND.sub} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scenario ? scenario.label : "สนามซ้อม AI"}</div>
          <div style={{ fontSize: 12, color: BRAND.sub }}>{scenario ? (loading ? "กำลังพิมพ์…" : decided ? "จบการสนทนา" : "ลูกค้าจำลอง · ออนไลน์") : "เลือกลูกค้าที่จะซ้อมด้านล่าง"}</div>
        </div>
        {scenario && <button className="f" onClick={changeCustomer} style={{ ...btnG, fontSize: 12.5, padding: "7px 12px" }}>เปลี่ยนลูกค้า</button>}
      </div>

      {violations.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F7EAEA", border: `1px solid ${BRAND.red}`, color: BRAND.red, borderRadius: 10, padding: "8px 12px", fontSize: 13, marginBottom: 8 }}>
          <ShieldAlert size={16} /> ใช้คำต้องห้าม: {violations.join(", ")} — ห้ามพูดกับลูกค้าจริง
        </div>
      )}

      {/* body */}
      <div ref={scrollRef} className="rp-msgs" style={{ flex: 1, overflowY: "auto", background: BRAND.bg, border: `1px solid ${BRAND.line}`, borderRadius: 18, padding: scenario ? 14 : "18px 16px" }}>
        {!scenario ? (
          <div>
            <div style={{ textAlign: "center", padding: "8px 0 18px" }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>เลือกลูกค้าที่จะซ้อม</div>
              <div style={{ fontSize: 13, color: BRAND.sub, marginTop: 4, lineHeight: 1.6 }}>ลูกค้า AI คิดเป็น อารมณ์ต่างกันทุกครั้ง และตัดสินใจซื้อ/ไม่ซื้อตามที่คุณคุยจริง</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
              {SCENARIOS.map((sc) => (
                <button key={sc.id} className="f pcard" onClick={() => start(sc)}
                  style={{ textAlign: "left", background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 14, padding: 16, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#F0EEE9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={17} color={BRAND.red} /></div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.3 }}>{sc.label}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: BRAND.sub, lineHeight: 1.5 }}>{sc.brief}</div>
                  <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: BRAND.red }}><Swords size={13} /> เริ่มซ้อม</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {msgs.map((m, i) => (
              <div key={i} className="bin" style={{ display: "flex", justifyContent: m.role === "sale" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
                {m.role === "customer" && <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EDE9E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={14} color={BRAND.sub} /></div>}
                <div style={{ maxWidth: "76%", padding: "10px 14px", borderRadius: 16, fontSize: 14.5, lineHeight: 1.5,
                  background: m.role === "sale" ? (m.flagged?.length ? "#F7EAEA" : BRAND.ink) : BRAND.card,
                  color: m.role === "sale" ? (m.flagged?.length ? BRAND.red : "#fff") : BRAND.ink,
                  border: m.role === "sale" ? (m.flagged?.length ? `1px solid ${BRAND.red}` : "none") : `1px solid ${BRAND.line}`,
                  borderBottomRightRadius: m.role === "sale" ? 4 : 16, borderBottomLeftRadius: m.role === "customer" ? 4 : 16 }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EDE9E2", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={14} color={BRAND.sub} /></div>
                <div className="typing" style={{ background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 16, borderBottomLeftRadius: 4 }}><i></i><i></i><i></i></div>
              </div>
            )}
          </>
        )}
      </div>

      {decision && (
        <div className="bin" style={{ background: decoBg, border: `1px solid ${decoColor}`, borderRadius: 16, padding: 16, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 16, marginBottom: 6, color: decoColor }}>{decoIcon} {decoLabel}</div>
          <div style={{ fontSize: 13.5, color: BRAND.ink, lineHeight: 1.6 }}><b>เหตุผลของลูกค้า:</b> {decision.reason}</div>
          {decision.unresolved?.length > 0 && (
            <div style={{ fontSize: 13, color: BRAND.sub, marginTop: 6 }}>ยังค้างใจ: {decision.unresolved.join(" · ")}</div>
          )}
        </div>
      )}

      {grade && (
        <div className="bin" style={{ background: grade.passed ? "#EAF3EE" : "#F7EAEA", border: `1px solid ${grade.passed ? BRAND.green : BRAND.red}`, borderRadius: 16, padding: 16, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            {grade.passed ? <Award size={18} color={BRAND.green} /> : <AlertTriangle size={18} color={BRAND.red} />}
            หัวหน้าให้ {grade.score}/100 — {grade.passed ? "ผ่าน พร้อมออกสนามจริง" : "ยังไม่ผ่าน ซ้อมอีกรอบ"}
          </div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>{grade.feedback?.map((f, i) => <li key={i} style={{ marginBottom: 3 }}>{f}</li>)}</ul>
        </div>
      )}

      {/* footer actions */}
      {scenario && !decided && (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input className="f" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="พิมพ์ตอบลูกค้า…" style={{ ...inp, margin: 0, flex: 1 }} disabled={busy} />
            <button className="f" onClick={send} disabled={loading || busy} style={{ ...btnP, padding: "0 16px" }}><Send size={16} /></button>
          </div>
          {saleTurns >= 2 && (
            <button className="f" onClick={decide} disabled={busy || loading} style={{ ...btnP, background: BRAND.ink, justifyContent: "center", marginTop: 8 }}>
              <Handshake size={16} /> {busy ? "ลูกค้ากำลังตัดสินใจ…" : "ปิดการขาย / จบการซ้อม"}
            </button>
          )}
        </>
      )}
      {scenario && decided && !grade && (
        <button className="f" onClick={gradeSession} disabled={busy} style={{ ...btnP, justifyContent: "center", marginTop: 10 }}>
          {busy ? "หัวหน้ากำลังประเมิน…" : "ขอผลประเมินจากหัวหน้า AI"}
        </button>
      )}
      {scenario && decided && grade && (
        <button className="f" onClick={changeCustomer} style={{ ...btnG, justifyContent: "center", marginTop: 10 }}>
          <RotateCcw size={15} /> ซ้อมลูกค้าคนใหม่
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
