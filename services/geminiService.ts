import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, ClothingStyle, Country } from "../types";

// Helper: Delay function for retry logic
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Aggressive compression to save tokens
const compressImage = (base64Str: string, maxWidth = 512, quality = 0.6): Promise<string> => {
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

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
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
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("مفتاح API غير موجود. يرجى التأكد من إضافة API_KEY في إعدادات Environment Variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // 1. COMPRESSION
  let processedBase64 = base64Image;
  let mimeType = 'image/jpeg';
  
  try {
    processedBase64 = await compressImage(base64Image, 512, 0.6);
  } catch (e) {
    console.warn("Image compression failed, using original", e);
    const match = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
    if (match) {
      mimeType = match[1];
    }
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
      case 'yemen': return "Yemeni Army Republican Guard camouflage pattern (yellowish-desert camo). If headwear is requested, use a Yemeni style beret featuring the Golden Eagle of Yemen (distinct from Egypt/Syria) which has a shield depicting the Marib Dam.";
      case 'saudi': return "Saudi Royal Land Forces camouflage pattern (darker desert digital or woodland depending on style). If headwear is requested, use a green/dark beret with the Saudi palm and swords emblem.";
      case 'egypt': return "Egyptian Army camouflage pattern (desert yellow/sand). If headwear is requested, use a beret with the Egyptian eagle emblem.";
      case 'usa': return "US Army OCP (Operational Camouflage Pattern). If headwear is requested, use a standard beret with US flash.";
      case 'uae': return "UAE Armed Forces camouflage pattern. If headwear is requested, use a beret with UAE emblem.";
      case 'jordan': return "Jordanian Armed Forces digital camouflage. If headwear is requested, use a beret with Jordanian emblem.";
      default: return "generic professional military camouflage uniform";
    }
  };

  let clothingDesc = getStyleDescription(config.style);
  let extraInstructions = "";
  let parts: any[] = [];
  let strictnessLevel = "HIGH";

  if (config.category === 'military') {
    strictnessLevel = "EXTREME"; 
    
    const countryDetails = getCountryMilitaryDetails(config.militaryOptions.country);
    
    if (config.style === 'military_camouflage') {
      clothingDesc = `a professional ${countryDetails}`;
    } else {
      clothingDesc = `${clothingDesc} in the style of ${config.militaryOptions.country} armed forces`;
    }

    if (config.militaryOptions.hasBeret) {
      if (config.militaryOptions.beretImage) {
        let beretBase64 = config.militaryOptions.beretImage;
        try { beretBase64 = await compressImage(beretBase64, 256, 0.6); } catch(e) {}
        const cleanBeret = beretBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        extraInstructions += " HEADWEAR COMPOSITING: I have provided an image of a specific MILITARY BERET/CAP. You MUST place this exact beret on the subject's head. IMPORTANT: Place the beret ON TOP of the existing head/hairline. DO NOT change the shape of the subject's forehead or skull to fit the beret.";
        parts.push({ text: "This is the image of the Beret/Cap to use:" });
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBeret } });
      } else {
        extraInstructions += " HEADWEAR: The subject MUST be wearing a military beret on their head. The beret color and insignia should match the specified country's army style. Ensure the beret sits naturally without cutting off the forehead.";
      }
    } else {
      extraInstructions += " HEADWEAR: Do NOT generate any hat, helmet, or beret. Bare head.";
    }

    if (config.militaryOptions.hasRank && config.militaryOptions.rankImage) {
      let rankBase64 = config.militaryOptions.rankImage;
      try {
         rankBase64 = await compressImage(rankBase64, 256, 0.6); 
      } catch (e) {}
      
      const cleanRankBase64 = rankBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      
      extraInstructions += " RANK INSIGNIA: I have provided a second image which is a military RANK badge. You MUST composite this specific rank badge onto the shoulders or chest of the generated uniform in a realistic way.";
      
      parts.push({
        text: "This is the image of the Rank Insignia:",
      });
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanRankBase64,
        },
      });
    }
  }

  // Add random ID to prompt to prevent any aggressive caching on Google's side
  const requestId = Math.random().toString(36).substring(7);

  const prompt = `
    TASK: Create a professional formal ID/Passport photo from the provided portrait image.
    ID: ${requestId}

    CRITICAL INSTRUCTIONS FOR PERFECT RESULT (STRICTNESS: ${strictnessLevel}):

    1. FACE & IDENTITY (ABSOLUTE PRIORITY):
       - The face in the output MUST be identical to the source image.
       - Preserve all facial features, eye shape, nose shape, mouth, and skin tone EXACTLY.
       - Do NOT distort, beautify, or "cartoonize" the face.
       - ${config.category === 'military' ? 'MILITARY SPECIFIC: Adding a uniform often causes the model to generate a generic "soldier face". DO NOT DO THIS. Keep the original civilian face exactly as it is, and only change the pixels below the neck.' : 'Keep it realistic.'}

    2. POSE & ALIGNMENT:
       - The subject MUST face the camera directly (Frontal View).
       - STRAIGHTEN THE HEAD: If the head is tilted in the source, rotate it so it is vertical.
       - LEVEL SHOULDERS: Shoulders must be completely horizontal and symmetrical.
       - ${config.category === 'military' ? 'NOTE: If straightening the head distorts the facial identity, prioritize IDENTITY over perfect alignment.' : 'Correct any leaning or rotation.'}

    3. ATTIRE:
       - Replace the existing clothing with: ${clothingDesc}.
       ${extraInstructions}
       - The clothing must fit naturally on the corrected straight posture.
       - Ensure the neck connection between the original face and the new uniform is seamless and realistic.

    4. ENVIRONMENT:
       - Background: Solid Pure White (#FFFFFF).
       - Lighting: Soft, even studio lighting. Avoid harsh shadows on the face.
       - Framing: Standard Passport Crop (Head and Shoulders).

    Output a single high-quality, photorealistic image.
  `;

  const finalParts = [
    { 
      inlineData: {
        mimeType: mimeType, 
        data: cleanBase64,
      }
    },
    ...parts,
    { text: prompt },
  ];

  let lastError: any = null;
  const MAX_RETRIES = 10; 
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0 && onProgress) {
        onProgress("جاري محاولة الاتصال بالخادم...");
      }

      // Updated: Send as Object, not Array of Objects, for proper single-turn structure
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: {
          parts: finalParts,
        },
        config: {
          imageConfig: {
            aspectRatio: config.ratio,
          }
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      throw new Error("لم يتم إرجاع أي صورة من النموذج (رد فارغ).");

    } catch (error: any) {
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      const errorMsg = (error.message || error.toString()).toLowerCase();
      
      // Handle Quota/Overloaded/Network Errors
      if (
        errorMsg.includes("429") || 
        errorMsg.includes("quota") || 
        errorMsg.includes("exhausted") || 
        errorMsg.includes("503") || 
        errorMsg.includes("overloaded") ||
        errorMsg.includes("fetch") || // Retry on network glitches too
        errorMsg.includes("network")
      ) {
        if (attempt === MAX_RETRIES - 1) break;
        
        let waitTimeMs = Math.min(20000, 2000 * Math.pow(2, attempt)); 
        waitTimeMs += Math.random() * 1000;
        
        const simulatedQueuePos = Math.max(1, 15 - Math.floor(attempt * 2));
        let remainingSeconds = Math.ceil(waitTimeMs / 1000);

        while (remainingSeconds > 0) {
          if (onProgress) {
             onProgress(`⚠️ الخادم مشغول.. المحاولة ${attempt + 1} من ${MAX_RETRIES} (انتظار ${remainingSeconds}ث)`);
          }
          await delay(1000);
          remainingSeconds--;
        }
        continue;
      }

      // Fatal Errors
      if (errorMsg.includes("404") || errorMsg.includes("not_found")) {
         throw new Error("⚠️ خطأ 404: النموذج غير موجود أو مفتاح API غير صالح.");
      }
      if (errorMsg.includes("safety") || errorMsg.includes("blocked")) {
        throw new Error("⚠️ تم حظر الصورة لسبب أمني (Safety Filter). حاول استخدام صورة مختلفة.");
      }
      if (errorMsg.includes("400") || errorMsg.includes("invalid argument")) {
         throw new Error("⚠️ خطأ في البيانات المرسلة (400). حاول استخدام صورة أصغر أو نوع مختلف.");
      }

      break; 
    }
  }

  // Final Diagnostics
  const finalMsg = (lastError.message || lastError.toString()).toLowerCase();
  
  if (finalMsg.includes("429") || finalMsg.includes("exhausted") || finalMsg.includes("quota")) {
    throw new Error("⚠️ تم تجاوز حد الاستخدام (Quota Exceeded). الخادم مشغول جداً حالياً.");
  }
  
  if (finalMsg.includes("failed to fetch") || finalMsg.includes("network")) {
     throw new Error("⚠️ فشل الاتصال بالخادم. تأكد من الإنترنت، أو أن إعدادات الشبكة لا تحظر Google API.");
  }

  throw new Error(`حدث خطأ غير متوقع: ${lastError.message || "Unknown"}`);
};