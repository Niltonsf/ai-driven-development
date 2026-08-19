"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { cn } from "@/shared/utils/cn";
import { Checkbox } from "./checkbox.component";

export interface DataTableColumn<TData> {
  key: string;
  header: ReactNode;
  cell?: (row: TData) => ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface DataTableSelection {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export interface DataTableSort {
  key: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<TData>
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  rowKey: (row: TData) => string;
  selection?: DataTableSelection;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  empty?: ReactNode;
  loading?: boolean;
}

const SortIcon = ({ direction }: { direction?: "asc" | "desc" }) => (
  <svg
    className={cn(
      "ml-1 inline-block h-3 w-3 text-ui-gray-400 transition",
      direction === "desc" ? "rotate-180" : "",
    )}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4 10l4-4 4 4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function DataTableInner<TData>(
  {
    columns,
    data,
    rowKey,
    selection,
    sort,
    onSortChange,
    empty,
    loading,
    className,
    ...props
  }: DataTableProps<TData>,
  ref: React.Ref<HTMLDivElement>,
) {
  const ids = data.map(rowKey);
  const allSelected =
    selection != null && ids.length > 0 && ids.every((id) => selection.selected.includes(id));
  const toggleAll = () => {
    if (!selection) return;
    selection.onChange(allSelected ? [] : ids);
  };
  const toggleOne = (id: string) => {
    if (!selection) return;
    selection.onChange(
      selection.selected.includes(id)
        ? selection.selected.filter((s) => s !== id)
        : [...selection.selected, id],
    );
  };

  return (
    <div
      ref={ref}
      className={cn("custom-scrollbar overflow-x-auto", className)}
      {...props}
    >
      <table className="w-full min-w-full">
        <thead className="border-y border-ui-table-rowBorder bg-ui-table-headerBg">
          <tr>
            {selection ? (
              <th className="px-5 py-3 text-left sm:px-6">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
            ) : null}
            {columns.map((col) => {
              const active = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "px-5 py-3 text-xs font-medium text-ui-table-headerFg sm:px-6",
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left",
                  )}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      className="inline-flex items-center font-medium text-ui-table-headerFg hover:text-ui-gray-700"
                      onClick={() =>
                        onSortChange({
                          key: col.key,
                          direction:
                            active && sort?.direction === "asc" ? "desc" : "asc",
                        })
                      }
                    >
                      {col.header}
                      <SortIcon direction={active ? sort?.direction : undefined} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-ui-table-rowBorder">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selection ? 1 : 0)}
                className="px-5 py-8 text-center text-sm text-ui-gray-500"
              >
                Loading…
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selection ? 1 : 0)}
                className="px-5 py-12"
              >
                {empty ?? (
                  <div className="text-center text-sm text-ui-gray-500">
                    No data available.
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const id = rowKey(row);
              const selected = selection?.selected.includes(id);
              return (
                <tr
                  key={id}
                  className={cn(
                    "transition hover:bg-ui-table-rowHoverBg",
                    selected ? "bg-ui-brand-50/40" : "",
                  )}
                >
                  {selection ? (
                    <td className="px-5 py-4 sm:px-6">
                      <Checkbox
                        aria-label="Select row"
                        checked={!!selected}
                        onChange={() => toggleOne(id)}
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-5 py-4 text-sm text-ui-table-cellFg sm:px-6",
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left",
                      )}
                    >
                      {col.cell
                        ? col.cell(row)
                        : ((row as unknown as Record<string, ReactNode>)[col.key] ?? null)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

const DataTableComponent = forwardRef(DataTableInner) as <TData>(
  props: DataTableProps<TData> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof DataTableInner>;

function DataTableToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-ui-card-border px-5 py-4 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

function DataTableEmpty({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-12 text-center text-sm text-ui-gray-500", className)}
      {...props}
    />
  );
}

export const DataTable = Object.assign(DataTableComponent, {
  Toolbar: DataTableToolbar,
  Empty: DataTableEmpty,
});

// re-exports for advanced cases
export type DataTableHeaderProps = ThHTMLAttributes<HTMLTableCellElement>;
export type DataTableTableProps = TableHTMLAttributes<HTMLTableElement>;
