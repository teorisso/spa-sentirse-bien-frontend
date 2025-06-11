'use client';

import Image from 'next/image';
import Link from 'next/link';
import { User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = true }: HeaderProps) {
  const { logout, user } = useAuth();
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  const handleUserClick = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
    } else {
      setShowMenu(!showMenu);
    }
  };

  const navLinks = [
    { href: '/', label: 'INICIO' },
    { href: '/servicios', label: 'SERVICIOS' },
    { href: '/conocenos', label: 'CONÓCENOS' },
    { href: '/contacto', label: 'CONTACTO' },
    { href: '/turnos', label: 'MIS TURNOS' },
  ];

  return (
    <motion.header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 font-roboto ${
        transparent 
          ? isScrolled 
            ? 'bg-primary/90 backdrop-blur-md border-b border-primary/20 shadow-lg' 
            : 'bg-transparent'
          : 'bg-primary/90 backdrop-blur-md border-b border-primary/20 shadow-lg'
      }`}
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Image 
              src="/images/logo.png" 
              alt="Logo del SPA" 
              width={45} 
              height={45} 
              className="rounded-full border-2 border-accent shadow-lg hover:shadow-xl transition-shadow duration-300" 
            />
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-lora font-bold tracking-tight text-soft2 drop-shadow-sm">
                SPA <span className="font-light italic text-accent">Sentirse Bien</span>
              </h1>
              <span className="block text-xs md:text-sm font-lora italic text-soft2/80 -mt-1">Bienestar & Relax</span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex gap-4 md:gap-6 text-sm md:text-base font-medium">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="relative px-2 py-1 font-lora text-soft2 transition-all duration-300
                      before:content-[''] before:absolute before:left-0 before:-bottom-1 before:w-0 before:h-[2px]
                      before:bg-accent before:transition-all before:duration-300
                      hover:before:w-full hover:text-accent hover:scale-105"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="flex items-center gap-4 relative">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <User
                  className="w-6 h-6 cursor-pointer hover:text-accent transition-colors duration-300"
                  onClick={handleUserClick}
                />
                <AnimatePresence>
                  {isAuthenticated && showMenu && (
                    <motion.div 
                      className="absolute right-0 mt-2 w-48 bg-white text-primary shadow-lg border border-soft2 rounded-xl z-50 text-sm font-normal overflow-hidden"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        href="/perfil"
                        className="block px-4 py-2 hover:bg-soft transition-colors duration-300 font-lora"
                        onClick={() => setShowMenu(false)}
                      >
                        Mi perfil
                      </Link>
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Administración
                          </div>
                          <Link
                            href="/admin/usuarios"
                            className="block px-4 py-2 hover:bg-soft transition-colors duration-300 font-lora text-amber-700"
                            onClick={() => setShowMenu(false)}
                          >
                            Gestión de Usuarios
                          </Link>
                          <Link
                            href="/admin/turnos"
                            className="block px-4 py-2 hover:bg-soft transition-colors duration-300 font-lora text-amber-700"
                            onClick={() => setShowMenu(false)}
                          >
                            Gestión de Turnos
                          </Link>
                          <Link
                            href="/servicios"
                            className="block px-4 py-2 hover:bg-soft transition-colors duration-300 font-lora text-amber-700"
                            onClick={() => setShowMenu(false)}
                          >
                            Gestión de Servicios
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-soft transition-colors duration-300 font-lora"
                      >
                        Cerrar sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-soft2 hover:text-accent focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <nav className="px-2 pt-2 pb-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 rounded-md text-base font-medium text-soft2 hover:text-accent hover:bg-primary/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/perfil"
                      className="block px-3 py-2 rounded-md text-base font-medium text-soft2 hover:text-accent hover:bg-primary/10"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Mi perfil
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="px-3 py-2 text-xs font-semibold text-soft2/60 uppercase tracking-wider">
                          Administración
                        </div>
                        <Link
                          href="/admin/usuarios"
                          className="block px-3 py-2 rounded-md text-base font-medium text-amber-300 hover:text-accent hover:bg-primary/10"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Gestión de Usuarios
                        </Link>
                        <Link
                          href="/admin/turnos"
                          className="block px-3 py-2 rounded-md text-base font-medium text-amber-300 hover:text-accent hover:bg-primary/10"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Gestión de Turnos
                        </Link>
                        <Link
                          href="/servicios"
                          className="block px-3 py-2 rounded-md text-base font-medium text-amber-300 hover:text-accent hover:bg-primary/10"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Gestión de Servicios
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-soft2 hover:text-accent hover:bg-primary/10"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-soft2 hover:text-accent hover:bg-primary/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
