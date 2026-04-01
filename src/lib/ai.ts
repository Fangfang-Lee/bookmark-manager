import axios from "axios";

interface AnalyzeResult {
  remark: string;
}

/**
 * Fetch page content using Jina.ai Reader (better for antibot sites)
 */
async function fetchPageContent(url: string): Promise<{ title: string; content: string }> {
  try {
    const response = await axios.get(`https://r.jina.ai/${url}`, {
      headers: {
        "Accept": "text/plain",
      },
      timeout: 15000,
    });

    const rawContent = response.data as string;

    // Extract title from markdown (first # heading)
    const titleMatch = rawContent.match(/^#\s+(.+?)(?:\s*\|.+)?$/m);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Get first 500 chars of meaningful content for AI analysis
    const cleanedContent = rawContent
      .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
      .replace(/\[.*?\]\(.*?\)/g, "") // Remove links
      .replace(/^#+\s.*$/gm, "") // Remove headings
      .replace(/\n+/g, " ") // Replace newlines with space
      .trim()
      .slice(0, 500);

    return { title, content: cleanedContent };
  } catch (error) {
    console.error("Jina.ai fetch error:", error);
    return { title: "", content: "" };
  }
}

/**
 * Analyze a webpage and generate a brief remark (50 chars max)
 * Uses Jina.ai Reader to get page content, then Claude AI to generate summary
 */
export async function analyzePage(url: string): Promise<AnalyzeResult> {
  try {
    // Fetch page content using Jina.ai Reader
    const { title, content } = await fetchPageContent(url);

    // If we have AI API key, use it to generate a remark
    if (process.env.AI_API_KEY) {
      const remark = await generateRemarkWithAI(title, content, url);
      return { remark };
    }

    // Otherwise, create a simple remark from title
    return { remark: createSimpleRemark(title) };
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
  content: string,
  url: string
): Promise<string> {
  try {
    const apiKey = process.env.AI_API_KEY;
    const apiUrl = process.env.AI_API_URL || "https://code.newcli.com/claude/ultra/v1/messages";

    if (!apiKey) {
      return createSimpleRemark(title);
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
            content: `简洁介绍这个网站的核心功能，不超过30字，直接输出结果。\n\n网站: ${title}\n简介: ${content}`,
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
    return createSimpleRemark(title);
  } catch (error) {
    console.error("AI remark generation error:", error);
    return createSimpleRemark(title);
  }
}

/**
 * Create a simple remark from title
 */
function createSimpleRemark(title: string): string {
  return title.slice(0, 50);
}
