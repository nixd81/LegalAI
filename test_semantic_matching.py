#!/usr/bin/env python3
"""
Test Script for Semantic Matching
=================================

This script tests the semantic matching functionality to ensure it works correctly
with various types of queries and document content.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from semantic_matcher import create_semantic_matcher, get_highlighting_info

def test_semantic_matching():
    """Test the semantic matching functionality"""
    print("🧪 Testing Semantic Matching System")
    print("=" * 50)
    
    # Create semantic matcher
    print("📦 Initializing semantic matcher...")
    matcher = create_semantic_matcher()
    print("✅ Semantic matcher initialized successfully")
    
    # Sample legal clauses for testing
    sample_clauses = [
        {
            "title": "Child Custody and Visitation",
            "text": "The parties agree that primary physical custody of the minor children shall be awarded to the mother, with the father having reasonable visitation rights as agreed upon by both parties. The father shall have visitation every other weekend and on alternating holidays."
        },
        {
            "title": "Payment Terms and Schedule",
            "text": "All payments shall be made within 30 days of invoice date. Late payments shall incur a 1.5% monthly interest charge. Payment methods include bank transfer, check, or credit card."
        },
        {
            "title": "Termination and Cancellation",
            "text": "Either party may terminate this agreement with 60 days written notice. Upon termination, all outstanding obligations must be fulfilled within 30 days. Early termination may result in additional fees."
        },
        {
            "title": "Liability and Indemnification",
            "text": "Each party shall indemnify and hold harmless the other party from any claims, damages, or losses arising from their own negligence or breach of this agreement. Liability shall be limited to the total amount paid under this contract."
        },
        {
            "title": "Confidentiality and Non-Disclosure",
            "text": "Both parties agree to maintain strict confidentiality regarding all proprietary information disclosed during the course of this agreement. This obligation shall survive termination of the contract for a period of five years."
        },
        {
            "title": "Dispute Resolution",
            "text": "Any disputes arising from this agreement shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The prevailing party shall be entitled to reasonable attorney's fees and costs."
        }
    ]
    
    # Test queries with different types of natural language
    test_queries = [
        "Who has custody of the children?",
        "Where does it discuss payment terms?",
        "What about ending the contract?",
        "Show me the liability section",
        "Where is the confidentiality clause?",
        "What does it say about intellectual property?",
        "How can I terminate this agreement?",
        "Where are the dispute resolution procedures?",
        "What happens if someone doesn't pay on time?",
        "Who is responsible if something goes wrong?",
        "How long do I have to keep information secret?",
        "What if we disagree about something?"
    ]
    
    print(f"\n📋 Testing with {len(sample_clauses)} sample clauses")
    print(f"🔍 Testing {len(test_queries)} different queries")
    print("\n" + "=" * 50)
    
    # Test each query
    for i, query in enumerate(test_queries, 1):
        print(f"\n🔍 Test {i}: '{query}'")
        print("-" * 30)
        
        try:
            # Get highlighting info
            highlighting_info = get_highlighting_info(query, sample_clauses, matcher)
            
            # Display results
            matches = highlighting_info['matches']
            query_analysis = highlighting_info['query_analysis']
            
            print(f"📊 Query Analysis:")
            print(f"   Keywords: {', '.join(query_analysis['keywords'])}")
            print(f"   Intent: {query_analysis['intent']}")
            
            if matches:
                print(f"🎯 Found {len(matches)} matches:")
                for j, match in enumerate(matches[:3], 1):  # Show top 3
                    print(f"   {j}. {match['title']} (Confidence: {match['confidence']}, Score: {match['score']:.3f})")
                    print(f"      Matched keywords: {', '.join(match['matched_keywords'])}")
                    if match['suggestions']:
                        print(f"      Suggestions: {', '.join(match['suggestions'])}")
            else:
                print("❌ No matches found")
            
            # Test segments for highlighting
            segments = highlighting_info['segments']
            if segments:
                print(f"📝 Highlighting segments: {len(segments)}")
                for j, segment in enumerate(segments[:2], 1):  # Show top 2
                    print(f"   {j}. {segment['text'][:100]}... (Score: {segment['score']:.3f})")
            
        except Exception as e:
            print(f"❌ Error testing query: {str(e)}")
    
    print("\n" + "=" * 50)
    print("✅ Semantic matching test completed!")
    
    # Test query analysis
    print("\n🔬 Testing Query Analysis")
    print("-" * 30)
    
    analysis_queries = [
        "Who has custody of the children right now?",
        "Where does it discuss the prayer/request to the court?",
        "What are the payment terms and when are they due?",
        "How can I end this contract early?"
    ]
    
    for query in analysis_queries:
        print(f"\nQuery: '{query}'")
        analysis = matcher.analyze_query(query)
        print(f"  Keywords: {analysis.keywords}")
        print(f"  Synonyms: {analysis.synonyms[:5]}")  # Show first 5
        print(f"  Intent: {analysis.intent}")
        print(f"  Legal entities: {analysis.legal_entities}")

def test_performance():
    """Test performance with caching"""
    print("\n⚡ Testing Performance with Caching")
    print("=" * 50)
    
    matcher = create_semantic_matcher()
    
    # Test with same query multiple times (should use cache)
    query = "Who has custody of the children?"
    clauses = [{"title": "Custody", "text": "The mother shall have primary custody of the children."}]
    
    import time
    
    # First run (no cache)
    start_time = time.time()
    result1 = get_highlighting_info(query, clauses, matcher)
    first_run_time = time.time() - start_time
    
    # Second run (should use cache)
    start_time = time.time()
    result2 = get_highlighting_info(query, clauses, matcher)
    second_run_time = time.time() - start_time
    
    print(f"First run (no cache): {first_run_time:.3f}s")
    print(f"Second run (with cache): {second_run_time:.3f}s")
    print(f"Speedup: {first_run_time/second_run_time:.1f}x")
    
    # Save cache
    matcher.save_cache()
    print("💾 Cache saved to disk")

if __name__ == "__main__":
    try:
        test_semantic_matching()
        test_performance()
        print("\n🎉 All tests completed successfully!")
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        sys.exit(1)
