import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import Icon from '@/components/FontAwesome';

const LanguageSwitcher = ({ 
  variant = 'dropdown', // 'dropdown' or 'toggle'
  showLabels = true,
  className = ''
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' }
  ];

  const currentLanguage = languages.find(lang => lang.code === router.locale) || languages[0];

  const changeLanguage = (locale) => {
    const { pathname, asPath, query } = router;
    
    // Close dropdown
    setIsOpen(false);
    
    // Change language
    router.push({ pathname, query }, asPath, { locale });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.umrahfi-language-switcher')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  if (variant === 'toggle') {
    return (
      <div className={`umrahfi-language-switcher umrahfi-language-toggle ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`umrahfi-lang-btn ${
              router.locale === lang.code ? 'umrahfi-lang-active' : ''
            }`}
            title={lang.name}
          >
            <span className="umrahfi-lang-flag">{lang.flag}</span>
            {showLabels && <span className="umrahfi-lang-code">{lang.code.toUpperCase()}</span>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`umrahfi-language-switcher umrahfi-language-dropdown ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="umrahfi-lang-trigger"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="umrahfi-lang-flag">{currentLanguage.flag}</span>
        {showLabels && (
          <span className="umrahfi-lang-label">
            {currentLanguage.nativeName}
          </span>
        )}
        <Icon 
          icon={['fas', 'chevron-down']} 
          className={`umrahfi-lang-chevron ${isOpen ? 'umrahfi-chevron-rotate' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="umrahfi-lang-menu">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`umrahfi-lang-menu-item ${
                router.locale === lang.code ? 'umrahfi-lang-menu-active' : ''
              }`}
            >
              <span className="umrahfi-lang-flag">{lang.flag}</span>
              <div className="umrahfi-lang-info">
                <span className="umrahfi-lang-name">{lang.name}</span>
                <span className="umrahfi-lang-native">{lang.nativeName}</span>
              </div>
              {router.locale === lang.code && (
                <Icon icon={['fas', 'check']} className="umrahfi-lang-check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;