import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, Calendar, User, ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';
import { ARTICLES, BlogPostArticle } from '@/components/site/blog-data';
import { img, PROJECT } from '@/components/site/site-data';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};

  const url = `https://anandipark.in/blog/${article.slug}`;

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url,
      siteName: 'Anandi Park Real Estate',
      type: 'article',
      publishedTime: new Date().toISOString(),
      authors: [article.author],
      images: [
        {
          url: img(article.seed, 1200, 630),
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [img(article.seed, 1200, 630)],
    },
  };
}

export default async function SingleArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: img(article.seed, 1200, 630),
    author: {
      '@type': 'Person',
      name: article.author,
      jobTitle: article.authorRole,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Rich-Land Developers',
      url: 'https://anandipark.in',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://anandipark.in/blog/${article.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://anandipark.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://anandipark.in/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `https://anandipark.in/blog/${article.slug}`,
      },
    ],
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen pt-28 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="mx-auto max-w-4xl px-5">
        {/* Navigation back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog &amp; Guides
        </Link>

        {/* Tag & Title */}
        <div className="mt-6">
          <span className="inline-block rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950">
            {article.tag}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
            {article.title}
          </h1>

          {/* Meta bar */}
          <div className="mt-6 flex flex-wrap items-center gap-6 border-y border-slate-800 py-4 text-xs sm:text-sm text-slate-400 font-medium">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 text-amber-400" />
              <span>
                <strong className="text-slate-200">{article.author}</strong> ({article.authorRole})
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-amber-400" /> {article.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" /> {article.readMins} min read
            </span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img(article.seed, 1200, 650)}
            alt={article.title}
            className="w-full h-auto max-h-[480px] object-cover"
          />
        </div>

        {/* Article Body Content */}
        <div className="mt-10 space-y-10 text-slate-300 text-base sm:text-lg leading-relaxed">
          <p className="text-xl font-medium text-slate-200 leading-snug border-l-4 border-amber-500 pl-4 py-1 italic bg-amber-500/5 rounded-r-lg">
            {article.excerpt}
          </p>

          {article.content.map((sec, i) => (
            <section key={i} className="space-y-4">
              <h2 className="text-2xl font-bold text-white tracking-tight border-b border-slate-800 pb-2">
                {sec.heading}
              </h2>
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx}>{p}</p>
              ))}
              {sec.bulletPoints && (
                <ul className="my-4 space-y-2.5 rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-sm sm:text-base">
                  {sec.bulletPoints.map((bp, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* Article FAQs */}
          {article.faqs && article.faqs.length > 0 && (
            <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
              <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-6">
                <HelpCircle className="h-5 w-5 text-amber-400" /> Frequently Asked Questions
              </h3>
              <div className="space-y-6">
                {article.faqs.map((faq, fIdx) => (
                  <div key={fIdx} className="border-b border-slate-800/80 pb-4 last:border-0 last:pb-0">
                    <h4 className="font-bold text-white text-base sm:text-lg">{faq.q}</h4>
                    <p className="mt-2 text-sm sm:text-base text-slate-400">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Developer Callout Box */}
          <div className="mt-12 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-6 sm:p-8 text-slate-200">
            <h3 className="text-xl font-bold text-white">About Anandi Park — Bakori, Wagholi</h3>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Developed by Rich-Land Developers ({PROJECT.partners}), Anandi Park offers 84 residential plots with clear titles, 30 &amp; 40 ft wide asphalt roads, and complete PMC municipal utilities starting from ₹18 Lakh.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/project"
                className="rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                View Plot Layout &amp; Sizes
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-colors"
              >
                Schedule Free Site Visit
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}