import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, ClothingStyle, Country } from "../types";

// Helper: Delay function for retry logic
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Aggressive compression to save tokens, but keep enough detail for faces
// Updated default to higher res to allow better face detection in "general" (wide) photos
const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      // Also check max height to prevent super tall images
      if (height > maxWidth) {
         width = Math.round((width * maxWidth) / height);
         height = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      // Fill white background to handle transparent PNGs correctly
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
  if (onProgress) onProgress("جاري تجهيز الصورة...");

  // 1. ROBUST API KEY RETRIEVAL
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.error("API Key is missing.");
    throw new Error("مفتاح API مفقود. يرجى التأكد من إعدادات المتغيرات البيئية.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // 2. COMPRESSION
  let processedBase64 = base64Image;
  let mimeType = 'image/jpeg';
  
  try {
    // Increased quality and size (1536px) for better identity preservation in wide/general shots
    // This helps the model see faces clearly even if the user uploads a full-body photo
    processedBase64 = await compressImage(base64Image, 1536, 0.85);
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
  
  if (config.category === 'military') {
    const countryDetails = getCountryMilitaryDetails(config.militaryOptions.country);
    
    if (config.style === 'military_camouflage') {
      clothingDesc = `a professional ${countryDetails}`;
    } else {
      clothingDesc = `${clothingDesc} in the style of ${config.militaryOptions.country} armed forces`;
    }

    if (config.militaryOptions.hasBeret) {
      if (config.militaryOptions.beretImage) {
        let beretBase64 = config.militaryOptions.beretImage;
        try { beretBase64 = await compressImage(beretBase64, 256, 0.7); } catch(e) {}
        const cleanBeret = beretBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        extraInstructions += " HEADWEAR COMPOSITING: I have provided an image of a specific MILITARY BERET/CAP. You MUST place this exact beret on the subject's head. IMPORTANT: Place the beret ON TOP of the existing head/hairline. DO NOT change the shape of the subject's forehead or skull to fit the beret.";
        parts.push({ text: "Reference Image 1 (Beret/Cap to use):" });
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
         rankBase64 = await compressImage(rankBase64, 256, 0.7); 
      } catch (e) {}
      
      const cleanRankBase64 = rankBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      
      extraInstructions += " RANK INSIGNIA: I have provided a second image which is a military RANK badge. You MUST composite this specific rank badge onto the shoulders or chest of the generated uniform in a realistic way.";
      
      parts.push({
        text: "Reference Image 2 (Rank Insignia):",
      });
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanRankBase64,
        },
      });
    }
  }

  const requestId = Math.random().toString(36).substring(7);

  // Refined Prompt for "General Photo" handling with explicit CROP & EXTEND instructions
  const prompt = `
    ROLE: Expert Professional ID Photo Editor & Retoucher.
    REQUEST ID: ${requestId}
    
    INPUT IMAGE ANALYSIS:
    1. Identify the MAIN SUBJECT in the image. 
    2. The input might be a wide shot, a full-body photo, a selfie, or have a messy background.
    3. CHECK IF THE SHOULDERS ARE CUT OFF in the original image.
    4. YOUR GOAL is to create a formal Passport/ID photo of ONLY the main subject's head and shoulders.

    STRICT EXECUTION STEPS:
    
    STEP 1: CROP & EXTRACT (CRITICAL)
    - If the input is a wide/full-body shot, ZOOM IN and CROP TIGHTLY to show only the Head and Upper Shoulders.
    - DISCARD everything else: background scenery, other people, hands, furniture, or body parts below the chest.
    - REMOVE the original background completely.
    
    STEP 2: SHOULDER EXTENSION (IMPORTANT FOR SELFIES)
    - If the subject's shoulders are cut off or incomplete in the input (e.g., a close-up selfie), you MUST realistically GENERATE/OUTPAINT the missing parts of the shoulders/suit to complete the standard ID photo frame.
    - The final result must show a complete head and shoulder profile, not a floating head.

    STEP 3: FACE PRESERVATION
    - Preserve the original facial features, skin texture, and identity with 100% fidelity.
    - Do NOT cartoonize, smooth excessively, or alter the person's bone structure.
    - Ensure the face remains sharp and high-resolution.

    STEP 4: POSTURE CORRECTION
    - Re-orient the subject to face the camera directly (Frontal View).
    - Level the shoulders. Straighten the head if tilted.

    STEP 5: ATTIRE REPLACEMENT
    - Replace current clothing with: ${clothingDesc}.
    ${extraInstructions}
    - Ensure the clothes fit the corrected posture naturally.

    STEP 6: COMPOSITION
    - Background: SOLID PURE WHITE (#FFFFFF). No shadows or gradients on background.
    - Framing: Standard Portrait ID Crop (Head roughly 60-70% of frame height).
    - Lighting: Soft professional studio lighting.
    
    ${config.promptModifier ? `ADDITIONAL INSTRUCTIONS: ${config.promptModifier}` : ''}

    Output ONLY the final processed image.
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
  const MAX_RETRIES = 2; 
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (onProgress) {
        if (attempt === 0) onProgress("جاري تحليل الصورة واستخراج الشخص...");
        else onProgress(`محاولة ${attempt + 1} من ${MAX_RETRIES + 1}...`);
      }

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

      // Check for image output
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      // Check for text refusal/error
      const textOutput = response.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
      if (textOutput) {
        console.warn("Model returned text instead of image:", textOutput);
        throw new Error(`رفض النموذج المعالجة: ${textOutput.substring(0, 100)}...`);
      }

      throw new Error("لم يتم إرجاع أي بيانات من النموذج.");

    } catch (error: any) {
      console.error(`Gemini API Error (Attempt ${attempt + 1}):`, error);
      lastError = error;
      
      const errorMsg = (error.message || error.toString()).toLowerCase();
      
      // Fatal errors - do not retry
      if (errorMsg.includes("400") || errorMsg.includes("invalid argument") || errorMsg.includes("refusal") || errorMsg.includes("safety")) {
         throw new Error("⚠️ تعذر معالجة الصورة. قد تكون غير واضحة أو تخالف سياسات الأمان.");
      }
      
      // Retryable errors
      if (attempt < MAX_RETRIES) {
        const waitTimeMs = 2000 * Math.pow(2, attempt); 
        await delay(waitTimeMs);
        continue;
      }
    }
  }

  // Final Error Handling
  const finalMsg = (lastError.message || lastError.toString()).toLowerCase();
  
  if (finalMsg.includes("429") || finalMsg.includes("quota")) {
    throw new Error("⚠️ الخادم مشغول (429). يرجى المحاولة بعد قليل.");
  }
  
  throw new Error(`فشل المعالجة: ${lastError.message || "خطأ غير معروف"}`);
};
