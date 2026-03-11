import axios from "axios";

interface PreviewData {
  title?: string;
  image?: string;
  favicon?: string;
}

export async function fetchPreview(url: string): Promise<PreviewData> {
  try {
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
      return {
        title: data.title,
        image: data.image?.url,
        favicon: data.favicon,
      };
    }

    return {};
  } catch (error) {
    console.error("Preview fetch error:", error);
    return {};
  }
}
