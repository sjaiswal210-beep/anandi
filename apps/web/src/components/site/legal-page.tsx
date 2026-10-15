import Link from 'next/link';
import { PROJECT } from './site-data';

/**
 * Shared shell for the static content/legal pages (Privacy, Terms, About,
 * Contact). These exist primarily so the site has the real, substantive pages
 * Google AdSense requires for approval, and they double as proper SEO pages.
 * Kept server-rendered (no 'use client') so the content is in the initial HTML
 * for crawlers.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Simple header with a route back to the site */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
          <Link href="/project" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/richland-transparent.png"
              alt="Rich-Land Developers"
              className="h-10 w-10 object-contain"
            />
            <span className="text-base font-bold text-white">{PROJECT.name}</span>
          </Link>
          <Link
            href="/project"
            className="text-sm font-semibold text-amber-400 hover:underline"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
        {updated && (
          <p className="mt-2 text-sm text-slate-500">Last updated: {updated}</p>
        )}
        <div className="prose-invert mt-8 space-y-6 text-[15px] leading-relaxed text-slate-300 [&_a]:text-amber-400 [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
          {children}
        </div>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-3xl px-5 text-xs text-slate-500">
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/project" className="hover:text-amber-400">Home</Link>
            <Link href="/about" className="hover:text-amber-400">About</Link>
            <Link href="/contact" className="hover:text-amber-400">Contact</Link>
            <Link href="/privacy" className="hover:text-amber-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-amber-400">Terms</Link>
          </nav>
          <p className="mt-4">
            © {new Date().getFullYear()} {PROJECT.builder} ({PROJECT.partners}). All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
