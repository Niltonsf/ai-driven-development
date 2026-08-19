"use client";

import {
  forwardRef,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/shared/utils/cn";
import { Progress } from "./progress.component";
import { IconButton } from "./icon-button.component";

export interface FileUploadFile {
  file: File;
  progress?: number;
}

export interface FileUploadProps extends Omit<HTMLAttributes<HTMLDivElement>, "onDrop"> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  description?: ReactNode;
  onFiles: (files: File[]) => void;
  files?: FileUploadFile[];
  onRemove?: (file: File) => void;
}

const UploadIcon = (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className="text-ui-gray-500"
  >
    <path
      d="M11 21l5-5 5 5M16 16v10M26 21.001V25a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-3.999M22 12.5a6 6 0 0 0-11.74-1.806A4.5 4.5 0 0 0 11 19.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      accept,
      multiple,
      maxSize,
      description,
      onFiles,
      files,
      onRemove,
      className,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [active, setActive] = useState(false);

    const handle = (list: FileList | null) => {
      if (!list) return;
      const arr = Array.from(list);
      const filtered = maxSize ? arr.filter((f) => f.size <= maxSize) : arr;
      if (filtered.length > 0) onFiles(filtered);
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setActive(false);
      handle(e.dataTransfer.files);
    };

    return (
      <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setActive(true);
          }}
          onDragLeave={() => setActive(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-ui-fileUpload-bg px-6 py-10 text-center transition",
            active
              ? "border-ui-fileUpload-borderActive"
              : "border-ui-fileUpload-border hover:border-ui-fileUpload-borderActive",
          )}
        >
          {UploadIcon}
          <div className="text-sm font-medium text-ui-fileUpload-fg">
            <span className="text-ui-brand-500">Click to upload</span> or drag and drop
          </div>
          {description ? (
            <div className="text-xs text-ui-gray-500">{description}</div>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={(e) => handle(e.target.files)}
          />
        </div>
        {files && files.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {files.map((f, idx) => (
              <li
                key={`${f.file.name}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-ui-card-border bg-white px-4 py-3"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ui-gray-800">
                      {f.file.name}
                    </span>
                    <span className="shrink-0 text-xs text-ui-gray-500">
                      {(f.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  {typeof f.progress === "number" ? (
                    <Progress value={f.progress} className="mt-2" />
                  ) : null}
                </div>
                {onRemove ? (
                  <IconButton
                    aria-label={`Remove ${f.file.name}`}
                    variant="ghost"
                    size="sm"
                    icon={TrashIcon}
                    onClick={() => onRemove(f.file)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  },
);
FileUpload.displayName = "FileUpload";
