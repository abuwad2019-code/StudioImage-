
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, ClothingStyle, Country } from "../types";

// Helper for waiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Smart resize logic - maintain aspect ratio
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
      // White background base
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
  // 1. Retrieve API Key
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.error("API Key is missing. Make sure VITE_API_KEY is set in Vercel Environment Variables.");
    throw new Error("مفتاح الربط (API Key) مفقود. يرجى التأكد من إعداد VITE_API_KEY في Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // 2. Optimize Image Size
  if (onProgress) onProgress("جاري تحسين حجم الصورة...");
  
  let processedBase64 = base64Image;
  let mimeType = 'image/jpeg';
  
  try {
    processedBase64 = await compressImage(base64Image, 1024, 0.8);
  } catch (e) {
    console.warn("Image compression failed, using original", e);
  }

  const cleanBase64 = processedBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  // 3. Construct Prompt
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

  // 4. Retry Logic Loop
  const MAX_RETRIES = 2;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt === 0 && onProgress) onProgress("جاري المعالجة (Gemini AI)...");
      if (attempt > 0 && onProgress) onProgress(`الخادم مشغول، محاولة ${attempt} من ${MAX_RETRIES}...`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ inlineData: { mimeType, data: cleanBase64 } }, ...parts, { text: prompt }] },
        config: { imageConfig: { aspectRatio: config.ratio } },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("لم يتم إرجاع بيانات صورة من الخادم.");

    } catch (error: any) {
      const msg = error.message?.toLowerCase() || "";
      console.error(`Attempt ${attempt} failed:`, msg);

      // Handle Invalid Key explicitly
      if (msg.includes("key") || msg.includes("api_key") || msg.includes("403") || msg.includes("400")) {
        throw new Error("مفتاح API غير صالح أو غير مفعل. تأكد من إعداد VITE_API_KEY في Vercel.");
      }

      // Handle Quota/Busy
      if (msg.includes("429") || msg.includes("exhausted") || msg.includes("busy") || msg.includes("overloaded")) {
        if (attempt < MAX_RETRIES) {
          await delay(2000 * (attempt + 1));
          continue;
        }
        throw new Error("الخادم مشغول جداً حالياً (429). يرجى الانتظار دقيقة ثم المحاولة.");
      }
      
      // Other errors
      throw error;
    }
  }
  
  throw new Error("فشلت المعالجة بعد عدة محاولات.");
};
