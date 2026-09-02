import axios from "axios";

export interface ModerationResult {
  flagged: boolean;
  flagReason?: string;
}

export async function checkModeration(promptText: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OPENAI_API_KEY not configured. Skipping moderation check.");
    return { flagged: false };
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/moderations",
      { input: promptText },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data?.results?.[0];
    if (result?.flagged) {
      const flaggedCategories = Object.entries(result.categories || {})
        .filter(([_, isFlagged]) => isFlagged)
        .map(([category]) => category)
        .join(", ");

      return {
        flagged: true,
        flagReason: flaggedCategories || "Violation of content policy",
      };
    }

    return { flagged: false };
  } catch (error: any) {
    console.error("Moderation API call failed:", error?.message || error);
    // Safety check: fail open or log warning for prototype
    return { flagged: false };
  }
}
