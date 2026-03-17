"use client";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  thumbnail?: string | null;
  favicon?: string | null;
  remark?: string | null;
  clickCount?: number;
}

interface Props {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onClick?: (bookmark: Bookmark) => void;
}

export function BookmarkCard({ bookmark, onEdit, onDelete, onClick }: Props) {
  const handleClick = () => {
    if (onClick) {
      onClick(bookmark);
    }
  };

  return (
    <div className="block group relative bg-white rounded-md shadow-sm border hover:shadow-lg hover:z-10 transition-all duration-200 hover:-translate-y-1">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        title={bookmark.remark || bookmark.title}
        onClick={handleClick}
      >
      {/* Thumbnail - smaller size */}
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
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition flex gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(bookmark);
            }}
            className="p-1 bg-white/90 rounded shadow-sm hover:bg-white"
          >
            <svg
              className="w-3 h-3"
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
            className="p-1 bg-white/90 rounded shadow-sm hover:bg-white text-red-500"
          >
            <svg
              className="w-3 h-3"
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
      <div className="p-1.5">
        <h3 className="text-xs font-medium truncate" title={bookmark.title}>
          {bookmark.title}
        </h3>
        {bookmark.clickCount !== undefined && bookmark.clickCount > 0 && (
          <div className="text-xs text-gray-400 mt-0.5">
            {bookmark.clickCount} 次点击
          </div>
        )}
      </div>

      {/* Remark tooltip on hover */}
      {bookmark.remark && (
        <div className="absolute left-0 right-0 bottom-full mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal z-20">
          {bookmark.remark}
        </div>
      )}
      </a>
    </div>
  );
}
