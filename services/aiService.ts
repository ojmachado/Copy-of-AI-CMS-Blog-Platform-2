
import { TextGeneratorProvider, ImageGeneratorProvider, VideoGeneratorProvider, TrendingTopic } from './ai/interfaces';
import { GeminiTextProvider, GeminiImageProvider, VeoVideoProvider } from './ai/GeminiProvider';
import { AIResponse, SeoConfig, LandingPage } from '../types';

class AIService {
  private textProvider: TextGeneratorProvider;
  private imageProvider: ImageGeneratorProvider;
  private videoProvider: VideoGeneratorProvider;

  constructor() {
    this.textProvider = new GeminiTextProvider();
    this.imageProvider = new GeminiImageProvider();
    this.videoProvider = new VeoVideoProvider();
  }

  async generateFullPost(topic: string): Promise<AIResponse> {
    try {
      // 1. Gera o texto e o prompt da imagem
      const textResponse = await this.textProvider.generatePost(topic);

      // 2. Tenta gerar a imagem automaticamente usando o prompt inteligente gerado
      let coverImage = undefined;
      if (textResponse.imagePrompt) {
        try {
          console.log("[AIService] Iniciando geração automática da imagem...");
          coverImage = await this.imageProvider.generateImage(textResponse.imagePrompt);
        } catch (imgError) {
          console.warn("[AIService] Geração automática de imagem falhou, mas o post continuará apenas com texto.", imgError);
        }
      }

      return {
        ...textResponse,
        // @ts-ignore
        coverImage: coverImage
      };

    } catch (error) {
      console.error("[AIService] Erro no fluxo de geração:", error);
      throw error;
    }
  }

  /**
   * Generates a smart image by first asking Gemini to describe a cinematic scene based on a title.
   */
  async generateSmartImage(title: string): Promise<string> {
    console.log("[AIService] Criando prompt visual inteligente para:", title);
    const visualPrompt = await this.textProvider.generateVisualPrompt(title);
    console.log("[AIService] Prompt gerado:", visualPrompt);
    return await this.imageProvider.generateImage(visualPrompt);
  }

  async generateLandingPage(data: LandingPage): Promise<string> {
    return await this.textProvider.generateLanding(data);
  }

  async generateImageOnly(prompt: string): Promise<string> {
    return await this.imageProvider.generateImage(prompt);
  }

  async generateVideoOnly(prompt: string): Promise<string> {
    return await this.videoProvider.generateVideo(prompt);
  }

  async generateSeoMetadata(title: string, content: string): Promise<SeoConfig> {
    return await this.textProvider.generateSeo(title, content);
  }

  async getTrendingTopics(niche: string): Promise<TrendingTopic[]> {
    return await this.textProvider.getTrendingTopics(niche);
  }
}

export const aiService = new AIService();
