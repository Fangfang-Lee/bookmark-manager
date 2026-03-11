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
  remark?: string | null;
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
    remark: string;
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
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
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
