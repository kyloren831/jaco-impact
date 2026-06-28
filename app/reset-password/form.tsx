"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../register/register.module.css";
import { resetPasswordAction } from "@/features/auth/actions";

const resetPasswordWrapper = async (prevState: any, formData: FormData) => {
  return await resetPasswordAction(prevState, formData);
};

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPasswordWrapper, null);

  return (
    <div className={styles.registerPage}>
      <div className={styles.backgroundImage} />
      <div className={styles.backgroundOverlay} />

      <div className={styles.logo}>
        <Link href="/">
          <Image src="/letters-logo.png" alt="Jacó Impact" width={180} height={52} className={styles.logoImage} priority />
        </Link>
      </div>

      <div className={styles.cardContainer}>
        <div className={styles.card}>
          <div className={styles.imagePanel} />

          <div className={styles.formPanel}>
            <h2 className={styles.title}>Jacó Impact</h2>
            <p className={styles.subtitle}>Establecer nueva contraseña</p>

            {state?.error && (
              <div className={styles.errorBox}>
                <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className={styles.errorText}>{state.error}</p>
              </div>
            )}
            
            {state?.success ? (
              <div className={styles.successBox} style={{ flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
                <svg className={styles.successIcon} viewBox="0 0 20 20" fill="currentColor" style={{ width: '40px', height: '40px', marginBottom: '10px' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className={styles.successText} style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  Contraseña actualizada exitosamente.
                </p>
                <Link href="/login" className={styles.submitBtn} style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center', marginTop: '20px' }}>
                  Ir a iniciar sesión
                </Link>
              </div>
            ) : (
              <form action={formAction}>
                <input type="hidden" name="token" value={token} />
                
                <div className={styles.fieldGroup}>
                  <div className={styles.labelRow}>
                    <label htmlFor="newPassword" className={styles.label}>Nueva Contraseña</label>
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    className={styles.input}
                    placeholder="••••••••"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.labelRow}>
                    <label htmlFor="confirmPassword" className={styles.label}>Confirmar Contraseña</label>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className={styles.input}
                    placeholder="••••••••"
                  />
                </div>

                <button type="submit" disabled={isPending || !token} className={styles.submitBtn}>
                  {isPending ? (
                    <span className={styles.spinner}>
                      <svg className={styles.spinnerIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Actualizando...
                    </span>
                  ) : "Cambiar Contraseña"}
                </button>
                
                {!token && (
                  <div className={styles.errorBox} style={{ marginTop: '16px' }}>
                    <p className={styles.errorText}>Token inválido o faltante. Revisa tu enlace.</p>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
