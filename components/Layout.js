import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/utils/AuthContext';
import { useState, useEffect } from 'react';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => router.pathname === path;
  const isActiveSection = (path) => router.pathname.startsWith(path);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={`${styles.navbarModern} ${isScrolled ? styles.navbarScrolled : ''}`}>
        <div className={styles.navbarContainer}>
          <div className={styles.navbarContent}>
            {/* Brand */}
            <div className={styles.navbarBrandSection}>
              <Link href="/" className={styles.navbarBrand} onClick={closeMobileMenu}>
                <div className={styles.brandIcon}>
                  <span className={styles.brandSymbol}>🕌</span>
                </div>
                <span className={styles.brandText}>Umrahfi</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className={styles.navbarNavDesktop}>
              <div className={styles.navLinks}>

                {!isAuthenticated ? (
                  <>
                    {/* Temporarily disabled
                    <Link 
                      href="/about" 
                      className={`${styles.navLink} ${isActive('/about') ? styles.navLinkActive : ''}`}
                    >
                      <span className={styles.navLinkText}>About</span>
                      <span className={styles.navLinkIndicator}></span>
                    </Link>
                    <Link 
                      href="/contact" 
                      className={`${styles.navLink} ${isActive('/contact') ? styles.navLinkActive : ''}`}
                    >
                      <span className={styles.navLinkText}>Contact</span>
                      <span className={styles.navLinkIndicator}></span>
                    </Link>
                    */}
                  </>
                ) : (
                  <>
                  <Link 
                    href="/packages" 
                    className={`${styles.navLink} ${isActive('/packages') ? styles.navLinkActive : ''}`}
                  >
                    <span className={styles.navLinkText}>Packages</span>
                    <span className={styles.navLinkIndicator}></span>
                  </Link>
                    {user.role === 'customer' && (
                      <>
                        <Link 
                          href="/customer" 
                          className={`${styles.navLink} ${isActive('/customer') ? styles.navLinkActive : ''}`}
                        >
                          <span className={styles.navLinkText}>Dashboard</span>
                          <span className={styles.navLinkIndicator}></span>
                        </Link>
                        <Link 
                          href="/customer/orders"
                          className={`${styles.navLink} ${isActive('/customer/orders') ? styles.navLinkActive : ''}`}
                        >
                          <span className={styles.navLinkText}>My Orders</span>
                          <span className={styles.navLinkIndicator}></span>
                        </Link>
                      </>
                    )}
                    
                    {user.role === 'company' && (
                      <>
                        <Link 
                          href="/company"
                          className={`${styles.navLink} ${isActive('/company') ? styles.navLinkActive : ''}`}
                        >
                          <span className={styles.navLinkText}>Dashboard</span>
                          <span className={styles.navLinkIndicator}></span>
                        </Link>
                        <Link 
                          href="/company/packages"
                          className={`${styles.navLink} ${isActive('/company/packages') ? styles.navLinkActive : ''}`}
                        >
                          <span className={styles.navLinkText}>My Packages</span>
                          <span className={styles.navLinkIndicator}></span>
                        </Link>
                        <Link 
                          href="/company/orders"
                          className={`${styles.navLink} ${isActive('/company/orders') ? styles.navLinkActive : ''}`}
                        >
                          <span className={styles.navLinkText}>Orders</span>
                          <span className={styles.navLinkIndicator}></span>
                        </Link>
                      </>
                    )}
                    
                    {user.role === 'admin' && (
                      <>
                        <Link 
                          href="/admin"
                          className={`${styles.navLink} ${isActive('/admin') ? styles.navLinkActive : ''}`}
                        >
                          <span className={styles.navLinkText}>Dashboard</span>
                          <span className={styles.navLinkIndicator}></span>
                        </Link>
                        <Link 
                          href="/admin/users"
                          className={`${styles.navLink} ${isActive('/admin/users') ? styles.navLinkActive : ''}`}
                        >
                          <span className={styles.navLinkText}>Users</span>
                          <span className={styles.navLinkIndicator}></span>
                        </Link>
                        <Link 
                          href="/admin/packages"
                          className={`${styles.navLink} ${isActive('/admin/packages') ? styles.navLinkActive : ''}`}
                        >
                          <span className={styles.navLinkText}>Packages</span>
                          <span className={styles.navLinkIndicator}></span>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Auth Section */}
              <div className={styles.navbarAuth}>
                {!isAuthenticated ? (
                  <div className={styles.authButtons}>
                    <Link href="/login">
                      <button className={`btn btn-ghost ${styles.btnNav}`}>
                        Sign In
                      </button>
                    </Link>
                    <Link href="/register">
                      <button className={`btn btn-primary ${styles.btnNav}`}>
                        <span>Get Started</span>
                        <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className={styles.userMenu}>
                    <div className={styles.userAvatar}>
                      <span>
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>Hi, {user.name}</span>
                      <span className={styles.userRole}>{user.role}</span>
                    </div>
                    <button onClick={handleLogout} className={`btn btn-ghost btn-sm ${styles.logoutBtn}`}>
                      <svg className={styles.logoutIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <div className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`}>
            <div className={styles.mobileNavContent}>
              <div className={styles.mobileNavLinks}>
                <Link 
                  href="/packages" 
                  className={`${styles.mobileNavLink} ${isActive('/packages') ? styles.mobileNavLinkActive : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.mobileNavIcon}>📦</span>
                  <span>Packages</span>
                </Link>

                {!isAuthenticated ? (
                  <>
                    <Link 
                      href="/about" 
                      className={`${styles.mobileNavLink} ${isActive('/about') ? styles.mobileNavLinkActive : ''}`}
                      onClick={closeMobileMenu}
                    >
                      <span className={styles.mobileNavIcon}>ℹ️</span>
                      <span>About</span>
                    </Link>
                    <Link 
                      href="/contact" 
                      className={`${styles.mobileNavLink} ${isActive('/contact') ? styles.mobileNavLinkActive : ''}`}
                      onClick={closeMobileMenu}
                    >
                      <span className={styles.mobileNavIcon}>📞</span>
                      <span>Contact</span>
                    </Link>
                  </>
                ) : (
                  <>
                    {user.role === 'customer' && (
                      <>
                        <Link 
                          href="/customer" 
                          className={`${styles.mobileNavLink} ${isActiveSection('/customer') ? styles.mobileNavLinkActive : ''}`}
                          onClick={closeMobileMenu}
                        >
                          <span className={styles.mobileNavIcon}>📊</span>
                          <span>Dashboard</span>
                        </Link>
                        <Link 
                          href="/customer/orders"
                          className={`${styles.mobileNavLink} ${isActive('/customer/orders') ? styles.mobileNavLinkActive : ''}`}
                          onClick={closeMobileMenu}
                        >
                          <span className={styles.mobileNavIcon}>📋</span>
                          <span>My Orders</span>
                        </Link>
                      </>
                    )}
                    
                    {user.role === 'company' && (
                      <>
                        <Link 
                          href="/company"
                          className={`${styles.mobileNavLink} ${isActiveSection('/company') ? styles.mobileNavLinkActive : ''}`}
                          onClick={closeMobileMenu}
                        >
                          <span className={styles.mobileNavIcon}>📊</span>
                          <span>Dashboard</span>
                        </Link>
                        <Link 
                          href="/company/packages"
                          className={`${styles.mobileNavLink} ${isActive('/company/packages') ? styles.mobileNavLinkActive : ''}`}
                          onClick={closeMobileMenu}
                        >
                          <span className={styles.mobileNavIcon}>📦</span>
                          <span>My Packages</span>
                        </Link>
                        <Link 
                          href="/company/orders"
                          className={`${styles.mobileNavLink} ${isActive('/company/orders') ? styles.mobileNavLinkActive : ''}`}
                          onClick={closeMobileMenu}
                        >
                          <span className={styles.mobileNavIcon}>📋</span>
                          <span>Orders</span>
                        </Link>
                      </>
                    )}
                    
                    {user.role === 'admin' && (
                      <>
                        <Link 
                          href="/admin"
                          className={`${styles.mobileNavLink} ${isActiveSection('/admin') ? styles.mobileNavLinkActive : ''}`}
                          onClick={closeMobileMenu}
                        >
                          <span className={styles.mobileNavIcon}>⚙️</span>
                          <span>Dashboard</span>
                        </Link>
                        <Link 
                          href="/admin/users"
                          className={`${styles.mobileNavLink} ${isActive('/admin/users') ? styles.mobileNavLinkActive : ''}`}
                          onClick={closeMobileMenu}
                        >
                          <span className={styles.mobileNavIcon}>👥</span>
                          <span>Users</span>
                        </Link>
                        <Link 
                          href="/admin/packages"
                          className={`${styles.mobileNavLink} ${isActive('/admin/packages') ? styles.mobileNavLinkActive : ''}`}
                          onClick={closeMobileMenu}
                        >
                          <span className={styles.mobileNavIcon}>📦</span>
                          <span>Packages</span>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Mobile Auth */}
              <div className={styles.mobileAuth}>
                {!isAuthenticated ? (
                  <div className={styles.mobileAuthButtons}>
                    <Link href="/login" onClick={closeMobileMenu}>
                      <button className={`btn btn-secondary ${styles.btnMobileAuth}`}>
                        Sign In
                      </button>
                    </Link>
                    <Link href="/register" onClick={closeMobileMenu}>
                      <button className={`btn btn-primary ${styles.btnMobileAuth}`}>
                        Get Started
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className={styles.mobileUserSection}>
                    <div className={styles.mobileUserInfo}>
                      <div className={styles.mobileUserAvatar}>
                        <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                      </div>
                      <div className={styles.mobileUserDetails}>
                        <span className={styles.mobileUserName}>{user.name}</span>
                        <span className={styles.mobileUserRole}>{user.role}</span>
                      </div>
                    </div>
                    <button onClick={handleLogout} className={`btn btn-ghost ${styles.btnMobileLogout}`}>
                      <svg className={styles.logoutIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className={styles.mainContent}>
        {children}
      </main>
      
      <footer className={styles.footerModern}>
        <div className={styles.footerContainer}>
          {/* Footer Top */}
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <div className={styles.footerLogoIcon}>
                  <span>🕌</span>
                </div>
                <span className={styles.footerLogoText}>Umrahfi</span>
              </div>
              <p className={styles.footerDescription}>
                Your trusted partner for sacred journeys. We connect pilgrims 
                with verified travel companies for authentic Umrah experiences.
              </p>
              <div className={styles.footerSocial}>
                <a href="#" className={styles.socialLink} aria-label="Facebook">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className={styles.socialLink} aria-label="Twitter">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className={styles.socialLink} aria-label="Instagram">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.747 0-3.158-1.411-3.158-3.158s1.411-3.158 3.158-3.158 3.158 1.411 3.158 3.158-1.411 3.158-3.158 3.158zm7.718 0c-1.747 0-3.158-1.411-3.158-3.158s1.411-3.158 3.158-3.158 3.158 1.411 3.158 3.158-1.411 3.158-3.158 3.158z"/>
                  </svg>
                </a>
                <a href="#" className={styles.socialLink} aria-label="LinkedIn">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className={styles.footerLinksSection}>
              <div className={styles.footerColumn}>
                <h3 className={styles.footerColumnTitle}>For Pilgrims</h3>
                <ul className={styles.footerLinks}>
                  <li><Link href="/packages" className={styles.footerLink}>Browse Packages</Link></li>
                  <li><Link href="/how-it-works" className={styles.footerLink}>How It Works</Link></li>
                  <li><Link href="/reviews" className={styles.footerLink}>Reviews</Link></li>
                  <li><Link href="/travel-guide" className={styles.footerLink}>Travel Guide</Link></li>
                </ul>
              </div>

              <div className={styles.footerColumn}>
                <h3 className={styles.footerColumnTitle}>For Partners</h3>
                <ul className={styles.footerLinks}>
                  <li><Link href="/register?type=company" className={styles.footerLink}>Join as Partner</Link></li>
                  <li><Link href="/partner-benefits" className={styles.footerLink}>Partner Benefits</Link></li>
                  <li><Link href="/partner-resources" className={styles.footerLink}>Resources</Link></li>
                  <li><Link href="/partner-support" className={styles.footerLink}>Support</Link></li>
                </ul>
              </div>

              <div className={styles.footerColumn}>
                <h3 className={styles.footerColumnTitle}>Support</h3>
                <ul className={styles.footerLinks}>
                  <li><Link href="/contact" className={styles.footerLink}>Contact Us</Link></li>
                  <li><Link href="/help" className={styles.footerLink}>Help Center</Link></li>
                  <li><Link href="/faq" className={styles.footerLink}>FAQ</Link></li>
                  <li><Link href="/safety" className={styles.footerLink}>Safety</Link></li>
                </ul>
              </div>

              <div className={styles.footerColumn}>
                <h3 className={styles.footerColumnTitle}>Company</h3>
                <ul className={styles.footerLinks}>
                  <li><Link href="/about" className={styles.footerLink}>About Us</Link></li>
                  <li><Link href="/careers" className={styles.footerLink}>Careers</Link></li>
                  <li><Link href="/press" className={styles.footerLink}>Press</Link></li>
                  <li><Link href="/blog" className={styles.footerLink}>Blog</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className={styles.footerBottom}>
            <div className={styles.footerBottomContent}>
              <div className={styles.footerCopyright}>
                <span>© 2024 Umrahfi. All rights reserved.</span>
              </div>
              <div className={styles.footerLegal}>
                <Link href="/legal/privacy" className={styles.footerLegalLink}>Privacy Policy</Link>
                <Link href="/legal/terms" className={styles.footerLegalLink}>Terms of Service</Link>
                <Link href="/legal/cookies" className={styles.footerLegalLink}>Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}