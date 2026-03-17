import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { fetchPreview } from "@/lib/preview";
import { analyzePage } from "@/lib/ai";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!bookmark) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }

  const { action } = await request.json();

  // Handle click count increment
  if (action === "incrementClick") {
    const updated = await prisma.bookmark.update({
      where: { id },
      data: {
        clickCount: { increment: 1 },
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!bookmark) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }

  const { url, title, categoryId, remark, refreshPreview, refreshRemark } = await request.json();

  let thumbnail = bookmark.thumbnail;
  let favicon = bookmark.favicon;
  let finalRemark = bookmark.remark;

  if (refreshPreview || (url && url !== bookmark.url)) {
    const preview = await fetchPreview(url || bookmark.url);
    thumbnail = preview.image || thumbnail;
    favicon = preview.favicon || favicon;
  }

  // Handle remark: either use provided value or regenerate
  if (remark !== undefined) {
    finalRemark = remark;
  } else if (refreshRemark || (url && url !== bookmark.url)) {
    const analysis = await analyzePage(url || bookmark.url);
    finalRemark = analysis.remark;
  }

  const updated = await prisma.bookmark.update({
    where: { id },
    data: {
      ...(url && { url }),
      ...(title && { title }),
      ...(categoryId !== undefined && { categoryId }),
      ...(finalRemark !== undefined && { remark: finalRemark }),
      thumbnail,
      favicon,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!bookmark) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }

  await prisma.bookmark.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
