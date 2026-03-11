import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchPreview } from "@/lib/preview";
import { analyzePage } from "@/lib/ai";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Fetch preview to get title
  const preview = await fetchPreview(url);

  // Analyze page to generate remark
  const analysis = await analyzePage(url);

  return NextResponse.json({
    title: preview.title || "",
    remark: analysis.remark || "",
  });
}
