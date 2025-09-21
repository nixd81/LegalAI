/**
 * Frontend Semantic Matching Utility
 * =================================
 * 
 * This utility provides semantic matching capabilities for the frontend,
 * including query analysis, confidence scoring, and suggestions.
 */

export class SemanticMatcher {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_BASE_URL;
  }

  /**
   * Analyze a user query to extract keywords, synonyms, and intent
   * @param {string} query - User's search query
   * @returns {Promise<Object>} Query analysis results
   */
  async analyzeQuery(query) {
    try {
      const formData = new FormData();
      formData.append('query', query);

      const response = await fetch(`${this.baseUrl}/analyze_query/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing query:', error);
      return {
        original_query: query,
        keywords: query.split(' ').filter(word => word.length > 2),
        synonyms: [],
        expanded_terms: [],
        intent: 'general',
        legal_entities: []
      };
    }
  }

  /**
   * Perform semantic search on clauses
   * @param {string} query - Search query
   * @param {Array} clauses - Array of clause objects
   * @returns {Promise<Object>} Search results with matches and segments
   */
  async semanticSearch(query, clauses) {
    try {
      const formData = new FormData();
      formData.append('query', query);
      formData.append('clauses', JSON.stringify(clauses));

      const response = await fetch(`${this.baseUrl}/semantic_search/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing semantic search:', error);
      return {
        query,
        matches: [],
        segments: [],
        query_analysis: {
          original_query: query,
          keywords: query.split(' ').filter(word => word.length > 2),
          intent: 'general'
        }
      };
    }
  }

  /**
   * Get confidence level color and styling
   * @param {string} confidence - Confidence level ('high', 'medium', 'low')
   * @returns {Object} Styling object
   */
  getConfidenceStyling(confidence) {
    const styles = {
      high: {
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        icon: '✓',
        label: 'High Confidence'
      },
      medium: {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        icon: '⚠',
        label: 'Medium Confidence'
      },
      low: {
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        icon: '?',
        label: 'Low Confidence'
      }
    };

    return styles[confidence] || styles.low;
  }

  /**
   * Format confidence score for display
   * @param {number} score - Confidence score (0-1)
   * @returns {string} Formatted percentage
   */
  formatConfidenceScore(score) {
    return `${Math.round(score * 100)}%`;
  }

  /**
   * Generate query suggestions based on analysis
   * @param {Object} analysis - Query analysis results
   * @returns {Array<string>} Array of suggestion strings
   */
  generateSuggestions(analysis) {
    const suggestions = [];

    // Suggest more specific terms if keywords are few
    if (analysis.keywords.length < 3) {
      suggestions.push('Try using more specific keywords');
    }

    // Suggest synonyms if available
    if (analysis.synonyms.length > 0) {
      suggestions.push(`Also try: ${analysis.synonyms.slice(0, 3).join(', ')}`);
    }

    // Intent-specific suggestions
    switch (analysis.intent) {
      case 'location':
        suggestions.push('Try searching for specific clause titles or section numbers');
        break;
      case 'explanation':
        suggestions.push('Try asking "What does [specific term] mean?"');
        break;
      case 'responsibility':
        suggestions.push('Try searching for "liability", "responsibility", or "obligation"');
        break;
      case 'timing':
        suggestions.push('Try searching for "deadline", "expiration", or "time period"');
        break;
      case 'process':
        suggestions.push('Try searching for "procedure", "steps", or "how to"');
        break;
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Check if semantic matching is available
   * @returns {Promise<boolean>} True if available, false otherwise
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/health/`);
      const data = await response.json();
      return data.semantic_matcher === 'available';
    } catch (error) {
      console.error('Error checking semantic matcher availability:', error);
      return false;
    }
  }
}

// Create singleton instance
export const semanticMatcher = new SemanticMatcher();

// Export convenience functions
export const analyzeQuery = (query) => semanticMatcher.analyzeQuery(query);
export const semanticSearch = (query, clauses) => semanticMatcher.semanticSearch(query, clauses);
export const getConfidenceStyling = (confidence) => semanticMatcher.getConfidenceStyling(confidence);
export const formatConfidenceScore = (score) => semanticMatcher.formatConfidenceScore(score);
export const generateSuggestions = (analysis) => semanticMatcher.generateSuggestions(analysis);
export const isSemanticMatchingAvailable = () => semanticMatcher.isAvailable();
