"use client";

import { useState, useRef } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Bookmark {
  id?: string;
  url: string;
  title: string;
  remark?: string | null;
  categoryId?: string | null;
  thumbnail?: string | null;
}

interface Props {
  categories: Category[];
  bookmark?: Bookmark;
  onClose: () => void;
  onSave: (data: { url: string; title: string; remark: string; categoryId: string | null; thumbnail?: string | null }) => void;
}

export function AddBookmarkModal({
  categories,
  bookmark,
  onClose,
  onSave,
}: Props) {
  const [url, setUrl] = useState(bookmark?.url || "");
  const [title, setTitle] = useState(bookmark?.title || "");
  const [remark, setRemark] = useState(bookmark?.remark || "");
  const [categoryId, setCategoryId] = useState(
    bookmark?.categoryId || ""
  );
  const [thumbnail, setThumbnail] = useState<string | null>(bookmark?.thumbnail || null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!url) return;

    setAnalyzing(true);
    try {
      const res = await fetch("/api/bookmarks/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        const data = await res.json();
        setRemark(data.remark || "");
        if (!title && data.title) {
          setTitle(data.title);
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setThumbnail(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setThumbnail(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onSave({
      url,
      title,
      remark,
      categoryId: categoryId || null,
      thumbnail,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {bookmark?.id ? "Edit Bookmark" : "Add Bookmark"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
                placeholder="https://example.com"
                required
              />
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!url || analyzing}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm whitespace-nowrap"
              >
                {analyzing ? "Analyzing..." : "AI Analyze"}
              </button>
            </div>
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
            <label className="block text-sm font-medium mb-1">
              Remark (AI generated, editable)
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value.slice(0, 50))}
              className="w-full px-3 py-2 border rounded-md resize-none"
              placeholder="AI will auto-generate a brief description..."
              rows={2}
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">{remark.length}/50</p>
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
          <div>
            <label className="block text-sm font-medium mb-1">Cover Image</label>
            <div className="space-y-2">
              {thumbnail ? (
                <div className="relative">
                  <img
                    src={thumbnail}
                    alt="Cover preview"
                    className="w-full h-32 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                >
                  <div className="text-center text-gray-500">
                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm">Click to upload image</span>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-xs text-gray-500">
                Supported: JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
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
