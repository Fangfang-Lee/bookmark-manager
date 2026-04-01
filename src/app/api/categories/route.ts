import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { bookmarks: true },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, color, icon } = await request.json();

  if (!name) {
    return NextResponse.json(
      { error: "Category name is required" },
      { status: 400 }
    );
  }

  const lastCategory = await prisma.category.findFirst({
    where: { userId: session.user.id },
    orderBy: { order: "desc" },
  });

  const category = await prisma.category.create({
    data: {
      userId: session.user.id,
      name,
      color: color || "#3B82F6",
      icon,
      order: lastCategory ? lastCategory.order + 1 : 0,
    },
  });

  return NextResponse.json(category);
}

// Batch update category order
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { categoryIds } = await request.json();

  if (!Array.isArray(categoryIds)) {
    return NextResponse.json(
      { error: "categoryIds must be an array" },
      { status: 400 }
    );
  }

  // Verify all categories belong to the user
  const categories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds },
      userId: session.user.id,
    },
  });

  if (categories.length !== categoryIds.length) {
    return NextResponse.json(
      { error: "Some categories not found or not owned by user" },
      { status: 400 }
    );
  }

  // Update order for each category
  const updates = categoryIds.map((id, index) =>
    prisma.category.update({
      where: { id },
      data: { order: index },
    })
  );

  await prisma.$transaction(updates);

  return NextResponse.json({ success: true });
}
