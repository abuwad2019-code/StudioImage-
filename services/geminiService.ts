
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, ClothingStyle, Country } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxWidth) {
         width = Math.round((width * maxWidth) / height);
         height = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context error"));
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (error) => reject(error);
  });
};

export const transformImage = async (
  base64Image: string,
  config: GenerationConfig,
  onProgress?: (message: string) => void
): Promise<string> => {
  if (onProgress) onProgress("جاري تجهيز الصورة (تحسين الحجم)...");

  // Multi-source API Key retrieval
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

  if (!apiKey || apiKey === 'undefined') {
    throw new Error("مفتاح API غير معرف. يرجى مراجعة إعدادات Vercel (VITE_API_KEY).");
  }

  const ai = new GoogleGenAI({ apiKey });

  let processedBase64 = base64Image;
  let mimeType = 'image/jpeg';
  
  try {
    // Reduced to 1024px to be "lightweight" for the API to avoid 429 Quota issues
    processedBase64 = await compressImage(base64Image, 1024, 0.75);
  } catch (e) {
    console.warn("Compression fallback", e);
  }

  const cleanBase64 = processedBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  const getStyleDescription = (s: ClothingStyle) => {
    switch (s) {
      case 'civilian_suit_black': return "a professional formal black business suit with a white shirt and tie";
      case 'civilian_suit_blue': return "a professional formal navy blue business suit with a white shirt and tie";
      case 'civilian_suit_grey': return "a professional formal dark grey business suit with a white shirt and tie";
      case 'civilian_traditional': return "formal traditional clothing suitable for official documents";
      case 'women_abaya_black': return "a modest, elegant professional black abaya with a matching black hijab covering hair";
      case 'women_abaya_colored': return "a modest, elegant beige or brown modest abaya with a matching hijab covering hair";
      case 'women_formal_hijab': return "a professional formal business blazer/jacket with a modest hijab covering hair";
      case 'military_camouflage': return "a professional military camouflage uniform";
      case 'military_formal': return "a professional formal dress military uniform";
      case 'military_special_forces': return "a tactical black special forces uniform";
      case 'military_airforce': return "a professional air force blue uniform";
      default: return "professional formal clothing";
    }
  };

  const getCountryMilitaryDetails = (c: Country) => {
    switch (c) {
      case 'yemen': return "Yemeni Army Republican Guard camouflage pattern (yellowish-desert camo).";
      case 'saudi': return "Saudi Royal Land Forces camouflage pattern (darker desert digital).";
      case 'egypt': return "Egyptian Army camouflage pattern (desert yellow).";
      default: return "generic professional military camouflage uniform";
    }
  };

  let clothingDesc = getStyleDescription(config.style);
  let extraInstructions = "";
  let parts: any[] = [];
  
  if (config.category === 'military') {
    const countryDetails = getCountryMilitaryDetails(config.militaryOptions.country);
    clothingDesc = config.style === 'military_camouflage' ? `a professional ${countryDetails}` : `${clothingDesc} in the style of ${config.militaryOptions.country} armed forces`;

    if (config.militaryOptions.hasBeret) {
      if (config.militaryOptions.beretImage) {
        let beretBase64 = await compressImage(config.militaryOptions.beretImage, 256, 0.7);
        parts.push({ text: "Reference Beret:" }, { inlineData: { mimeType: 'image/jpeg', data: beretBase64.split(',')[1] } });
        extraInstructions += " Place the provided beret ON TOP of the subject's head naturally.";
      } else {
        extraInstructions += " The subject MUST wear a matching military beret.";
      }
    }

    if (config.militaryOptions.hasRank && config.militaryOptions.rankImage) {
      let rankBase64 = await compressImage(config.militaryOptions.rankImage, 256, 0.7);
      parts.push({ text: "Reference Rank:" }, { inlineData: { mimeType: 'image/jpeg', data: rankBase64.split(',')[1] } });
      extraInstructions += " Composite the provided rank insignia onto the uniform shoulders.";
    }
  }

  const prompt = `ROLE: Professional ID Photo Editor.
    INPUT: A photo of a person.
    ACTION: 1. Crop/Zoom to head and shoulders only. 2. Remove background. 3. Replace clothing with: ${clothingDesc}. 4. Posture: Frontal view. 5. Background: Solid Pure White. 6. Identity: Keep face 100% original. 
    ${extraInstructions} ${config.promptModifier || ''}
    Output ONLY the image.`;

  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (onProgress) onProgress(attempt === 0 ? "جاري المعالجة بالذكاء الاصطناعي..." : `محاولة بديلة ${attempt}...`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ inlineData: { mimeType, data: cleanBase64 } }, ...parts, { text: prompt }] },
        config: { imageConfig: { aspectRatio: config.ratio } },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("لم يتم إرجاع صورة من الخادم.");

    } catch (error: any) {
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("429") || msg.includes("exhausted") || msg.includes("busy")) {
        if (attempt < MAX_RETRIES) {
          if (onProgress) onProgress("الخادم مشغول قليلاً.. سأحاول مجدداً بعد لحظات");
          await delay(3000 * (attempt + 1));
          continue;
        }
        throw new Error("⏳ ضغط كبير على خوادم Gemini المجانية حالياً. يرجى المحاولة بعد دقيقة واحدة.");
      }
      throw error;
    }
  }
  throw new Error("فشلت جميع المحاولات للاتصال بالخادم.");
};
