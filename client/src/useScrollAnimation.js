import { useEffect } from "react";
import { inView, animate } from "framer-motion";
import gsap from "gsap";

export default function useScrollAnimation() {
  useEffect(() => {
    // 1. Maintain existing .scroll-animate functionality but FIX THE CRASH
    inView(".scroll-animate", (element) => {
      // FIX: The callback receives the DOM element directly! Not an 'info' object.
      element.classList.add("visible");
      
      // Cinematic Apple/Tesla style easing
      animate(element, 
        { opacity: [0, 1], y: [60, 0], scale: [0.95, 1], filter: ["blur(10px)", "blur(0px)"] }, 
        { duration: 1.4, ease: [0.16, 1, 0.3, 1] }
      );
    }, { margin: "0px 0px -50px 0px" });

    // 2. Add GLOBAL cinematic scroll animations for all major sections and cards
    const selectorsToAnimate = [
      "main > section",
      "main > div > section",
      ".glass-card",
      ".bg-\\[\\#111a11\\]", // Admin report cards
      "article"
    ].join(", ");

    // Inject initial styles to hide elements below the fold before they animate in
    const styleId = 'global-anti-gravity-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .framer-anti-gravity-init {
           opacity: 0 !important;
           transform: translateY(60px) scale(0.96) !important;
           filter: blur(8px) !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Apply init class only to elements that are below the fold
    const elements = document.querySelectorAll(selectorsToAnimate);
    elements.forEach(el => {
      if (el.classList.contains("scroll-animate") || el.closest('.scroll-animate')) return;
      if (el.dataset.animated === "true") return;

      const rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.8) {
        el.classList.add('framer-anti-gravity-init');
      }
    });

    // Premium Anti-Gravity Floating Feel using GSAP for luxury easing
    inView(selectorsToAnimate, (element) => {
      if (element.classList.contains("scroll-animate") || element.closest('.scroll-animate')) return;
      if (element.dataset.animated === "true") return;
      
      element.dataset.animated = "true";
      element.classList.remove('framer-anti-gravity-init');

      // GSAP Advanced Cinematic Reveal
      gsap.fromTo(element, 
        { opacity: 0, y: 80, scale: 0.95, filter: "blur(12px)" },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          filter: "blur(0px)",
          duration: 1.8, 
          ease: "power4.out", // Luxury smooth deceleration
          clearProps: "filter" // Improve scroll performance
        }
      );
    }, { margin: "0px 0px -150px 0px" });

  }, []); // Run once on mount
}
