const GEMINI_MODEL = "gemini-2.0-flash";

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export async function callGeminiInsight(
  apiKey: string,
  prompt: string
): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as GeminiGenerateResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch (err) {
    console.error("Failed to call Gemini API:", err);
    return null;
  }
}
