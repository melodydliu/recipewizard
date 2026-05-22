"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  BookOpen,
  Flower2,
  Package,
  Leaf,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const nav = [
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/library", label: "Recipe Library", icon: BookOpen },
  {
    label: "Master Catalog",
    icon: Flower2,
    children: [
      { href: "/catalog/flowers", label: "Flowers", icon: Flower2 },
      { href: "/catalog/hard-goods", label: "Hard Goods", icon: Package },
      { href: "/catalog/leis", label: "Leis", icon: Leaf },
    ],
  },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

type NavItem = (typeof nav)[number];
type NavGroup = Extract<NavItem, { children: readonly { href: string; label: string; icon: typeof Flower2 }[] }>;
type NavLink = Extract<NavItem, { href: string }>;

export function Sidebar() {
  const pathname = usePathname();
  const [catalogOpen, setCatalogOpen] = useState(
    pathname.startsWith("/catalog")
  );

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-display text-lg font-medium tracking-tight">
          Recipe Wizard
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map((item) => {
          if ("children" in item) {
            const group = item as NavGroup;
            return (
              <div key={group.label}>
                <button
                  onClick={() => setCatalogOpen((o) => !o)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <group.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      catalogOpen && "rotate-180"
                    )}
                  />
                </button>
                {catalogOpen && (
                  <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l pl-3">
                    {group.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                          pathname === child.href
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <child.icon className="h-3.5 w-3.5" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          const link = item as NavLink;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                pathname === link.href ||
                  pathname.startsWith(link.href + "/")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
