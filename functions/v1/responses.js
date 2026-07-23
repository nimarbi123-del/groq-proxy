export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const body = await request.json();

  const inputText =
    typeof body.input === "string"
      ? body.input
      : body.input
          ?.map(item => {
            if (typeof item === "string") return item;
            if (item.content) {
              if (typeof item.content === "string") return item.content;
              if (Array.isArray(item.content)) {
                return item.content.map(c => c.text || "").join("");
              }
            }
            return "";
          })
          .join("") || "";

  const chatBody = {
    model: body.model,
    messages: [{ role: "user", content: inputText }],
  };

  const groqResponse = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + env.GROQ_API_KEY,
      },
      body: JSON.stringify(chatBody),
    }
  );

  const rawText = await groqResponse.text();
  let data;
  try { data = JSON.parse(rawText); } catch { data = {}; }

  if (!groqResponse.ok) {
    return new Response(rawText, {
      status: groqResponse.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  return new Response(
    JSON.stringify({
      id: "resp_proxy",
      object: "response",
      output: [{
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: data.choices?.[0]?.message?.content || "" }],
      }],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    }
  );
}