"use client";

import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { createClient } from "@/utils/supabase/client";
import {
  ChevronDown,
  LayoutDashboard,
  List,
  Loader2,
  LogOut,
  Menu,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./logo";

export function Header() {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, loading } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Close menus on path change directly during render
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.log(error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Menu", href: "/menu" },
    { name: "Featured", href: "/#featured" },
  ];

  const initials =
    user?.email
      ?.split("@")[0]
      .split(/[-_.]/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "BC";

  return (
    <header
      className={
        "sticky top-0 py-4 z-50 w-full transition-all duration-300 border-b bg-background/50 backdrop-blur-xl border-transparent shadow-md"
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full transition-all",
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Cart Trigger */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-all hover:border-primary hover:text-primary active:scale-90"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 animate-in zoom-in-50 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Auth Section */}
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
              <div className="hidden sm:block h-10 w-24 animate-pulse rounded-full bg-muted" />
            </div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-border bg-background p-1 pr-3 transition hover:border-primary"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {initials}
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    profileMenuOpen && "rotate-180",
                  )}
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-border bg-popover p-2 shadow-2xl">
                  <div className="px-3 py-3 border-b border-border/50">
                    <p className="text-xs text-muted-foreground">Account</p>
                    <p className="text-sm font-bold truncate">{user.email}</p>
                  </div>
                  <div className="mt-1">
                    {user.role === "admin" && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-primary font-bold hover:bg-primary/5"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/orders"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <List className="w-4 h-4 text-muted-foreground" /> My
                      Orders
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <User className="w-4 h-4 text-muted-foreground" /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={isSigningOut}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      {isSigningOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      <span>{isSigningOut ? "Signing out..." : "Logout"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-sm font-bold px-4 py-2 hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                Join Now
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted lg:hidden"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16.25 z-40 h-screen bg-background p-6 animate-in slide-in-from-right lg:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-2xl font-black border-b border-border py-4"
              >
                {link.name}
              </Link>
            ))}
            {loading ? (
              <div className="grid gap-4 pt-4">
                <div className="h-14 w-full animate-pulse rounded-2xl bg-muted" />
                <div className="h-14 w-full animate-pulse rounded-2xl bg-muted" />
              </div>
            ) : (
              !user && (
                <div className="sm:hidden grid gap-4 pt-4">
                  <Link
                    href="/auth/login"
                    className="w-full py-4 text-center rounded-2xl border border-border font-bold"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="w-full py-4 text-center rounded-2xl bg-primary text-white font-bold"
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
