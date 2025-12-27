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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-all duration-300 transform hover:scale-105">
            <div className="relative h-20 w-20">
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <ul className="flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link);
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={`relative px-4 py-2 font-medium transition-all duration-300 group ${
                        isActive 
                          ? 'text-emerald-600' 
                          : 'text-gray-700 hover:text-emerald-600'
                      }`}
                    >
                      {link.label}
                      <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}></span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center space-x-3 ml-6">
              <Link
                href="/dashboard/general-consultation"
                className="px-5 py-2 text-gray-900 font-semibold hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-300"
              >
                Join Team
              </Link>
              <Link
                href="/login"
                className="px-5 py-2 text-emerald-600 font-semibold hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-300"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
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
