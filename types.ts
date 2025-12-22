
export enum VariantType {
  STUDIO = 'Minimalist High-Fashion Studio',
  URBAN = 'Outdoor Lifestyle/Urban',
  CINEMATIC = 'Cinematic Action/Mood',
  ECOMMERCE = 'Clean E-commerce White',
  ABSTRACT = 'Creative/Abstract Artistic'
}

export interface GeneratedAsset {
  id: string;
  variantType: VariantType;
  prompt: string;
  imageUrl?: string; // The generated marketing image
  status: 'pending' | 'generating_image' | 'complete' | 'error';
  error?: string;
}

export interface AiStudioWindow {
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}

export interface AnalysisResult {
  productDescription: string;
  marketingHooks: string[];
}
