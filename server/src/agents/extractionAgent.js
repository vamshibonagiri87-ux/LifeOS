import { AIService } from '../services/aiService.js';

export class ExtractionAgent {
  static async run(input) {
    const rawText = input.content || input.text || '';
    const metadata = input.metadata || {};

    if (!rawText.trim()) {
      return {
        success: false,
        error: 'Input content is empty',
        responsibilities: [],
      };
    }

    const { provider, data } = await AIService.extractStructuredData(rawText, metadata);
    const responsibilities = data?.responsibilities || [];

    return {
      success: true,
      provider,
      responsibilities,
      extractedCount: responsibilities.length,
    };
  }
}
