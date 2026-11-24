import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { INDIAN_LANGUAGES, DEFAULT_LANGUAGE, findLanguage } from "../data/languages";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Helper to get cookie
const getCookie = (name) => {
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : null;
};

// Helper to set cookie across domains and root path
const setGoogleTransCookie = (langCode) => {
  const cookieValue = `/en/${langCode}`;
  const hostname = window.location.hostname;
  
  // Set for current path & root
  document.cookie = `googtrans=${cookieValue}; path=/;`;
  
  // If not localhost, set for domain
  if (hostname && !hostname.includes("localhost") && !hostname.includes("127.0.0.1")) {
    document.cookie = `googtrans=${cookieValue}; path=/; domain=.${hostname};`;
    const parts = hostname.split(".");
    if (parts.length > 2) {
      const rootDomain = parts.slice(-2).join(".");
      document.cookie = `googtrans=${cookieValue}; path=/; domain=.${rootDomain};`;
    }
  }
};

// Helper to clear cookie for English reset
const clearGoogleTransCookie = () => {
  const hostname = window.location.hostname;
  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = `googtrans=/en/en; path=/;`;
  if (hostname && !hostname.includes("localhost") && !hostname.includes("127.0.0.1")) {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname};`;
    document.cookie = `googtrans=/en/en; path=/; domain=.${hostname};`;
    const parts = hostname.split(".");
    if (parts.length > 2) {
      const rootDomain = parts.slice(-2).join(".");
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain};`;
      document.cookie = `googtrans=/en/en; path=/; domain=.${rootDomain};`;
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(DEFAULT_LANGUAGE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize on mount: check saved preference
  useEffect(() => {
    const saved = localStorage.getItem("preferred_lang");
    if (saved) {
      const lang = findLanguage(saved);
      setCurrentLang(lang);
    } else {
      const cookie = getCookie("googtrans");
      if (cookie) {
        const match = cookie.split("/")[2];
        if (match) {
          setCurrentLang(findLanguage(match));
        }
      }
    }
  }, []);

  // Synchronize document lang and data-lang attribute whenever currentLang changes
  useEffect(() => {
    if (currentLang?.code) {
      document.documentElement.lang = currentLang.code;
      document.documentElement.setAttribute("data-lang", currentLang.code);
    }
  }, [currentLang]);

  // Dynamically load Google Translate Script safely
  useEffect(() => {
    // Define global callback
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: INDIAN_LANGUAGES.map((l) => l.code).join(","),
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element"
        );
        setIsInitialized(true);
      }
    };

    // Check if script already exists
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.type = "text/javascript";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      setIsInitialized(true);
    }
  }, []);

  // Language changer
  const changeLanguage = useCallback((langCode) => {
    const targetLang = findLanguage(langCode);
    setCurrentLang(targetLang);
    localStorage.setItem("preferred_lang", targetLang.code);

    if (targetLang.code === "en") {
      clearGoogleTransCookie();
    } else {
      setGoogleTransCookie(targetLang.code);
    }

    // Attempt to trigger the Google Translate DOM element if rendered
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = targetLang.code;
      combo.dispatchEvent(new Event("change"));
    } else {
      // Reload smoothly if needed to apply cookie translations cleanly
      window.location.reload();
    }

    setIsModalOpen(false);
  }, []);

  // Reset to English
  const resetToEnglish = useCallback(() => {
    changeLanguage("en");
  }, [changeLanguage]);

  return (
    <LanguageContext.Provider
      value={{
        languages: INDIAN_LANGUAGES,
        currentLang,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        changeLanguage,
        resetToEnglish,
        isInitialized,
      }}
    >
      {/* Hidden container for Google Translate Engine */}
      <div id="google_translate_element" style={{ display: "none" }} aria-hidden="true" />
      {children}
    </LanguageContext.Provider>
  );
};
