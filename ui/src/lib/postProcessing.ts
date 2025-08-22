import type {
  PostProcessingConfig,
  PostProcessingModel,
  SummaryFormat,
  ProcessedTranscript
} from './types';

export class PostProcessingEngine {
  private static instance: PostProcessingEngine;
  
  static getInstance(): PostProcessingEngine {
    if (!PostProcessingEngine.instance) {
      PostProcessingEngine.instance = new PostProcessingEngine();
    }
    return PostProcessingEngine.instance;
  }

  /**
   * Process transcript with formatting and summarization
   */
  async processTranscript(
    originalText: string,
    config: PostProcessingConfig
  ): Promise<ProcessedTranscript> {
    const startTime = Date.now();
    const result: ProcessedTranscript = {
      original_text: originalText,
      processing_time: 0,
      models_used: {}
    };

    // Step 1: Text Formatting
    if (config.enabled && config.text_formatting.enabled) {
      result.formatted_text = await this.formatText(originalText, config.text_formatting);
      result.models_used.formatting = config.text_formatting.model;
    }

    // Step 2: Summarization
    if (config.enabled && config.summarization.enabled) {
      const textToSummarize = result.formatted_text || originalText;
      result.summary = await this.generateSummary(textToSummarize, config.summarization);
      result.models_used.summarization = config.summarization.model;
    }

    result.processing_time = Date.now() - startTime;
    return result;
  }

  /**
   * Format text for better readability
   */
  private async formatText(text: string, config: PostProcessingConfig['text_formatting']): Promise<string> {
    console.log('🔍 formatText called with config:', config);
    console.log('📝 Original text length:', text.length);
    
    // Simulate AI text formatting
    let formattedText = text;

    // Fix common transcription errors first (especially for accents)
    formattedText = this.fixCommonTranscriptionErrors(formattedText);
    console.log('✅ After error correction:', formattedText.substring(0, 100));

    if (config.add_paragraphs) {
      console.log('📄 Adding paragraph breaks...');
      formattedText = this.addParagraphBreaks(formattedText);
      console.log('✅ After paragraph breaks:', formattedText.substring(0, 200));
    }

    if (config.fix_punctuation) {
      formattedText = this.fixPunctuation(formattedText);
    }

    if (config.improve_readability) {
      formattedText = this.improveReadability(formattedText);
    }

    console.log('🎯 Final formatted text different from original?', formattedText !== text);
    console.log('📊 Number of \\n\\n in formatted:', (formattedText.match(/\n\n/g) || []).length);
    return formattedText;
  }

  /**
   * Generate intelligent summary
   */
  private async generateSummary(text: string, config: PostProcessingConfig['summarization']): Promise<ProcessedTranscript['summary']> {
    // Simulate AI summarization based on format
    const summary = {
      content: this.generateSummaryContent(text, config.format, config.max_length),
      format: config.format,
      key_points: config.include_key_points ? this.extractKeyPoints(text) : undefined,
      action_items: config.extract_action_items ? this.extractActionItems(text) : undefined,
      insights: config.focus_on_insights ? this.extractInsights(text) : undefined,
    };

    return summary;
  }

  /**
   * Add paragraph breaks based on natural speech patterns
   */
  private addParagraphBreaks(text: string): string {
    console.log('🔤 addParagraphBreaks input text sample:', text.substring(0, 200));
    
    // First, ensure proper sentence splitting
    const improvedText = text
      .replace(/([a-z])([A-Z])/g, '$1. $2') // Add periods where likely missing
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    // Split on sentence boundaries more accurately
    const sentences = improvedText.match(/[^.!?]+[.!?]+/g) || [improvedText];
    console.log('📝 Number of sentences found:', sentences.length);
    console.log('📝 First 3 sentences:', sentences.slice(0, 3));
    
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];
    
    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim();
      
      // Skip empty sentences
      if (!trimmedSentence) return;
      
      currentParagraph.push(trimmedSentence);
      
      // Add paragraph break after 3-5 sentences or on topic indicators
      const shouldBreak = 
        currentParagraph.length >= 3 && (
          currentParagraph.length >= 5 ||
          this.isTopicTransition(trimmedSentence) ||
          (index > 0 && this.isNewSpeaker(trimmedSentence)) ||
          // Break on common transitional phrases
          /^(Now |So |And |But |However |Therefore |Next |Finally |In conclusion |To summarize )/i.test(trimmedSentence)
        );
      
      if (shouldBreak && currentParagraph.length > 0) {
        console.log('📄 Creating paragraph with', currentParagraph.length, 'sentences');
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
    });
    
    // Add remaining sentences
    if (currentParagraph.length > 0) {
      console.log('📄 Adding final paragraph with', currentParagraph.length, 'sentences');
      paragraphs.push(currentParagraph.join(' '));
    }
    
    console.log('📊 Total paragraphs created:', paragraphs.length);
    
    // Ensure paragraphs are well-formed
    const result = paragraphs
      .filter(p => p.trim().length > 0)
      .join('\n\n');
    
    console.log('🎯 Result sample:', result.substring(0, 300));
    console.log('📊 Result has \\n\\n?', result.includes('\n\n'));
    
    return result;
  }

  /**
   * Fix common punctuation issues in transcripts
   */
  private fixPunctuation(text: string): string {
    // Split by paragraphs to preserve paragraph breaks
    const paragraphs = text.split('\n\n');
    
    const fixedParagraphs = paragraphs.map(paragraph => {
      return paragraph
        // Fix missing periods at sentence ends
        .replace(/([a-z])\s+([A-Z])/g, '$1. $2')
        // Fix spacing around punctuation
        .replace(/\s+([,.!?])/g, '$1')
        .replace(/([,.!?])([A-Za-z])/g, '$1 $2')
        // Fix common transcript artifacts (but only within paragraphs)
        .replace(/[ \t]+/g, ' ')  // Only replace spaces and tabs, not newlines
        .replace(/\.\s*\./g, '.')
        .trim();
    });
    
    // Rejoin paragraphs with double newlines
    return fixedParagraphs.join('\n\n');
  }

  /**
   * Improve overall readability
   */
  /**
   * Fix common transcription errors, especially for technical terms and accents
   */
  private fixCommonTranscriptionErrors(text: string): string {
    // Common technical term corrections
    const corrections: [RegExp, string][] = [
      // Network/Web terms
      [/\bHCP\b/gi, 'HTTP'],
      [/\bHCPS\b/gi, 'HTTPS'],
      [/\bHDP\b/gi, 'HTTP'],
      [/\bHTPS\b/gi, 'HTTPS'],
      [/\bAPA\b/gi, 'API'],
      [/\bAPIs\b/gi, 'APIs'],
      [/\bJay Son\b/gi, 'JSON'],
      [/\bJayson\b/gi, 'JSON'],
      [/\bX ML\b/gi, 'XML'],
      [/\bU R L\b/gi, 'URL'],
      [/\bU R I\b/gi, 'URI'],
      [/\bI P\b/gi, 'IP'],
      [/\bT C P\b/gi, 'TCP'],
      [/\bU D P\b/gi, 'UDP'],
      [/\bS S L\b/gi, 'SSL'],
      [/\bT L S\b/gi, 'TLS'],
      [/\bD N S\b/gi, 'DNS'],
      
      // Programming terms
      [/\bJava script\b/gi, 'JavaScript'],
      [/\bType script\b/gi, 'TypeScript'],
      [/\bPython\b/gi, 'Python'],
      [/\bGit hub\b/gi, 'GitHub'],
      [/\bGit lab\b/gi, 'GitLab'],
      [/\bV S Code\b/gi, 'VS Code'],
      [/\bI D E\b/gi, 'IDE'],
      [/\bS Q L\b/gi, 'SQL'],
      [/\bNo S Q L\b/gi, 'NoSQL'],
      [/\bRest full\b/gi, 'RESTful'],
      [/\bRest API\b/gi, 'REST API'],
      [/\bGraph Q L\b/gi, 'GraphQL'],
      
      // Cloud/DevOps terms
      [/\bA W S\b/gi, 'AWS'],
      [/\bG C P\b/gi, 'GCP'],
      [/\bDocker\b/gi, 'Docker'],
      [/\bKubernetes\b/gi, 'Kubernetes'],
      [/\bK 8 S\b/gi, 'K8s'],
      [/\bC I C D\b/gi, 'CI/CD'],
      [/\bDev ops\b/gi, 'DevOps'],
      
      // Common Scottish accent issues
      [/\bcannae\b/gi, "can't"],
      [/\bdidnae\b/gi, "didn't"],
      [/\bwouldnae\b/gi, "wouldn't"],
      [/\bcouldnae\b/gi, "couldn't"],
      [/\bshouldnae\b/gi, "shouldn't"],
    ];
    
    let correctedText = text;
    corrections.forEach(([pattern, replacement]) => {
      correctedText = correctedText.replace(pattern, replacement);
    });
    
    return correctedText;
  }

  private improveReadability(text: string): string {
    // Split by paragraphs to preserve paragraph breaks
    const paragraphs = text.split('\n\n');
    
    const improvedParagraphs = paragraphs.map(paragraph => {
      return paragraph
        // Fix common filler words patterns
        .replace(/\b(um|uh|like|you know)\b\s*/gi, '')
        // Fix repeated words
        .replace(/\b(\w+)\s+\1\b/gi, '$1')
        // Capitalize proper sentence starts
        .replace(/(^|\. )([a-z])/g, (match, prefix, letter) => prefix + letter.toUpperCase())
        // Fix common transcription errors
        .replace(/\bi\b/g, 'I')
        .replace(/\bim\b/gi, "I'm")
        .replace(/\bits\b/gi, "it's");
    });
    
    // Rejoin paragraphs with double newlines
    return improvedParagraphs.join('\n\n');
  }

  /**
   * Generate summary content based on format
   */
  private generateSummaryContent(text: string, format: SummaryFormat, maxLength: number): string {
    const words = text.split(' ');
    const targetLength = Math.min(maxLength, Math.floor(words.length * 0.3));
    
    switch (format) {
      case 'paragraphs':
        return this.generateParagraphSummary(text, targetLength);
      
      case 'bullets':
        return this.generateBulletSummary(text);
      
      case 'markdown':
        return this.generateMarkdownSummary(text);
      
      case 'key_points':
        return this.generateKeyPointsSummary(text);
      
      case 'outline':
        return this.generateOutlineSummary(text);
      
      default:
        return this.generateParagraphSummary(text, targetLength);
    }
  }

  private generateParagraphSummary(text: string, targetLength: number): string {
    // Simulate extractive summarization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const importantSentences = sentences
      .slice(0, Math.ceil(sentences.length * 0.4))
      .join('. ');
    
    return `**Summary**\n\n${importantSentences}.`;
  }

  private generateBulletSummary(text: string): string {
    const keyPoints = this.extractKeyPoints(text);
    return '**Key Points**\n\n' + keyPoints.map(point => `• ${point}`).join('\n');
  }

  private generateMarkdownSummary(text: string): string {
    const keyPoints = this.extractKeyPoints(text);
    const actionItems = this.extractActionItems(text);
    const insights = this.extractInsights(text);
    
    let markdown = '# Summary\n\n';
    
    if (keyPoints.length > 0) {
      markdown += '## Key Points\n\n';
      markdown += keyPoints.map(point => `- ${point}`).join('\n') + '\n\n';
    }
    
    if (insights.length > 0) {
      markdown += '## Key Insights\n\n';
      markdown += insights.map(insight => `> ${insight}`).join('\n\n') + '\n\n';
    }
    
    if (actionItems.length > 0) {
      markdown += '## Action Items\n\n';
      markdown += actionItems.map(item => `- [ ] ${item}`).join('\n') + '\n';
    }
    
    return markdown;
  }

  private generateKeyPointsSummary(text: string): string {
    const points = this.extractKeyPoints(text);
    return '**Key Points & Takeaways**\n\n' + points.map((point, index) => 
      `${index + 1}. ${point}`
    ).join('\n');
  }

  private generateOutlineSummary(text: string): string {
    const sections = this.identifyTopicalSections(text);
    let outline = '**Outline & Structure**\n\n';
    
    sections.forEach((section, index) => {
      outline += `${index + 1}. ${section.title}\n`;
      section.points.forEach(point => {
        outline += `   • ${point}\n`;
      });
      outline += '\n';
    });
    
    return outline;
  }

  /**
   * Extract key points from text
   */
  private extractKeyPoints(text: string): string[] {
    // Simulate key point extraction
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyIndicators = [
      'important', 'key', 'crucial', 'essential', 'main', 'primary',
      'significant', 'critical', 'fundamental', 'basically', 'essentially'
    ];
    
    return sentences
      .filter(sentence => 
        keyIndicators.some(indicator => 
          sentence.toLowerCase().includes(indicator)
        ) || sentence.length > 100
      )
      .slice(0, 5)
      .map(sentence => sentence.trim());
  }

  /**
   * Extract action items from text
   */
  private extractActionItems(text: string): string[] {
    // Look for action-oriented language
    const actionIndicators = [
      'need to', 'should', 'must', 'will', 'going to', 'plan to',
      'decide', 'follow up', 'action', 'next step', 'todo'
    ];
    
    const sentences = text.split(/[.!?]+/);
    return sentences
      .filter(sentence => 
        actionIndicators.some(indicator => 
          sentence.toLowerCase().includes(indicator)
        )
      )
      .slice(0, 3)
      .map(sentence => sentence.trim().replace(/^(we|i|you)\s+/i, ''));
  }

  /**
   * Extract insights and wisdom from text
   */
  private extractInsights(text: string): string[] {
    // Look for insight indicators
    const insightIndicators = [
      'learned', 'realized', 'understand', 'insight', 'wisdom',
      'experience shows', 'what we found', 'discovered', 'concluded'
    ];
    
    const sentences = text.split(/[.!?]+/);
    return sentences
      .filter(sentence => 
        insightIndicators.some(indicator => 
          sentence.toLowerCase().includes(indicator)
        )
      )
      .slice(0, 3)
      .map(sentence => sentence.trim());
  }

  /**
   * Utility methods
   */
  private isTopicTransition(sentence: string): boolean {
    const transitionWords = [
      'however', 'but', 'meanwhile', 'furthermore', 'additionally',
      'on the other hand', 'in contrast', 'moving on', 'next'
    ];
    
    return transitionWords.some(word => 
      sentence.toLowerCase().includes(word.toLowerCase())
    );
  }

  private isNewSpeaker(sentence: string): boolean {
    // Simple heuristic for speaker changes
    return sentence.trim().startsWith('"') || 
           sentence.toLowerCase().includes('said') ||
           sentence.toLowerCase().includes('speaker');
  }

  private identifyTopicalSections(text: string): Array<{title: string, points: string[]}> {
    // Simulate topic modeling
    const paragraphs = text.split('\n\n');
    return paragraphs.slice(0, 3).map((paragraph, index) => ({
      title: `Topic ${index + 1}`,
      points: paragraph.split(/[.!?]+/).slice(0, 2).map(s => s.trim()).filter(s => s.length > 10)
    }));
  }

  /**
   * Get available models for different tasks
   */
  getAvailableModels(): {
    formatting: PostProcessingModel[];
    summarization: PostProcessingModel[];
  } {
    return {
      formatting: ['phi3.5', 'qwen2.5', 'gemma2', 'llama3.2'],
      summarization: ['llama3.2', 'phi3.5', 'qwen2.5', 'gemma2']
    };
  }

  /**
   * Get model capabilities and recommendations
   */
  getModelRecommendations(taskType: 'formatting' | 'summarization'): Array<{
    model: PostProcessingModel;
    pros: string[];
    cons: string[];
    recommended_for: string[];
  }> {
    if (taskType === 'formatting') {
      return [
        {
          model: 'phi3.5',
          pros: ['Fast', 'Good at punctuation', 'Lightweight'],
          cons: ['Limited context'],
          recommended_for: ['Quick formatting', 'Real-time processing']
        },
        {
          model: 'qwen2.5',
          pros: ['Excellent grammar', 'Good paragraph structure'],
          cons: ['Slower processing'],
          recommended_for: ['Professional documents', 'Long transcripts']
        }
      ];
    } else {
      return [
        {
          model: 'llama3.2',
          pros: ['Excellent summarization', 'Good insight extraction'],
          cons: ['Requires more memory'],
          recommended_for: ['Meeting summaries', 'Long content']
        },
        {
          model: 'phi3.5',
          pros: ['Fast processing', 'Good key points'],
          cons: ['Less detailed summaries'],
          recommended_for: ['Quick overviews', 'Real-time summaries']
        }
      ];
    }
  }
}

// Export singleton instance
export const postProcessingEngine = PostProcessingEngine.getInstance();