'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home', section: '' },
    { href: '/about', label: 'About', section: 'about' },
    { href: '/#services', label: 'Services', section: 'services' },
    { href: '/our-team', label: 'Our Team', section: '' },
    { href: '/partnerships', label: 'Partnerships', section: '' },
    { href: '/research', label: 'Research', section: '' },
    { href: '/health-resources', label: 'Health Resources', section: '' },
    { href: '/testimonials', label: 'Testimonials', section: '' },
    { href: '/#contact', label: 'Contact', section: 'contact' },
  ];

  // Track active section on scroll (for homepage sections)
  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection('');
      return;
    }

    const handleScroll = () => {
      const sections = ['services', 'about', 'contact'];
      const scrollPosition = window.scrollY + 100;

      // Check if at top of page
      if (scrollPosition < 200) {
        setActiveSection('home');
        return;
      }

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Check if a link is active
  const isLinkActive = (link: { href: string; section: string }) => {
    // For non-homepage pages
    if (link.href.startsWith('/') && !link.href.includes('#')) {
      if (link.href === '/') {
        return pathname === '/' && (activeSection === 'home' || activeSection === '');
      }
      return pathname === link.href || pathname.startsWith(link.href + '/');
    }
    
    // For homepage sections (hash links)
    if (link.href.includes('#') && pathname === '/') {
      return activeSection === link.section;
    }

    return false;
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="mx-auto w-full max-w-[1920px] px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between gap-2 py-3 sm:py-4 md:gap-3 md:py-4">
          <Link
            href="/"
            className="flex shrink-0 items-center hover:opacity-80 transition-all duration-300 transform hover:scale-105"
          >
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 md:h-[4.25rem] md:w-[4.25rem] lg:h-20 lg:w-20">
              <Image
                src="/logo.svg"
                alt="MedConsult Liberia Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <button
            type="button"
            className="md:hidden flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-gray-700 transition-all duration-300 hover:bg-emerald-50 hover:text-emerald-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
          </button>

          {/* Desktop: keep nav + CTAs in one row (no wrap) so nothing drifts under a huge empty gap */}
          <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto overflow-y-hidden pl-2 md:flex lg:gap-2 lg:pl-4 [scrollbar-width:thin]">
            <nav className="min-w-0">
              <ul className="flex flex-nowrap items-center justify-end gap-x-0.5 sm:gap-x-1 lg:gap-x-1.5">
                {navLinks.map((link) => {
                  const isActive = isLinkActive(link);
                  return (
                    <li key={link.href} className="shrink-0">
                      <a
                        href={link.href}
                        className={`relative block whitespace-nowrap px-1 py-1.5 text-[11px] font-medium leading-snug transition-all duration-300 group sm:px-1.5 sm:text-xs md:text-[12px] md:px-1.5 lg:text-sm lg:px-2 ${
                          isActive ? 'text-emerald-600' : 'text-gray-700 hover:text-emerald-600'
                        }`}
                      >
                        {link.label}
                        <span
                          className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 ${
                            isActive ? 'w-full' : 'w-0 group-hover:w-full'
                          }`}
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex shrink-0 items-center gap-0.5 border-l border-gray-200/80 pl-1.5 sm:gap-1 sm:pl-2 lg:gap-2 lg:pl-3">
              <Link
                href="/dashboard/general-consultation"
                className="whitespace-nowrap rounded-lg px-1.5 py-1.5 text-[11px] font-semibold text-gray-900 hover:bg-emerald-50 hover:text-emerald-600 sm:text-xs md:px-2 lg:text-sm"
              >
                Join Team
              </Link>
              <Link
                href="/login"
                className="whitespace-nowrap rounded-lg px-1.5 py-1.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 sm:text-xs md:px-2 lg:text-sm"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="whitespace-nowrap rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-2 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-emerald-600 sm:text-xs md:px-2.5 lg:text-sm lg:px-3"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            <ul className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link);
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={`font-medium transition-all duration-300 block py-3 px-4 rounded-lg ${
                        isActive
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
              <li className="pt-4 space-y-2">
                <Link
                  href="/login"
                  className="block text-center py-3 px-4 text-emerald-600 font-semibold hover:bg-emerald-50 rounded-lg transition-all duration-300"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block text-center py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-md"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
