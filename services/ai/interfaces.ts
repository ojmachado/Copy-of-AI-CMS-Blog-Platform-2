
import { AIResponse, SeoConfig, LandingPage } from '../../types';

export interface TrendingTopic {
  title: string;
  relevance: string;
  sources: { title: string; uri: string }[];
}

export interface TextGeneratorProvider {
  generatePost(topic: string): Promise<AIResponse>;
  generateSeo(title: string, content: string): Promise<SeoConfig>;
  /**
   * Generates a visual description (prompt) based on a title for image models.
   */
  generateVisualPrompt(title: string): Promise<string>;
  /**
   * Generates a high-conversion landing page structure.
   */
  generateLanding(data: LandingPage): Promise<string>;
  /**
   * Pesquisa tendências atuais em um nicho usando Grounding (Google Search).
   */
  getTrendingTopics(niche: string): Promise<TrendingTopic[]>;
}

export interface ImageGeneratorProvider {
  generateImage(prompt: string): Promise<string>;
}

export interface VideoGeneratorProvider {
  generateVideo(prompt: string): Promise<string>;
}
