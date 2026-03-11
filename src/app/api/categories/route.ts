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
