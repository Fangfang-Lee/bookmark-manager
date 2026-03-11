import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { fetchPreview } from "@/lib/preview";

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

  const { url, title, categoryId, refreshPreview } = await request.json();

  let thumbnail = bookmark.thumbnail;
  let favicon = bookmark.favicon;

  if (refreshPreview || (url && url !== bookmark.url)) {
    const preview = await fetchPreview(url || bookmark.url);
    thumbnail = preview.image || thumbnail;
    favicon = preview.favicon || favicon;
  }

  const updated = await prisma.bookmark.update({
    where: { id },
    data: {
      ...(url && { url }),
      ...(title && { title }),
      ...(categoryId !== undefined && { categoryId }),
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
