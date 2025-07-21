import { useRouter } from 'next/router';

/**
 * Translation helper utilities for next-translate
 */

/**
 * Get current locale from router
 * @returns {string} Current locale code
 */
export const getCurrentLocale = () => {
  const router = useRouter();
  return router.locale || 'en';
};

/**
 * Get available locales
 * @returns {Array} Array of available locale codes
 */
export const getAvailableLocales = () => {
  return ['en', 'de']; // Add more locales as needed
};

/**
 * Check if current locale is RTL
 * @param {string} locale - Locale code
 * @returns {boolean} True if RTL language
 */
export const isRTL = (locale = null) => {
  const currentLocale = locale || getCurrentLocale();
  const rtlLocales = ['ar', 'he', 'fa', 'ur']; // Add RTL languages as needed
  return rtlLocales.includes(currentLocale);
};

/**
 * Format number based on locale
 * @param {number} number - Number to format
 * @param {string} locale - Locale code
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted number
 */
export const formatNumber = (number, locale = null, options = {}) => {
  const currentLocale = locale || getCurrentLocale();
  return new Intl.NumberFormat(currentLocale, options).format(number);
};

/**
 * Format currency based on locale
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale code
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = 'USD', locale = null) => {
  const currentLocale = locale || getCurrentLocale();
  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date based on locale
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale code
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (date, locale = null, options = {}) => {
  const currentLocale = locale || getCurrentLocale();
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(currentLocale, { ...defaultOptions, ...options })
    .format(new Date(date));
};

/**
 * Format time based on locale
 * @param {Date|string} date - Date/time to format
 * @param {string} locale - Locale code
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time
 */
export const formatTime = (date, locale = null, options = {}) => {
  const currentLocale = locale || getCurrentLocale();
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat(currentLocale, { ...defaultOptions, ...options })
    .format(new Date(date));
};

/**
 * Get localized route path
 * @param {string} path - Route path
 * @param {string} locale - Target locale
 * @returns {string} Localized path
 */
export const getLocalizedPath = (path, locale) => {
  if (locale === 'en') return path; // Default locale doesn't need prefix
  return `/${locale}${path}`;
};

/**
 * Get language name from locale code
 * @param {string} locale - Locale code
 * @returns {string} Language name
 */
export const getLanguageName = (locale) => {
  const languages = {
    en: 'English',
    de: 'Deutsch',
    ar: 'العربية',
    fr: 'Français',
    es: 'Español',
    it: 'Italiano',
    pt: 'Português',
    ru: 'Русский',
    zh: '中文',
    ja: '日本語',
    ko: '한국어'
  };
  
  return languages[locale] || locale.toUpperCase();
};

/**
 * Get language flag emoji from locale code
 * @param {string} locale - Locale code
 * @returns {string} Flag emoji
 */
export const getLanguageFlag = (locale) => {
  const flags = {
    en: '🇺🇸',
    de: '🇩🇪',
    ar: '🇸🇦',
    fr: '🇫🇷',
    es: '🇪🇸',
    it: '🇮🇹',
    pt: '🇵🇹',
    ru: '🇷🇺',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ko: '🇰🇷'
  };
  
  return flags[locale] || '🌍';
};

/**
 * Pluralization helper for manual pluralization
 * @param {number} count - Count value
 * @param {Object} forms - Plural forms object
 * @param {string} locale - Locale code
 * @returns {string} Pluralized string
 */
export const pluralize = (count, forms, locale = null) => {
  const currentLocale = locale || getCurrentLocale();
  
  // English pluralization rules
  if (currentLocale === 'en') {
    if (count === 0 && forms.zero) return forms.zero;
    if (count === 1) return forms.one || forms.singular;
    return forms.other || forms.plural;
  }
  
  // German pluralization rules
  if (currentLocale === 'de') {
    if (count === 1) return forms.one || forms.singular;
    return forms.other || forms.plural;
  }
  
  // Default fallback
  return count === 1 ? (forms.one || forms.singular) : (forms.other || forms.plural);
};

/**
 * Get text direction based on locale
 * @param {string} locale - Locale code
 * @returns {string} 'ltr' or 'rtl'
 */
export const getTextDirection = (locale = null) => {
  return isRTL(locale) ? 'rtl' : 'ltr';
};

/**
 * Create localized URL for sharing
 * @param {string} path - Path to localize
 * @param {string} locale - Target locale
 * @param {string} baseUrl - Base URL (optional)
 * @returns {string} Full localized URL
 */
export const createLocalizedUrl = (path, locale, baseUrl = '') => {
  const localizedPath = getLocalizedPath(path, locale);
  return `${baseUrl}${localizedPath}`;
};

/**
 * Hook to get common translation functions
 * @returns {Object} Translation helper functions
 */
export const useI18nHelpers = () => {
  const router = useRouter();
  
  return {
    currentLocale: router.locale || 'en',
    isRTL: isRTL(router.locale),
    textDirection: getTextDirection(router.locale),
    formatNumber: (number, options) => formatNumber(number, router.locale, options),
    formatCurrency: (amount, currency) => formatCurrency(amount, currency, router.locale),
    formatDate: (date, options) => formatDate(date, router.locale, options),
    formatTime: (date, options) => formatTime(date, router.locale, options),
    getLocalizedPath: (path) => getLocalizedPath(path, router.locale),
    pluralize: (count, forms) => pluralize(count, forms, router.locale)
  };
};