import { useEffect } from "react";
import { inView, animate } from "framer-motion";

export default function useScrollAnimation() {
  useEffect(() => {
    // 1. Maintain existing .scroll-animate functionality but upgrade it with Framer Motion
    inView(".scroll-animate", (info) => {
      const el = info.target;
      el.classList.add("visible");
      
      // Premium Apple/Tesla style easing
      animate(el, 
        { opacity: [0, 1], y: [40, 0], scale: [0.95, 1] }, 
        { duration: 1, ease: [0.16, 1, 0.3, 1] }
      );
    }, { margin: "0px 0px -50px 0px" });

    // 2. Add GLOBAL automatic scroll animations for all major sections and cards
    // This fulfills the requirement of animating everything globally without manual edits
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
           transform: translateY(40px) scale(0.98) !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Apply init class only to elements that are below the fold (to prevent hiding the hero section)
    const elements = document.querySelectorAll(selectorsToAnimate);
    elements.forEach(el => {
      // Skip already manually animated elements
      if (el.classList.contains("scroll-animate") || el.closest('.scroll-animate')) return;
      if (el.dataset.animated === "true") return;

      const rect = el.getBoundingClientRect();
      // If element is below viewport, hide it initially for a smooth reveal
      if (rect.top > window.innerHeight * 0.8) {
        el.classList.add('framer-anti-gravity-init');
      }
    });

    // Animate them when they come into view
    inView(selectorsToAnimate, (info) => {
      const el = info.target;
      
      if (el.classList.contains("scroll-animate") || el.closest('.scroll-animate')) return;
      if (el.dataset.animated === "true") return;
      
      el.dataset.animated = "true";
      el.classList.remove('framer-anti-gravity-init');

      // Premium Anti-Gravity Floating Feel
      animate(el, 
        { 
          opacity: [0, 1], 
          y: [40, 0], 
          scale: [0.98, 1],
          filter: ["blur(5px)", "blur(0px)"] 
        }, 
        { 
          duration: 1.2, 
          ease: [0.22, 1, 0.36, 1], // Premium SaaS easing curve
          delay: 0.1 // Subtle stagger feel
        }
      );
    }, { margin: "0px 0px -100px 0px" });

  }, []); // Run once on mount
}
