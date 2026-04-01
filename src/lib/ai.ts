import axios from "axios";

interface AnalyzeResult {
  remark: string;
}

/**
 * Fetch page content using Jina.ai Reader (better for antibot sites)
 */
async function fetchPageContent(url: string): Promise<{ title: string; description: string }> {
  try {
    const response = await axios.get(`https://r.jina.ai/${url}`, {
      headers: {
        "Accept": "text/plain",
      },
      timeout: 15000,
    });

    const content = response.data as string;

    // Extract title from markdown (first # heading)
    const titleMatch = content.match(/^#\s+(.+?)(?:\s*\|.+)?$/m);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract description from first paragraph after title
    const lines = content.split("\n").filter((line: string) => line.trim() && !line.startsWith("#") && !line.startsWith("[") && !line.startsWith("!"));
    const description = lines[0]?.trim() || "";

    return { title, description };
  } catch (error) {
    console.error("Jina.ai fetch error:", error);
    return { title: "", description: "" };
  }
}

/**
 * Analyze a webpage and generate a brief remark (50 chars max)
 * Uses Jina.ai Reader to get page content, then Claude AI to generate summary
 */
export async function analyzePage(url: string): Promise<AnalyzeResult> {
  try {
    // Fetch page content using Jina.ai Reader
    const { title, description } = await fetchPageContent(url);

    // If we have AI API key, use it to generate a remark
    if (process.env.AI_API_KEY) {
      const remark = await generateRemarkWithAI(title, description, url);
      return { remark };
    }

    // Otherwise, create a simple remark from title/description
    return { remark: createSimpleRemark(title, description) };
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
    const apiUrl = process.env.AI_API_URL || "https://code.newcli.com/claude/ultra";

    if (!apiKey) {
      return createSimpleRemark(title, description);
    }

    // Call Claude API
    const response = await axios.post(
      apiUrl,
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: `请根据以下网页信息，用50字以内的一句话描述这个网页的核心功能或用途。\n\n网页标题: ${title}\n网页描述: ${description}\n\n请直接输出描述，不要有前缀或引号。`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
      }
    );

    // Claude API response format: { content: [{ type: "text", text: "..." }] }
    if (response.data?.content?.[0]?.text) {
      let remark = response.data.content[0].text.trim();
      if (remark.length > 50) {
        remark = remark.slice(0, 47) + "...";
      }
      return remark;
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
