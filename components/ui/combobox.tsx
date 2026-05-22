"use client";

import * as React from "react";
import { Command } from "cmdk";
import { cn } from "@/lib/utils";

interface ComboboxOption {
  value: string;
  label: string;
  prefix?: React.ReactNode;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  allowFreeText?: boolean;
  onFreeTextSelect?: (text: string) => void;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Search...",
  emptyMessage = "No results found.",
  allowFreeText = false,
  onFreeTextSelect,
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Display label for current value
  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? value;

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSelect(optionValue: string) {
    onValueChange(optionValue);
    setOpen(false);
    setSearch("");
  }

  function handleFreeTextSelect() {
    if (!search.trim()) return;
    if (onFreeTextSelect) {
      onFreeTextSelect(search.trim());
    } else {
      onValueChange(search.trim());
    }
    setOpen(false);
    setSearch("");
  }

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const showFreeText =
    allowFreeText &&
    search.trim().length > 0 &&
    filteredOptions.length === 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger input */}
      <input
        type="text"
        readOnly
        disabled={disabled}
        value={open ? "" : selectedLabel}
        placeholder={open ? "" : placeholder}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            setSearch("");
          }
        }}
        className={cn(
          "h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          open && "border-ring ring-3 ring-ring/50"
        )}
        onChange={() => {}}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[180px] overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          <Command shouldFilter={false}>
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder={placeholder}
              className={cn(
                "w-full border-b border-border bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground"
              )}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  setSearch("");
                }
              }}
            />
            <Command.List className="max-h-[220px] overflow-y-auto p-1">
              {filteredOptions.length === 0 && !showFreeText && (
                <Command.Empty className="py-2 px-2.5 text-sm text-muted-foreground">
                  {emptyMessage}
                </Command.Empty>
              )}
              {filteredOptions.map((option) => (
                <Command.Item
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
                    value === option.value && "font-medium"
                  )}
                >
                  {option.prefix && (
                    <span className="shrink-0">{option.prefix}</span>
                  )}
                  {option.label}
                </Command.Item>
              ))}
              {showFreeText && (
                <Command.Item
                  value={`__free__${search}`}
                  onSelect={handleFreeTextSelect}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm italic",
                    "hover:bg-accent hover:text-accent-foreground",
                    "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                  )}
                >
                  Use &ldquo;{search}&rdquo;
                </Command.Item>
              )}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
