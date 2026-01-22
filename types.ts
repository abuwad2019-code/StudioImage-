
export interface ProcessedImage {
  original: string;
  generated: string | null;
}

export enum AspectRatio {
  PORTRAIT = "3:4",
  LANDSCAPE = "4:3",
  SQUARE = "1:1",
  WIDE = "16:9",
}

export type Gender = 'male' | 'female';

export type ClothingCategory = 'civilian' | 'military';

export type Country = 'generic' | 'yemen' | 'saudi' | 'egypt' | 'usa' | 'uae' | 'jordan';

export type ClothingStyle = 
  // Men Civilian
  | 'civilian_suit_black' 
  | 'civilian_suit_blue'
  | 'civilian_suit_grey'
  | 'civilian_traditional'
  // Women Civilian
  | 'women_abaya_black'
  | 'women_abaya_colored'
  | 'women_formal_hijab'
  // Military (Generic style keys, specific look determined by Country option)
  | 'military_camouflage' 
  | 'military_formal' 
  | 'military_special_forces'
  | 'military_airforce';

export interface MilitaryOptions {
  country: Country;
  hasBeret: boolean;
  beretImage: string | null; // Base64 string of the custom beret
  hasRank: boolean;
  rankImage: string | null; // Base64 string of the rank
}

export interface GenerationConfig {
  gender: Gender;
  ratio: AspectRatio;
  category: ClothingCategory;
  style: ClothingStyle;
  militaryOptions: MilitaryOptions;
  promptModifier: string;
}

export interface UserSettings {
  useCustomKey: boolean;
  customApiKey: string;
}

export interface AppState {
  isLoading: boolean;
  loadingMessage?: string; // Shows detailed status like queue position
  error: string | null;
  image: ProcessedImage | null;
  config: GenerationConfig;
  settings: UserSettings;
}
