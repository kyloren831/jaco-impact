// c:\Users\Aaron\Documents\projects2026\jaco-impact\components\layout\Navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface NavbarProps {
  variant?: "default" | "dashboard";
}

export default function Navbar({ variant = "default" }: NavbarProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsLoggedIn(false);
      window.location.href = "/";
    } catch {
      console.error("Error al cerrar sesión");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      const navbarHeight = document.getElementById("navbar")?.offsetHeight || 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth"
      });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        variant === "dashboard"
          ? "bg-transparent py-4"
          : scrolled ? "bg-black/95 backdrop-blur-md py-3" : "py-4"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center ml-auto md:ml-0">
          <Image
            src="/letters-logo.png"
            alt="Jaco Impact"
            width={180}
            height={52}
            className={`h-[52px] w-auto opacity-92 ${variant === "dashboard" ? "brightness-0 dark:invert" : ""}`}
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-8">
          <li>
            <a href="#about" onClick={(e) => handleSmoothScroll(e, "about")} className={`${variant === "dashboard" ? "text-gray-900 dark:text-gray-100" : "text-white"} font-medium hover:text-brand-verde transition-colors relative group`}>
              Nosotros
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-verde transition-all group-hover:w-full"></span>
            </a>
          </li>
          <li>
            <a href="#impact" onClick={(e) => handleSmoothScroll(e, "impact")} className={`${variant === "dashboard" ? "text-gray-900 dark:text-gray-100" : "text-white"} font-medium hover:text-brand-verde transition-colors relative group`}>
              Impacto
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-verde transition-all group-hover:w-full"></span>
            </a>
          </li>
          <li>
            <a href="#pilares" onClick={(e) => handleSmoothScroll(e, "pilares")} className={`${variant === "dashboard" ? "text-gray-900 dark:text-gray-100" : "text-white"} font-medium hover:text-brand-verde transition-colors relative group`}>
              Pilares
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-verde transition-all group-hover:w-full"></span>
            </a>
          </li>
          <li>
            <a href="#galeria" onClick={(e) => handleSmoothScroll(e, "galeria")} className={`${variant === "dashboard" ? "text-gray-900 dark:text-gray-100" : "text-white"} font-medium hover:text-brand-verde transition-colors relative group`}>
              Actividades
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-verde transition-all group-hover:w-full"></span>
            </a>
          </li>
          <li>
            <a href="#contact" onClick={(e) => handleSmoothScroll(e, "contact")} className={`${variant === "dashboard" ? "text-gray-900 dark:text-gray-100" : "text-white"} font-medium hover:text-brand-verde transition-colors relative group`}>
              Contacto
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-verde transition-all group-hover:w-full"></span>
            </a>
          </li>
          <li className="flex items-center gap-2 ml-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-5 py-2 rounded-full text-sm font-bold text-white bg-brand-verde hover:bg-brand-turquesa transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Mi Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="px-5 py-2 rounded-full text-sm font-bold text-white bg-brand-rojo/80 hover:bg-brand-rojo transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                >
                  {loggingOut ? "Saliendo…" : "Cerrar Sesión"}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 rounded-full text-sm font-bold text-white bg-brand-verde hover:bg-brand-turquesa transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Iniciar Sesión
              </Link>
            )}
          </li>
        </ul>

        {/* Mobile Toggle */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className={`w-6 h-0.5 ${variant === "dashboard" ? "bg-black dark:bg-white" : "bg-white"} transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
          <span className={`w-6 h-0.5 ${variant === "dashboard" ? "bg-black dark:bg-white" : "bg-white"} transition-all ${mobileMenuOpen ? "opacity-0" : ""}`}></span>
          <span className={`w-6 h-0.5 ${variant === "dashboard" ? "bg-black dark:bg-white" : "bg-white"} transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/98 flex flex-col p-6 gap-5 md:hidden">
            <a href="#about" onClick={(e) => handleSmoothScroll(e, "about")} className="text-white font-medium text-lg">Nosotros</a>
            <a href="#impact" onClick={(e) => handleSmoothScroll(e, "impact")} className="text-white font-medium text-lg">Impacto</a>
            <a href="#pilares" onClick={(e) => handleSmoothScroll(e, "pilares")} className="text-white font-medium text-lg">Pilares</a>
            <a href="#galeria" onClick={(e) => handleSmoothScroll(e, "galeria")} className="text-white font-medium text-lg">Actividades</a>
            <a href="#contact" onClick={(e) => handleSmoothScroll(e, "contact")} className="text-white font-medium text-lg">Contacto</a>
            <div className="border-t border-white/20 pt-4 mt-2 flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-5 py-3 rounded-full text-sm font-bold text-white bg-brand-verde hover:bg-brand-turquesa transition-all duration-300"
                  >
                    Ir al Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full px-5 py-3 rounded-full text-sm font-bold text-white bg-brand-rojo/80 hover:bg-brand-rojo transition-all duration-300 disabled:opacity-60"
                  >
                    {loggingOut ? "Saliendo…" : "Cerrar Sesión"}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-5 py-3 rounded-full text-sm font-bold text-white bg-brand-verde hover:bg-brand-turquesa transition-all duration-300"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
