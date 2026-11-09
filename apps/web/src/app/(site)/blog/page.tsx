import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ArrowRight, User, Calendar, BookOpen } from 'lucide-react';
import { ARTICLES } from '@/components/site/blog-data';
import { img, PROJECT } from '@/components/site/site-data';

export const metadata: Metadata = {
  title: 'Real Estate Blog & Buying Guides',
  description:
    'In-depth real estate guides, plot investment analysis, legal checklists, and Pune East market trends by Rich-Land Developers.',
  alternates: { canonical: 'https://anandipark.in/blog' },
  openGraph: {
    title: 'Anandi Park Real Estate Blog & Plot Investment Guides',
    description:
      'Learn about land appreciation, legal verification for plots, Pune Ring Road updates, and property ROI in Wagholi.',
    url: 'https://anandipark.in/blog',
    siteName: 'Anandi Park',
    type: 'website',
  },
};

export default function BlogIndexPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-5">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-400">
            <BookOpen className="h-3.5 w-3.5" /> Insights &amp; Market Intelligence
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl text-white">
            Pune Real Estate Blog &amp; Plot Buying Guides
          </h1>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Expert articles, financial comparisons, legal checklists, and location reviews to help you make informed land purchase decisions in Pune East.
          </p>
        </div>

        {/* Featured / Grid of articles */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg transition hover:border-amber-500/50 hover:shadow-amber-500/10"
            >
              <div>
                <div className="relative aspect-[1.6] overflow-hidden bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img(post.seed, 800, 500)}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950">
                    {post.tag}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-amber-400" /> {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-400" /> {post.readMins} min read
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold leading-snug text-white group-hover:text-amber-400 transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800/80 p-6 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <User className="h-3.5 w-3.5 text-slate-500" /> {post.author}
                </span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  Read Guide <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Callout section */}
        <div className="mt-20 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-8 sm:p-12 text-center md:text-left md:flex md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Looking for a verified residential plot in Pune?</h2>
            <p className="mt-2 text-sm text-slate-300">
              Explore 84 gated plots at Bakori, Wagholi-Bakori Road. Clear titles, 30 &amp; 40 ft roads, starting ₹18 Lakh.
            </p>
          </div>
          <div className="mt-6 md:mt-0 shrink-0">
            <Link
              href="/project"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
            >
              View Anandi Park Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}