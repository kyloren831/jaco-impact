// c:\Users\Aaron\Documents\projects2026\jaco-impact\lib\seed-data\types.ts

export interface PillarSeed {
  id: number;
  name: string;
  description: string;
  iconSvg: string;  // We use SVG directly instead of iconUrl for the landing page mapping
  colorVar: string; // E.g., 'brand-verde'
}

export interface ImpactStatSeed {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  colorVar: string;
  iconSvg: string;
}

export interface ActivitySeed {
  id: string;
  name: string;
  iconSvg: string;
  colorFrom: string;
  colorTo: string;
}
