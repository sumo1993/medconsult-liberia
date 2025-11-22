'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/#services', label: 'Services' },
    { href: '/our-team', label: 'Our Team' },
    { href: '/partnerships', label: 'Partnerships' },
    { href: '/research', label: 'Research' },
    { href: '/blog', label: 'Blog' },
    { href: '/testimonials', label: 'Testimonials' },
    { href: '/#contact', label: 'Contact' },
  ];

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
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="relative px-4 py-2 text-gray-700 font-medium hover:text-emerald-600 transition-all duration-300 group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-600 to-emerald-400 group-hover:w-full transition-all duration-300"></span>
                  </a>
                </li>
              ))}
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
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gray-700 font-medium hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300 block py-3 px-4 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
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
