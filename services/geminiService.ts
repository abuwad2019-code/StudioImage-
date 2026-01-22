
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, ClothingStyle, Country } from "../types";

// Fix for Vercel Build: Explicitly declare process to avoid "Cannot find name 'process'" error during TSC
declare const process: any;

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to clean error messages
const getFriendlyErrorMessage = (error: any): string => {
  const msg = error?.message?.toLowerCase() || JSON.stringify(error).toLowerCase();

  if (msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("quota")) {
    return "الخادم مشغول جداً حالياً (429). يرجى المحاولة بعد قليل أو استخدام مفتاح خاص.";
  }
  if (msg.includes("safety") || msg.includes("blocked") || msg.includes("finishreason")) {
    return "لم تتم معالجة الصورة لأنها قد تخالف سياسات الأمان (محتوى غير لائق أو وجوه غير واضحة).";
  }
  if (msg.includes("400") || msg.includes("invalid_argument")) {
    return "الصورة المرسلة غير صالحة أو التنسيق غير مدعوم. حاول استخدام صورة أخرى.";
  }
  if (msg.includes("apikey") || msg.includes("api_key") || msg.includes("403")) {
    return "مفتاح API غير صالح أو انتهت صلاحيته. يرجى التحقق من الإعدادات.";
  }
  if (msg.includes("fetch") || msg.includes("network")) {
    return "مشكلة في الاتصال بالإنترنت. يرجى التحقق من الشبكة.";
  }
  
  // Truncate very long technical errors
  if (msg.length > 100) {
    return "حدث خطأ غير متوقع أثناء المعالجة. يرجى المحاولة مرة أخرى.";
  }

  return "حدث خطأ غير معروف. يرجى المحاولة لاحقاً.";
};

const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain quality but ensure reasonable size
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
  customApiKey: string | null,
  onProgress?: (message: string) => void
): Promise<string> => {
  
  // 1. Determine Key and Mode
  let apiKey = process.env.API_KEY;
  let isFreeMode = true;

  if (customApiKey && customApiKey.trim().length > 10) {
    apiKey = customApiKey.trim();
    isFreeMode = false;
  }

  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error(isFreeMode 
      ? "مفتاح النظام مفقود. يرجى إدخال مفتاح خاص من الإعدادات." 
      : "المفتاح المدخل غير صالح.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // 2. Prepare Image
  if (onProgress) onProgress(isFreeMode ? "جاري تجهيز الصورة (وضع مجاني)..." : "جاري المعالجة السريعة...");
  
  let processedBase64 = base64Image;
  let mimeType = 'image/jpeg';
  
  try {
    // 1024px is a good balance for both
    processedBase64 = await compressImage(base64Image, 1024, 0.85);
  } catch (e) {
    console.warn("Compression failed", e);
  }

  const cleanBase64 = processedBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  // 3. Construct Prompt (Same logic as before)
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
        let beretBase64 = await compressImage(config.militaryOptions.beretImage, 300, 0.8);
        parts.push({ text: "Reference Beret:" }, { inlineData: { mimeType: 'image/jpeg', data: beretBase64.split(',')[1] } });
        extraInstructions += " Place the provided beret ON TOP of the subject's head naturally.";
      } else {
        extraInstructions += " The subject MUST wear a matching military beret.";
      }
    }

    if (config.militaryOptions.hasRank && config.militaryOptions.rankImage) {
      let rankBase64 = await compressImage(config.militaryOptions.rankImage, 300, 0.8);
      parts.push({ text: "Reference Rank:" }, { inlineData: { mimeType: 'image/jpeg', data: rankBase64.split(',')[1] } });
      extraInstructions += " Composite the provided rank insignia onto the uniform shoulders.";
    }
  }

  const prompt = `ROLE: Professional ID Photo Editor.
    INPUT: A photo of a person.
    ACTION: 1. Crop/Zoom to head and shoulders only. 2. Remove background. 3. Replace clothing with: ${clothingDesc}. 4. Posture: Frontal view. 5. Background: Solid Pure White. 6. Identity: Keep face 100% original. 
    ${extraInstructions} ${config.promptModifier || ''}
    Output ONLY the image.`;

  // 4. Execution Logic (Hybrid)
  
  const generate = async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ inlineData: { mimeType, data: cleanBase64 } }, ...parts, { text: prompt }] },
        config: { imageConfig: { aspectRatio: config.ratio } },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("لم يتم استلام صورة من الخادم.");
    } catch (err: any) {
      // Re-throw with clean message immediately for direct calls
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  if (isFreeMode) {
    // FREE MODE: Retry Logic + Delays
    const maxRetries = 2;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        if (i > 0) {
           if (onProgress) onProgress(`الخادم مشغول، محاولة ${i}/${maxRetries}...`);
           await wait(3000 * i); // Backoff: 3s, then 6s
        }
        return await generate();
      } catch (error: any) {
        // If it's the last retry, throw the CLEAN error
        if (i === maxRetries) throw error;
        
        // If it's a 429, continue loop. Otherwise, if it's a fatal error (like 400), throw immediately
        const msg = error.message; 
        if (msg.includes("429") || msg.includes("مشغول")) {
          continue;
        } else {
          throw error;
        }
      }
    }
  } else {
    // PAID MODE: Direct fast execution
    return await generate();
  }
  
  throw new Error("Unexpected end of function");
};
