'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const TOUR_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1600',
    title: 'Top-Down Aerial Master Plan',
    subtext: 'Perfect 84-plot geometric layout with sprawling green pockets.',
    badge: 'Drone View'
  },
  {
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1600',
    title: 'Nestled Below Bakori Hills',
    subtext: 'Breathtaking hillside views and refreshing morning breezes.',
    badge: 'Imagination View'
  },
  {
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600',
    title: 'Premium Villa Developments',
    subtext: 'Build your dream bungalow on 1000 - 4510 sq.ft ready plots.',
    badge: 'Infrastructure'
  }
];

export function SiteVideoTour() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIshowPlaying] = useState(true);
  const [voiceLang, setVoiceLang] = useState<'hi' | 'mr' | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-play slideshow logic
  useEffect(() => {
    if (isPlaying) {
      slideInterval.current = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % TOUR_SLIDES.length);
      }, 6000); // 6 seconds per drone shot
    } else {
      if (slideInterval.current) clearInterval(slideInterval.current);
    }

    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, [isPlaying]);

  // Audio play/pause logic
  const handleVoicePlay = (lang: 'hi' | 'mr') => {
    if (voiceLang === lang) {
      // Toggle pause/play
      if (audioRef.current?.paused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current?.pause();
      }
    } else {
      // New language selected
      setVoiceLang(lang);
      if (audioRef.current) {
        audioRef.current.src = `/site/pitch-${lang === 'hi' ? 'hindi' : 'marathi'}.wav`;
        audioRef.current.load();
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress || 0);
    }
  };

  const handleAudioEnded = () => {
    setVoiceLang(null);
    setAudioProgress(0);
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % TOUR_SLIDES.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + TOUR_SLIDES.length) % TOUR_SLIDES.length);
  };

  return (
    <section className="bg-slate-900 py-20 text-white sm:py-24 overflow-hidden relative border-y border-slate-800">
      {/* Hidden native audio element */}
      <audio 
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
      />

      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <Sparkles className="h-3 w-3" />
            AI Interactive Tour
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-white">
            Experience Anandi Park In HD
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Take a cinematic, virtual flight over your future residential plots. Turn on the AI voiceover to hear our exclusive inaugural layout features.
          </p>
        </div>

        {/* Cinematic Main Viewport */}
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Image with Custom CSS Ken Burns Zoom Animation */}
              <div className="absolute inset-0 w-full h-full overflow-hidden scale-105">
                <img
                  src={TOUR_SLIDES[activeSlide].image}
                  alt={TOUR_SLIDES[activeSlide].title}
                  className="w-full h-full object-cover animate-ken-burns"
                />
                {/* Cinematic dark overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
              </div>

              {/* Floating Slide Badge */}
              <div className="absolute top-6 left-6 z-10">
                <span className="rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-amber-400 border border-slate-700">
                  {TOUR_SLIDES[activeSlide].badge}
                </span>
              </div>

              {/* Lower Overlay Captions */}
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 z-10 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pt-20">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h3 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                    {TOUR_SLIDES[activeSlide].title}
                  </h3>
                  <p className="mt-2 text-sm sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                    {TOUR_SLIDES[activeSlide].subtext}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Left/Right Manual Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-900/60 backdrop-blur-sm border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-amber-400 transition"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-900/60 backdrop-blur-sm border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:text-amber-400 transition"
            aria-label="Next Slide"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Slideshow Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/40 z-20">
            <motion.div
              key={activeSlide + (isPlaying ? '-playing' : '-paused')}
              initial={{ width: '0%' }}
              animate={isPlaying ? { width: '100%' } : { width: '0%' }}
              transition={{ duration: isPlaying ? 6 : 0, ease: 'linear' }}
              className="h-full bg-amber-500"
            />
          </div>
        </div>

        {/* Unified Audio Controller & Voiceover Console */}
        <div className="mt-8 rounded-2xl bg-slate-800/50 backdrop-blur-md border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
              voiceLang ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-700 text-slate-300'
            }`}>
              <Volume2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white">AI Voiceover Narrator</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {voiceLang 
                  ? `Playing high-fidelity ${voiceLang === 'hi' ? 'Hindi (1.0x)' : 'Marathi (1.2x)'} campaign script...` 
                  : 'Select a language to play the audio presentation'
                }
              </p>
            </div>
          </div>

          {/* Audio controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleVoicePlay('hi')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition flex items-center gap-2 border ${
                voiceLang === 'hi'
                  ? 'bg-amber-500 border-amber-600 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white'
              }`}
            >
              {voiceLang === 'hi' && !audioRef.current?.paused ? (
                <>
                  <Pause className="h-4 w-4" /> Hindi Active
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Play Hindi Voice
                </>
              )}
            </button>

            <button
              onClick={() => handleVoicePlay('mr')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition flex items-center gap-2 border ${
                voiceLang === 'mr'
                  ? 'bg-amber-500 border-amber-600 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white'
              }`}
            >
              {voiceLang === 'mr' && !audioRef.current?.paused ? (
                <>
                  <Pause className="h-4 w-4" /> Marathi Active
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Play Marathi (1.2x)
                </>
              )}
            </button>

            {/* Slide Play/Pause */}
            <div className="h-8 w-px bg-slate-700 hidden sm:block mx-2" />

            <button
              onClick={() => setIshowPlaying(!isPlaying)}
              className="px-4 py-2.5 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1.5"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> Pause Auto-Flight
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Resume Auto-Flight
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Styled inline keyframes to simulate smooth Ken Burns panning and zooming */}
      <style jsx global>{`
        @keyframes kenBurns {
          0% {
            transform: scale(1.03) translate(0%, 0%);
          }
          50% {
            transform: scale(1.12) translate(-1%, 0.5%);
          }
          100% {
            transform: scale(1.03) translate(0%, 0%);
          }
        }
        .animate-ken-burns {
          animation: kenBurns 18s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
