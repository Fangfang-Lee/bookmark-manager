"use client";

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
            ? "bg-blue-600 text-white"
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
