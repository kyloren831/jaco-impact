"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al iniciar sesión");
      } else {
        router.push("/volunteer/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Error de conexión, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
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
        {/* Top-left cluster */}
        <img src="/leaf-1.svg" alt="" className={`${styles.leaf} ${styles.leafTopLeft1}`} aria-hidden="true" />
        <img src="/leaf-2.svg" alt="" className={`${styles.leaf} ${styles.leafTopLeft2}`} aria-hidden="true" />
        <img src="/leaf-3.svg" alt="" className={`${styles.leaf} ${styles.leafTopLeft3}`} aria-hidden="true" />

        {/* Top-right cluster */}
        <img src="/leaf-2.svg" alt="" className={`${styles.leaf} ${styles.leafTopRight1}`} aria-hidden="true" />
        <img src="/leaf-1.svg" alt="" className={`${styles.leaf} ${styles.leafTopRight2}`} aria-hidden="true" />

        {/* Bottom-left cluster */}
        <img src="/leaf-3.svg" alt="" className={`${styles.leaf} ${styles.leafBottomLeft1}`} aria-hidden="true" />
        <img src="/leaf-1.svg" alt="" className={`${styles.leaf} ${styles.leafBottomLeft2}`} aria-hidden="true" />

        {/* Bottom-right cluster */}
        <img src="/leaf-2.svg" alt="" className={`${styles.leaf} ${styles.leafBottomRight1}`} aria-hidden="true" />
        <img src="/leaf-3.svg" alt="" className={`${styles.leaf} ${styles.leafBottomRight2}`} aria-hidden="true" />

        {/* Middle sides */}
        <img src="/leaf-1.svg" alt="" className={`${styles.leaf} ${styles.leafMidLeft}`} aria-hidden="true" />
        <img src="/leaf-3.svg" alt="" className={`${styles.leaf} ${styles.leafMidRight}`} aria-hidden="true" />

        {/* Card */}
        <div className={styles.card}>
          {/* Left image panel */}
          <div className={styles.imagePanel} />

          {/* Right form panel */}
          <div className={styles.formPanel}>
            <h2 className={styles.title}>Jaco Impact</h2>
            <p className={styles.subtitle}>¡Bienvenido de vuelta!</p>

            {/* Google sign-in button */}
            <a href="#" className={styles.googleBtn}>
              <svg viewBox="0 0 40 40">
                <path
                  d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.045 27.2142 24.3525 30 20 30C14.4775 30 10 25.5225 10 20C10 14.4775 14.4775 9.99999 20 9.99999C22.5492 9.99999 24.8683 10.9617 26.6342 12.5325L31.3483 7.81833C28.3717 5.04416 24.39 3.33333 20 3.33333C10.7958 3.33333 3.33335 10.7958 3.33335 20C3.33335 29.2042 10.7958 36.6667 20 36.6667C29.2042 36.6667 36.6667 29.2042 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z"
                  fill="#FFC107"
                />
                <path
                  d="M5.25497 12.2425L10.7308 16.2583C12.2125 12.59 15.8008 9.99999 20 9.99999C22.5491 9.99999 24.8683 10.9617 26.6341 12.5325L31.3483 7.81833C28.3716 5.04416 24.39 3.33333 20 3.33333C13.5983 3.33333 8.04663 6.94749 5.25497 12.2425Z"
                  fill="#FF3D00"
                />
                <path
                  d="M20 36.6667C24.305 36.6667 28.2167 35.0192 31.1742 32.34L26.0159 27.975C24.3425 29.2425 22.2625 30 20 30C15.665 30 11.9842 27.2359 10.5975 23.3784L5.16254 27.5659C7.92087 32.9634 13.5225 36.6667 20 36.6667Z"
                  fill="#4CAF50"
                />
                <path
                  d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.7592 25.1975 27.56 26.805 26.0133 27.9758C26.0142 27.975 26.015 27.975 26.0158 27.9742L31.1742 32.3392C30.8092 32.6708 36.6667 28.3333 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z"
                  fill="#1976D2"
                />
              </svg>
              Iniciar sesión con Google
            </a>

            {/* Divider */}
            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>o inicia sesión con email</span>
              <span className={styles.dividerLine} />
            </div>

            {/* Error message */}
            {error && (
              <div className={styles.errorBox}>
                <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
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
                  <Link href="/forgot-password" className={styles.forgotLink}>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? (
                  <span className={styles.spinner}>
                    <svg className={styles.spinnerIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Cargando...
                  </span>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>

            {/* Bottom divider */}
            <div className={styles.bottomDivider}>
              <span className={styles.dividerLine} />
              <Link href="/register" className={styles.registerLink}>
                o regístrate
              </Link>
              <span className={styles.dividerLine} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
