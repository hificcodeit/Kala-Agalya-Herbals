import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FaWhatsapp, FaInstagram, FaYoutube } from "react-icons/fa6";

const timeline = [
  { year: "2024", event: "Founded in Chennai by herbalist Kala Agalya with a traditional 18+ rare herb recipe." },
  { year: "2024", event: "Expanded organic farming partnerships across Tamil Nadu." },
  { year: "2025", event: "Reached 10,000+ happy customers with zero harmful chemicals." },
  { year: "2026", event: "Crossed 20,000+ happy customers with pan-India delivery." },
];

const values = [
  { icon: "🌿", title: "100% Natural",       desc: "Every ingredient is sourced directly from certified organic farms across India." },
  { icon: "🔬", title: "Science + Ayurveda", desc: "Traditional recipes backed by Naturopathy research for proven effectiveness." },
  { icon: "💚", title: "Cruelty Free",       desc: "Never tested on animals. Completely ethical and environmentally conscious." },
  { icon: "🛡️", title: "No Chemicals",      desc: "Zero parabens, sulfates, mineral oils, artificial fragrances, or preservatives." },
  { icon: "🌸", title: "Women-Led Brand",    desc: "Founded and led by women herbalists passionate about natural wellness." },
  { icon: "🇮🇳", title: "Made in India",     desc: "Proudly crafted in Chennai, Tamil Nadu, supporting local farmers and artisans." },
];

const stats = [
  { value: "20000+", label: "Happy Customers" },
  { value: "18+",   label: "Rare Herbs" },
  { value: "100%",  label: "Organic Formula" },
  { value: "4.9★",  label: "Average Rating" },
];

/* ── Animated stat counter ───────────────────────────────────── */
function StatCounter({ value, label }) {
  const numMatch = value.match(/[\d.]+/);
  const target = numMatch ? parseFloat(numMatch[0]) : 0;
  const suffix = numMatch ? value.replace(numMatch[0], "") : "";
  const prefix = value.startsWith("★") ? "★" : "";
  const cleanSuffix = suffix.replace("★", "");

  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animatedRef.current) {
        animatedRef.current = true;
        let startTimestamp = null;
        const duration = 1200;
        const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 4);
          const current = easeOut * target;
          setCount(current);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            setCount(target);
          }
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.1 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  const formattedCount = target % 1 !== 0 ? count.toFixed(1) : Math.floor(count);

  return (
    <div ref={ref} className="py-5 px-3 text-center group">
      <div className="text-2xl sm:text-3xl font-black text-yellow-600 font-soria tabular-nums group-hover:scale-110 transition-transform duration-300 notranslate" translate="no">
        {prefix}{formattedCount}{cleanSuffix}
      </div>
      <div className="text-xs sm:text-sm text-[#6C685F] mt-1 font-inter">{label}</div>
    </div>
  );
}

export default function About() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="bg-[#FDFBF7] text-[#1C1A16] overflow-x-hidden">
      <Helmet>
        <title>About Us | Kala Agalya Herbals — Our Story & Mission</title>
        <meta name="description" content="Learn about Kala Agalya Herbals — a women-led Naturopathy hair oil brand founded in Chennai. 18+ rare herbs, 100% organic, 5000+ happy customers across India." />
        <meta name="keywords" content="about Kala Agalya Herbals, herbal hair oil brand India, naturopathy hair care Chennai, women led herbal brand" />
        <link rel="canonical" href="https://kalaagalyaherbals.com/about" />
        <meta property="og:title"       content="About Us | Kala Agalya Herbals" />
        <meta property="og:description" content="Our story — natural hair care rooted in ancient Ayurvedic wisdom." />
        <meta property="og:url"         content="https://kalaagalyaherbals.com/about" />
        <meta property="og:image"       content="https://kalaagalyaherbals.com/images/Home%201.webp" />
      </Helmet>

      {/* ══ HERO BANNER ══════════════════════════════════════ */}
      <section className="relative min-h-[70vh] sm:min-h-[75vh] flex items-center overflow-hidden" aria-label="About Us hero">
        {/* Background — clear visible product image */}
        <div className="absolute inset-0">
          <img
            src="/images/Home 1.webp"
            alt="Kala Agalya Herbals Hair Oil banner"
            className="w-full h-full object-cover object-center brightness-[0.70] scale-105 transition-all duration-700"
            loading="eager"
          />
          {/* Subtle gradient overlay for high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-[#0d0b03]" />
        </div>

        {/* Ambient orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-[120px] animate-blob pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/8 rounded-full blur-[100px] animate-blob animation-delay-2000 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-20 text-white text-center">
          <span
            className="inline-block px-4 py-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-xs font-grotesk uppercase tracking-widest mb-6"
            style={{ animation: "fadeInUp 0.5s ease-out both" }}
          >
            🌿 Our Story
          </span>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 font-soria leading-tight"
            style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}
          >
            Nature's Best,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">
              Bottled With Love
            </span>
          </h1>
          <p
            className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-inter leading-relaxed"
            style={{ animation: "fadeInUp 0.6s ease-out 0.2s both" }}
          >
            Rooted in ancient Ayurvedic wisdom, we craft premium naturopathy hair oil from 18+ rare herbs
            — entirely free from chemicals, entirely full of care.
          </p>
          <div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}
          >
            <a href="/#product">
              <button className="relative overflow-hidden px-7 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-xl shadow-gold hover:shadow-gold-lg hover:scale-[1.03] transition-all duration-300 font-grotesk tracking-wide group">
                <span className="relative z-10">Shop Now ✨</span>
                <div className="absolute -inset-full h-full w-1/2 -skew-x-12 bg-white/25 opacity-0 group-hover:opacity-100 group-hover:left-full transition-all duration-500" />
              </button>
            </a>
            <Link to="/contact">
              <button className="px-7 py-3.5 border border-yellow-400/40 text-yellow-300 font-semibold rounded-xl hover:bg-yellow-500/10 hover:border-yellow-400/70 transition-all duration-300 font-grotesk">
                Contact Us
              </button>
            </Link>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-10 sm:h-16 fill-[#FDFBF7]">
            <path d="M0,40 C300,80 900,0 1200,40 L1200,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ══ STATS BAR ════════════════════════════════════════ */}
      <section className="py-8 px-5 sm:px-8" aria-label="Key statistics">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-card border border-yellow-500/10 grid grid-cols-2 md:grid-cols-4 divide-x divide-yellow-500/10 -mt-6 relative z-10 scroll-animate">
          {stats.map((s, i) => (
            <StatCounter key={i} value={s.value} label={s.label} />
          ))}
        </div>
      </section>

      {/* ══ OUR STORY ════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 sm:px-8 relative" aria-labelledby="story-heading">
        <div className="absolute right-0 top-0 w-80 h-80 bg-yellow-500/4 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          {/* Image */}
          <div className="scroll-animate scroll-fade-left relative">
            <div className="relative rounded-3xl overflow-hidden shadow-card-hover border border-yellow-500/10 bg-[#F5F2EB]">
              <img
                src="/images/home 2.webp"
                alt="Kala Agalya Herbals founder crafting hair oil"
                className="w-full h-auto aspect-[4/5] object-cover object-top hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 bg-yellow-500 text-black font-bold py-3 px-5 rounded-2xl shadow-gold text-sm font-grotesk">
              Since 2024 🌿
            </div>
          </div>

          {/* Text */}
          <div className="scroll-animate">
            <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-700 text-xs font-grotesk uppercase tracking-widest mb-4 border border-yellow-500/20">
              Our Journey
            </span>
            <h2 id="story-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1C1A16] mb-5 font-soria leading-tight">
              From a Kitchen <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">to 20,000+ Homes</span>
            </h2>
            <div className="space-y-4 text-[#4A473E] font-inter leading-relaxed">
              <p>
                Kala Agalya Herbals was born in a small kitchen in Chennai, where our founder began blending
                rare herbs using traditional Naturopathy methods passed down through generations.
              </p>
              <p>
                What started as a personal remedy for hair fall soon became a community treasure — shared
                across neighbourhoods, then cities, and now across all of India.
              </p>
              <p>
                Today, every bottle carries the same original recipe: <strong className="text-yellow-700">18+ rare herbs</strong>,
                pure cold-pressed coconut oil, and absolutely zero harmful chemicals.
              </p>
            </div>
            <div className="mt-7 flex gap-3">
              <a href="/#product">
                <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold rounded-xl shadow-gold hover:shadow-gold-lg hover:scale-105 transition-all duration-300 font-grotesk text-sm">
                  Try Our Oil →
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TIMELINE ═════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white border-t border-yellow-500/8 px-5 sm:px-8" aria-labelledby="timeline-heading">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 scroll-animate">
            <h2 id="timeline-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1C1A16] font-soria">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">Milestones</span>
            </h2>
          </div>
          <ol className="relative border-l-2 border-yellow-500/20 space-y-8 pl-8">
            {timeline.map((item, i) => (
              <li key={i} className={`scroll-animate scroll-delay-${(i % 4) + 1} relative group`}>
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-yellow-500 border-4 border-[#FDFBF7] group-hover:scale-125 transition-transform duration-300" />
                <div className="bg-[#FDFBF7] border border-yellow-500/10 rounded-2xl p-5 hover:border-yellow-500/35 hover:shadow-card transition-all duration-300 group-hover:-translate-y-0.5">
                  <span className="text-xs font-bold text-yellow-600 font-grotesk uppercase tracking-wider">{item.year}</span>
                  <p className="text-[#4A473E] mt-1 font-inter text-sm leading-relaxed">{item.event}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ VALUES ═══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 sm:px-8 bg-[#FDFBF7]" aria-labelledby="values-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 scroll-animate">
            <h2 id="values-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1C1A16] font-soria mb-3">
              What We <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">Stand For</span>
            </h2>
            <p className="text-[#6C685F] max-w-xl mx-auto font-inter">
              Our values drive every decision, from ingredient sourcing to packaging.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map((v, i) => (
              <div
                key={i}
                className={`scroll-animate scroll-delay-${(i % 3) + 1} group bg-white p-6 sm:p-7 rounded-2xl border border-yellow-500/10 hover:border-yellow-500/35 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-400`}
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 w-fit">{v.icon}</div>
                <h3 className="font-bold text-[#1C1A16] text-base mb-2 font-grotesk group-hover:text-yellow-700 transition-colors">{v.title}</h3>
                <p className="text-[#6C685F] text-sm font-inter leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MEET THE FOUNDER ═════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white border-t border-yellow-500/8 px-5 sm:px-8" aria-labelledby="founder-heading">
        <div className="max-w-4xl mx-auto text-center scroll-animate">
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-700 text-xs font-grotesk uppercase tracking-widest mb-5 border border-yellow-500/20">
            Meet the Founder
          </span>
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden mx-auto mb-6 border-4 border-yellow-500/25 shadow-gold">
            <img
              src="/images/Home 5.webp"
              alt="Kala Agalya — Founder of Kala Agalya Herbals"
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          </div>
          <h2 id="founder-heading" className="text-2xl sm:text-3xl font-bold text-[#1C1A16] font-soria mb-2">Kala Agalya</h2>
          <p className="text-yellow-700 font-medium text-sm mb-5 font-grotesk">Herbalist & Founder</p>
          <blockquote className="text-[#4A473E] text-base sm:text-lg font-playfair italic leading-relaxed max-w-2xl mx-auto">
            &ldquo;I created this oil for my own family first. Seeing the transformation it brought — the thick, lustrous
            hair, the confidence — I knew this secret needed to be shared with the world. Nature already has all the answers.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-5 sm:px-8 bg-[#FDFBF7] text-[#1C1A16] text-center border-t border-yellow-500/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(217,119,6,0.05)_0%,_transparent_75%)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 font-soria scroll-animate text-[#1C1A16]">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">Experience the Difference?</span>
          </h2>
          <p className="text-[#6C685F] mb-8 font-inter">Join thousands transforming their hair with Kala Agalya Herbals.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/#product">
              <button className="px-8 py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 hover:scale-105 transition-all duration-300 shadow-gold font-grotesk">
                Shop Now →
              </button>
            </a>
            <a
              href="https://wa.me/917338758727?text=Hi%20Kala%20Agalya%20Herbals,%20I%20would%20like%20to%20know%20more%20about%20your%20products."
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[#128C7E] bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all duration-300 font-grotesk shadow-sm"
            >
              <FaWhatsapp /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
