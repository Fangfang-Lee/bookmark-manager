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
  const search = searchParams.get("search");
  const sort = searchParams.get("sort"); // "asc" or "desc" for clickCount

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: session.user.id,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { remark: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      category: true,
    },
    orderBy: sort === "asc"
      ? { clickCount: "asc" }
      : { clickCount: "desc" },
  });

  return NextResponse.json(bookmarks);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, title, categoryId, remark, thumbnail } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Fetch preview (only if no custom thumbnail provided)
  const preview = thumbnail ? { title: null, image: null, favicon: null } : await fetchPreview(url);

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
      thumbnail: thumbnail || preview.image,
      remark: finalRemark || null,
      order: lastBookmark ? lastBookmark.order + 1 : 0,
    },
  });

  return NextResponse.json(bookmark);
}
