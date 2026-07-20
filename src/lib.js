import { CURRICULUM, ADMIN_PIN, AI_MODEL, FORBIDDEN_WORDS, SCENARIOS } from "./content.js";

export const BRAND = {
  bg: "#F5F3EF", ink: "#2B2B2B", red: "#8B1E1E", card: "#FFFFFF",
  line: "#E6E1DA", sub: "#6F6A63", green: "#2F7D4F", amber: "#B7791F",
};

/* ---- progress ต่อพนักงาน ---- */
export function loadProgress(empId) {
  try { return JSON.parse(localStorage.getItem(`deal_progress:${empId}`)) || {}; } catch { return {}; }
}
export function saveProgress(empId, data) {
  try { localStorage.setItem(`deal_progress:${empId}`, JSON.stringify(data)); } catch {}
}
export function loadUser() { try { return JSON.parse(localStorage.getItem("deal_user")); } catch { return null; } }
export function saveUser(u) { try { localStorage.setItem("deal_user", JSON.stringify(u)); } catch {} }
export function clearUser() { try { localStorage.removeItem("deal_user"); } catch {} }

/* ---- video URL overrides (แก้ URL บทเดิม) ---- */
export function loadVideoOverrides() { try { return JSON.parse(localStorage.getItem("deal_video_overrides")) || {}; } catch { return {}; } }
export function saveVideoOverrides(map) { try { localStorage.setItem("deal_video_overrides", JSON.stringify(map)); } catch {} }

/* ---- บทที่เพิ่มใหม่จากหน้า admin ---- */
export function loadAddedLessons() { try { return JSON.parse(localStorage.getItem("deal_added_lessons")) || []; } catch { return []; } }
export function saveAddedLessons(arr) { try { localStorage.setItem("deal_added_lessons", JSON.stringify(arr)); } catch {} }

/* ---- โหมดทดสอบ: ปลดล็อกสนามซ้อม (เฉพาะเครื่องนี้) ---- */
export function loadPreviewUnlock() { try { return localStorage.getItem("deal_preview_unlock") === "1"; } catch { return false; } }
export function savePreviewUnlock(on) { try { on ? localStorage.setItem("deal_preview_unlock", "1") : localStorage.removeItem("deal_preview_unlock"); } catch {} }

/* ---- ล้างข้อมูลชั่วคราวในเครื่อง (หลัง export+push แล้ว) ---- */
export function clearLocalContent() {
  try { localStorage.removeItem("deal_video_overrides"); localStorage.removeItem("deal_added_lessons"); } catch {}
}

/* ---- รวม base + บทที่เพิ่ม + video overrides ---- */
export function getCurriculum() {
  const ov = loadVideoOverrides();
  const added = loadAddedLessons();
  const mods = CURRICULUM.map((m) => ({ module: m.module, lessons: m.lessons.map((l) => ({ ...l })) }));
  added.forEach((al) => {
    let m = mods.find((x) => x.module === al.module);
    if (!m) { m = { module: al.module, lessons: [] }; mods.push(m); }
    m.lessons.push({ id: al.id, title: al.title, videoUrl: al.videoUrl, quiz: al.quiz || [] });
  });
  mods.forEach((m) => { m.lessons = m.lessons.map((l) => (ov[l.id] ? { ...l, videoUrl: ov[l.id] } : l)); });
  return mods;
}
export const flatLessons = () => getCurriculum().flatMap((m) => m.lessons);

/* ---- สร้างไฟล์ content.js เต็ม(พร้อมบท/วิดีโอที่แก้) ให้เอาไป push ---- */
export function buildContentFile() {
  const cur = getCurriculum();
  return `/* content.js — สร้างจากหน้า /admin  วางทับ src/content.js ทั้งไฟล์ แล้ว git push */
export const ADMIN_PIN = ${JSON.stringify(ADMIN_PIN)};
export const AI_MODEL = ${JSON.stringify(AI_MODEL)};
export const FORBIDDEN_WORDS = ${JSON.stringify(FORBIDDEN_WORDS)};
export const CURRICULUM = ${JSON.stringify(cur, null, 2)};
export const SCENARIOS = ${JSON.stringify(SCENARIOS, null, 2)};
`;
}

export function fmt(sec = 0) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m ? `${m}:${String(s).padStart(2, "0")} นาที` : `${s} วินาที`;
}
