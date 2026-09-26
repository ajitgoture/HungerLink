import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PackageCheck, Users, HeartHandshake, Layers, MapPin, ChevronDown, Star, Shield, Zap } from 'lucide-react';

// --- Hero slideshow images: real food & clothes donation photos from Unsplash ---
const HERO_SLIDES = [{
  url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  labelKey: 'home.hero.slide1'
}, {
  url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  labelKey: 'home.hero.slide2'
}, {
  url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  labelKey: 'home.hero.slide3'
}];
export default function Home() {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  // Auto-rotate hero slides every 5 seconds
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  return <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      <main className="flex-grow">

        {/* =========================================================
            HERO — Full-width slideshow with dark overlay + CTA
         ========================================================= */}
        <section className="relative w-full h-[92vh] min-h-[600px] overflow-hidden">
          {/* Slideshow backgrounds */}
          {HERO_SLIDES.map((s, i) => <div key={i} className="absolute inset-0 transition-opacity duration-1000" style={{
          opacity: i === slide ? 1 : 0
        }}>
              <img src={s.url} alt={s.label} className="w-full h-full object-cover object-center" />
            </div>)}

          {/* Multi-layer dark overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

          {/* Hero content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center text-white">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-semibold mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t("home.hero.badge")}
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-tight tracking-tight mb-4 drop-shadow-xl">
              {t("home.hero.titlePart1")}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                {t("home.hero.titlePart2")}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mb-4 leading-relaxed font-light">
              {t(HERO_SLIDES[slide].labelKey)}
            </p>
            <p className="text-sm text-white/60 max-w-xl mb-10">
              {t("home.hero.description")}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button onClick={() => navigate('/food')} className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-lg shadow-xl shadow-amber-500/30 transition-all hover:scale-105">
                {t("🍲 Donate Food")} <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/cloth')} className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-xl shadow-indigo-500/30 transition-all hover:scale-105">
                {t("👕 Donate Clothes")} <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/explore')} className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 border border-white/30 backdrop-blur-sm text-white font-bold text-lg hover:bg-white/20 transition-all">
                {t("Explore Donations")}
              </button>
            </div>

            {/* Slide indicators */}
            <div className="absolute bottom-10 flex gap-2">
              {HERO_SLIDES.map((_, i) => <button key={i} onClick={() => setSlide(i)} className={`w-8 h-1.5 rounded-full transition-all ${i === slide ? 'bg-emerald-400 w-12' : 'bg-white/40'}`} />)}
            </div>

            {/* Scroll cue */}
            <div className="absolute bottom-10 right-8 flex flex-col items-center gap-1 text-white/40 text-xs">
              <ChevronDown className="w-5 h-5 animate-bounce" />
              {t("scroll")}
            </div>
          </div>
        </section>

        

        {/* =========================================================
            SPLIT IMAGE — FOOD MODULE
         ========================================================= */}
        <section className="w-full flex flex-col md:flex-row min-h-[520px]">
          {/* Image side */}
          <div className="md:w-1/2 relative overflow-hidden min-h-[300px]">
            <img src="https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80" alt={t("home.food.imgAlt")} className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900/60 to-transparent" />
          </div>
          {/* Text side */}
          <div className="md:w-1/2 bg-amber-50 flex flex-col justify-center px-10 py-16 space-y-6">
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-amber-600 bg-amber-100 px-3 py-1 rounded-full w-fit">{t("home.food.badge")}</span>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">
              {t("home.food.titlePart1")}<br />{t("home.food.titlePart2")}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {t("home.food.description")}
            </p>
            <ul className="space-y-3 text-slate-700">
              {[t("home.food.feature1"), t("home.food.feature2"), t("home.food.feature3"), t("home.food.feature4")].map(f => <li key={f} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  {f}
                </li>)}
            </ul>
            <button onClick={() => navigate('/food')} className="flex items-center gap-2 w-fit px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/30 transition-all hover:scale-105">
              {t("home.food.cta")} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* =========================================================
            SPLIT IMAGE — CLOTHES MODULE (reversed)
         ========================================================= */}
        <section className="w-full flex flex-col md:flex-row-reverse min-h-[520px]">
          {/* Image side */}
          <div className="md:w-1/2 relative overflow-hidden min-h-[300px]">
            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80" alt={t("home.clothes.imgAlt")} className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-l from-indigo-900/60 to-transparent" />
          </div>
          {/* Text side */}
          <div className="md:w-1/2 bg-indigo-50 flex flex-col justify-center px-10 py-16 space-y-6">
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full w-fit">{t("home.clothes.badge")}</span>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">
              {t("home.clothes.titlePart1")}<br />{t("home.clothes.titlePart2")}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {t("home.clothes.description")}
            </p>
            <ul className="space-y-3 text-slate-700">
              {[t("home.clothes.feature1"), t("home.clothes.feature2"), t('Age group matching (Kids / Adults)'), t("home.clothes.feature4")].map(f => <li key={f} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  {f}
                </li>)}
            </ul>
            <button onClick={() => navigate('/cloth')} className="flex items-center gap-2 w-fit px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
              {t("home.clothes.cta")} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* =========================================================
            HOW IT WORKS — With background image
         ========================================================= */}
        <section className="relative py-28 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt={t("home.howItWorks.imgAlt")} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm" />
          <div className="relative z-10 max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-emerald-400 text-sm font-extrabold uppercase tracking-widest">{t("home.howItWorks.badge")}</span>
              <h2 className="text-4xl md:text-5xl font-black text-white mt-3">{t("home.howItWorks.title")}</h2>
              <p className="text-slate-400 mt-4 max-w-xl mx-auto">{t("home.howItWorks.subtitle")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[{
              step: '01',
              icon: '📋',
              title: t("home.howItWorks.step1.title"),
              desc: t("home.howItWorks.step1.desc")
            }, {
              step: '02',
              icon: '🔔',
              title: t("home.howItWorks.step2.title"),
              desc: t("home.howItWorks.step2.desc")
            }, {
              step: '03',
              icon: '📍',
              title: t("home.howItWorks.step3.title"),
              desc: t("home.howItWorks.step3.desc")
            }, {
              step: '04',
              icon: '✅',
              title: t("home.howItWorks.step4.title"),
              desc: t("home.howItWorks.step4.desc")
            }].map((item, i) => <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-7 space-y-4 hover:bg-white/10 transition-all">
                  <div className="text-4xl">{item.icon}</div>
                  <div className="text-emerald-400 text-xs font-black tracking-widest">{item.step}</div>
                  <h3 className="text-white font-bold text-xl">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>)}
            </div>
          </div>
        </section>

        {/* =========================================================
            TRUST / FEATURES STRIP
         ========================================================= */}
        <section className="bg-white py-20 border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-14">
              <span className="text-teal-600 text-sm font-extrabold uppercase tracking-widest">{t("home.features.badge")}</span>
              <h2 className="text-4xl font-black text-slate-900 mt-3">{t("home.features.title")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[{
              icon: <Shield className="w-8 h-8 text-emerald-600" />,
              bg: 'bg-emerald-50',
              title: t("home.features.item1.title"),
              desc: t("home.features.item1.desc")
            }, {
              icon: <Zap className="w-8 h-8 text-amber-600" />,
              bg: 'bg-amber-50',
              title: t("home.features.item2.title"),
              desc: t("home.features.item2.desc")
            }, {
              icon: <HeartHandshake className="w-8 h-8 text-indigo-600" />,
              bg: 'bg-indigo-50',
              title: t("home.features.item3.title"),
              desc: t("home.features.item3.desc")
            }].map((f, i) => <div key={i} className={`${f.bg} rounded-3xl p-8 space-y-4`}>
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                </div>)}
            </div>
          </div>
        </section>

        {/* =========================================================
            FINAL CTA — Full-width image banner
         ========================================================= */}
        <section className="relative py-32 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt={t("home.cta.imgAlt")} className="absolute inset-0 w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 text-center text-white px-4">
            <h2 className="text-4xl md:text-6xl font-black mb-6 drop-shadow-xl">
              {t("home.cta.titlePart1")} <br />
              <span className="text-emerald-400">{t("home.cta.titlePart2")}</span>
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
              {t("home.cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate('/register')} className="px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg shadow-2xl shadow-emerald-500/40 transition-all hover:scale-105">
                {t("home.cta.button1")}
              </button>
              <button onClick={() => navigate('/explore')} className="px-10 py-4 rounded-2xl bg-white/10 border border-white/30 text-white font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm">
                {t("home.cta.button2")}
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================
            STATS BAR
         ========================================================= */}
        <section className="bg-slate-900 text-white py-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[{
              icon: <PackageCheck className="w-7 h-7 mx-auto text-emerald-400 mb-2" />,
              num: '10,000+',
              label: t("Donations Shared")
            }, {
              icon: <Users className="w-7 h-7 mx-auto text-emerald-400 mb-2" />,
              num: '5,000+',
              label: t("People Helped")
            }, {
              icon: <HeartHandshake className="w-7 h-7 mx-auto text-emerald-400 mb-2" />,
              num: '2,500+',
              label: t("Active Donors")
            }, {
              icon: <Star className="w-7 h-7 mx-auto text-emerald-400 mb-2" />,
              num: '4.9 / 5',
              label: t("Community Rating")
            }].map((s, i) => <div key={i}>
                  {s.icon}
                  <div className="text-3xl font-black">{s.num}</div>
                  <div className="text-slate-400 text-sm mt-1">{s.label}</div>
                </div>)}
            </div>
          </div>
        </section>

      </main>
    </div>;
}