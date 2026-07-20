import { CURRICULUM } from "./content.js";

export const BRAND = {
  bg: "#F5F3EF", ink: "#2B2B2B", red: "#8B1E1E", card: "#FFFFFF",
  line: "#E6E1DA", sub: "#6F6A63", green: "#2F7D4F", amber: "#B7791F",
};

// ---- progress ต่อพนักงาน (เก็บในเบราว์เซอร์เครื่องนี้) ----
export function loadProgress(empId) {
  try { return JSON.parse(localStorage.getItem(`deal_progress:${empId}`)) || {}; }
  catch { return {}; }
}
export function saveProgress(empId, data) {
  try { localStorage.setItem(`deal_progress:${empId}`, JSON.stringify(data)); } catch {}
}
export function loadUser() {
  try { return JSON.parse(localStorage.getItem("deal_user")); } catch { return null; }
}
export function saveUser(u) {
  try { localStorage.setItem("deal_user", JSON.stringify(u)); } catch {}
}
export function clearUser() {
  try { localStorage.removeItem("deal_user"); } catch {}
}

// ---- video URL overrides จากหน้า admin (ทับ content.js ชั่วคราวในเครื่องนี้) ----
export function loadVideoOverrides() {
  try { return JSON.parse(localStorage.getItem("deal_video_overrides")) || {}; }
  catch { return {}; }
}
export function saveVideoOverrides(map) {
  try { localStorage.setItem("deal_video_overrides", JSON.stringify(map)); } catch {}
}

// รวม content.js + overrides → ได้ curriculum ที่ใช้แสดงจริง
export function getCurriculum() {
  const ov = loadVideoOverrides();
  return CURRICULUM.map((m) => ({
    ...m,
    lessons: m.lessons.map((l) => (ov[l.id] ? { ...l, videoUrl: ov[l.id] } : l)),
  }));
}

export const flatLessons = () => getCurriculum().flatMap((m) => m.lessons);

export function fmt(sec = 0) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m ? `${m}:${String(s).padStart(2, "0")} นาที` : `${s} วินาที`;
}
