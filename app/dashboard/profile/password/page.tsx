"use client";

import { useActionState } from "react";
import styles from "./password.module.css";
import { changePasswordAction } from "@/features/auth/actions";

const changePasswordWrapper = async (prevState: any, formData: FormData) => {
  return await changePasswordAction(prevState, formData);
};

export default function ChangePasswordPage() {
  const [state, formAction, isPending] = useActionState(changePasswordWrapper, null);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Seguridad</h1>
      <p className={styles.subtitle}>Actualiza tu contraseña para mantener tu cuenta segura.</p>

      <div className={styles.formCard}>
        {state?.error && <div className={styles.errorBox}>{state.error}</div>}
        {state?.success && <div className={styles.successBox}>Contraseña actualizada correctamente.</div>}

        <form action={formAction}>
          <div className={styles.fieldGroup}>
            <label htmlFor="oldPassword" className={styles.label}>Contraseña Actual</label>
            <input
              id="oldPassword"
              name="oldPassword"
              type="password"
              required
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="newPassword" className={styles.label}>Nueva Contraseña</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              className={styles.input}
              placeholder="••••••••"
              minLength={8}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirmar Nueva Contraseña</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className={styles.input}
              placeholder="••••••••"
              minLength={8}
            />
          </div>

          <button type="submit" disabled={isPending} className={styles.submitBtn}>
            {isPending ? "Actualizando..." : "Guardar Cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
