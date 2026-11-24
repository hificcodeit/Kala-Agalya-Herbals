import { Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useToast } from "../components/Alert";
import { API_URL, BASE_URL } from "../services/api";
import ImageWithSkeleton from "../components/ImageWithSkeleton";

/* ── Query Section Component ──────────────────────────────────── */
function QuerySection() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setError("Please fill in Name, Phone and Message.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/queries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setForm({ name: "", phone: "", email: "", message: "" });
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="query" className="py-20 bg-[#FDFBF7] border-t border-yellow-500/10">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 text-[10px] font-grotesk font-extrabold uppercase tracking-[0.25em] mb-4">
            💬 Have a Question?
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1C1A16] font-soria mb-3">
            We're Here to <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">Help You</span>
          </h2>
          <p className="text-[#6C685F] text-sm max-w-md mx-auto font-inter leading-relaxed">
            Have a question about our products, delivery, or ingredients? Send us a message and we'll get back to you soon.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-yellow-500/15 shadow-lg overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600" />

          {submitted ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#1C1A16] font-soria mb-2">Message Received! 🎉</h3>
              <p className="text-[#6C685F] font-inter text-sm mb-6">Thank you for reaching out. We'll get back to you shortly on your phone or email.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-yellow-500/20 transition-all"
              >
                Send Another Query
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-[#7C786E] uppercase tracking-[0.2em] mb-2 font-grotesk">Full Name *</label>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm text-[#1C1A16] placeholder-[#9A9690] focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all font-inter"
                  />
                </div>
                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-[#7C786E] uppercase tracking-[0.2em] mb-2 font-grotesk">Phone Number *</label>
                  <input
                    type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm text-[#1C1A16] placeholder-[#9A9690] focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all font-inter"
                  />
                </div>
              </div>
              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-[#7C786E] uppercase tracking-[0.2em] mb-2 font-grotesk">Email Address <span className="text-[#9A9690] normal-case font-normal">(optional)</span></label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="e.g. priya@gmail.com"
                  className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm text-[#1C1A16] placeholder-[#9A9690] focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all font-inter"
                />
              </div>
              {/* Message */}
              <div>
                <label className="block text-[10px] font-bold text-[#7C786E] uppercase tracking-[0.2em] mb-2 font-grotesk">Your Message *</label>
                <textarea
                  name="message" value={form.message} onChange={handleChange} rows={4}
                  placeholder="Type your question or message here..."
                  className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm text-[#1C1A16] placeholder-[#9A9690] focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all resize-none font-inter"
                />
              </div>
              {/* Error */}
              {error && (
                <p className="text-red-500 text-xs font-inter flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </p>
              )}
              {/* Submit */}
              <button
                type="submit" disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-xl uppercase tracking-widest text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed font-grotesk flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /><span>Sending...</span></>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg><span>Send My Query</span></>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Contact info strip */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-[#7C786E] font-inter">
          <span className="flex items-center gap-2">📞 <a href="tel:+916382460820" className="hover:text-yellow-700 transition-colors">+91 7338758727</a></span>
          <span className="hidden sm:block w-px h-4 bg-yellow-500/20" />
          <span className="flex items-center gap-2">✉️ <a href="mailto:kalaagalyaherbals@gmail.com" className="hover:text-yellow-700 transition-colors">kalaagalyaherbals@gmail.com</a></span>
        </div>
      </div>
    </section>
  );
}


/* ── Static data ──────────────────────────────────────────────── */
const heroSlides = [
  { title: "Revitalize Your", highlight: "Natural Shine",    subtitle: "Experience the ancient power of 18+ rare herbs blended in pure coconut oil.", badge: "🌿 100% Naturopathy & Organic",  image: "/images/Home 1.webp", alt: "Kala Agalya Herbals Naturopathy Hair Oil bottle" },
  { title: "Strengthen Your", highlight: "Roots From Within",subtitle: "Clinically proven formula enriched with Amla and Hibiscus to stop hair fall.",  badge: "💪 Zero Hair Fall Formula",      image: "/images/home 2.webp", alt: "Natural hair growth treatment with rare herbs" },
  { title: "Pure Nature",     highlight: "In Every Drop",    subtitle: "Free from parabens, sulfates, and mineral oils. Just pure nature.",              badge: "✨ Premium Quality Promise",    image: "/images/Home 3.webp", alt: "Organic herbal hair oil chemical-free" },
  { title: "Nourish Your",    highlight: "Scalp Deeply",     subtitle: "Soothe your scalp and eliminate dandruff with Vetiver and Neem.",                badge: "🌱 Soothing Scalp Care",       image: "/images/Home 4.webp", alt: "Deep nourishment and scalp care hair oil" },
  { title: "Restore Your",    highlight: "Natural Volume",   subtitle: "Stimulate new follicles with the richness of Fenugreek and Black Cumin.",        badge: "🌟 Volume Booster",            image: "/images/Home 5.webp", alt: "Hair volume restoration herbal oil" },
  { title: "Embrace The",     highlight: "Ayurvedic Secret", subtitle: "A time-tested blend to lock in moisture and protect from daily damage.",         badge: "🛡️ Complete Protection",      image: "/images/Home 6.webp", alt: "Ayurvedic hair protection moisture oil" },
];

const ingredients = [
  { name: "Amla",           img: "/images/amla.webp",         benefit: "Strengthens Roots"   },
  { name: "Hibiscus",       img: "/images/Hibiscus.webp",     benefit: "Prevents Hair Fall"  },
  { name: "Aloe Vera",      img: "/images/aloe-vera.webp",    benefit: "Natural Conditioner" },
  { name: "Neem",           img: "/images/neem.webp",         benefit: "Dandruff Control"    },
  { name: "Coconut Oil",    img: "/images/coconut-oil.webp",  benefit: "Deep Nourishment"    },
  { name: "Vetiver",        img: "/images/vetiver.webp",      benefit: "Cooling Effect"      },
  { name: "Fenugreek",      img: "/images/Fenugreek.webp",    benefit: "Prevents Shedding"   },
  { name: "Henna",          img: "/images/Henna.webp",        benefit: "Natural Color"       },
  { name: "Curry Leaves",   img: "/images/curry-leaves.webp", benefit: "Rich in Iron"        },
  { name: "Black Cumin",    img: "/images/black-cumin.webp",  benefit: "Anti-Inflammatory"   },
  { name: "Rose Petals",    img: "/images/rose-petals.webp",  benefit: "Scalp Soothing"      },
  { name: "Pearl Onion",    img: "/images/pearl-onion.webp",  benefit: "Growth Booster"      },
  { name: "False Daisy",    img: "/images/false-daisy.webp",  benefit: "Rejuvenation"        },
  { name: "Rosemary",       img: "/images/rosemary.webp",     benefit: "Circulation"         },
  { name: "Tanner's Cassia",img: "/images/tanners-cassia.webp",benefit:"Antibacterial"       },
];

const whyCards = [
  { img: "Home 1.webp", title: "100% Ayurvedic Recipe",    desc: "Ancient secrets perfectly formulated for modern, everyday hair care needs." },
  { img: "home 2.webp", title: "Zero Harmful Chemicals",   desc: "Completely free from parabens, sulphates, mineral oils, and artificial colors." },
  { img: "Home 3.webp", title: "Proven Visible Results",   desc: "Experience noticeable hair growth and reduced hair fall in just weeks." },
  { img: "Home 4.webp", title: "Deep Root Nourishment",    desc: "Our oil penetrates deeply to strengthen strands from the inside out." },
  { img: "Home 5.webp", title: "Scalp Cooling Effect",     desc: "Alleviates stress and eliminates dandruff with natural cooling herbs like Vetiver." },
  { img: "Home 6.webp", title: "Restores Natural Shine",   desc: "Locks in vital moisture and brings back your hair's beautiful, natural glow." },
];

const skeletonSizes = ["100 ml", "200 ml", "500 ml"];

/* ── Helper: safe image URL ──────────────────────────────────── */
function resolveImg(img) {
  if (!img) return "/images/icons/logo.png";
  if (img.startsWith("http") || img.startsWith("/images/") || img.startsWith("data:image")) return img;
  return `${BASE_URL.replace(/\/api$/, "")}${img.startsWith("/") ? img : `/${img}`}`;
}

const defaultDandruffReviews = [
  {
    _id: "d1",
    name: "Kavitha R.",
    rating: 5,
    comment: "Struggled with severe dry scalp and flaky dandruff for months. Within 2 weeks of using this oil infused with Neem and Vetiver, my scalp is completely clear!",
    image: "/images/neem.webp",
    category: "dandruff",
    createdAt: new Date().toISOString()
  },
  {
    _id: "d2",
    name: "Arun Kumar",
    rating: 5,
    comment: "The scalp cooling effect is amazing! It stopped itchiness on day one and reduced dandruff flakes dramatically.",
    image: "/images/Home 4.webp",
    category: "dandruff",
    createdAt: new Date().toISOString()
  },
  {
    _id: "d3",
    name: "Meenakshi S.",
    rating: 5,
    comment: "100% natural formula that cured my chronic dandruff without harsh chemical shampoos. Extremely happy with results!",
    image: "/images/vetiver.webp",
    category: "dandruff",
    createdAt: new Date().toISOString()
  },
  {
    _id: "d4",
    name: "Senthil Nathan",
    rating: 5,
    comment: "Best oil for dandruff control in South India! The combination of Rose Petals and Tanner's Cassia soothes redness and eliminates buildup.",
    image: "/images/tanners-cassia.webp",
    category: "dandruff",
    createdAt: new Date().toISOString()
  }
];

/* ── Helper: detect dandruff review ──────────────────────────── */
function isDandruffReview(r) {
  if (!r) return false;
  const cat = (r.category || "").trim().toLowerCase();
  if (cat === "dandruff") return true;
  if (r.comment && /dandruff|anti-dandruff|dry scalp|flak(y|es?)|scalp itch/i.test(r.comment)) return true;
  return false;
}

/* ── ReviewCard ──────────────────────────────────────────────── */
function ReviewCard({ review, badgeText, onImageClick }) {
  const imgSrc = resolveImg(review.image);
  const isDandruff = isDandruffReview(review) || (badgeText && badgeText.includes("Dandruff"));
  return (
    <div className={`w-[320px] sm:w-[360px] shrink-0 bg-white p-6 rounded-3xl border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-400 flex flex-col justify-between group ${isDandruff ? "border-emerald-500/25" : "border-yellow-500/12"}`}>
      <div>
        {imgSrc && (
          <div
            onClick={() => onImageClick && onImageClick(imgSrc, review)}
            className="w-full h-44 mb-4 rounded-2xl overflow-hidden bg-gradient-to-b from-[#FDFBF7] to-[#F5F2EB] border border-yellow-500/10 flex items-center justify-center p-2 cursor-pointer relative group/img"
          >
            <ImageWithSkeleton
              src={imgSrc}
              alt={`${review.name}'s result photo`}
              className="max-h-full max-w-full object-contain group-hover/img:scale-105 transition-transform duration-500"
              containerClassName="w-full h-full"
              loading="lazy"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold font-grotesk gap-1 rounded-2xl backdrop-blur-xs notranslate" translate="no">
              🔍 Click to Zoom Photo
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-1 mb-3">
          <div className="flex items-center gap-1 text-yellow-500 text-sm notranslate" translate="no">
            {Array.from({ length: 5 }).map((_, idx) => (
              <svg
                key={idx}
                className={`w-3.5 h-3.5 fill-current ${idx < (review.rating || 5) ? "text-yellow-500" : "text-gray-300"}`}
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-xs text-[#9A9690] font-inter font-semibold notranslate" translate="no">({review.rating || 5}.0)</span>
          </div>
          {badgeText && (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-grotesk uppercase border notranslate ${isDandruff ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"}`} translate="no">
              {badgeText}
            </span>
          )}
        </div>
        <p className="text-[#4A473E] text-sm leading-relaxed line-clamp-4 font-inter mb-4 break-words [overflow-wrap:anywhere]">
          &ldquo;{review.comment}&rdquo;
        </p>
      </div>
      <div className="pt-4 border-t border-yellow-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center font-grotesk shadow-sm notranslate ${isDandruff ? "bg-gradient-to-br from-emerald-600 to-teal-800" : "bg-gradient-to-br from-yellow-600 to-amber-700"}`} translate="no">
            {review.name ? review.name[0].toUpperCase() : "U"}
          </div>
          <div>
            <p className="font-bold text-[#1C1A16] text-xs font-grotesk">{review.name}</p>
            <p className="text-[10px] text-emerald-700 font-medium font-inter flex items-center gap-0.5">✓ Verified Buyer</p>
          </div>
        </div>
        {review.createdAt && (
          <span className="text-[10px] text-[#9A9690] font-inter notranslate" translate="no">
            {new Date(review.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── OfferBannerCarousel (Smooth Auto-Scroll & Showcase Carousel) ── */
function OfferBannerCarousel({ banners, onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const total = banners.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (total === 0) return null;

  // Single Banner: Centered Showcase Poster
  if (total === 1) {
    const banner = banners[0];
    const bImg = resolveImg(banner.image);
    return (
      <div className="max-w-4xl mx-auto">
        <div className="relative group bg-white rounded-3xl p-4 sm:p-6 border border-yellow-500/25 shadow-card hover:shadow-gold-lg transition-all duration-500 overflow-hidden">
          <div
            onClick={() => onImageClick && onImageClick(bImg)}
            className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-br from-[#FDFBF7] to-[#F5F2EB] border border-yellow-500/15 flex items-center justify-center cursor-pointer group/img"
          >
            <ImageWithSkeleton
              src={bImg}
              alt={banner.title || "Offer Banner"}
              className="w-full h-full object-contain group-hover/img:scale-[1.02] transition-transform duration-700 filter drop-shadow-md"
              containerClassName="w-full h-full"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold font-grotesk gap-2 backdrop-blur-xs rounded-2xl">
              🔍 Click to Zoom Poster
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#7C786E] font-inter font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ⚡ Limited Stock Available for this Offer
            </span>
            <a
              href={banner.linkUrl || "#product"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold font-grotesk text-xs uppercase tracking-wider bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-gold hover:shadow-gold-lg transition-all transform hover:-translate-y-0.5"
            >
              <span>Claim Offer Now 🛒</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Multiple Banners: Interactive Carousel Slider with Smooth Sliding Effect
  return (
    <div
      className="relative max-w-5xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider Viewport */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-yellow-500/25 shadow-card p-3 sm:p-5">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, idx) => {
            const bImg = resolveImg(banner.image);
            return (
              <div
                key={banner._id || idx}
                className="w-full shrink-0 px-1 sm:px-2 flex flex-col"
              >
                <div
                  onClick={() => onImageClick && onImageClick(bImg)}
                  className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-br from-[#FDFBF7] to-[#F5F2EB] border border-yellow-500/15 flex items-center justify-center cursor-pointer group/slide"
                >
                  <ImageWithSkeleton
                    src={bImg}
                    alt={banner.title || `Offer Banner ${idx + 1}`}
                    className="w-full h-full object-contain group-hover/slide:scale-[1.02] transition-transform duration-700 filter drop-shadow-md"
                    containerClassName="w-full h-full"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/slide:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold font-grotesk gap-2 backdrop-blur-xs rounded-2xl">
                    🔍 Click to Zoom Poster
                  </div>
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-white text-[11px] font-bold font-grotesk border border-white/20 flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Offer #{idx + 1} of {total}</span>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                  <div className="flex items-center gap-2 text-xs font-inter text-[#6C685F]">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 font-bold text-[11px] font-grotesk uppercase">
                      🔥 Special Deal
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="font-medium">Limited Quantity Available</span>
                  </div>

                  <a
                    href={banner.linkUrl || "#product"}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider font-grotesk bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-gold hover:shadow-gold-lg transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Claim Offer 🛒</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous offer"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 text-[#1C1A16] border border-yellow-500/30 shadow-gold hover:bg-yellow-500 hover:text-black hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next offer"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 text-[#1C1A16] border border-yellow-500/30 shadow-gold hover:bg-yellow-500 hover:text-black hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Slide Indicators / Dots */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to offer ${i + 1}`}
            className={`h-2.5 rounded-full transition-all duration-400 cursor-pointer ${
              i === currentIndex
                ? "w-8 bg-gradient-to-r from-yellow-500 to-amber-600 shadow-xs"
                : "w-2.5 bg-yellow-500/30 hover:bg-yellow-500/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── IngredientCard ──────────────────────────────────────────── */
function IngredientCard({ item }) {
  return (
    <div className="w-[180px] sm:w-[220px] shrink-0 bg-white p-5 rounded-2xl border border-yellow-500/10 hover:border-yellow-500/35 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-400 group text-center">
      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 bg-gradient-to-b from-[#FDFBF7] to-[#F5F2EB] rounded-2xl p-2 border border-yellow-500/8 flex items-center justify-center group-hover:scale-110 transition-transform duration-400">
        <ImageWithSkeleton
          src={item.img}
          alt={item.name}
          className="max-h-full max-w-full object-contain filter drop-shadow-md"
          containerClassName="w-full h-full"
          loading="lazy"
        />
      </div>
      <h3 className="font-bold text-[#1C1A16] text-sm sm:text-base font-grotesk group-hover:text-yellow-700 transition-colors mb-1">{item.name}</h3>
      <span className="inline-block px-2.5 py-0.5 rounded-full bg-yellow-500/8 border border-yellow-500/20 text-yellow-800 text-[10px] font-semibold uppercase tracking-wider font-inter">
        {item.benefit}
      </span>
    </div>
  );
}

/* ── AutoManualScroll (Horizontal Auto + Manual Touch/Mouse Scroll) ── */
function AutoManualScroll({ children, speed = 2.0, className = "" }) {
  const containerRef = useRef(null);
  const isInteractingRef = useRef(false);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let lastTime = performance.now();
    const scrollStep = (now) => {
      const delta = Math.min((now - lastTime) / 16.67, 2); // Normalized frame multiplier (~1.0 at 60fps)
      lastTime = now;

      if (!isInteractingRef.current && el) {
        el.scrollLeft += (1.8 * speed * delta); // High-speed 60fps continuous auto-scroll
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
          el.scrollLeft = 0;
        }
      }
      animFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animFrameRef.current = requestAnimationFrame(scrollStep);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [speed]);

  const handleManualScroll = (direction) => {
    if (!containerRef.current) return;
    const amount = containerRef.current.clientWidth * 0.75;
    containerRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="relative group/slider w-full"
      onMouseEnter={() => { isInteractingRef.current = true; }}
      onMouseLeave={() => { isInteractingRef.current = false; }}
      onTouchStart={() => { isInteractingRef.current = true; }}
      onTouchEnd={() => {
        setTimeout(() => { isInteractingRef.current = false; }, 2000);
      }}
    >
      {/* Manual Left Scroll Button */}
      <button
        type="button"
        onClick={() => handleManualScroll("left")}
        aria-label="Scroll left"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/95 shadow-gold border border-yellow-500/25 text-yellow-800 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:bg-yellow-500 hover:text-black hover:scale-110"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
      </button>

      {/* Manual Right Scroll Button */}
      <button
        type="button"
        onClick={() => handleManualScroll("right")}
        aria-label="Scroll right"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/95 shadow-gold border border-yellow-500/25 text-yellow-800 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:bg-yellow-500 hover:text-black hover:scale-110"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* Scrollable Row (Hidden Scrollbar + Instant 60fps Auto-Scroll) */}
      <div
        ref={containerRef}
        className={`flex gap-5 overflow-x-auto scrollbar-none no-scrollbar py-4 px-2 ${className}`}
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── 3D Tilt Hook for Product Cards ──────────────────────────── */
function useTilt(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top  - rect.height / 2;
      el.style.transform = `perspective(1000px) rotateX(${-y / 18}deg) rotateY(${x / 18}deg) scale3d(1.02, 1.02, 1.02)`;
    };
    const handleLeave = () => {
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    };
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [ref]);
}

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
        const duration = 1200; // Fast 1.2s count up
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
    <div ref={ref} className="text-center group py-4 px-2">
      <div className="text-3xl md:text-4xl font-black text-yellow-600 font-soria tabular-nums group-hover:scale-110 transition-transform duration-300 notranslate" translate="no">
        {prefix}{formattedCount}{cleanSuffix}
      </div>
      <div className="text-[#6C685F] text-sm mt-1 font-inter">{label}</div>
    </div>
  );
}

/* ── ProductCard ─────────────────────────────────────────────── */
function ProductCard({ product, index, onAddToCart, onBuyNow }) {
  const ref = useRef(null);
  useTilt(ref);

  const handleRipple = (e, fn) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.cssText = `width:${Math.max(rect.width, rect.height)*2}px;height:${Math.max(rect.width, rect.height)*2}px;left:${e.clientX-rect.left-rect.width}px;top:${e.clientY-rect.top-rect.height}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
    fn(product);
  };

  return (
    <div
      ref={ref}
      className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-yellow-500/10 shadow-card hover:shadow-card-hover hover:border-yellow-500/35 transition-all duration-500 flex flex-col h-full"
      style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.12}s both`, transformStyle: "preserve-3d" }}
    >
      {/* Badges */}
      {product.savings && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold z-20 shadow-lg font-grotesk tracking-wide notranslate" translate="no">
          {product.savings}
        </div>
      )}
      {product.ml === "200 ml" && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-yellow-500 text-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold z-20 shadow-md font-grotesk notranslate" translate="no">
          ★ Popular
        </div>
      )}

      {/* Image area */}
      <div className="h-44 sm:h-64 lg:h-72 bg-gradient-to-b from-[#FDFBF7] to-[#F5F2EB] relative flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-yellow-500/4 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="w-24 h-24 sm:w-40 sm:h-40 bg-yellow-500/8 rounded-full absolute blur-[30px] sm:blur-[50px] group-hover:bg-yellow-500/18 group-hover:scale-125 transition-all duration-700" />
        <ImageWithSkeleton
          src={product.img}
          alt={`Kala Agalya Herbals ${product.ml} herbal hair oil bottle`}
          className="relative z-10 h-full w-auto object-contain group-hover:scale-110 transition-transform duration-700 ease-spring drop-shadow-[0_12px_30px_rgba(217,119,6,0.22)]"
          containerClassName="w-full h-full z-10"
          loading={index === 0 ? "eager" : "lazy"}
          fetchpriority={index === 0 ? "high" : "auto"}
          decoding={index === 0 ? "sync" : "async"}
        />
        {/* Reveal CTA ribbon on hover */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-yellow-500/90 to-transparent py-2 sm:py-3 px-3 sm:px-6 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-spring flex items-center justify-center gap-2">
          <span className="text-black font-bold text-xs sm:text-sm font-grotesk tracking-wide">Add to Cart →</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-5 lg:p-6 relative flex flex-col flex-1 justify-between">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />

        {/* Title & Description */}
        <div className="text-center mb-2 sm:mb-4 min-h-[54px] sm:min-h-[64px] flex flex-col justify-start">
          <h3 className="text-base sm:text-2xl font-black text-[#2C2921] mb-1 font-soria line-clamp-1">{product.ml}</h3>
          <p className="text-[#6C685F] text-[11px] sm:text-xs line-clamp-2 font-inter leading-tight sm:leading-normal">{product.description}</p>
        </div>

        {/* Price Area */}
        <div className="flex flex-col items-center justify-end min-h-[44px] sm:min-h-[56px] mb-3 sm:mb-5">
          <div className="h-5 sm:h-6 flex items-center justify-center">
            {product.mrp ? (
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm text-[#9A9690] line-through font-inter">MRP ₹{product.mrp}</span>
                <span className="text-[10px] sm:text-xs text-emerald-700 font-bold font-grotesk bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Save ₹{product.mrp - product.price}
                </span>
              </div>
            ) : null}
          </div>
          <div className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-700 font-soria">
            ₹{product.price}
          </div>
        </div>

        {/* Badges */}
        <div className="flex justify-center gap-1 sm:gap-2 mb-3 sm:mb-5 shrink-0">
          {["🔒 Secure", "🌿 Organic", "🚚 Fast"].map(t => (
            <span key={t} className="text-[9px] sm:text-[10px] text-[#9A9690] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#e8e4dc] font-inter">{t}</span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto space-y-2 sm:space-y-2.5 font-grotesk shrink-0">
          <button
            onClick={(e) => handleRipple(e, onAddToCart)}
            className="ripple-container w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 bg-[#F5F2EB] text-yellow-800 border border-yellow-500/25 hover:bg-yellow-500/12 hover:border-yellow-500/50 hover:shadow-md active:scale-98 relative overflow-hidden"
          >
            Add to Cart
          </button>
          <button
            onClick={(e) => handleRipple(e, onBuyNow)}
            className="ripple-container w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500 shadow-[0_4px_15px_rgba(217,119,6,0.25)] hover:shadow-gold hover:-translate-y-0.5 active:scale-98 relative overflow-hidden"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addToast } = useToast();

  const [dbProduct,      setDbProduct]      = useState(null);
  const [products,       setProducts]       = useState([]);
  const [reviews,        setReviews]        = useState([]);
  const [dandruffReviews,setDandruffReviews]= useState([]);
  const [banners,        setBanners]        = useState([]);
  const [bannerSettings, setBannerSettings] = useState({
    badge: "",
    title: "",
    highlightText: "",
    subtitle: "",
  });
  const [loadingProducts,setLoadingProducts] = useState(true);
  const [reviewForm,     setReviewForm]     = useState({ name: "", rating: 5, comment: "", category: "hair_oil" });
  const [reviewImage,    setReviewImage]    = useState(null);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [selectedZoomImg,setSelectedZoomImg]= useState(null);
  const [mousePos,       setMousePos]       = useState({ x: 0, y: 0 });

  const heroRef = useRef(null);

  /* ── Hero slider & Image Preloading ─────────────────────────── */
  useEffect(() => {
    // Preload hero slide images for zero-latency slide transitions
    heroSlides.forEach(slide => {
      const img = new Image();
      img.src = slide.image;
    });
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % heroSlides.length), 4000);
    return () => clearInterval(t);
  }, []);

  /* ── Hero parallax mouse ─────────────────────────────────── */
  useEffect(() => {
    const onMove = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width  - 0.5) * 30,
        y: ((e.clientY - rect.top)  / rect.height - 0.5) * 20,
      });
    };
    const hero = heroRef.current;
    if (hero) hero.addEventListener("mousemove", onMove);
    return () => { if (hero) hero.removeEventListener("mousemove", onMove); };
  }, []);

  /* ── Custom cursor + scroll progress ───────────────────────*/
  useEffect(() => {
    const cursor = document.getElementById("custom-cursor");
    const ring   = document.getElementById("custom-cursor-ring");
    const bar    = document.getElementById("scroll-progress");

    const onMouse = (e) => {
      if (cursor) { cursor.style.left = e.clientX + "px"; cursor.style.top = e.clientY + "px"; }
      if (ring)   { ring.style.left   = e.clientX + "px"; ring.style.top   = e.clientY + "px"; }
    };
    const onScroll = () => {
      if (!bar) return;
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      bar.style.transform = `scaleX(${Math.min(pct, 1)})`;
    };

    window.addEventListener("mousemove", onMouse);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* ── Product API fetch ───────────────────────────────────── */
  const getImg = useCallback((images, idx) => {
    if (!images?.length) return "/images/icons/logo.png";
    return resolveImg(images[idx] || images[0]);
  }, []);

  const fetchReviews = useCallback((productId) => {
    const endpoint = productId && productId !== "undefined"
      ? `${API_URL}/reviews/${productId}`
      : `${API_URL}/reviews/hair_oil`;
    fetch(endpoint)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setReviews(d);
        else if (d && Array.isArray(d.reviews)) setReviews(d.reviews);
      })
      .catch(() => {});
  }, []);

  const fetchDandruffReviews = useCallback(() => {
    fetch(`${API_URL}/reviews/category/dandruff`)
      .then(res => {
        if (!res.ok) return fetch(`${API_URL}/reviews/dandruff`);
        return res;
      })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setDandruffReviews(d);
        else if (d && Array.isArray(d.reviews)) setDandruffReviews(d.reviews);
      })
      .catch(() => {});
  }, []);

  const fetchBanners = useCallback(() => {
    fetch(`${API_URL}/banners`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (Array.isArray(d.banners)) setBanners(d.banners);
          if (d.settings) setBannerSettings(d.settings);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchDandruffReviews();
    fetchBanners();
  }, [fetchReviews, fetchDandruffReviews, fetchBanners]);

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.products?.length > 0) {
          const master = data.products[0];
          setDbProduct(master);
          fetchReviews(master._id);
          const parsed = data.products
            .filter(p => p.isActive !== false)
            .flatMap(prod =>
              prod.sizes.map((s, idx) => {
                const price = s.price;
                const mrp   = s.mrp && s.mrp > price ? s.mrp : null;
                const savings = mrp ? `Save ₹${mrp - price}` : null;
                return {
                  id: `${prod._id}-${s.size}`,
                  productId: prod._id,
                  ml: s.size,
                  name: prod.name,
                  price, mrp, savings,
                  description: prod.description || "100% Naturopathy Herbal Hair Oil",
                  img: getImg(prod.images, idx),
                };
              })
            );
          setProducts(parsed);
          // Preload product images immediately so they are cache-warm when the user scrolls
          parsed.forEach(p => { if (p.img) { const img = new Image(); img.src = p.img; } });
        } else {
          setProducts([
            { id: "100", ml: "100 ml", name: "Kala Agalya Herbal Oil", price: 199, mrp: 249, savings: "Save ₹50", description: "Starter pack for daily scalp nourishment", img: "/images/Home 1.webp" },
            { id: "200", ml: "200 ml", name: "Kala Agalya Herbal Oil", price: 349, mrp: 449, savings: "Save ₹100", description: "Most popular 1-month treatment pack", img: "/images/home 2.webp" },
            { id: "500", ml: "500 ml", name: "Kala Agalya Herbal Oil", price: 799, mrp: 999, savings: "Save ₹200", description: "Family value pack — 3 months supply", img: "/images/Home 3.webp" },
          ]);
        }
      })
      .catch(() => {
        setProducts([
          { id: "100", ml: "100 ml", name: "Kala Agalya Herbal Oil", price: 199, mrp: 249, savings: "Save ₹50", description: "Starter pack for daily scalp nourishment", img: "/images/Home 1.webp" },
          { id: "200", ml: "200 ml", name: "Kala Agalya Herbal Oil", price: 349, mrp: 449, savings: "Save ₹100", description: "Most popular 1-month treatment pack", img: "/images/home 2.webp" },
          { id: "500", ml: "500 ml", name: "Kala Agalya Herbal Oil", price: 799, mrp: 999, savings: "Save ₹200", description: "Family value pack — 3 months supply", img: "/images/Home 3.webp" },
        ]);
      })
      .finally(() => setLoadingProducts(false));
  }, [getImg, fetchReviews]);

  /* ── Add to Cart ─────────────────────────────────────────── */
  const handleAddToCart = (product) => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const idx = cart.findIndex(i =>
      product.productId ? i.productId === product.productId && i.size === product.ml : i.id === product.id
    );
    if (idx > 0) cart[idx].quantity += 1;
    else if (idx === 0) cart[0].quantity += 1;
    else {
      cart.push({
        id: product.id,
        productId: product.productId || "default",
        name: product.name || "Kala Agalya Herbal Oil",
        size: product.ml,
        price: product.price,
        quantity: 1,
      });
    }
    try { localStorage.setItem("cart", JSON.stringify(cart)); } catch { /* ignore */ }
    document.dispatchEvent(new Event("cartUpdated"));
    addToast(`Added ${product.ml} bottle to cart! 🛍️`, "success");
  };

  const handleBuyNow = (product) => {
    handleAddToCart(product);
    window.location.href = "/cart";
  };

  /* ── Submit Review ───────────────────────────────────────── */
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fd = new FormData();
    if (dbProduct && dbProduct._id) fd.append("productId", dbProduct._id);
    fd.append("category", reviewForm.category || "hair_oil");
    fd.append("name", reviewForm.name);
    fd.append("rating", reviewForm.rating);
    fd.append("comment", reviewForm.comment);
    if (reviewImage) fd.append("image", reviewImage);
    try {
      const res  = await fetch(`${API_URL}/reviews`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok || data.success) {
        addToast("Review submitted! Thank you 🌿", "success");
        setReviewForm({ name: "", rating: 5, comment: "", category: "hair_oil" });
        setReviewImage(null);
        if (dbProduct && dbProduct._id) fetchReviews(dbProduct._id);
        fetchDandruffReviews();
        const fi = document.getElementById("review-img-input");
        if (fi) fi.value = "";
      } else addToast(data.message || "Failed to submit", "error");
    } catch { addToast("Error submitting review", "error"); }
    finally { setIsSubmitting(false); }
  };

  const hairCareReviews = reviews.filter(r => !isDandruffReview(r));
  const avgRating  = hairCareReviews.length ? (hairCareReviews.reduce((a, r) => a + r.rating, 0) / hairCareReviews.length).toFixed(1) : "5.0";
  const ratingStats = [5,4,3,2,1].map(stars => ({ stars, pct: hairCareReviews.length ? ((hairCareReviews.filter(r => r.rating === stars).length / hairCareReviews.length) * 100).toFixed(0) + "%" : "0%" }));

  /* ── Schema ──────────────────────────────────────────────── */
  const schemaOrg = {
    "@context": "https://schema.org", "@type": "Organization",
    name: "Kala Agalya Herbals", url: "https://kalaagalyaherbals.com",
    logo: "https://kalaagalyaherbals.com/images/icons/logo.png",
    contactPoint: { "@type": "ContactPoint", telephone: "+91-7338758727", contactType: "customer service" }
  };
  const schemaProduct = {
    "@context": "https://schema.org", "@type": "Product",
    name: "Kala Agalya Naturopathy Herbal Hair Oil",
    image: "https://kalaagalyaherbals.com/images/Home%201.webp",
    description: "100% Naturopathy herbal hair oil with 18+ rare herbs for hair growth and hair fall control.",
    brand: { "@type": "Brand", name: "Kala Agalya Herbals" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "20000" },
    offers: { "@type": "AggregateOffer", offerCount: "3", priceCurrency: "INR", lowPrice: "199", highPrice: "899" }
  };

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="overflow-x-hidden">
      <Helmet>
        <title>Kala Agalya Herbals | Best Naturopathy Herbal Hair Oil — 18+ Rare Herbs</title>
        <meta name="description" content="Kala Agalya Herbals — 100% Naturopathy herbal hair oil with 18+ rare herbs. Stop hair fall, boost growth, restore shine. Free delivery across India." />
        <meta name="keywords" content="herbal hair oil, naturopathy hair oil, hair fall control, organic hair oil India, Kala Agalya" />
        <link rel="canonical" href="https://kalaagalyaherbals.com" />
        <meta property="og:title"       content="Kala Agalya Herbals | Naturopathy Hair Oil" />
        <meta property="og:description" content="100% organic herbal hair oil with 18+ rare herbs." />
        <meta property="og:url"         content="https://kalaagalyaherbals.com" />
        <meta property="og:type"        content="website" />
        <meta property="og:image"       content="https://kalaagalyaherbals.com/images/Home%201.webp" />
        <script type="application/ld+json">{JSON.stringify(schemaOrg)}</script>
        <script type="application/ld+json">{JSON.stringify(schemaProduct)}</script>
      </Helmet>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#FDFBF7]"
        aria-label="Hero"
      >
        {/* Ambient orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-yellow-500/6 rounded-full blur-[120px] animate-blob pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] animate-blob animation-delay-2000 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-lime-500/4 rounded-full blur-[80px] animate-blob animation-delay-4000 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center py-16 sm:py-20 relative z-10">

          {/* Text column */}
          <div className="lg:col-span-7 min-w-0 z-20">
            <div className="grid grid-cols-1 items-center min-h-[460px] sm:min-h-[500px]">
              {heroSlides.map((slide, i) => (
                <div
                  key={i}
                  className={`col-start-1 row-start-1 flex flex-col justify-center min-w-0 transition-all duration-1000 ease-spring ${
                    i === currentSlide
                      ? "opacity-100 translate-x-0 scale-100 pointer-events-auto z-10"
                      : i < currentSlide
                      ? "opacity-0 -translate-x-8 scale-95 pointer-events-none invisible"
                      : "opacity-0 translate-x-8 scale-95 pointer-events-none invisible"
                  }`}
                  aria-hidden={i !== currentSlide}
                >
                  <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium px-4 py-1.5 sm:py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-800 mb-4 sm:mb-6 w-fit font-grotesk">
                    {slide.badge}
                  </span>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.2] sm:leading-[1.18] md:leading-[1.15] mb-4 sm:mb-5 text-[#1C1A16] font-soria break-words [overflow-wrap:anywhere]">
                    {slide.title}<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-700 bg-[length:200%_auto] animate-gradient-x">
                      {slide.highlight}
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-[#4A473E] mb-6 sm:mb-8 max-w-xl leading-relaxed font-inter break-words [overflow-wrap:anywhere]">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href="#product">
                      <button className="relative overflow-hidden px-8 py-3.5 sm:py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-xl shadow-gold hover:shadow-gold-lg hover:scale-[1.03] hover:-translate-y-0.5 transition-all duration-300 font-grotesk tracking-wide group">
                        <span className="relative z-10 flex items-center gap-2">Shop Now <span aria-hidden="true">✨</span></span>
                        <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white/30 opacity-0 group-hover:opacity-100 group-hover:left-full transition-all duration-500" />
                      </button>
                    </a>
                    <button
                      onClick={() => document.getElementById("ingredients")?.scrollIntoView({ behavior: "smooth" })}
                      className="px-8 py-3.5 sm:py-4 border border-yellow-500/40 text-yellow-700 font-semibold rounded-xl hover:bg-yellow-500/8 hover:border-yellow-500/70 transition-all duration-300 font-grotesk"
                    >
                      View Ingredients
                    </button>
                  </div>
                  <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#6C685F] font-inter">
                    {["⚡ Fast Delivery", "🌿 No Chemicals", "✓ Cruelty Free"].map(t => (
                      <span key={t} className="flex items-center gap-1.5">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image column — parallax */}
          <div className="lg:col-span-5 min-w-0 relative min-h-[340px] sm:min-h-[420px] lg:h-[580px] flex items-center justify-center z-10">
            {heroSlides.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-spring ${
                  i === currentSlide ? "opacity-100 scale-100" : i < currentSlide ? "opacity-0 scale-90 blur-sm" : "opacity-0 scale-90 blur-sm"
                }`}
                aria-hidden={i !== currentSlide}
              >
                <div
                  className="relative z-10 animate-float"
                  style={{ transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.3}px) rotate(${mousePos.x * 0.03}deg)`, transition: "transform 0.1s ease-out" }}
                >
                  <ImageWithSkeleton
                    src={slide.image}
                    alt={slide.alt}
                    className="max-h-[340px] md:max-h-[520px] w-auto object-contain drop-shadow-[0_0_60px_rgba(217,119,6,0.55)] filter brightness-105"
                    containerClassName="h-[340px] md:h-[520px] w-auto"
                    loading={i === 0 ? "eager" : "lazy"}
                    width="400" height="520"
                  />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] bg-yellow-500/6 blur-[80px] rounded-full pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2" role="tablist" aria-label="Hero slides">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === currentSlide}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-400 ${i === currentSlide ? "w-6 bg-yellow-500" : "w-1.5 bg-yellow-500/30 hover:bg-yellow-500/60"}`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-8 hidden md:flex flex-col items-center gap-2 text-[#9A9690] text-xs font-inter" aria-hidden="true">
          <span className="tracking-widest uppercase" style={{ writingMode: "vertical-rl" }}>Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-yellow-500/50 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ══ STATS ════════════════════════════════════════════════ */}
      <div className="bg-white w-full">
        <section
          className="scroll-animate scroll-scale bg-white py-6 relative -mt-8 mx-4 md:mx-auto max-w-5xl rounded-3xl shadow-card z-20 border border-yellow-500/10"
          aria-label="Brand statistics"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-yellow-500/10">
            <StatCounter value="100%"  label="Natural Ingredients" />
            <StatCounter value="20000+" label="Happy Customers" />
            <StatCounter value="18+"   label="Rare Herbs" />
            <StatCounter value="4.9"   label="Star Rating" />
          </div>
        </section>
      </div>

      {/* ══ SPECIAL WEBSITE LAUNCHING OFFER BANNER SECTION ════════════ */}
      {banners.length > 0 && (
        <section id="launch-offer" className="py-20 bg-gradient-to-b from-white via-[#FDFBF7] to-white relative overflow-hidden border-t border-yellow-500/15" aria-labelledby="offer-heading">
          <div className="absolute top-0 left-1/3 w-[450px] h-[450px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
            {/* Section Header: Banner Title & Subtitle exclusively from Admin */}
            {(() => {
              const badge = (bannerSettings.badge || "").trim();
              const heading = (bannerSettings.title || banners[0]?.title || "").trim();
              const highlight = (bannerSettings.highlightText || "").trim();
              const sub = (bannerSettings.subtitle || banners[0]?.subtitle || "").trim();

              const hasHeader = badge || heading || highlight || sub;
              if (!hasHeader) return null;

              return (
                <div className="text-center max-w-3xl mx-auto mb-10 scroll-animate">
                  {badge && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 text-amber-900 text-xs font-grotesk font-extrabold uppercase tracking-widest mb-4 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      {badge}
                    </div>
                  )}

                  {(heading || highlight) && (
                    <h2 id="offer-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1C1A16] font-soria leading-tight mb-4">
                      {heading}{" "}
                      {highlight && (
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-700">
                          {highlight}
                        </span>
                      )}
                    </h2>
                  )}

                  {sub && (
                    <div className="relative inline-block max-w-2xl mx-auto">
                      <p className="text-[#5C5850] text-sm sm:text-base font-inter leading-relaxed px-5 py-2.5 rounded-2xl bg-amber-500/8 border border-amber-500/20 shadow-xs">
                        {sub}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Offer Banners Carousel with Smooth Auto-Scroll / Interactive Controls */}
            <OfferBannerCarousel
              banners={banners}
              onImageClick={img => setSelectedZoomImg(img)}
            />
          </div>
        </section>
      )}

      {/* ══ PRODUCT CATALOG ══════════════════════════════════════ */}
      <section id="product" className="py-24 bg-[#FDFBF7] relative" aria-labelledby="catalog-heading">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 scroll-animate">
            <span className="inline-block px-4 py-1.5 rounded-full border border-yellow-500/25 text-yellow-800 text-xs font-grotesk uppercase tracking-widest mb-4 bg-yellow-500/8">
              Select Your Bottle Size
            </span>
            <h2 id="catalog-heading" className="text-4xl md:text-5xl font-extrabold text-[#1C1A16] font-soria">
              Naturopathy Herbal <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">Hair Oil</span>
            </h2>
            <p className="text-[#6C685F] mt-3 text-base font-inter">
              Choose the size that fits your hair care routine. Every bottle is freshly prepared with 18+ rare herbs.
            </p>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
              {skeletonSizes.map((ml) => (
                <div key={ml} className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-yellow-500/10 shadow-card">
                  <div className="h-44 sm:h-64 bg-gradient-to-b from-[#FDFBF7] to-[#F5F2EB] rounded-xl sm:rounded-2xl mb-4 sm:mb-5 skeleton-shimmer" />
                  <div className="h-5 sm:h-6 bg-[#F5F2EB] rounded-md w-1/2 mx-auto mb-2 sm:mb-3 skeleton-shimmer" />
                  <div className="h-3 sm:h-4 bg-[#F5F2EB] rounded-md w-3/4 mx-auto mb-4 sm:mb-6 skeleton-shimmer" />
                  <div className="h-8 sm:h-10 bg-[#F5F2EB] rounded-lg sm:rounded-xl skeleton-shimmer" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={idx}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ CUSTOMER REVIEWS & FORM ══════════════════════════════ */}
      <section className="py-24 bg-white relative border-t border-yellow-500/10" aria-labelledby="reviews-heading">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="text-center mb-14 scroll-animate">
            <h2 id="reviews-heading" className="text-4xl md:text-5xl font-bold text-[#1C1A16] mb-3 font-soria">
              Customer <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">Experience</span>
            </h2>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-14">
            {/* Rating summary */}
            <div className="scroll-animate bg-gradient-to-br from-[#FDFBF7] to-white p-8 rounded-3xl border border-yellow-500/12 shadow-card text-center h-fit">
              <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-500 to-amber-700 font-soria mb-1 notranslate" translate="no" aria-label={`Average rating: ${avgRating} out of 5`}>
                {avgRating}
              </div>
              <div className="text-yellow-500 text-2xl tracking-widest my-2 notranslate" translate="no" aria-hidden="true">★★★★★</div>
              <p className="text-[#6C685F] text-sm mb-6 font-inter">Based on {hairCareReviews.length} customer review{hairCareReviews.length !== 1 ? "s" : ""}</p>
              <div className="space-y-2.5">
                {ratingStats.map(row => (
                  <div key={row.stars} className="flex items-center gap-3 text-xs font-inter">
                    <span className="w-10 text-[#4A473E] text-right shrink-0 notranslate" translate="no">{row.stars} ★</span>
                    <div className="flex-1 h-2 bg-[#F5F2EB] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-600 to-amber-500 rounded-full transition-all duration-700" style={{ width: row.pct }} />
                    </div>
                    <span className="w-8 text-[#9A9690] notranslate" translate="no">{row.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review form */}
            <div className="lg:col-span-2 scroll-animate">
              <div className="bg-white p-7 md:p-9 rounded-3xl border border-yellow-500/12 shadow-card">
                <h3 className="text-xl font-bold text-[#1C1A16] mb-6 border-b border-yellow-500/10 pb-4 font-grotesk">
                  Share Your Experience
                </h3>
                <form onSubmit={handleReviewSubmit} className="space-y-5 font-inter">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="review-name" className="block text-sm text-[#6C685F] mb-1.5 font-medium">Your Name</label>
                      <input
                        id="review-name"
                        type="text"
                        required
                        placeholder="e.g. Priya S."
                        className="input-premium"
                        value={reviewForm.name}
                        onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="review-category" className="block text-sm text-[#6C685F] mb-1.5 font-medium">Review Category</label>
                      <div className="relative">
                        <select
                          id="review-category"
                          className="input-premium appearance-none pr-10 cursor-pointer font-grotesk font-semibold"
                          value={reviewForm.category || "hair_oil"}
                          onChange={e => setReviewForm({ ...reviewForm, category: e.target.value })}
                        >
                          <option value="hair_oil">✨ Hair Growth & Nourishment Oil</option>
                          <option value="dandruff">🌿 Dandruff & Scalp Relief Treatment</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center" aria-hidden="true">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="review-rating" className="block text-sm text-[#6C685F] mb-1.5 font-medium">Rating</label>
                    <div className="relative">
                      <select
                        id="review-rating"
                        className="input-premium appearance-none pr-10 cursor-pointer notranslate"
                        translate="no"
                        value={reviewForm.rating}
                        onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                      >
                        <option value="5">★★★★★ — Excellent (5/5)</option>
                        <option value="4">★★★★☆ — Good (4/5)</option>
                        <option value="3">★★★☆☆ — Average (3/5)</option>
                        <option value="2">★★☆☆☆ — Fair (2/5)</option>
                        <option value="1">★☆☆☆☆ — Poor (1/5)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center" aria-hidden="true">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="review-comment" className="block text-sm text-[#6C685F] mb-1.5 font-medium">Your Review</label>
                    <textarea
                      id="review-comment"
                      required
                      placeholder="How has our herbal oil helped your hair or scalp?"
                      className="input-premium h-28 resize-none"
                      value={reviewForm.comment}
                      onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="review-img-input" className="block text-sm text-[#6C685F] mb-1.5 font-medium">Add a Photo <span className="text-[#9A9690]">(Optional)</span></label>
                    <input
                      id="review-img-input"
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-[#6C685F] file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/10 file:text-yellow-700 hover:file:bg-yellow-500/20 file:transition-colors cursor-pointer font-inter"
                      onChange={e => setReviewImage(e.target.files[0])}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative overflow-hidden px-8 py-3.5 rounded-xl font-semibold text-black bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 transition-all shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 disabled:opacity-50 font-grotesk tracking-wide"
                  >
                    {isSubmitting ? "Submitting…" : "Submit Review"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* ── Auto-Scrolling + Manual Touch/Mouse Reviews Slider ── */}
          {hairCareReviews.length > 0 ? (
            <div className="pt-4 border-t border-yellow-500/8">
              <AutoManualScroll speed={1.5}>
                {hairCareReviews.map((review, i) => (
                  <ReviewCard key={review._id || i} review={review} badgeText="✨ Hair Care" onImageClick={img => setSelectedZoomImg(img)} />
                ))}
              </AutoManualScroll>
            </div>
          ) : (
            <div className="py-12 px-6 text-center bg-[#FDFBF7] rounded-3xl border border-yellow-500/10">
              <div className="text-4xl mb-3">🌿</div>
              <h4 className="text-lg font-bold text-[#1C1A16] font-grotesk mb-1">No Customer Reviews Yet</h4>
              <p className="text-sm text-[#6C685F] font-inter">Be the first to share your experience with Kala Agalya Herbals!</p>
            </div>
          )}
        </div>
      </section>

      {/* ══ DANDRUFF REVIEW IMAGE HORIZONTAL SCROLL SECTION ════════════ */}
      <section id="dandruff-reviews" className="py-20 bg-gradient-to-b from-[#FDFBF7] to-[#F3F9F5] border-t border-emerald-500/15 relative overflow-hidden" aria-labelledby="dandruff-reviews-heading">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12 scroll-animate">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 text-emerald-800 text-xs font-grotesk font-extrabold uppercase tracking-widest mb-3 bg-emerald-500/10">
              🌱 100% Naturopathy Scalp Relief
            </span>
            <h2 id="dandruff-reviews-heading" className="text-4xl md:text-5xl font-extrabold text-[#1C1A16] font-soria mb-3">
              Dandruff Scalp Care <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800">Results & Reviews</span>
            </h2>
            <p className="text-[#5A635C] text-base font-inter">
              Browse real customer result photos & scalp care feedback after using our specialized herbal Neem & Vetiver anti-dandruff formulation.
            </p>
          </div>

          {(() => {
            const allDandruffCandidates = [...dandruffReviews, ...reviews].filter(r => isDandruffReview(r));
            const seen = new Set();
            const uniqueDandruff = [];
            for (const r of allDandruffCandidates) {
              const id = r._id || r.name + r.comment;
              if (!seen.has(id)) {
                seen.add(id);
                uniqueDandruff.push(r);
              }
            }
            const displayList = uniqueDandruff.length > 0 ? uniqueDandruff : defaultDandruffReviews;

            return (
              <div className="pt-2">
                <AutoManualScroll speed={1.3}>
                  {displayList.map((review, i) => (
                    <ReviewCard
                      key={review._id || i}
                      review={review}
                      badgeText="🌿 Dandruff Care"
                      onImageClick={img => setSelectedZoomImg(img)}
                    />
                  ))}
                </AutoManualScroll>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── Image Lightbox Zoom Modal ── */}
      {selectedZoomImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedZoomImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl p-3 border border-white/20 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedZoomImg(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white font-extrabold flex items-center justify-center hover:bg-black transition-colors"
            >
              ✕
            </button>
            <ImageWithSkeleton
              src={selectedZoomImg}
              alt="Enlarged review photo"
              className="max-h-[82vh] max-w-full object-contain rounded-2xl mx-auto"
              containerClassName="w-full h-full max-h-[82vh]"
            />
          </div>
        </div>
      )}

      {/* ══ WHY THIS HAIR OIL ════════════════════════════════════ */}
      <section className="py-24 relative bg-[#FDFBF7]" aria-labelledby="why-heading">
        <div className="absolute inset-0 bg-noise opacity-[0.025] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/4 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 scroll-animate">
            <h2 id="why-heading" className="text-4xl md:text-5xl font-extrabold text-[#1C1A16] mb-5 font-soria">
              Why This <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">Hair Oil?</span>
            </h2>
            <p className="text-lg text-yellow-800 font-medium italic font-playfair">
              &ldquo;We bring you the secrets of ancient Ayurveda, bottled with care and precision for the modern lifestyle.&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
            {whyCards.map((item, i) => (
              <div
                key={i}
                className={`scroll-animate scroll-delay-${(i % 2) + 1} group flex flex-col h-[270px] sm:h-[350px] md:h-[380px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover border border-yellow-500/10 bg-white transition-all duration-500`}
              >
                <div className="h-[58%] sm:h-[65%] w-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#FDFBF7] to-[#F5F2EB] p-3 sm:p-5 relative">
                  <ImageWithSkeleton
                    src={`/images/${item.img}`}
                    alt={item.title}
                    className="max-h-full max-w-full object-contain transform group-hover:scale-110 transition-transform duration-700 ease-spring filter brightness-95 group-hover:brightness-105 drop-shadow-[0_8px_20px_rgba(217,119,6,0.12)]"
                    containerClassName="w-full h-full"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 bg-white p-3 sm:p-5 border-t border-yellow-500/10 flex flex-col justify-center text-center">
                  <h3 className="text-xs sm:text-lg md:text-xl font-extrabold text-[#1C1A16] mb-1 sm:mb-1.5 group-hover:text-yellow-700 transition-colors font-grotesk leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[#6C685F] text-[10px] sm:text-xs md:text-sm leading-tight sm:leading-relaxed font-inter line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INGREDIENTS SLIDER (Auto + Manual Horizontal Scroll) ══ */}
      <section id="ingredients" className="py-24 bg-[#FDFBF7] border-t border-yellow-500/10 relative overflow-hidden" aria-labelledby="herbs-heading">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />

        <div className="text-center mb-12 scroll-animate px-5">
          <h2 id="herbs-heading" className="text-4xl md:text-5xl font-extrabold text-[#1C1A16] font-soria mb-4">
            Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">18+ Rare Herbs</span>
          </h2>
          <p className="text-[#6C685F] max-w-xl mx-auto text-base font-inter">
            Each bottle is infused with a potent blend of pure herbs, selected for their unique hair-nourishing properties.
          </p>
        </div>

        {/* Auto + Manual Touch/Mouse Scrollable Slider */}
        <div className="max-w-7xl mx-auto px-5">
          <AutoManualScroll speed={0.9}>
            {ingredients.map((item, i) => (
              <IngredientCard key={i} item={item} />
            ))}
          </AutoManualScroll>
        </div>
      </section>

      {/* ══ FOOTER CTA ═══════════════════════════════════════════ */}
      <section className="bg-[#FDFBF7] border-t border-yellow-500/10 text-[#1C1A16] py-20 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(217,119,6,0.05)_0%,_transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block px-5 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-800 text-xs font-grotesk font-extrabold uppercase tracking-widest mb-6 shadow-sm">
            ⚡ Limited Stock Available
          </span>
          <h2 className="scroll-animate text-3xl md:text-5xl font-extrabold mb-5 font-soria leading-tight text-[#1C1A16]">
            Ready to Transform<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">Your Hair Naturally?</span>
          </h2>
          <p className="text-[#6C685F] mb-10 text-base max-w-xl mx-auto font-inter leading-relaxed">
            Join thousands of satisfied customers who have switched to Kala Agalya Herbals Organic Hair Oil.
          </p>
          <a href="#product">
            <button className="relative overflow-hidden px-10 py-4 rounded-full font-bold text-base bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500 shadow-gold hover:shadow-gold-lg hover:scale-105 transition-all duration-300 font-grotesk tracking-wider group">
              <span className="relative z-10">Get Your Bottle Today →</span>
              <div className="absolute -inset-full h-full w-1/2 -skew-x-12 bg-white/30 opacity-0 group-hover:opacity-100 group-hover:left-full transition-all duration-600" />
            </button>
          </a>
        </div>
      </section>

      {/* ── Query / Contact Section ───────────────────────────────── */}
      <QuerySection />
    </div>
  );
}
