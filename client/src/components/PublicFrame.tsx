/**
 * Shared public-page chrome keeps every destination connected to the same
 * primary navigation and gives mobile users an immediate route back home.
 */
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { assetUrl } from "@/lib/assets";

const navigation = [
  ["Collective", "/collective"],
  ["People", "/people"],
  ["Capabilities", "/capabilities"],
  ["Contact", "/contact"],
  ["Team access", "/dashboard"],
] as const;

export function PublicFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="route-page">
      <header className="route-header">
        <Link href="/" className="brand-lockup" aria-label="XY COMBINATOR home">
          <span className="brand-mark-shell" aria-hidden="true"><img src={assetUrl("/manus-storage/xy-combinator-brand-mark_8b6de4c4.png")} alt="" className="brand-mark" /><i /></span>
          <span className="brand-wordmark"><b>XY</b><b>COMBINATOR</b></span>
        </Link>
        <nav className="route-nav" aria-label="Main navigation">
          {navigation.map(([name, href]) => <Link key={href} href={href}>{name}</Link>)}
        </nav>
        <span className="route-label">{label}</span>
      </header>
      {children}
      <footer className="route-footer">
        <span>XY COMBINATOR / 2026</span>
        <Link href="/contact">Start a conversation <ArrowUpRight size={14} /></Link>
      </footer>
    </div>
  );
}
