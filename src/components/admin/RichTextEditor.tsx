import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { cmd: "bold", icon: Bold, label: "Bold" },
  { cmd: "italic", icon: Italic, label: "Italic" },
  { cmd: "underline", icon: Underline, label: "Underline" },
  { cmd: "insertUnorderedList", icon: List, label: "Bulleted list" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
];

/** Minimal rich-text editor storing HTML. */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  return (
    <div className={cn("rounded-md border border-input bg-background", className)}>
      <div className="flex gap-1 border-b border-border p-1">
        {actions.map(({ cmd, icon: Icon, label }) => (
          <button
            key={cmd}
            type="button"
            aria-label={label}
            title={label}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand(cmd);
              if (ref.current) onChange(ref.current.innerHTML);
            }}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="min-h-28 px-3 py-2 text-sm outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
