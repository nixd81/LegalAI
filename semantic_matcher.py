"""
Semantic Matcher for Legal Document Annotation
=============================================

This module provides semantic, fuzzy, and synonym-aware matching for legal document
queries. It supports natural language queries that don't exactly match document text.

Features:
- Semantic similarity using sentence transformers
- Fuzzy string matching for typos and variations
- Synonym expansion using WordNet
- Confidence scoring and query suggestions
- Caching for performance optimization
- Modular design for frontend/backend reuse
"""

import json
import re
import hashlib
import pickle
import os
from typing import List, Dict, Tuple, Optional, Union
from dataclasses import dataclass
from pathlib import Path

# Core dependencies
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import fuzz, process
import nltk
from nltk.corpus import wordnet
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/wordnet')
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)

@dataclass
class MatchResult:
    """Result of a semantic match operation"""
    text: str
    title: str
    similarity_score: float
    fuzzy_score: float
    combined_score: float
    confidence: str  # 'high', 'medium', 'low'
    matched_keywords: List[str]
    suggestions: List[str]
    page_number: Optional[int] = None
    position: Optional[Tuple[int, int]] = None

@dataclass
class QueryAnalysis:
    """Analysis of user query for semantic matching"""
    original_query: str
    keywords: List[str]
    synonyms: List[str]
    expanded_terms: List[str]
    intent: str
    legal_entities: List[str]

class SemanticMatcher:
    """
    Advanced semantic matcher for legal document queries.
    
    Supports:
    - Semantic similarity using sentence transformers
    - Fuzzy matching for typos and variations
    - Synonym expansion
    - Legal domain-specific matching
    - Confidence scoring and suggestions
    """
    
    def __init__(self, 
                 model_name: str = "all-MiniLM-L6-v2",
                 cache_dir: str = "./semantic_cache",
                 similarity_threshold: float = 0.3,
                 fuzzy_threshold: int = 60):
        """
        Initialize the semantic matcher.
        
        Args:
            model_name: Sentence transformer model name
            cache_dir: Directory for caching embeddings
            similarity_threshold: Minimum similarity score for matches
            fuzzy_threshold: Minimum fuzzy match score
        """
        self.model_name = model_name
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.similarity_threshold = similarity_threshold
        self.fuzzy_threshold = fuzzy_threshold
        
        # Initialize models
        self.sentence_model = SentenceTransformer(model_name)
        self.lemmatizer = WordNetLemmatizer()
        
        # Legal domain keywords for better matching
        self.legal_keywords = {
            'custody': ['custody', 'guardianship', 'care', 'supervision', 'parental rights'],
            'payment': ['payment', 'compensation', 'salary', 'wages', 'remuneration', 'fee'],
            'termination': ['termination', 'ending', 'conclusion', 'expiration', 'cancellation'],
            'liability': ['liability', 'responsibility', 'accountability', 'obligation', 'duty'],
            'confidentiality': ['confidentiality', 'privacy', 'secrecy', 'non-disclosure', 'proprietary'],
            'dispute': ['dispute', 'conflict', 'disagreement', 'controversy', 'litigation'],
            'jurisdiction': ['jurisdiction', 'venue', 'court', 'legal authority', 'competent court'],
            'force_majeure': ['force majeure', 'act of god', 'unforeseen circumstances', 'emergency'],
            'intellectual_property': ['intellectual property', 'patent', 'copyright', 'trademark', 'ip'],
            'indemnification': ['indemnification', 'indemnity', 'protection', 'compensation', 'reimbursement']
        }
        
        # Load or create embedding cache
        self.embedding_cache = self._load_embedding_cache()
    
    def _load_embedding_cache(self) -> Dict[str, np.ndarray]:
        """Load embedding cache from disk"""
        cache_file = self.cache_dir / "embeddings.pkl"
        if cache_file.exists():
            try:
                with open(cache_file, 'rb') as f:
                    return pickle.load(f)
            except Exception:
                return {}
        return {}
    
    def _save_embedding_cache(self):
        """Save embedding cache to disk"""
        cache_file = self.cache_dir / "embeddings.pkl"
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(self.embedding_cache, f)
        except Exception as e:
            print(f"Warning: Could not save embedding cache: {e}")
    
    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def _get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Get embeddings for texts, using cache when possible"""
        embeddings = []
        texts_to_encode = []
        indices_to_encode = []
        
        for i, text in enumerate(texts):
            cache_key = self._get_cache_key(text)
            if cache_key in self.embedding_cache:
                embeddings.append(self.embedding_cache[cache_key])
            else:
                embeddings.append(None)
                texts_to_encode.append(text)
                indices_to_encode.append(i)
        
        # Encode texts not in cache
        if texts_to_encode:
            new_embeddings = self.sentence_model.encode(texts_to_encode)
            for i, embedding in enumerate(new_embeddings):
                original_index = indices_to_encode[i]
                cache_key = self._get_cache_key(texts_to_encode[i])
                self.embedding_cache[cache_key] = embedding
                embeddings[original_index] = embedding
        
        return np.array(embeddings)
    
    def analyze_query(self, query: str) -> QueryAnalysis:
        """
        Analyze user query to extract keywords, synonyms, and intent.
        
        Args:
            query: User's search query
            
        Returns:
            QueryAnalysis object with extracted information
        """
        # Clean and tokenize query
        clean_query = re.sub(r'[^\w\s]', ' ', query.lower())
        tokens = word_tokenize(clean_query)
        
        # Extract keywords
        keywords = [token for token in tokens if len(token) > 2]
        
        # Generate synonyms
        synonyms = []
        for word in keywords:
            for syn in wordnet.synsets(word):
                for lemma in syn.lemmas():
                    if lemma.name() != word:
                        synonyms.append(lemma.name().replace('_', ' '))
        
        # Expand with legal domain keywords
        expanded_terms = keywords.copy()
        for keyword in keywords:
            for legal_term, variations in self.legal_keywords.items():
                if any(variation in keyword for variation in variations):
                    expanded_terms.extend(variations)
        
        # Determine intent
        intent = self._determine_intent(query)
        
        # Extract legal entities (simple pattern matching)
        legal_entities = self._extract_legal_entities(query)
        
        return QueryAnalysis(
            original_query=query,
            keywords=keywords,
            synonyms=synonyms,
            expanded_terms=list(set(expanded_terms)),
            intent=intent,
            legal_entities=legal_entities
        )
    
    def _determine_intent(self, query: str) -> str:
        """Determine the intent of the query"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['where', 'find', 'locate', 'show']):
            return 'location'
        elif any(word in query_lower for word in ['what', 'explain', 'mean', 'definition']):
            return 'explanation'
        elif any(word in query_lower for word in ['who', 'responsible', 'liable', 'accountable']):
            return 'responsibility'
        elif any(word in query_lower for word in ['when', 'time', 'deadline', 'expire']):
            return 'timing'
        elif any(word in query_lower for word in ['how', 'process', 'procedure', 'method']):
            return 'process'
        else:
            return 'general'
    
    def _extract_legal_entities(self, query: str) -> List[str]:
        """Extract legal entities from query"""
        entities = []
        
        # Common legal entity patterns
        patterns = [
            r'\b(?:court|tribunal|judge|magistrate)\b',
            r'\b(?:plaintiff|defendant|respondent|appellant)\b',
            r'\b(?:contract|agreement|lease|deed|will)\b',
            r'\b(?:clause|section|paragraph|article)\b',
            r'\b(?:party|parties|signatory|signatories)\b'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, query, re.IGNORECASE)
            entities.extend(matches)
        
        return list(set(entities))
    
    def find_semantic_matches(self, 
                            query: str, 
                            clauses: List[Dict[str, str]], 
                            max_results: int = 5) -> List[MatchResult]:
        """
        Find semantic matches for a query in document clauses.
        
        Args:
            query: User's search query
            clauses: List of clause dictionaries with 'title' and 'text'
            max_results: Maximum number of results to return
            
        Returns:
            List of MatchResult objects sorted by combined score
        """
        # Analyze the query
        query_analysis = self.analyze_query(query)
        
        # Prepare texts for comparison
        clause_texts = []
        clause_metadata = []
        
        for i, clause in enumerate(clauses):
            # Combine title and text for better matching
            combined_text = f"{clause.get('title', '')} {clause.get('text', '')}"
            clause_texts.append(combined_text)
            clause_metadata.append({
                'index': i,
                'title': clause.get('title', ''),
                'text': clause.get('text', ''),
                'original_clause': clause
            })
        
        # Get embeddings
        query_embedding = self._get_embeddings([query])[0]
        clause_embeddings = self._get_embeddings(clause_texts)
        
        # Calculate semantic similarities
        similarities = cosine_similarity([query_embedding], clause_embeddings)[0]
        
        # Calculate fuzzy matches
        fuzzy_scores = []
        for clause_text in clause_texts:
            # Fuzzy match against original query
            fuzzy_score = fuzz.partial_ratio(query.lower(), clause_text.lower())
            
            # Also check against expanded terms
            max_expanded_score = 0
            for term in query_analysis.expanded_terms:
                score = fuzz.partial_ratio(term.lower(), clause_text.lower())
                max_expanded_score = max(max_expanded_score, score)
            
            # Take the best fuzzy score
            fuzzy_scores.append(max(fuzzy_score, max_expanded_score))
        
        # Combine scores and create results
        results = []
        for i, (similarity, fuzzy_score) in enumerate(zip(similarities, fuzzy_scores)):
            # Weighted combination (70% semantic, 30% fuzzy)
            combined_score = 0.7 * similarity + 0.3 * (fuzzy_score / 100)
            
            # Only include results above threshold
            if combined_score >= self.similarity_threshold or fuzzy_score >= self.fuzzy_threshold:
                metadata = clause_metadata[i]
                
                # Find matched keywords
                matched_keywords = self._find_matched_keywords(
                    query_analysis, 
                    metadata['text']
                )
                
                # Generate suggestions
                suggestions = self._generate_suggestions(
                    query_analysis, 
                    metadata['text']
                )
                
                # Determine confidence level
                confidence = self._determine_confidence(combined_score, fuzzy_score)
                
                result = MatchResult(
                    text=metadata['text'],
                    title=metadata['title'],
                    similarity_score=float(similarity),
                    fuzzy_score=float(fuzzy_score),
                    combined_score=float(combined_score),
                    confidence=confidence,
                    matched_keywords=matched_keywords,
                    suggestions=suggestions
                )
                
                results.append(result)
        
        # Sort by combined score and return top results
        results.sort(key=lambda x: x.combined_score, reverse=True)
        return results[:max_results]
    
    def _find_matched_keywords(self, query_analysis: QueryAnalysis, text: str) -> List[str]:
        """Find which keywords from the query match the text"""
        matched = []
        text_lower = text.lower()
        
        for keyword in query_analysis.keywords:
            if keyword.lower() in text_lower:
                matched.append(keyword)
        
        for synonym in query_analysis.synonyms:
            if synonym.lower() in text_lower:
                matched.append(synonym)
        
        return list(set(matched))
    
    def _generate_suggestions(self, query_analysis: QueryAnalysis, text: str) -> List[str]:
        """Generate suggestions for refining the query"""
        suggestions = []
        
        # If confidence is low, suggest more specific terms
        if len(query_analysis.keywords) < 3:
            suggestions.append("Try using more specific keywords")
        
        # Suggest related legal terms
        for legal_term, variations in self.legal_keywords.items():
            if any(keyword in query_analysis.keywords for keyword in variations):
                other_variations = [v for v in variations if v not in query_analysis.keywords]
                if other_variations:
                    suggestions.append(f"Also try: {', '.join(other_variations[:3])}")
        
        # Suggest intent-specific refinements
        if query_analysis.intent == 'location':
            suggestions.append("Try searching for specific clause titles or section numbers")
        elif query_analysis.intent == 'explanation':
            suggestions.append("Try asking 'What does [specific term] mean?'")
        
        return suggestions[:3]  # Limit to 3 suggestions
    
    def _determine_confidence(self, combined_score: float, fuzzy_score: float) -> str:
        """Determine confidence level based on scores"""
        if combined_score >= 0.8 or fuzzy_score >= 90:
            return 'high'
        elif combined_score >= 0.5 or fuzzy_score >= 70:
            return 'medium'
        else:
            return 'low'
    
    def get_highlighting_segments(self, 
                                query: str, 
                                clauses: List[Dict[str, str]], 
                                max_segments: int = 10) -> List[Dict[str, Union[str, int, float]]]:
        """
        Get text segments to highlight in PDF based on semantic matching.
        
        Args:
            query: User's search query
            clauses: List of clause dictionaries
            max_segments: Maximum number of segments to return
            
        Returns:
            List of segments with highlighting information
        """
        matches = self.find_semantic_matches(query, clauses, max_segments)
        
        segments = []
        for match in matches:
            # Split text into sentences for better highlighting
            sentences = re.split(r'[.!?]+', match.text)
            
            for sentence in sentences:
                if len(sentence.strip()) > 10:  # Skip very short sentences
                    # Calculate relevance score for this sentence
                    sentence_score = self._calculate_sentence_relevance(
                        query, sentence, match.matched_keywords
                    )
                    
                    if sentence_score > 0.3:  # Only include relevant sentences
                        segments.append({
                            'text': sentence.strip(),
                            'title': match.title,
                            'score': sentence_score,
                            'confidence': match.confidence,
                            'matched_keywords': match.matched_keywords
                        })
        
        # Sort by score and return top segments
        segments.sort(key=lambda x: x['score'], reverse=True)
        return segments[:max_segments]
    
    def _calculate_sentence_relevance(self, 
                                    query: str, 
                                    sentence: str, 
                                    matched_keywords: List[str]) -> float:
        """Calculate relevance score for a sentence"""
        # Base score from matched keywords
        keyword_score = len(matched_keywords) / max(len(query.split()), 1)
        
        # Fuzzy match score
        fuzzy_score = fuzz.partial_ratio(query.lower(), sentence.lower()) / 100
        
        # Length penalty (prefer medium-length sentences)
        length_penalty = 1.0
        if len(sentence) < 20 or len(sentence) > 200:
            length_penalty = 0.8
        
        return (keyword_score + fuzzy_score) * length_penalty
    
    def save_cache(self):
        """Save the embedding cache to disk"""
        self._save_embedding_cache()

# Convenience functions for easy integration
def create_semantic_matcher(model_name: str = "all-MiniLM-L6-v2") -> SemanticMatcher:
    """Create a new semantic matcher instance"""
    return SemanticMatcher(model_name=model_name)

def find_best_match(query: str, 
                   clauses: List[Dict[str, str]], 
                   matcher: Optional[SemanticMatcher] = None) -> Optional[MatchResult]:
    """Find the best semantic match for a query"""
    if matcher is None:
        matcher = create_semantic_matcher()
    
    matches = matcher.find_semantic_matches(query, clauses, max_results=1)
    return matches[0] if matches else None

def get_highlighting_info(query: str, 
                         clauses: List[Dict[str, str]], 
                         matcher: Optional[SemanticMatcher] = None) -> Dict:
    """Get highlighting information for a query"""
    if matcher is None:
        matcher = create_semantic_matcher()
    
    matches = matcher.find_semantic_matches(query, clauses, max_results=5)
    segments = matcher.get_highlighting_segments(query, clauses, max_segments=10)
    
    return {
        'matches': [
            {
                'title': match.title,
                'text': match.text,
                'confidence': match.confidence,
                'score': match.combined_score,
                'matched_keywords': match.matched_keywords,
                'suggestions': match.suggestions
            }
            for match in matches
        ],
        'segments': segments,
        'query_analysis': {
            'original_query': query,
            'keywords': matcher.analyze_query(query).keywords,
            'intent': matcher.analyze_query(query).intent
        }
    }

if __name__ == "__main__":
    # Example usage
    matcher = create_semantic_matcher()
    
    # Example clauses
    sample_clauses = [
        {
            "title": "Child Custody",
            "text": "The parties agree that primary physical custody of the minor children shall be awarded to the mother, with the father having reasonable visitation rights as agreed upon by both parties."
        },
        {
            "title": "Payment Terms",
            "text": "All payments shall be made within 30 days of invoice date. Late payments shall incur a 1.5% monthly interest charge."
        },
        {
            "title": "Termination Clause",
            "text": "Either party may terminate this agreement with 60 days written notice. Upon termination, all outstanding obligations must be fulfilled."
        }
    ]
    
    # Test queries
    test_queries = [
        "Who has custody of the children?",
        "Where does it discuss payment terms?",
        "What about ending the contract?",
        "Show me the dispute resolution section"
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        result = find_best_match(query, sample_clauses, matcher)
        if result:
            print(f"Best match: {result.title}")
            print(f"Confidence: {result.confidence}")
            print(f"Score: {result.combined_score:.3f}")
            print(f"Matched keywords: {result.matched_keywords}")
        else:
            print("No matches found")
