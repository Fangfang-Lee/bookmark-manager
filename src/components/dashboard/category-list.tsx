"use client";

import { useState, useRef } from "react";

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
  onReorder?: (categoryIds: string[]) => void;
}

export function CategoryList({
  categories,
  selectedCategory,
  onSelect,
  onAdd,
  onEdit,
  onReorder,
}: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLButtonElement | null>(null);

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedId(categoryId);
    dragNodeRef.current = e.target as HTMLButtonElement;
    // Add drag styling after a frame to prevent immediate visual feedback
    requestAnimationFrame(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = "0.5";
      }
    });
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "1";
    }
    setDraggedId(null);
    setDragOverId(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== categoryId) {
      setDragOverId(categoryId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId || !onReorder) {
      setDragOverId(null);
      return;
    }

    const draggedIndex = categories.findIndex((c) => c.id === draggedId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder categories
    const newCategories = [...categories];
    const [draggedCategory] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);

    onReorder(newCategories.map((c) => c.id));
    setDragOverId(null);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onSelect(undefined)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
          selectedCategory === undefined
            ? "bg-blue-600 text-white"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          draggable
          onDragStart={(e) => handleDragStart(e, category.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, category.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, category.id)}
          onClick={() => onSelect(category.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            onEdit(category);
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-grab active:cursor-grabbing ${
            selectedCategory === category.id
              ? "text-white"
              : "bg-gray-100 hover:bg-gray-200"
          } ${dragOverId === category.id ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
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
