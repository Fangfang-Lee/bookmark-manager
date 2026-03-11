# Bookmark Manager Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal bookmark manager where users can register/login, create categories, add websites with auto-fetched preview thumbnails, displayed in a compact card grid layout.

**Architecture:** Next.js 16 App Router with Prisma ORM, Neon PostgreSQL, NextAuth.js for authentication. Preview images fetched via third-party API.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Prisma, Neon PostgreSQL, NextAuth.js, Vercel

---

## File Structure

```
bookmark-manager/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   ├── categories/route.ts
│   │   │   ├── bookmarks/route.ts
│   │   │   └── preview/route.ts
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── auth/              # Auth components
│   │   ├── dashboard/         # Dashboard components
│   │   └── category-card.tsx
│   │   └── bookmark-card.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # NextAuth config
│   │   └── preview.ts         # Preview image fetcher
│   └── types/
│       └── index.ts           # TypeScript types
├── .env
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Implementation Chunks

### Chunk 1: Project Setup & Database Schema

**Goal:** Initialize Next.js project, set up Prisma with Neon, create database schema

**Files:**
- Create: `bookmark-manager/package.json`
- Create: `bookmark-manager/tsconfig.json`
- Create: `bookmark-manager/tailwind.config.ts`
- Create: `bookmark-manager/next.config.ts`
- Create: `bookmark-manager/.env`
- Create: `bookmark-manager/prisma/schema.prisma`

- [ ] **Step 1: Initialize Next.js project structure**

Create package.json with dependencies:
```json
{
  "name": "bookmark-manager",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "^4.21.0",
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.4.6",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "prisma": "^5.22.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Create next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 5: Create .env template**

```
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
PREVIEW_API_URL="https://api.microlink.io"
PREVIEW_API_KEY=""
```

- [ ] **Step 6: Create Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String     @id @default(cuid())
  email     String     @unique
  password  String
  name      String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  categories Category[]
  bookmarks Bookmark[]
}

model Category {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  color     String?    @default("#3B82F6")
  icon      String?
  order     Int        @default(0)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  bookmarks Bookmark[]
}

model Bookmark {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  title      String
  url        String
  favicon    String?
  thumbnail  String?
  order      Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

- [ ] **Step 7: Install dependencies and generate Prisma client**

Run:
```bash
cd /Users/jason/cursor/bookmark-manager
npm install
npx prisma generate
```

- [ ] **Step 8: Push schema to Neon database**

Run:
```bash
npx prisma db push
```

Expected: Schema created successfully

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "chore: initial project setup with Prisma schema"
```

---

### Chunk 2: Authentication (NextAuth.js)

**Goal:** Set up NextAuth.js with email/password authentication

**Files:**
- Modify: `src/lib/auth.ts`
- Create: `src/lib/prisma.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/types/next-auth.d.ts`

- [ ] **Step 1: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Create NextAuth configuration**

Create `src/lib/auth.ts`:
```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
```

- [ ] **Step 3: Create NextAuth API route**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

- [ ] **Step 4: Create registration API**

Create `src/app/api/auth/register/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Extend NextAuth types**

Create `src/types/next-auth.d.ts`:
```typescript
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
```

- [ ] **Step 6: Create auth provider wrapper**

Create `src/components/providers.tsx`:
```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 7: Update root layout to include providers**

Create `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bookmark Manager",
  description: "Personal bookmark manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Create global CSS**

Create `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

- [ ] **Step 9: Test build**

Run:
```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: add authentication with NextAuth.js"
```

---

### Chunk 3: Login & Register Pages

**Goal:** Create login and register UI pages

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`
- Create: `src/components/auth/login-form.tsx`
- Create: `src/components/auth/register-form.tsx`

- [ ] **Step 1: Create login form component**

Create `src/components/auth/login-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition"
      >
        Sign In
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create login page**

Create `src/app/login/page.tsx`:
```typescript
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
        <LoginForm />
        <p className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create register form component**

Create `src/components/auth/register-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      return;
    }

    router.push("/login");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name (optional)
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
          minLength={6}
        />
      </div>
      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition"
      >
        Register
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Create register page**

Create `src/app/register/page.tsx`:
```typescript
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        <RegisterForm />
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Test and commit**

Run:
```bash
npm run build
```

Expected: Build succeeds

Commit:
```bash
git add .
git commit -m "feat: add login and register pages"
```

---

### Chunk 4: Category API & Management

**Goal:** Create category CRUD API endpoints and management UI

**Files:**
- Create: `src/app/api/categories/route.ts`
- Create: `src/components/dashboard/category-list.tsx`
- Create: `src/components/dashboard/add-category-modal.tsx`

- [ ] **Step 1: Create categories API (GET/POST)**

Create `src/app/api/categories/route.ts`:
```typescript
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
```

- [ ] **Step 2: Create category API (PUT/DELETE)**

Create `src/app/api/categories/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const category = await prisma.category.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const { name, color, icon, order } = await request.json();

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(color && { color }),
      ...(icon !== undefined && { icon }),
      ...(order !== undefined && { order }),
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

  const category = await prisma.category.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create category list component**

Create `src/components/dashboard/category-list.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  _count: { bookmarks: number };
}

interface Props {
  categories: Category[];
  selectedCategory?: string;
  onSelect: (categoryId: string | undefined) => void;
  onAdd: () => void;
  onEdit: (category: Category) => void;
}

export function CategoryList({
  categories,
  selectedCategory,
  onSelect,
  onAdd,
  onEdit,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onSelect(undefined)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
          selectedCategory === undefined
            ? "bg-primary text-white"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            onEdit(category);
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedCategory === category.id
              ? "text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
          style={{
            backgroundColor:
              selectedCategory === category.id ? category.color : undefined,
          }}
        >
          {category.icon && <span className="mr-1">{category.icon}</span>}
          {category.name}
          <span className="ml-1 opacity-70">({category._count.bookmarks})</span>
        </button>
      ))}
      <button
        onClick={onAdd}
        className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 transition"
      >
        + Add
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create add/edit category modal**

Create `src/components/dashboard/category-modal.tsx`:
```typescript
"use client";

import { useState } from "react";

interface Category {
  id?: string;
  name: string;
  color: string;
  icon?: string;
}

interface Props {
  category?: Category;
  onClose: () => void;
  onSave: (data: Category) => void;
  onDelete?: () => void;
}

export function CategoryModal({ category, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || "#3B82F6");
  const [icon, setIcon] = useState(category?.icon || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, color, icon: icon || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {category ? "Edit Category" : "Add Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 border rounded-md cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Icon (emoji)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g. 🚀"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-primary/90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            {category?.id && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Test and commit**

Run:
```bash
npm run build
```

Expected: Build succeeds

Commit:
```bash
git add .
git commit -feat: add category API and management UI
```

---

### Chunk 5: Bookmark API & Preview Image Fetching

**Goal:** Create bookmark CRUD API with auto-preview image fetching

**Files:**
- Create: `src/lib/preview.ts`
- Create: `src/app/api/bookmarks/route.ts`
- Create: `src/app/api/bookmarks/[id]/route.ts`
- Create: `src/components/dashboard/bookmark-card.tsx`

- [ ] **Step 1: Create preview image fetcher utility**

Create `src/lib/preview.ts`:
```typescript
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
```

- [ ] **Step 2: Create bookmarks API (GET/POST)**

Create `src/app/api/bookmarks/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { fetchPreview } from "@/lib/preview";

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

  const { url, title, categoryId } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Fetch preview
  const preview = await fetchPreview(url);

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
      order: lastBookmark ? lastBookmark.order + 1 : 0,
    },
  });

  return NextResponse.json(bookmark);
}
```

- [ ] **Step 3: Create bookmark API (PUT/DELETE)**

Create `src/app/api/bookmarks/[id]/route.ts`:
```typescript
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
```

- [ ] **Step 4: Create bookmark card component**

Create `src/components/dashboard/bookmark-card.tsx`:
```typescript
"use client";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  thumbnail?: string | null;
  favicon?: string | null;
}

interface Props {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
}

export function BookmarkCard({ bookmark, onEdit, onDelete }: Props) {
  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group relative bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative">
        {bookmark.thumbnail ? (
          <img
            src={bookmark.thumbnail}
            alt={bookmark.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {bookmark.favicon ? (
              <img
                src={bookmark.favicon}
                alt=""
                className="w-8 h-8"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            )}
          </div>
        )}

        {/* Action buttons - show on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(bookmark);
            }}
            className="p-1.5 bg-white/90 rounded-md shadow-sm hover:bg-white"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(bookmark.id);
            }}
            className="p-1.5 bg-white/90 rounded-md shadow-sm hover:bg-white text-red-500"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="p-2">
        <h3 className="text-sm font-medium truncate" title={bookmark.title}>
          {bookmark.title}
        </h3>
      </div>
    </a>
  );
}
```

- [ ] **Step 5: Test and commit**

Run:
```bash
npm run build
```

Expected: Build succeeds

Commit:
```bash
git add .
git commit -m "feat: add bookmark API with preview image fetching"
```

---

### Chunk 6: Dashboard Page

**Goal:** Create main dashboard page with category list and bookmark grid

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/add-bookmark-modal.tsx`
- Modify: `src/app/page.tsx` (redirect to dashboard or login)

- [ ] **Step 1: Create add bookmark modal**

Create `src/components/dashboard/add-bookmark-modal.tsx`:
```typescript
"use client";

import { useState } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Bookmark {
  id?: string;
  url: string;
  title: string;
  categoryId?: string | null;
}

interface Props {
  categories: Category[];
  bookmark?: Bookmark;
  onClose: () => void;
  onSave: (data: Bookmark) => void;
}

export function AddBookmarkModal({
  categories,
  bookmark,
  onClose,
  onSave,
}: Props) {
  const [url, setUrl] = useState(bookmark?.url || "");
  const [title, setTitle] = useState(bookmark?.title || "");
  const [categoryId, setCategoryId] = useState(
    bookmark?.categoryId || ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onSave({
      url,
      title,
      categoryId: categoryId || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {bookmark?.id ? "Edit Bookmark" : "Add Bookmark"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Auto-fetched if empty"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create dashboard page**

Create `src/app/dashboard/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CategoryList } from "@/components/dashboard/category-list";
import { CategoryModal } from "@/components/dashboard/category-modal";
import { BookmarkCard } from "@/components/dashboard/bookmark-card";
import { AddBookmarkModal } from "@/components/dashboard/add-bookmark-modal";

interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  _count: { bookmarks: number };
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  thumbnail?: string | null;
  favicon?: string | null;
  categoryId?: string | null;
  category?: Category | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >();
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<
    Bookmark | undefined
  >();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCategories();
      fetchBookmarks();
    }
  }, [session, selectedCategory]);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
    }
  };

  const fetchBookmarks = async () => {
    const url = selectedCategory
      ? `/api/bookmarks?categoryId=${selectedCategory}`
      : "/api/bookmarks";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setBookmarks(data);
    }
  };

  const handleSaveCategory = async (data: {
    name: string;
    color: string;
    icon?: string;
  }) => {
    const method = editingCategory?.id ? "PUT" : "POST";
    const url = editingCategory?.id
      ? `/api/categories/${editingCategory.id}`
      : "/api/categories";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      fetchCategories();
      setShowCategoryModal(false);
      setEditingCategory(undefined);
    }
  };

  const handleDeleteCategory = async () => {
    if (!editingCategory?.id) return;

    const res = await fetch(`/api/categories/${editingCategory.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchCategories();
      setShowCategoryModal(false);
      setEditingCategory(undefined);
      if (selectedCategory === editingCategory.id) {
        setSelectedCategory(undefined);
      }
    }
  };

  const handleSaveBookmark = async (data: {
    url: string;
    title: string;
    categoryId: string | null;
  }) => {
    const method = editingBookmark?.id ? "PUT" : "POST";
    const url = editingBookmark?.id
      ? `/api/bookmarks/${editingBookmark.id}`
      : "/api/bookmarks";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      fetchBookmarks();
      fetchCategories();
      setShowBookmarkModal(false);
      setEditingBookmark(undefined);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });

    if (res.ok) {
      fetchBookmarks();
      fetchCategories();
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">My Bookmarks</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Add bookmark button */}
        <div className="mb-4">
          <button
            onClick={() => {
              setEditingBookmark(undefined);
              setShowBookmarkModal(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            + Add Bookmark
          </button>
        </div>

        {/* Categories */}
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
          onAdd={() => {
            setEditingCategory(undefined);
            setShowCategoryModal(true);
          }}
          onEdit={(category) => {
            setEditingCategory(category);
            setShowCategoryModal(true);
          }}
        />

        {/* Bookmarks grid */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No bookmarks yet. Click &quot;Add Bookmark&quot; to get started.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={(b) => {
                  setEditingBookmark(b);
                  setShowBookmarkModal(true);
                }}
                onDelete={handleDeleteBookmark}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(undefined);
          }}
          onSave={handleSaveCategory}
          onDelete={
            editingCategory?.id ? handleDeleteCategory : undefined
          }
        />
      )}

      {showBookmarkModal && (
        <AddBookmarkModal
          categories={categories}
          bookmark={editingBookmark}
          onClose={() => {
            setShowBookmarkModal(false);
            setEditingBookmark(undefined);
          }}
          onSave={handleSaveBookmark}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update root page to redirect**

Modify `src/app/page.tsx`:
```typescript
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
```

- [ ] **Step 4: Test and commit**

Run:
```bash
npm run build
```

Expected: Build succeeds

Commit:
```bash
git add .
git commit -m "feat: add dashboard page with bookmark management"
```

---

### Chunk 7: Environment & Deployment

**Goal:** Configure environment variables and prepare for Vercel deployment

**Files:**
- Modify: `.env`
- Create: `vercel.json` (optional)

- [ ] **Step 1: Update .env with Neon connection string]

Add your Neon database URL:
```
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="generate-a-secure-random-string-here"
NEXTAUTH_URL="https://your-project.vercel.app"
```

- [ ] **Step 2: Test locally with production build]

Run:
```bash
npm run build && npm run start
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "chore: add environment configuration"
```

---

## Summary

This plan includes 7 chunks:

1. **Project Setup** - Next.js + Prisma + Neon
2. **Authentication** - NextAuth.js with email/password
3. **Login & Register Pages** - UI for auth
4. **Category Management** - CRUD API + UI
5. **Bookmark Management** - CRUD API + preview fetching
6. **Dashboard** - Main page with categories and bookmark grid
7. **Deployment** - Environment + Vercel

Total estimated tasks: ~35 steps

---

**Plan saved to:** `docs/superpowers/plans/2025-03-11-bookmark-manager-implementation.md`

Ready to execute?
