import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Utensils, Shirt, Droplet, ArrowRight, Sparkles, Clock, MapPin, ShieldCheck } from 'lucide-react';

const Categories = () => {
  const { t } = useTranslation();
  const categories = [
    {
      id: 'food',
      title: t("Food Donation"),
      badge: 'Active Module',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: t("Share surplus cooked food, fresh groceries, or packaged meals with individuals and shelters nearby."),
      icon: Utensils,
      color: 'amber',
      accentBg: 'from-amber-500 to-orange-500',
      hoverBorder: 'hover:border-amber-300 hover:shadow-amber-500/10',
      bgGlow: 'bg-amber-500/10',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 hover:shadow-amber-600/30',
      link: '/food',
      buttonText: 'Explore Food',
      highlights: ['Real-time food alerts', 'Expiry time countdown', 'Veg & Non-Veg tags'],
      emoji: '🍲'
    },
    {
      id: 'clothes',
      title: t("Clothes Donation"),
      badge: 'Coming Soon',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      description: t("Give your gently used apparel, winter jackets, and blankets a second life to keep people warm."),
      icon: Shirt,
      color: 'indigo',
      accentBg: 'from-indigo-500 to-violet-500',
      hoverBorder: 'hover:border-indigo-300 hover:shadow-indigo-500/10',
      bgGlow: 'bg-indigo-500/10',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 hover:shadow-indigo-600/30',
      link: '/clothes',
      buttonText: 'Explore Clothes',
      highlights: ['Category & size filters', 'Season requirement tags', 'Direct handover'],
      emoji: '👕'
    }
  ];

  return (
    <section id="categories" className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-teal-100/70 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Donation Modules
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            How Would You Like to Help?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Select a category to donate surplus items or request essential support. Every request is verified and matched in real time.
          </p>
        </div>

        {/* 3 Main Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className={`group relative bg-white rounded-3xl p-8 border border-slate-200/80 shadow-lg hover:shadow-2xl transition-all duration-300 ${cat.hoverBorder} flex flex-col justify-between transform hover:-translate-y-1.5`}
              >
                {/* Background Glow Effect */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${cat.bgGlow} rounded-bl-full blur-2xl transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none`} />

                <div>
                  {/* Top Bar: Icon & Module Status Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.accentBg} text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cat.badgeColor}`}>
                      {cat.badge}
                    </span>
                  </div>

                  {/* Title & Emoji */}
                  <h3 className="text-2xl font-black text-slate-900 mb-3 flex items-center gap-2">
                    {cat.title} <span className="text-xl">{cat.emoji}</span>
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                    {cat.description}
                  </p>

                  {/* Key Highlights */}
                  <ul className="space-y-2 mb-8 border-t border-slate-100 pt-5">
                    {cat.highlights.map((item, idx) => (
                      <li key={idx} className="flex items-center text-xs font-semibold text-slate-500 gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Link Button */}
                <Link
                  to={cat.link}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-center flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${cat.buttonBg} group-hover:gap-3`}
                >
                  <span>{cat.buttonText}</span>
                  <ArrowRight className="w-5 h-5 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Categories;
