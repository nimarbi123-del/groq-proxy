export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 只处理 /v1/ 路径
    if (!path.startsWith("/v1/")) {
      return new Response(JSON.stringify({ error: "Not found. Use /v1/ endpoints." }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Groq API 路径需要加 /openai 前缀
    const groqPath = "/openai" + path;
    const groqUrl = "https://api.groq.com" + groqPath + url.search;
    const groqRequest = new Request(groqUrl, {
      method: request.method,
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "application/json",
        "Authorization": request.headers.get("Authorization") || "",
      },
      body: request.method !== "GET" ? request.body : null,
    });

    try {
      const response = await fetch(groqRequest);
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Expose-Headers", "*");
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
