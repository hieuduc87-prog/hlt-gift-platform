import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildCardPrompt, SYSTEM_PROMPT } from "@/lib/ai/card-prompts";
import { execSync } from "child_process";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    occasion_type,
    recipient_name,
    relationship,
    sender_name,
    company,
    occasion_label,
    note,
  } = body;

  if (!occasion_type || !recipient_name || !sender_name) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = buildCardPrompt({
    occasion_type,
    recipient_name,
    relationship: relationship || "other",
    sender_name,
    company,
    occasion_label,
    note,
  });

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${prompt}`;

  try {
    // Use claude CLI subprocess (NOT Anthropic API key)
    // Must delete CLAUDECODE env var to prevent conflicts
    const env = { ...process.env };
    delete env.CLAUDE_CODE;
    delete env.CLAUDECODE;

    const result = execSync(
      `echo ${JSON.stringify(fullPrompt)} | claude -p --model haiku`,
      { env, timeout: 30000, encoding: "utf-8", maxBuffer: 1024 * 1024 }
    );

    const cardText = result.trim();
    return Response.json({ text: cardText });
  } catch (error) {
    console.error("Card text generation failed:", error);
    // Fallback: return a simple template
    return Response.json({
      text: `Kính gửi ${recipient_name},\n\nChúc mừng ${occasion_label || occasion_type}! Gửi đến bạn lời chúc tốt đẹp nhất.\n\nTrân trọng,\n${sender_name}`,
      fallback: true,
    });
  }
}
