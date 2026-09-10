// Cloudflare Worker example for Dota 2 Help Tool anonymous usage analytics.
// Required bindings/secrets:
//   KV namespace binding: STATS
//   secret: HASH_SALT
//   secret: STATS_TOKEN
// Optional Resend email notification secrets:
//   RESEND_API_KEY, OWNER_EMAIL, FROM_EMAIL

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function increment(kv, key) {
  const current = Number((await kv.get(key)) || 0);
  const next = current + 1;
  await kv.put(key, String(next));
  return next;
}

async function notifyNewInstall(env, uniqueCount) {
  if (!env.RESEND_API_KEY || !env.OWNER_EMAIL || !env.FROM_EMAIL) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [env.OWNER_EMAIL],
      subject: "Dota 2 Help Tool · New anonymous installation",
      text: `A new anonymous installation opened the app. Total unique installations: ${uniqueCount}. No Steam ID, Dota account ID, match data, machine name, or gameplay state was collected.`
    })
  }).catch(() => {});
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return json({ ok: true });

    if (request.method === "GET" && url.pathname === "/stats") {
      if (!env.STATS_TOKEN || url.searchParams.get("token") !== env.STATS_TOKEN) {
        return json({ error: "unauthorized" }, 401);
      }
      return json({
        appOpens: Number((await env.STATS.get("app_opens")) || 0),
        uniqueInstallations: Number((await env.STATS.get("unique_installations")) || 0),
        lastEventAt: await env.STATS.get("last_event_at")
      });
    }

    if (request.method !== "POST" || url.pathname !== "/events") {
      return json({ error: "not_found" }, 404);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    if (body?.event !== "app_open") return json({ ok: true, ignored: true });

    const opens = await increment(env.STATS, "app_opens");
    await env.STATS.put("last_event_at", new Date().toISOString());

    let uniqueInstallations = Number((await env.STATS.get("unique_installations")) || 0);
    let isNewInstallation = false;

    if (body.installId && env.HASH_SALT) {
      const hash = await sha256Hex(`${env.HASH_SALT}:${body.installId}`);
      const key = `install:${hash}`;
      const seen = await env.STATS.get(key);
      if (!seen) {
        await env.STATS.put(key, "1");
        uniqueInstallations = await increment(env.STATS, "unique_installations");
        isNewInstallation = true;
        await notifyNewInstall(env, uniqueInstallations);
      }
    }

    return json({ ok: true, appOpens: opens, uniqueInstallations, isNewInstallation });
  }
};
