import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { fetchPreview } from "@/lib/preview";
import { analyzePage } from "@/lib/ai";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: session.user.id,
      ...(categoryId && { categoryId }),
    },
    include: {
      category: true,
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(bookmarks);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, title, categoryId, remark } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Fetch preview
  const preview = await fetchPreview(url);

  // Analyze page to generate remark if not provided
  let finalRemark = remark;
  if (!finalRemark) {
    const analysis = await analyzePage(url);
    finalRemark = analysis.remark;
  }

  const lastBookmark = await prisma.bookmark.findFirst({
    where: { userId: session.user.id },
    orderBy: { order: "desc" },
  });

  const bookmark = await prisma.bookmark.create({
    data: {
      userId: session.user.id,
      url,
      title: title || preview.title || url,
      categoryId: categoryId || null,
      favicon: preview.favicon,
      thumbnail: preview.image,
      remark: finalRemark || null,
      order: lastBookmark ? lastBookmark.order + 1 : 0,
    },
  });

  return NextResponse.json(bookmark);
}
