import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

const heroSlides = [
  {
    title: "Revitalize Your",
    highlight: "Natural Shine",
    subtitle: "Experience the ancient power of 18+ rare herbs blended in pure coconut oil.",
    badge: "🌿 100% Naturopathy & Organic",
    image: "/images/Home 1.png",
    alt: "Naturopathy herbal hair oil bottle showcase - Kala Agalya Herbals"
  },
  {
    title: "Strengthen Your",
    highlight: "Roots From Within",
    subtitle: "Clinically proven formula enriched with Amla and Hibiscus to stop hair fall.",
    badge: "💪 Zero Hair Fall Guarantee",
    image: "/images/home 2.png",
    alt: "Natural hair growth treatment with 18 rare herbs"
  },
  {
    title: "Pure Nature",
    highlight: "In Every Drop",
    subtitle: "Free from parabens, sulfates, and mineral oils. Just pure nature.",
    badge: "✨ Premium Quality Promise",
    image: "/images/Home 3.png",
    alt: "Organic hair oil chemical-free formula"
  },
  {
    title: "Nourish Your",
    highlight: "Scalp Deeply",
    subtitle: "Soothe your scalp and eliminate dandruff with the cooling essence of Vetiver and Neem.",
    badge: "🌱 Soothing Scalp Care",
    image: "/images/Home 4.png",
    alt: "Deep nourishment and scalp care"
  },
  {
    title: "Restore Your",
    highlight: "Natural Volume",
    subtitle: "Stimulate new hair follicles with the richness of Fenugreek and Black Cumin.",
    badge: "🌟 Volume Booster",
    image: "/images/Home 5.png",
    alt: "Hair volume and density restoration"
  },
  {
    title: "Embrace The",
    highlight: "Ayurvedic Secret",
    subtitle: "A time-tested blend crafted to lock in moisture and protect from daily damage.",
    badge: "🛡️ Complete Protection",
    image: "/images/Home 6.png",
    alt: "Ayurvedic hair protection and moisture"
  }
];


export default function Landing() {
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);



  const ingredients = [
    { name: "Amla", img: "/images/amla.jpg", benefit: "Strengthens Roots" },
    { name: "Hibiscus", img: "/images/Hibiscus.jpg", benefit: "Prevents Hair Fall" },
    { name: "Aloe Vera", img: "/images/aloe-vera.jpg", benefit: "Natural Conditioner" },
    { name: "Neem", img: "/images/neem.jpg", benefit: "Dandruff Control" },
    { name: "Coconut Oil", img: "/images/coconut-oil.jpg", benefit: "Deep Nourishment" },
    { name: "Vetiver", img: "/images/vetiver.jpg", benefit: "Cooling Effect" },
    { name: "Fenugreek", img: "/images/Fenugreek.jpg", benefit: "Prevents Shedding" },
    { name: "Henna", img: "/images/Henna.jpg", benefit: "Natural Color" },
    { name: "Curry Leaves", img: "/images/curry-leaves.jpg", benefit: "Rich in Iron" },
    { name: "Black Cumin", img: "/images/black-cumin.jpg", benefit: "Anti-Inflammatory" },
    { name: "Rose Petals", img: "/images/rose-petals.jpg", benefit: "Scalp Soothing" },
    { name: "Pearl Onion", img: "/images/pearl-onion.jpg", benefit: "Growth Booster" },
    { name: "False Daisy", img: "/images/false-daisy.jpg", benefit: "Rejuvenation" },
    { name: "Rosemary", img: "/images/rosemary.jpg", benefit: "Circulation" },
    { name: "Tanner's Cassia", img: "/images/tanners-cassia.jpg", benefit: "Antibacterial" },
  ];

  const visibleIngredients = showAllIngredients ? ingredients : ingredients.slice(0, 6);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kala Agalya Herbals",
    "url": "https://kalaagalyaherbals.com",
    "logo": "https://kalaagalyaherbals.com/images/icons/logo.png",
    "description": "Premium Naturopathy Herbal Hair Oil made with 18+ rare herbs for hair growth and hair fall control.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-7338758727",
      "contactType": "customer service"
    }
  };

  return (
    <div className="overflow-x-hidden relative">
      <Helmet>
        <title>Kala Agalya Herbals | Best Naturopathy Herbal Hair Oil for Growth & Hair Fall</title>
        <meta name="description" content="Experience the ancient power of 18+ rare herbs with Kala Agalya Herbals. Our 100% organic Naturopathy hair oil strengthens roots, prevents hair fall, and promotes natural shine." />
        <meta name="keywords" content="herbal hair oil, Naturopathy hair growth oil, natural hair care, stop hair fall, organic hair oil India, Kala Agalya Herbals" />
        <link rel="canonical" href="https://kalaagalyaherbals.com" />
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Patterns & Animations */}
        <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[#0a0802]"></div>
            <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-amber-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-lime-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10 py-20">
          
          {/* Left Text Content - Carousel */}
          <div className="relative min-h-[450px] md:min-h-[500px] flex items-center">
            {heroSlides.map((slide, index) => (
              <div 
                key={index}
                className={`absolute inset-0 flex flex-col justify-center transition-all duration-1000 ease-in-out transform ${
                  index === currentSlide 
                    ? 'opacity-100 translate-x-0 scale-100' 
                    : index < currentSlide 
                      ? 'opacity-0 -translate-x-10 scale-95'
                      : 'opacity-0 translate-x-10 scale-95'
                }`}
              >
                  <h2 className="text-lg md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-200 tracking-[0.2em] mb-4 uppercase drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                    Kala Agalya Herbals
                  </h2>
                  <span className="inline-block w-fit py-1.5 px-4 bg-lime-900/20 text-lime-300 rounded-full text-xs md:text-sm font-semibold mb-6 border border-lime-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(163,230,53,0.1)]">
                    {slide.badge}
                  </span>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 text-white drop-shadow-[0_0_25px_rgba(234,179,8,0.3)]">
                    {slide.title} <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-400 animate-gradient-x">
                      {slide.highlight}
                    </span>
                  </h1>
                  <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-8 max-w-lg leading-relaxed">
                    {slide.subtitle}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                    <Link to="/product" className="w-full sm:w-auto">
                      <button className="relative w-full px-8 py-4 bg-yellow-600 text-black font-bold rounded-xl overflow-hidden group hover:scale-105 transition-transform duration-300 shadow-[0_0_25px_rgba(234,179,8,0.5)] border border-yellow-400/50">
                         <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                         <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-30 group-hover:animate-shine" />
                         <span className="relative flex items-center justify-center gap-2">
                           Shop Now 
                           <span className="text-xl">✨</span>
                         </span>
                      </button>
                    </Link>
                    <button 
                      onClick={() => document.getElementById('ingredients').scrollIntoView({ behavior: 'smooth' })}
                      className="w-full sm:w-auto px-8 py-4 bg-transparent border border-yellow-500 text-yellow-500 font-bold rounded-xl hover:bg-yellow-500/10 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all duration-300 cursor-pointer backdrop-blur-sm"
                    >
                      View Ingredients
                    </button>
                  </div>

                  <div className="mt-8 md:mt-12 flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm font-medium text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_#facc15]"></span>
                      Fast Delivery
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></span>
                      No Chemicals
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]"></span>
                      Cruelty Free
                    </div>
                  </div>
              </div>
            ))}
          </div>

          {/* Right Image Content */}
          <div className="relative min-h-[400px] md:h-[600px] flex items-center justify-center md:-translate-x-10 mt-12 md:mt-0">
            {heroSlides.map((slide, index) => (
              <div 
                key={index}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out transform ${
                  index === currentSlide 
                    ? 'opacity-100 translate-x-0 scale-100 md:scale-110' 
                    : index < currentSlide 
                      ? 'opacity-0 -translate-x-20 scale-90 blur-sm'
                      : 'opacity-0 translate-x-20 scale-90 blur-sm'
                }`}
              >
                <div className="relative z-10 animate-[float_4s_ease-in-out_infinite]">
                  <img 
                    src={slide.image}
                    alt={slide.alt} 
                    className="w-full max-h-[350px] md:max-h-[600px] object-contain mx-auto drop-shadow-[0_0_50px_rgba(234,179,8,0.6)] filter brightness-110"
                  />
                </div>
                {/* Glowing effect behind bottle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-yellow-500/20 blur-[80px] md:blur-[130px] rounded-full pointer-events-none mix-blend-screen"></div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Stats Section */}
      <section className="scroll-animate scroll-scale bg-[#121005]/90 backdrop-blur-md py-10 relative -mt-10 mx-4 md:mx-auto max-w-6xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] z-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center border border-yellow-500/30">
        <div>
          <h3 className="text-4xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]">100%</h3>
          <p className="text-amber-100/70 mt-1">Natural Ingredients</p>
        </div>
        <div>
          <h3 className="text-4xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]">5000+</h3>
          <p className="text-amber-100/70 mt-1">Happy Customers</p>
        </div>
        <div>
          <h3 className="text-4xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]">18+</h3>
          <p className="text-amber-100/70 mt-1">Rare Herbs</p>
        </div>
        <div>
          <h3 className="text-4xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]">4.9</h3>
          <p className="text-amber-100/70 mt-1">Star Rating</p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 relative bg-[#060502]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-20 scroll-animate">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
              Why this <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-200">Hair Oil?</span>
            </h2>
            <p className="text-xl md:text-2xl text-yellow-500/80 font-medium italic">
              "We bring you the secrets of ancient Ayurveda, bottled with care and precision for the modern lifestyle."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { img: "Home 1.png", title: "100% Ayurvedic Recipe", desc: "Ancient secrets formulated perfectly for modern, everyday hair care needs." },
              { img: "home 2.png", title: "Zero Harmful Chemicals", desc: "Completely free from parabens, sulphates, mineral oils, and artificial colors." },
              { img: "Home 3.png", title: "Proven Visible Results", desc: "Experience noticeable hair growth and significantly reduced hair fall in weeks." },
              { img: "Home 4.png", title: "Deep Root Nourishment", desc: "Our oil penetrates deeply to strengthen your hair strands from the inside out." },
              { img: "Home 5.png", title: "Scalp Cooling Effect", desc: "Alleviates stress and eliminates dandruff with natural cooling herbs like Vetiver." },
              { img: "Home 6.png", title: "Restores Natural Shine", desc: "Locks in vital moisture and brings back your hair's beautiful, natural glow." }
            ].map((item, i) => (
              <div key={i} className={`scroll-animate scroll-delay-${(i % 3) + 1} group relative h-[400px] rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-yellow-500/20`}>
                <div className="absolute inset-0 bg-[#0d0a04]"></div>
                
                {/* Background Image Container with proper scaling */}
                <div className="absolute inset-0 top-0 h-3/4 overflow-hidden flex items-center justify-center p-6 bg-gradient-to-b from-[#1a1405] to-[#0d0a04]">
                  <div className="absolute inset-0 bg-yellow-500/5 mix-blend-overlay"></div>
                  <img 
                    src={`/images/${item.img}`} 
                    alt={item.title} 
                    className="w-full h-full object-contain transform group-hover:scale-110 group-hover:-translate-y-4 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] drop-shadow-[0_10px_20px_rgba(234,179,8,0.3)] filter brightness-90 group-hover:brightness-110" 
                  />
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-20 pb-8 px-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors drop-shadow-md">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ingredients Section */}
      <section id="ingredients" className="py-24 bg-[#0a0802] relative border-t border-yellow-900/30">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              Powered by 18+ Rare Herbs
            </h2>
            <p className="text-gray-400 mt-6 max-w-2xl mx-auto text-lg">
               Each bottle is infused with a potent blend of pure herbs, carefully selected for their unique hair-nourishing properties.
            </p>
          </div>
          
          {/* Robust CSS Grid instead of Flex to prevent layout collapse */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
            {visibleIngredients.map((item, i) => (
              <div key={i} className={`scroll-animate scroll-delay-${(i % 6) + 1} group flex flex-col items-center justify-start text-center p-4 bg-[#15120a] rounded-3xl border border-yellow-900/30 hover:border-yellow-500/50 hover:bg-[#1a170d] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(234,179,8,0.15)]`}>
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-5 border-2 border-yellow-500/20 group-hover:border-yellow-400 transition-colors relative shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                  <div className="absolute inset-0 bg-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 mix-blend-overlay"></div>
                  <img 
                    src={item.img} 
                    alt={`Ingredient: ${item.name}`} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                  />
                </div>
                <h4 className="font-bold text-gray-200 group-hover:text-yellow-400 transition-colors text-sm sm:text-base mb-2">{item.name}</h4>
                <span className="text-[10px] sm:text-xs text-lime-400 font-bold bg-lime-900/30 border border-lime-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                  {item.benefit}
                </span>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16 scroll-animate">
            <button 
              onClick={() => setShowAllIngredients(!showAllIngredients)}
              className="group relative px-8 py-4 bg-transparent border-2 border-yellow-600 text-yellow-500 font-bold rounded-xl overflow-hidden hover:text-black transition-colors shadow-[0_0_20px_rgba(234,179,8,0.2)]"
            >
              <div className="absolute inset-0 bg-yellow-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] -z-10"></div>
              <span className="flex items-center gap-3">
                {showAllIngredients ? "Show Less" : "View all 18+ ingredients"}
                <span className={`text-xl transform transition-transform duration-500 ${showAllIngredients ? 'rotate-180' : 'rotate-0 group-hover:translate-y-1'}`}>
                  ↓
                </span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-[#0a0802] border-t border-yellow-900/50 text-white py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-yellow-600/5 bg-[radial-gradient(circle_at_bottom,_transparent_0%,_#0a0802_70%)] pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="scroll-animate text-3xl md:text-5xl font-bold mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">Ready to Transform Your Hair Naturally?</h2>
          <p className="text-gray-400 mb-10 text-lg max-w-2xl mx-auto">
            Join thousands of satisfied customers who have switched to Kala Agalya Herbals Herbal Organic Hair Oil.
          </p>
          <Link to="/product">
            <button className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-10 py-4 rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(234,179,8,0.7)] transition-all shadow-lg border border-yellow-400/50">
              Get Your Natural Hair Growth Bottle Today
            </button>
          </Link>
        </div>
      </section>

      {/* Global Animation Styles */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes shine {
          100% { left: 125%; }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}


