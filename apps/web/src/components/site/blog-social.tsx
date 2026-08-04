'use client';

import { motion } from 'framer-motion';
import { Clock, ArrowRight, Instagram, Facebook, Youtube, Heart } from 'lucide-react';
import { BLOG_POSTS, SOCIAL_POSTS, PROJECT, img } from './site-data';

export function SiteBlog() {
  return (
    <section id="blog" className="bg-white py-20 dark:bg-slate-950 sm:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Insights
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Guides for smart plot buyers
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Everything you need to know before investing in a residential plot at Pune East.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {BLOG_POSTS.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="relative overflow-hidden">
                <img
                  src={img(post.seed, 800, 500)}
                  alt={post.title}
                  className="h-48 w-full bg-slate-100 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950">
                  {post.tag}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{post.date}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" /> {post.readMins} min read
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900 dark:text-white">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{post.excerpt}</p>
                <a
                  href="#contact"
                  className="group/link mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400"
                >
                  Read more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" aria-hidden="true" />
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteSocial() {
  return (
    <section className="bg-slate-50 py-20 dark:bg-slate-900 sm:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Follow us
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              @anandipark on social
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={PROJECT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-amber-500 text-white transition hover:scale-105"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={PROJECT.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877F2] text-white transition hover:scale-105"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href={PROJECT.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF0000] text-white transition hover:scale-105"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SOCIAL_POSTS.map((post, i) => (
            <motion.a
              key={post.seed}
              href={PROJECT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: (i % 6) * 0.06 }}
              className="group relative aspect-square overflow-hidden rounded-xl"
            >
              <img
                src={img(post.seed, 500, 500)}
                alt={post.caption}
                className="h-full w-full bg-slate-200 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs font-medium text-white line-clamp-2">{post.caption}</p>
                <span className="mt-1 flex items-center gap-1 text-xs text-white/80">
                  <Heart className="h-3 w-3 fill-current" aria-hidden="true" /> {post.likes}
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
