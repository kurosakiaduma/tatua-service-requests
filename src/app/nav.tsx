"use client";

// Authenticated navigation with responsive links, account actions, and theme control.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Shield, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions";
import { ThemeToggle } from "@/app/theme-toggle";
import { SubmitButton } from "@/components/ui/submit-button";
import { LinkPendingIndicator } from "@/components/ui/link-pending";

/** Renders navigation appropriate to the current user's role. */
export function Nav({
  name,
  role,
  admin = false,
}: {
  name: string;
  role?: string;
  admin?: boolean;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const [open, setOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDetailsElement>(null);
  const links = [
    { href: "/dashboard", label: "Report an issue", tab: "new" },
    { href: "/dashboard?tab=requests", label: "My requests", tab: "requests" },
    ...(admin ? [{ href: "/admin", label: "Admin dashboard" }] : []),
  ] as const;

  // Close both menus on browser back/forward navigation.
  useEffect(() => {
    const closeMenus = () => {
      setOpen(false);
      if (profileMenuRef.current) profileMenuRef.current.open = false;
    };
    window.addEventListener("popstate", closeMenus);
    return () => window.removeEventListener("popstate", closeMenus);
  }, []);

  // The profile menu is a native <details>; close it when focus or a click leaves it.
  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        profileMenuRef.current.open = false;
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") profileMenuRef.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const closeProfileMenu = () => {
    if (profileMenuRef.current) profileMenuRef.current.open = false;
  };

  const goToTab = (tab: string) => {
    setOpen(false);
    closeProfileMenu();
    window.history.pushState(null, "", `/dashboard?tab=${tab}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center gap-2 text-xl font-bold text-primary">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Shield size={20} />
          </span>
          Tatua
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLinkItem
              key={link.href}
              link={link}
              isDashboard={isDashboard}
              goToTab={goToTab}
              onNavigate={closeProfileMenu}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            />
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <details ref={profileMenuRef} className="relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border bg-card px-3 text-sm font-semibold">
              <UserRound size={16} />
              {name}
              <span className="text-xs text-muted-foreground">({role ?? "citizen"})</span>
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-popover p-3 shadow-xl">
              <p className="px-2 py-2 text-sm font-semibold">{name}</p>
              <p className="px-2 pb-3 text-xs text-muted-foreground capitalize">
                {role ?? "citizen"} account
              </p>
              <form action={signOut} onSubmit={closeProfileMenu}>
                <SubmitButton
                  label="Sign out"
                  pendingLabel="Signing out…"
                  variant="secondary"
                  className="min-h-11 w-full px-3 text-left text-sm"
                />
              </form>
            </div>
          </details>
        </div>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
          className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-lg border md:hidden"
        >
          <Menu />
        </button>
      </div>
      {open && (
        <div className="mobile-menu fixed inset-0 z-[1000] min-h-dvh overflow-y-auto bg-background p-5 text-foreground md:hidden">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-xl font-bold text-primary"
            >
              Tatua
            </Link>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-lg border"
            >
              <X />
            </button>
          </div>
          <nav className="mt-8 grid gap-2">
            {links.map((link) => (
              <NavLinkItem
                key={link.href}
                link={link}
                isDashboard={isDashboard}
                goToTab={goToTab}
                onNavigate={() => setOpen(false)}
                className="cursor-pointer min-h-12 rounded-xl border bg-card px-4 py-3 text-base font-semibold hover:bg-accent block"
              />
            ))}
          </nav>
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <span className="text-sm text-muted-foreground">
              {name} · {role ?? "citizen"}
            </span>
            <ThemeToggle />
          </div>
          <form action={signOut} className="mt-4" onSubmit={() => setOpen(false)}>
            <SubmitButton
              label="Sign out"
              pendingLabel="Signing out…"
              variant="secondary"
              className="w-full rounded-xl text-left px-4"
            />
          </form>
        </div>
      )}
    </header>
  );
}

function NavLinkItem({
  link,
  isDashboard,
  goToTab,
  onNavigate,
  className,
}: {
  link: { href: string; label: string; tab?: "new" | "requests" };
  isDashboard: boolean;
  goToTab: (tab: string) => void;
  onNavigate?: () => void;
  className: string;
}) {
  // On the dashboard these links switch tabs instantly without a server round trip.
  // Elsewhere they remain normal navigations.
  if (isDashboard && link.tab) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          goToTab(link.tab!);
        }}
        className={`${className} w-full text-left`}
      >
        {link.label}
      </button>
    );
  }
  return (
    <Link href={link.href} onClick={onNavigate} className={className}>
      {link.label}
      <LinkPendingIndicator />
    </Link>
  );
}
