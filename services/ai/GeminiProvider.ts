
import { GoogleGenAI, Type } from "@google/genai";
import { TextGeneratorProvider, ImageGeneratorProvider, VideoGeneratorProvider, TrendingTopic } from "./interfaces";
import { AIResponse, SeoConfig, LandingPage } from "../../types";
import { storage } from "../../lib/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export class GeminiTextProvider implements TextGeneratorProvider {
  async generatePost(topic: string): Promise<AIResponse> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um Especialista em Redação Web de alto nível. Escreva um post de blog profundo sobre: "${topic}".
      
      **REGRAS CRÍTICAS DE FORMATO:**
      1. O campo "content" deve conter APENAS o corpo do artigo. 
      2. PROIBIDO repetir o título principal dentro do "content".
      3. Use Markdown puro. Não use HTML.
      4. Use quebras de linha reais para parágrafos.
      5. O primeiro parágrafo deve ser uma introdução envolvente (lead).
      6. Gere um "imagePrompt" descritivo em inglês para a capa.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            imagePrompt: { type: Type.STRING },
            seo: {
              type: Type.OBJECT,
              properties: {
                  metaTitle: { type: Type.STRING },
                  metaDescription: { type: Type.STRING },
                  focusKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                  slug: { type: Type.STRING }
              },
              required: ["metaTitle", "metaDescription", "focusKeywords", "slug"]
            },
            slug: { type: Type.STRING }
          },
          required: ["title", "content", "summary", "slug", "tags", "seo", "imagePrompt"]
        }
      }
    });

    if (!response.text) throw new Error("Falha na geração");
    return JSON.parse(response.text) as AIResponse;
  }

  async generateVisualPrompt(title: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Describe a high-quality, cinematic, professional photography scene for a blog post titled: "${title}". Use English.`,
    });
    return response.text || title;
  }

  async generateSeo(title: string, content: string): Promise<SeoConfig> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate professional SEO metadata for: ${title}. Content snippet: ${content.substring(0, 400)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    metaTitle: { type: Type.STRING },
                    metaDescription: { type: Type.STRING },
                    focusKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    slug: { type: Type.STRING }
                },
                required: ["metaTitle", "metaDescription", "focusKeywords", "slug"]
            }
        }
    });
    return JSON.parse(response.text!) as SeoConfig;
  }

  async generateLanding(data: LandingPage): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma Landing Page moderna usando Tailwind CSS e HTML para o produto: ${data.subject}. Contexto: ${data.salesContext}.`,
    });
    return response.text!;
  }

  async getTrendingTopics(niche: string): Promise<TrendingTopic[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify 5 current trending topics and news in the niche: "${niche}". Return JSON: [{"title": "...", "relevance": "..."}]`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    if (!response.text) throw new Error("Sem resposta");
    
    let topicsData = [];
    try {
        const jsonMatch = response.text.match(/\[.*\]/s);
        topicsData = JSON.parse(jsonMatch ? jsonMatch[0] : response.text);
    } catch (e) { topicsData = []; }
    
    const sources: { title: string; uri: string }[] = [];
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web?.uri) sources.push({ title: chunk.web.title || 'Referência', uri: chunk.web.uri });
    });

    return topicsData.map((topic: any) => ({
      ...topic,
      sources: sources.slice(0, 3)
    }));
  }
}

export class GeminiImageProvider implements ImageGeneratorProvider {
  async generateImage(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `${prompt}. Award winning photography, 8k, highly detailed.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } },
    });
    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imgPart?.inlineData) {
      const base64 = imgPart.inlineData.data;
      
      // Upload para Firebase Storage para evitar Base64 no Firestore
      const fileName = `covers/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
      const storageRef = ref(storage, fileName);
      
      await uploadString(storageRef, base64, 'base64', { contentType: 'image/png' });
      return await getDownloadURL(storageRef);
    }
    throw new Error("Erro na imagem");
  }
}

export class VeoVideoProvider implements VideoGeneratorProvider {
  async generateVideo(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }
    return `${operation.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`;
  }
}
