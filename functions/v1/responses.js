export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  const body = await request.json();

  const input =
    typeof body.input === "string"
      ? body.input
      : Array.isArray(body.input)
      ? body.input
          .map(x => {
            if (typeof x === "string") return x;
            if (Array.isArray(x.content))
              return x.content.map(c => c.text || "").join("");
            return x.content || "";
          })
          .join("\n")
      : "";

  const chatBody = {
    model: body.model,
    messages: [
      {
        role: "user",
        content: input
      }
    ],
    stream: body.stream === true,
    temperature: body.temperature,
    max_tokens: body.max_output_tokens
  };

  const resp = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(chatBody)
    }
  );

  const headers = new Headers(resp.headers);

  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Expose-Headers", "*");

  return new Response(resp.body, {
    status: resp.status,
    headers
  });
}