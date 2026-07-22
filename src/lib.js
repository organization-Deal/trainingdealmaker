import { CURRICULUM, ADMIN_PIN, AI_MODEL, FORBIDDEN_WORDS, SCENARIOS, BUSINESS_CONTEXT } from "./content.js";

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

/* ---- overrides: URL วิดีโอ + รูป thumbnail (แก้บทเดิม) ---- */
export function loadVideoOverrides() { try { return JSON.parse(localStorage.getItem("deal_video_overrides")) || {}; } catch { return {}; } }
export function saveVideoOverrides(map) { try { localStorage.setItem("deal_video_overrides", JSON.stringify(map)); } catch {} }
export function loadThumbOverrides() { try { return JSON.parse(localStorage.getItem("deal_thumb_overrides")) || {}; } catch { return {}; } }
export function saveThumbOverrides(map) { try { localStorage.setItem("deal_thumb_overrides", JSON.stringify(map)); } catch {} }

/* ---- บทที่เพิ่มใหม่จากหน้า admin ---- */
export function loadAddedLessons() { try { return JSON.parse(localStorage.getItem("deal_added_lessons")) || []; } catch { return []; } }
export function saveAddedLessons(arr) { try { localStorage.setItem("deal_added_lessons", JSON.stringify(arr)); } catch {} }

/* ---- แก้ชื่อบท + ซ่อน(ลบ)บท ---- */
export function loadTitleOverrides() { try { return JSON.parse(localStorage.getItem("deal_title_overrides")) || {}; } catch { return {}; } }
export function saveTitleOverrides(map) { try { localStorage.setItem("deal_title_overrides", JSON.stringify(map)); } catch {} }
export function loadHiddenLessons() { try { return JSON.parse(localStorage.getItem("deal_hidden_lessons")) || []; } catch { return []; } }
export function saveHiddenLessons(arr) { try { localStorage.setItem("deal_hidden_lessons", JSON.stringify(arr)); } catch {} }

/* ---- ลำดับคลิป (จัดเรียงเอง) ---- */
export function loadOrder() { try { return JSON.parse(localStorage.getItem("deal_order")) || []; } catch { return []; } }
export function saveOrder(arr) { try { localStorage.setItem("deal_order", JSON.stringify(arr)); } catch {} }

/* ---- โหมดทดสอบ: ปลดล็อกสนามซ้อม (เฉพาะเครื่องนี้) ---- */
export function loadPreviewUnlock() { try { return localStorage.getItem("deal_preview_unlock") === "1"; } catch { return false; } }
export function savePreviewUnlock(on) { try { on ? localStorage.setItem("deal_preview_unlock", "1") : localStorage.removeItem("deal_preview_unlock"); } catch {} }

/* ---- ล้างข้อมูลชั่วคราวในเครื่อง (หลัง export+push) ---- */
export function clearLocalContent() {
  try {
    localStorage.removeItem("deal_video_overrides");
    localStorage.removeItem("deal_thumb_overrides");
    localStorage.removeItem("deal_title_overrides");
    localStorage.removeItem("deal_hidden_lessons");
    localStorage.removeItem("deal_order");
    localStorage.removeItem("deal_added_lessons");
  } catch {}
}

/* ---- รวม base + บทที่เพิ่ม + overrides (วิดีโอ+รูป) ---- */
export function getCurriculum() {
  const ov = loadVideoOverrides();
  const tov = loadThumbOverrides();
  const titleOv = loadTitleOverrides();
  const hidden = loadHiddenLessons();
  const added = loadAddedLessons();
  const mods = CURRICULUM.map((m) => ({ module: m.module, lessons: m.lessons.map((l) => ({ ...l })) }));
  const baseIds = new Set(mods.flatMap((m) => m.lessons.map((l) => l.id)));
  added.forEach((al) => {
    if (baseIds.has(al.id)) return; // กันซ้ำกับที่อยู่ใน content.js แล้ว
    baseIds.add(al.id);
    let m = mods.find((x) => x.module === al.module);
    if (!m) { m = { module: al.module, lessons: [] }; mods.push(m); }
    m.lessons.push({ id: al.id, title: al.title, videoUrl: al.videoUrl, thumbnail: al.thumbnail || "", quiz: al.quiz || [] });
  });
  mods.forEach((m) => {
    m.lessons = m.lessons
      .filter((l) => !hidden.includes(l.id))
      .map((l) => ({
        ...l,
        title: titleOv[l.id] || l.title,
        videoUrl: ov[l.id] || l.videoUrl,
        thumbnail: tov[l.id] !== undefined ? tov[l.id] : (l.thumbnail || ""),
        quiz: l.quiz || [],
      }));
  });
  return mods.filter((m) => m.lessons.length > 0);
}
export function flatLessons() {
  const order = loadOrder();
  let ls = getCurriculum().flatMap((m) => m.lessons.map((l) => ({ ...l, __module: m.module })));
  if (order.length) {
    const idx = (id) => { const i = order.indexOf(id); return i === -1 ? 9999 : i; };
    ls = ls.map((l, i) => ({ l, i })).sort((a, b) => (idx(a.l.id) - idx(b.l.id)) || (a.i - b.i)).map((x) => x.l);
  }
  return ls;
}

/* ---- ข้อสอบใหญ่: รวมทุกคำถามจากทุกบท ---- */
export function allExamQuestions() {
  return flatLessons().flatMap((l) => (l.quiz || []).map((q) => ({ ...q, from: l.title })));
}

/* ---- สร้างไฟล์ content.js เต็ม ให้เอาไป push ---- */
export function buildContentFile() {
  const flat = flatLessons();
  const mods = [];
  flat.forEach((l) => {
    const { __module, ...rest } = l;
    const last = mods[mods.length - 1];
    if (last && last.module === __module) last.lessons.push(rest);
    else mods.push({ module: __module, lessons: [rest] });
  });
  return `/* content.js — สร้างจากหน้า /admin  วางทับ src/content.js ทั้งไฟล์ แล้ว git push */
export const ADMIN_PIN = ${JSON.stringify(ADMIN_PIN)};
export const AI_MODEL = ${JSON.stringify(AI_MODEL)};
export const FORBIDDEN_WORDS = ${JSON.stringify(FORBIDDEN_WORDS)};
export const BUSINESS_CONTEXT = ${JSON.stringify(BUSINESS_CONTEXT)};
export const CURRICULUM = ${JSON.stringify(mods, null, 2)};
export const SCENARIOS = ${JSON.stringify(SCENARIOS, null, 2)};
`;
}

export function fmt(sec = 0) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m ? `${m}:${String(s).padStart(2, "0")} นาที` : `${s} วินาที`;
}
