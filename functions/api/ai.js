// Cloudflare Pages Function — หลังบ้านซ่อน API key
// Deploy อัตโนมัติเมื่อ push (path จริงคือ /api/ai)
// ต้องตั้ง environment variable ชื่อ ANTHROPIC_API_KEY ใน Cloudflare Pages → Settings → Environment variables
//
// frontend เรียก POST /api/ai ด้วย body: { model, max_tokens, system, messages }
// key ไม่เคยโผล่ฝั่งหน้าเว็บ

export async function onRequestPost({ request, env }) {
  try {
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY ใน Cloudflare" }, 500);
    }
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

    const text = await r.text();
    return new Response(text, {
      status: r.status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}

// กันเรียกด้วย GET เฉยๆ
export async function onRequestGet() {
  return json({ ok: true, note: "ใช้ POST เท่านั้น" }, 200);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
