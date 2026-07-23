export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const groqUrl = "https://api.groq.com/openai/v1/chat/completions";

  const groqRequest = new Request(groqUrl, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("Content-Type") || "application/json",
      "Authorization": "Bearer " + env.GROQ_API_KEY,
    },
    body: request.body,
  });

  try {
    const response = await fetch(groqRequest);
    const h = new Headers(response.headers);
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Access-Control-Expose-Headers", "*");
    return new Response(response.body, { status: response.status, headers: h });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}