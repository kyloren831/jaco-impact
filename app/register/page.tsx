"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al registrar la cuenta");
      } else {
        setSuccess("¡Registro exitoso! Redirigiendo al inicio de sesión...");
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      setError("Error de conexión, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerPage}>
      {/* Background */}
      <div className={styles.backgroundImage} />
      <div className={styles.backgroundOverlay} />

      {/* Logo */}
      <div className={styles.logo}>
        <Link href="/">
          <Image
            src="/letters-logo.png"
            alt="Jaco Impact"
            width={180}
            height={52}
            className={styles.logoImage}
            priority
          />
        </Link>
      </div>

      {/* Card with Leaves */}
      <div className={styles.cardContainer}>
        {/* Decorative Leaves */}
        <img src="/leaf-1.svg" alt="" className={`${styles.leaf} ${styles.leafTopLeft1}`} aria-hidden="true" />
        <img src="/leaf-2.svg" alt="" className={`${styles.leaf} ${styles.leafTopLeft2}`} aria-hidden="true" />
        <img src="/leaf-3.svg" alt="" className={`${styles.leaf} ${styles.leafTopLeft3}`} aria-hidden="true" />
        <img src="/leaf-2.svg" alt="" className={`${styles.leaf} ${styles.leafTopRight1}`} aria-hidden="true" />
        <img src="/leaf-1.svg" alt="" className={`${styles.leaf} ${styles.leafTopRight2}`} aria-hidden="true" />
        <img src="/leaf-3.svg" alt="" className={`${styles.leaf} ${styles.leafBottomLeft1}`} aria-hidden="true" />
        <img src="/leaf-1.svg" alt="" className={`${styles.leaf} ${styles.leafBottomLeft2}`} aria-hidden="true" />
        <img src="/leaf-2.svg" alt="" className={`${styles.leaf} ${styles.leafBottomRight1}`} aria-hidden="true" />
        <img src="/leaf-3.svg" alt="" className={`${styles.leaf} ${styles.leafBottomRight2}`} aria-hidden="true" />
        <img src="/leaf-1.svg" alt="" className={`${styles.leaf} ${styles.leafMidLeft}`} aria-hidden="true" />
        <img src="/leaf-3.svg" alt="" className={`${styles.leaf} ${styles.leafMidRight}`} aria-hidden="true" />

        {/* Card */}
        <div className={styles.card}>
          {/* Left image panel */}
          <div className={styles.imagePanel} />

          {/* Right form panel */}
          <div className={styles.formPanel}>
            <h2 className={styles.title}>Jaco Impact</h2>
            <p className={styles.subtitle}>¡Únete a nuestra comunidad!</p>

            {/* Error & Success Messages */}
            {error && (
              <div className={styles.errorBox}>
                <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}
            
            {success && (
              <div className={styles.successBox}>
                <svg className={styles.successIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className={styles.successText}>{success}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="name" className={styles.label}>Nombre Completo</label>
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  placeholder="Tu nombre y apellido"
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="email" className={styles.label}>Correo Electrónico</label>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="tu@correo.com"
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="password" className={styles.label}>Contraseña</label>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !!success}
                className={styles.submitBtn}
              >
                {loading ? (
                  <span className={styles.spinner}>
                    <svg className={styles.spinnerIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registrando...
                  </span>
                ) : (
                  "Crear Cuenta"
                )}
              </button>
            </form>

            {/* Bottom divider */}
            <div className={styles.bottomDivider}>
              <span className={styles.dividerLine} />
              <Link href="/login" className={styles.loginLink}>
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
              <span className={styles.dividerLine} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
