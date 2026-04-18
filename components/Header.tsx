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
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-4 py-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-x-4 lg:gap-x-8">
          {/* Logo + mobile menu trigger (unwraps into grid on md+) */}
          <div className="flex items-center justify-between gap-4 md:contents">
            <Link
              href="/"
              className="flex items-center justify-self-start hover:opacity-80 transition-all duration-300 transform hover:scale-105"
            >
              <div className="relative h-20 w-20 shrink-0">
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
              className="md:hidden shrink-0 justify-self-end p-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop nav — centered in the middle column so links stay grouped on ultrawide */}
          <nav className="hidden min-w-0 md:block">
            <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 xl:gap-x-3">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link);
                return (
                  <li key={link.href} className="shrink-0">
                    <a
                      href={link.href}
                      className={`relative block whitespace-nowrap px-2 py-2 text-sm font-medium transition-all duration-300 group sm:px-3 sm:text-base lg:px-2.5 xl:px-3 ${
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

          <div className="hidden shrink-0 flex-wrap items-center justify-center gap-2 sm:gap-3 md:flex md:justify-self-end lg:justify-end">
            <Link
              href="/dashboard/general-consultation"
              className="whitespace-nowrap px-3 py-2 text-sm font-semibold text-gray-900 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-300 sm:px-4 sm:text-base"
            >
              Join Team
            </Link>
            <Link
              href="/login"
              className="whitespace-nowrap px-3 py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-300 sm:px-4 sm:text-base"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="whitespace-nowrap px-3 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg sm:px-5 sm:text-base"
            >
              Sign Up
            </Link>
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
