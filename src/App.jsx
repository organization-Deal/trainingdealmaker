import React, { useState, useEffect, useRef } from "react";
import {
  Lock, CheckCircle2, Play, ClipboardCheck, Swords, LogOut,
  ChevronLeft, RotateCcw, Send, ShieldAlert, Award, Circle, AlertTriangle, Settings,
} from "lucide-react";
import { SCENARIOS, FORBIDDEN_WORDS, AI_MODEL } from "./content.js";
import {
  BRAND, loadProgress, saveProgress, loadUser, saveUser, clearUser,
  getCurriculum, flatLessons, fmt, loadPreviewUnlock,
} from "./lib.js";

// เรียก AI ผ่านหลังบ้าน Cloudflare (key ถูกซ่อนฝั่ง server)
async function askAI({ system, messages }) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL, max_tokens: 1000, system, messages }),
  });
  const data = await res.json();
  return data.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim() || "";
}

export default function App() {
  const [user, setUser] = useState(loadUser());
  const [progress, setProgress] = useState(() => { const u = loadUser(); return u ? loadProgress(u.empId) : {}; });
  const [screen, setScreen] = useState(loadUser() ? "dashboard" : "login");
  const [activeLesson, setActiveLesson] = useState(null);

  const curriculum = getCurriculum();
  const lessons = flatLessons();
  const total = lessons.length;
  const passedCount = lessons.filter((l) => progress[l.id]?.quizPassed).length;
  const allPassed = passedCount === total;
  const previewUnlock = loadPreviewUnlock();
  const unlocked = allPassed || previewUnlock;

  const update = (lessonId, patch) => {
    const next = { ...progress, [lessonId]: { ...(progress[lessonId] || {}), ...patch } };
    setProgress(next);
    if (user) saveProgress(user.empId, next);
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
        @media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
      `}</style>

      {screen === "login" && <Login onLogin={login} />}
      {screen === "dashboard" && user && (
        <Dashboard user={user} curriculum={curriculum} progress={progress}
          passedCount={passedCount} total={total} allPassed={allPassed}
          unlocked={unlocked} previewUnlock={previewUnlock}
          onOpen={(l) => { setActiveLesson(l); setScreen("lesson"); }}
          onRoleplay={() => setScreen("roleplay")} onLogout={logout} />
      )}
      {screen === "lesson" && activeLesson && (
        <LessonView lesson={activeLesson} st={progress[activeLesson.id] || {}}
          onBack={() => setScreen("dashboard")} onUpdate={(p) => update(activeLesson.id, p)} />
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
      <p style={{ color: BRAND.sub, fontSize: 15, marginBottom: 28 }}>ดูคลิปให้จบ → สอบผ่าน 100% → ปลดล็อกซ้อมกับลูกค้าจำลอง แล้วถึงพร้อมปิดการขายจริง</p>
      <div style={{ background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 16, padding: 22 }}>
        <label style={lbl}>ชื่อ–สกุล</label>
        <input className="f" style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น มิว สมใจ" />
        <label style={lbl}>รหัสพนักงาน</label>
        <input className="f" style={inp} value={emp} onChange={(e) => setEmp(e.target.value)} placeholder="เช่น DEAL-041" />
        <button className="f" onClick={() => ready && onLogin(name, emp)} disabled={!ready}
          style={{ ...btnP, width: "100%", marginTop: 8, opacity: ready ? 1 : 0.45, cursor: ready ? "pointer" : "not-allowed" }}>
          เข้าสู่การอบรม
        </button>
      </div>
      <a href="#admin" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: BRAND.sub, fontSize: 12.5, textDecoration: "none", marginTop: 14 }}>
        <Settings size={13} /> หลังบ้านผู้ดูแล
      </a>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */
function Dashboard({ user, curriculum, progress, passedCount, total, allPassed, unlocked, previewUnlock, onOpen, onRoleplay, onLogout }) {
  const pct = Math.round((passedCount / total) * 100);
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 20px 80px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 800, letterSpacing: "0.16em", fontSize: 12, color: BRAND.red }}>DEAL! SALES ACADEMY</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>สวัสดี {user.name}</div>
          <div style={{ fontSize: 13, color: BRAND.sub }}>รหัส {user.empId}</div>
        </div>
        <button className="f" onClick={onLogout} style={btnG}><LogOut size={15} /> ออก</button>
      </header>

      <div style={{ background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 16, padding: 20, marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>ความคืบหน้ารวม</span>
          <span style={{ color: BRAND.sub }}>{passedCount}/{total} บทผ่านแล้ว</span>
        </div>
        <div style={{ height: 10, background: BRAND.line, borderRadius: 999 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: allPassed ? BRAND.green : BRAND.red, borderRadius: 999, transition: "width .4s" }} />
        </div>
      </div>

      {curriculum.map((mod) => (
        <section key={mod.module} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{mod.module}</div>
          {mod.lessons.map((l) => {
            const st = progress[l.id] || {};
            const status = st.quizPassed ? "passed" : st.watched ? "watched" : "new";
            return (
              <button key={l.id} className="f" onClick={() => onOpen(l)} style={{ ...row, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {status === "passed" ? <CheckCircle2 size={20} color={BRAND.green} />
                    : status === "watched" ? <ClipboardCheck size={20} color={BRAND.amber} />
                      : <Play size={20} color={BRAND.sub} />}
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{l.title}</div>
                    <div style={{ fontSize: 12.5, color: BRAND.sub }}>
                      {status === "passed" ? "ผ่านแล้ว ✓"
                        : status === "watched" ? `ดูแล้ว ${fmt(st.watchedSec)} — ยังไม่ผ่านแบบทดสอบ`
                          : "ยังไม่ได้ดู"}
                    </div>
                  </div>
                </div>
                <ChevronLeft size={18} style={{ transform: "rotate(180deg)", color: BRAND.sub }} />
              </button>
            );
          })}
        </section>
      ))}

      <section style={{ marginTop: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          ด่านสุดท้าย · สนามซ้อมกับลูกค้าจริง
        </div>
        <div style={{ background: unlocked ? BRAND.card : "#EFEBE4", border: `1px solid ${unlocked ? BRAND.green : BRAND.line}`, borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            {unlocked ? <Swords size={22} color={BRAND.green} /> : <Lock size={22} color={BRAND.sub} />}
            <div style={{ fontWeight: 700, fontSize: 17 }}>สนามซ้อม AI — รับมือลูกค้าก่อนของจริง</div>
          </div>
          {previewUnlock && !allPassed && (
            <div style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: BRAND.amber, background: "#FBF3E3", border: `1px solid ${BRAND.amber}`, borderRadius: 8, padding: "3px 8px", marginBottom: 10 }}>
              โหมดทดสอบ (ปลดล็อกชั่วคราวสำหรับผู้ดูแล)
            </div>
          )}
          <p style={{ fontSize: 14, color: BRAND.sub, margin: "0 0 16px" }}>
            {unlocked ? "ซ้อมคุยกับลูกค้าจำลอง ระบบจับคำต้องห้ามสดๆ และประเมินผลตอนจบ"
              : `ต้องสอบผ่านครบทั้ง ${total} บท (100% ทุกบท) ก่อนถึงจะปลดล็อก — ตอนนี้ผ่าน ${passedCount}/${total}`}
          </p>
          <button className="f" onClick={() => unlocked && onRoleplay()} disabled={!unlocked}
            style={{ ...btnP, background: unlocked ? BRAND.green : "#B9B3AA", cursor: unlocked ? "pointer" : "not-allowed" }}>
            {unlocked ? "เข้าสนามซ้อม" : "ยังล็อกอยู่"}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ---------------- LESSON + QUIZ ---------------- */
/* ---- รองรับทั้ง YouTube และ .mp4 ---- */
function ytId(url = "") {
  const m = String(url).match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function YouTubePlayer({ videoId, onTime, onMeta, onEnd }) {
  const holder = useRef(null);
  const player = useRef(null);
  useEffect(() => {
    let poll;
    const build = () => {
      player.current = new window.YT.Player(holder.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => onMeta(Math.floor(e.target.getDuration())),
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              clearInterval(poll);
              poll = setInterval(() => {
                onTime(Math.floor(player.current.getCurrentTime()), Math.floor(player.current.getDuration()));
              }, 1000);
            } else { clearInterval(poll); }
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

function LessonView({ lesson, st, onBack, onUpdate }) {
  const vidRef = useRef(null);
  const [watchedSec, setWatchedSec] = useState(st.watchedSec || 0);
  const [duration, setDuration] = useState(st.duration || 0);
  const [mode, setMode] = useState("video");
  const watchedEnough = duration > 0 && watchedSec >= duration * 0.9;
  const canQuiz = watchedEnough || st.watched;
  const yt = ytId(lesson.videoUrl);

  const handleTime = (sec, dur) => {
    const w = Math.max(watchedSec, Math.floor(sec || 0));
    setWatchedSec(w);
    if (dur) setDuration(Math.floor(dur));
    if (w % 3 === 0) onUpdate({ watchedSec: w, duration: Math.floor(dur || duration) });
  };
  const onVideoTime = () => { const v = vidRef.current; if (v) handleTime(v.currentTime, v.duration); };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 20px 80px" }}>
      <button className="f" onClick={onBack} style={btnG}><ChevronLeft size={16} /> กลับหน้าหลัก</button>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: "16px 0 12px" }}>{lesson.title}</h2>

      {mode === "video" && (
        <>
          <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${BRAND.line}`, background: "#000" }}>
            {yt ? (
              <YouTubePlayer videoId={yt}
                onTime={(t, d) => handleTime(t, d)}
                onMeta={(d) => setDuration(d)}
                onEnd={() => onUpdate({ watched: true, watchedSec, duration })} />
            ) : (
              <video ref={vidRef} src={lesson.videoUrl} controls onTimeUpdate={onVideoTime}
                onLoadedMetadata={() => setDuration(Math.floor(vidRef.current?.duration || 0))}
                onEnded={() => onUpdate({ watched: true, watchedSec, duration })}
                style={{ width: "100%", display: "block", aspectRatio: "16/9" }} />
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: BRAND.sub, margin: "10px 2px" }}>
            <span>ดูไปแล้ว {fmt(watchedSec)}{duration ? ` / ${fmt(duration)}` : ""}</span>
          </div>
          <button className="f" onClick={() => setMode("quiz")} disabled={!canQuiz}
            style={{ ...btnP, width: "100%", opacity: canQuiz ? 1 : 0.45, cursor: canQuiz ? "pointer" : "not-allowed" }}>
            {canQuiz ? "ทำแบบทดสอบ" : "ดูคลิปให้ครบ 90% ก่อนถึงจะทำแบบทดสอบได้"}
          </button>
        </>
      )}

      {mode === "quiz" && (
        <Quiz lesson={lesson} passedBefore={st.quizPassed}
          onPass={() => onUpdate({ quizPassed: true, watched: true })}
          onBack={() => setMode("video")} />
      )}
    </div>
  );
}

function Quiz({ lesson, onPass, onBack, passedBefore }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const total = lesson.quiz.length;
  const correct = lesson.quiz.filter((q, i) => answers[i] === q.correct).length;
  const perfect = submitted && correct === total;

  const submit = () => { setSubmitted(true); if (lesson.quiz.every((q, i) => answers[i] === q.correct)) onPass(); };
  const retry = () => { setAnswers({}); setSubmitted(false); };

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 13, color: BRAND.sub, marginBottom: 14 }}>
        ตอบถูก <b>ทุกข้อ (100%)</b> เท่านั้นถึงจะผ่าน — ผิดข้อเดียวต้องทำใหม่{passedBefore ? " · บทนี้เคยผ่านแล้ว" : ""}
      </div>
      {lesson.quiz.map((q, i) => (
        <div key={i} style={{ background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>{i + 1}. {q.q}</div>
          {q.choices.map((c, ci) => {
            const chosen = answers[i] === ci;
            const showC = submitted && ci === q.correct;
            const showW = submitted && chosen && ci !== q.correct;
            return (
              <button key={ci} className="f" onClick={() => !submitted && setAnswers({ ...answers, [i]: ci })}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  padding: "10px 12px", marginBottom: 6, borderRadius: 10, fontSize: 14.5,
                  border: `1px solid ${showC ? BRAND.green : showW ? BRAND.red : chosen ? BRAND.ink : BRAND.line}`,
                  background: showC ? "#EAF3EE" : showW ? "#F7EAEA" : chosen ? "#F0EEE9" : "#fff",
                  cursor: submitted ? "default" : "pointer", color: BRAND.ink,
                }}>
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
          <button className="f" onClick={retry} style={{ ...btnP, width: "100%" }}><RotateCcw size={16} /> ทำใหม่</button>
        </div>
      )}
      {perfect && (
        <div style={{ textAlign: "center", background: "#EAF3EE", border: `1px solid ${BRAND.green}`, borderRadius: 14, padding: 20 }}>
          <CheckCircle2 size={30} color={BRAND.green} />
          <div style={{ fontWeight: 700, fontSize: 17, margin: "8px 0 4px" }}>ผ่าน 100% 🎉</div>
          <button className="f" onClick={onBack} style={{ ...btnG, margin: "8px auto 0" }}>กลับ</button>
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
    } catch {
      setGrade({ score: 0, passed: false, feedback: ["ประเมินไม่สำเร็จ ลองใหม่อีกครั้ง"] });
    } finally { setGrading(false); }
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
            <div style={{
              maxWidth: "78%", padding: "9px 13px", borderRadius: 14, fontSize: 14.5, lineHeight: 1.5,
              background: m.role === "sale" ? (m.flagged?.length ? "#F7EAEA" : BRAND.ink) : "#F0EEE9",
              color: m.role === "sale" ? (m.flagged?.length ? BRAND.red : "#fff") : BRAND.ink,
              border: m.flagged?.length ? `1px solid ${BRAND.red}` : "none",
            }}>{m.text}</div>
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
          <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13.5 }}>
            {grade.feedback?.map((f, i) => <li key={i} style={{ marginBottom: 3 }}>{f}</li>)}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input className="f" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()} placeholder="พิมพ์ตอบลูกค้า…"
          style={{ ...inp, margin: 0, flex: 1 }} />
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

/* ---------------- styles ---------------- */
const inp = { width: "100%", boxSizing: "border-box", padding: "11px 13px", margin: "6px 0 16px", borderRadius: 10, border: `1px solid ${BRAND.line}`, fontSize: 15, background: "#fff", color: BRAND.ink };
const lbl = { fontSize: 13, fontWeight: 600, color: BRAND.sub };
const btnP = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: BRAND.red, color: "#fff", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 15, fontWeight: 600, cursor: "pointer" };
const btnG = { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${BRAND.line}`, color: BRAND.ink, borderRadius: 10, padding: "8px 12px", fontSize: 13.5, fontWeight: 500, cursor: "pointer" };
const row = { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 12, padding: "14px 16px", marginBottom: 8 };
