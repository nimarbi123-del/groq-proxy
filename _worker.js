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

    // Responses API ▸ Chat Completions
    if (path === "/v1/responses" && request.method === "POST") {
      const body = await request.json();
      const chatBody = {
        model: body.model,
        messages: [{ role: "user", content: body.input }],
      };
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": request.headers.get("Authorization"),
          },
          body: JSON.stringify(chatBody),
        }
      );
      const data = await groqResponse.json();
      return new Response(
        JSON.stringify({
          id: "resp_proxy",
          object: "response",
          output: [
            {
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text: data.choices?.[0]?.message?.content || "",
                },
              ],
            },
          ],
        }),
        {
          status: groqResponse.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const groqUrl = "https://api.groq.com/openai" + path + url.search;
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
  },
};
