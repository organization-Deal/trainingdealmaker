// Cloudflare Worker entry
// - /api/ai  → proxy ไป Anthropic (ซ่อน API key ฝั่ง server)
// - อื่นๆ    → เสิร์ฟไฟล์เว็บจาก ./dist ผ่าน ASSETS binding
//
// ตั้ง environment variable ชื่อ ANTHROPIC_API_KEY ใน Cloudflare
// (โปรเจกต์ trainingdealmaker → Settings → Variables and Secrets)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/ai") {
      if (request.method !== "POST") {
        return json({ ok: true, note: "ใช้ POST เท่านั้น" }, 200);
      }
      if (!env.ANTHROPIC_API_KEY) {
        return json({ error: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY ใน Cloudflare" }, 500);
      }
      try {
        const payload = await request.json();
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(payload),
        });
        return new Response(await r.text(), {
          status: r.status,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

    // ไม่ใช่ API → เสิร์ฟไฟล์เว็บ
    return env.ASSETS.fetch(request);
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
