// c:\Users\Aaron\Documents\projects2026\jaco-impact\lib\seed-data\landing.ts
import { PillarSeed, ImpactStatSeed, ActivitySeed } from "./types";

export const pilaresData: PillarSeed[] = [
  {
    id: 1,
    name: "Ambiente",
    description: "Recolección de basura, reciclaje y tablas de surf fabricadas con colillas de cigarros. Cuidamos nuestra playa.",
    colorVar: "brand-verde",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" /></svg>`
  },
  {
    id: 2,
    name: "Educación",
    description: "Clases de inglés gratuitas, tutorías y donación de útiles escolares. Invertir en educación es invertir en futuro.",
    colorVar: "brand-azul",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" /></svg>`
  },
  {
    id: 3,
    name: "Arte y Cultura",
    description: "Ruta de Ensueño, talleres de arte y trueque digital. Creamos espacios para la creatividad comunitaria.",
    colorVar: "brand-rosa",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>`
  },
  {
    id: 4,
    name: "Bienestar",
    description: "Yoga, meditación, nutrición y Círculo de Mujeres. Fomentamos el balance y la salud integral.",
    colorVar: "brand-turquesa",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>`
  },
  {
    id: 5,
    name: "Deporte",
    description: "Surf inclusivo, zumba y donación de tablas. El deporte como herramienta de unión y salud.",
    colorVar: "brand-amarillo",
    iconSvg: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill-opacity="0" /></svg>`
  },
  {
    id: 6,
    name: "Bienestar Animal",
    description: "Rescates, castraciones (720+) y adopciones. Protegemos a nuestros compañeros de cuatro patas.",
    colorVar: "brand-rojo",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M4.5 9.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" /><path d="M9 5.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" /><path d="M15 5.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" /><path d="M19.5 9.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" /><path d="M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02 1.02 2.03 2.33 2.32.73.15 3.06-.44 5.54-.44h.18c2.48 0 4.81.58 5.54.44 1.31-.29 2.04-1.31 2.33-2.32.31-2.04-1.3-3.49-2.61-4.8z" /></svg>`
  },
  {
    id: 7,
    name: "Emprendimiento",
    description: "Ferias artesanales en Marriott, Crocs y Jaco Walk. Apoyamos el talento local y la economía comunitaria.",
    colorVar: "brand-azul-oscuro",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" /></svg>`
  },
  {
    id: 8,
    name: "Social",
    description: "Banco de alimentos, donaciones y centro comunitario. Siempre listos para ayudar a cada persona que lo necesite.",
    colorVar: "white",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>`
  }
];

export const impactStatsData: ImpactStatSeed[] = [
  {
    id: "beneficiarios",
    label: "Beneficiarios",
    value: 15000,
    suffix: "+",
    colorVar: "brand-verde",
    iconSvg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>`
  },
  {
    id: "trueque",
    label: "Personas en Trueque",
    value: 7000,
    suffix: "+",
    colorVar: "brand-turquesa",
    iconSvg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>`
  },
  {
    id: "basura",
    label: "Basura Recolectada",
    value: 3406,
    suffix: " kg",
    colorVar: "brand-rosa",
    iconSvg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" /></svg>`
  },
  {
    id: "voluntarios",
    label: "Voluntarios Históricos",
    value: 700,
    suffix: "+",
    colorVar: "brand-azul",
    iconSvg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>`
  }
];

export const actividadesData: ActivitySeed[] = [
  {
    id: "limpieza",
    name: "Limpieza de Playas",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" /></svg>`,
    colorFrom: "brand-verde",
    colorTo: "[#2d8a3a]"
  },
  {
    id: "ingles",
    name: "Clases de Inglés",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" /></svg>`,
    colorFrom: "brand-azul",
    colorTo: "[#1d8ac4]"
  },
  {
    id: "surf",
    name: "Surf Inclusivo",
    iconSvg: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>`,
    colorFrom: "brand-rosa",
    colorTo: "[#c7006f]"
  },
  {
    id: "yoga",
    name: "Yoga y Meditación",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>`,
    colorFrom: "brand-turquesa",
    colorTo: "[#0f8a82]"
  },
  {
    id: "rescate",
    name: "Rescate Animal",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M4.5 9.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" /><path d="M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02 1.02 2.03 2.33 2.32.73.15 3.06-.44 5.54-.44h.18c2.48 0 4.81.58 5.54.44 1.31-.29 2.04-1.31 2.33-2.32.31-2.04-1.3-3.49-2.61-4.8z" /></svg>`,
    colorFrom: "brand-amarillo",
    colorTo: "[#b0ba1a]"
  },
  {
    id: "ferias",
    name: "Ferias Artesanales",
    iconSvg: `<svg viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" /></svg>`,
    colorFrom: "brand-rojo",
    colorTo: "[#c6151d]"
  }
];
