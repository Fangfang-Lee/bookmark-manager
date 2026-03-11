import axios from "axios";

interface AnalyzeResult {
  remark: string;
}

/**
 * Analyze a webpage and generate a brief remark (50 chars max)
 * Uses the page title and description to create a summary
 */
export async function analyzePage(url: string): Promise<AnalyzeResult> {
  try {
    // First, try to get page metadata using Microlink (which we already use for preview)
    const apiUrl = process.env.PREVIEW_API_URL || "https://api.microlink.io";
    const apiKey = process.env.PREVIEW_API_KEY;

    const params: Record<string, string> = {
      url,
      palette: "true",
    };

    if (apiKey) {
      params.accessKey = apiKey;
    }

    const response = await axios.get(apiUrl, { params });

    if (response.data?.data) {
      const data = response.data.data;
      const title = data.title || "";
      const description = data.description || "";

      // If we have AI API key, use it to generate a remark
      if (process.env.AI_API_KEY) {
        const remark = await generateRemarkWithAI(title, description, url);
        return { remark };
      }

      // Otherwise, create a simple remark from title/description
      let remark = "";
      if (title) {
        remark = title.slice(0, 40);
      }
      if (description && remark.length < 50) {
        const remaining = 50 - remark.length;
        remark += (remark ? " - " : "") + description.slice(0, remaining);
      }

      return { remark: remark.slice(0, 50) };
    }

    return { remark: "" };
  } catch (error) {
    console.error("Page analysis error:", error);
    return { remark: "" };
  }
}

/**
 * Use AI to generate a concise remark from page content
 */
async function generateRemarkWithAI(
  title: string,
  description: string,
  url: string
): Promise<string> {
  try {
    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
      return createSimpleRemark(title, description);
    }

    // Try v1 text generation first
    try {
      const response = await axios.post(
        "https://api.minimax.chat/v1/text/chatcompletion_v2",
        {
          model: "abab6.5s-chat",
          messages: [
            {
              role: "user",
              content: `请根据以下网页信息，用50字以内的一句话描述这个网页的核心功能或用途。\n\n网页标题: ${title}\n网页描述: ${description}\n\n请直接输出描述，不要有前缀或引号。`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        let remark = response.data.choices[0].message.content.trim();
        if (remark.length > 50) {
          remark = remark.slice(0, 47) + "...";
        }
        return remark;
      }
    } catch (e) {
      console.log("V2 API failed, trying V1...");
    }

    // Fallback to simple extraction
    return createSimpleRemark(title, description);
  } catch (error) {
    console.error("AI remark generation error:", error);
    return createSimpleRemark(title, description);
  }
}

/**
 * Create a simple remark from title and description
 */
function createSimpleRemark(title: string, description: string): string {
  let remark = "";
  if (title) {
    remark = title.slice(0, 40);
  }
  if (description && remark.length < 50) {
    const remaining = 50 - remark.length;
    remark += (remark ? " - " : "") + description.slice(0, remaining);
  }
  return remark.slice(0, 50);
}
