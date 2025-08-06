import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tid } = await req.json();
    if (!tid) {
      return new Response(JSON.stringify({ error: "tid is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const url = `https://indiankanoon.org/doc/${tid}/`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch case page");
    }
    const html = await res.text();
    // Extract the main judgement text. Indian Kanoon wraps content in <pre id="content"> maybe, fallback to body
    let text = "";
    const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (preMatch) {
      text = preMatch[1];
    } else {
      // fallback: strip tags from body
      text = html.replace(/<[^>]*>/g, " ");
    }
    text = text.replace(/\s+/g, " ").trim();

    return new Response(JSON.stringify({ tid, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("get-indian-kanoon-case error", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});