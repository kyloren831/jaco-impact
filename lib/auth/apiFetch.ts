/**
 * Wrapper de fetch para el lado cliente.
 * Si recibe 401, intenta refresh automático y reintenta UNA sola vez.
 * No usa localStorage — todo vía cookies HttpOnly.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Primera request
  let response = await fetch(input, {
    ...init,
    credentials: "same-origin", // envía cookies automáticamente
  });

  // Si no es 401, retornar directamente
  if (response.status !== 401) {
    return response;
  }

  // Intentar refresh
  const refreshResponse = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
  });

  // Si refresh falló, retornar el 401 original
  if (!refreshResponse.ok) {
    return response;
  }

  // Reintentar la request original UNA vez con las cookies nuevas
  response = await fetch(input, {
    ...init,
    credentials: "same-origin",
  });

  return response;
}
