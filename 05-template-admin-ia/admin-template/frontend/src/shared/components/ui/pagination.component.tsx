import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  variant?: "numeric" | "arrows-only";
  siblingCount?: number;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getPages(currentPage: number, totalPages: number, siblingCount: number): (number | "...")[] {
  const totalPageNumbers = siblingCount * 2 + 5;
  if (totalPageNumbers >= totalPages) return range(1, totalPages);
  const left = Math.max(currentPage - siblingCount, 1);
  const right = Math.min(currentPage + siblingCount, totalPages);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < totalPages - 1;
  const pages: (number | "...")[] = [1];
  if (showLeftEllipsis) pages.push("...");
  for (const p of range(Math.max(left, 2), Math.min(right, totalPages - 1))) pages.push(p);
  if (showRightEllipsis) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}

const ChevronLeft = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M10 12L6 8l4-4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      variant = "numeric",
      siblingCount = 1,
      className,
      ...props
    },
    ref,
  ) => {
    const goPrev = () => currentPage > 1 && onPageChange(currentPage - 1);
    const goNext = () => currentPage < totalPages && onPageChange(currentPage + 1);
    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ui-gray-300 bg-white text-ui-gray-700 transition hover:bg-ui-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ChevronLeft}
        </button>
        {variant === "numeric" ? (
          <ul className="flex items-center gap-1">
            {getPages(currentPage, totalPages, siblingCount).map((p, idx) =>
              p === "..." ? (
                <li
                  key={`ellipsis-${idx}`}
                  className="inline-flex h-9 min-w-9 items-center justify-center px-2 text-sm text-ui-gray-500"
                >
                  …
                </li>
              ) : (
                <li key={p}>
                  <button
                    type="button"
                    aria-current={p === currentPage ? "page" : undefined}
                    onClick={() => onPageChange(p)}
                    className={cn(
                      "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition",
                      p === currentPage
                        ? "bg-ui-brand-500 text-white"
                        : "text-ui-gray-700 hover:bg-ui-gray-100",
                    )}
                  >
                    {p}
                  </button>
                </li>
              ),
            )}
          </ul>
        ) : (
          <span className="text-sm text-ui-gray-600">
            Page {currentPage} of {totalPages}
          </span>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ui-gray-300 bg-white text-ui-gray-700 transition hover:bg-ui-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ChevronRight}
        </button>
      </nav>
    );
  },
);
Pagination.displayName = "Pagination";
