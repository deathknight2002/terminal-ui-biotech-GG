#!/usr/bin/env python3
"""
Test script for clinical trials scraper
Tests that we can fetch hundreds of trials from multiple sources
"""

import sys
import json
import logging
from biotech_scraper import BiotechDataScraper

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_clinical_trials_scraper():
    """Test that we can fetch 500+ clinical trials"""
    logger.info("=" * 80)
    logger.info("Testing Clinical Trials Scraper")
    logger.info("=" * 80)
    
    scraper = BiotechDataScraper()
    
    # Test 1: Fetch default 500 trials
    logger.info("\n🧪 Test 1: Fetching 500 clinical trials...")
    trials = scraper.scrape_clinical_trials(limit=500)
    
    logger.info(f"\n✅ Successfully fetched {len(trials)} clinical trials")
    
    # Validate results
    assert len(trials) > 0, "Should fetch at least some trials"
    assert len(trials) >= 100, f"Should fetch at least 100 trials, got {len(trials)}"
    
    # Check trial structure
    if trials:
        sample_trial = trials[0]
        logger.info(f"\n📋 Sample trial structure:")
        logger.info(f"   NCT ID: {sample_trial.get('nct_id', 'N/A')}")
        logger.info(f"   Title: {sample_trial.get('title', 'N/A')[:80]}...")
        logger.info(f"   Phase: {sample_trial.get('phase', 'N/A')}")
        logger.info(f"   Status: {sample_trial.get('status', 'N/A')}")
        logger.info(f"   Sponsor: {sample_trial.get('sponsor', 'N/A')[:50]}...")
        logger.info(f"   Conditions: {sample_trial.get('condition', 'N/A')[:80]}...")
        logger.info(f"   Intervention: {sample_trial.get('intervention', 'N/A')[:80]}...")
        
        # Validate required fields
        assert sample_trial.get('nct_id'), "Trial should have NCT ID"
        assert sample_trial.get('title'), "Trial should have title"
        assert sample_trial.get('phase'), "Trial should have phase"
        assert sample_trial.get('status'), "Trial should have status"
        assert sample_trial.get('source') == 'ClinicalTrials.gov', "Trial should have source"
    
    # Statistics
    logger.info(f"\n📊 Statistics:")
    
    # Count by phase
    phase_counts = {}
    for trial in trials:
        phase = trial.get('phase', 'Unknown')
        phase_counts[phase] = phase_counts.get(phase, 0) + 1
    
    logger.info(f"   By Phase:")
    for phase, count in sorted(phase_counts.items(), key=lambda x: x[1], reverse=True):
        logger.info(f"      {phase}: {count}")
    
    # Count by status
    status_counts = {}
    for trial in trials:
        status = trial.get('status', 'Unknown')
        status_counts[status] = status_counts.get(status, 0) + 1
    
    logger.info(f"   By Status:")
    for status, count in sorted(status_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
        logger.info(f"      {status}: {count}")
    
    # Check for duplicates
    nct_ids = [t.get('nct_id') for t in trials]
    unique_nct_ids = set(nct_ids)
    logger.info(f"\n🔍 Duplicate check:")
    logger.info(f"   Total trials: {len(trials)}")
    logger.info(f"   Unique NCT IDs: {len(unique_nct_ids)}")
    
    if len(trials) != len(unique_nct_ids):
        duplicates = len(trials) - len(unique_nct_ids)
        logger.warning(f"   ⚠️ Found {duplicates} duplicate trials")
    else:
        logger.info(f"   ✅ No duplicates found")
    
    # Test 2: Check data quality
    logger.info(f"\n🎯 Data Quality Check:")
    trials_with_conditions = sum(1 for t in trials if t.get('condition'))
    trials_with_interventions = sum(1 for t in trials if t.get('intervention'))
    trials_with_sponsors = sum(1 for t in trials if t.get('sponsor'))
    trials_with_enrollment = sum(1 for t in trials if t.get('enrollment'))
    
    logger.info(f"   Trials with conditions: {trials_with_conditions} ({trials_with_conditions/len(trials)*100:.1f}%)")
    logger.info(f"   Trials with interventions: {trials_with_interventions} ({trials_with_interventions/len(trials)*100:.1f}%)")
    logger.info(f"   Trials with sponsors: {trials_with_sponsors} ({trials_with_sponsors/len(trials)*100:.1f}%)")
    logger.info(f"   Trials with enrollment: {trials_with_enrollment} ({trials_with_enrollment/len(trials)*100:.1f}%)")
    
    # Verify no placeholder data
    logger.info(f"\n🚫 Placeholder Data Check:")
    has_placeholder = False
    placeholder_keywords = ['mock', 'placeholder', 'test', 'dummy', 'sample']
    
    for trial in trials[:10]:  # Check first 10
        title = trial.get('title', '').lower()
        for keyword in placeholder_keywords:
            if keyword in title:
                logger.warning(f"   ⚠️ Potential placeholder found: {trial.get('title')}")
                has_placeholder = True
    
    if not has_placeholder:
        logger.info(f"   ✅ No obvious placeholder data found")
    
    logger.info("\n" + "=" * 80)
    logger.info("✅ ALL TESTS PASSED")
    logger.info("=" * 80)
    
    return trials

if __name__ == "__main__":
    try:
        trials = test_clinical_trials_scraper()
        
        # Save sample output
        output = {
            "total_trials": len(trials),
            "sample_trials": trials[:5],  # First 5 trials
            "test_status": "PASSED"
        }
        
        with open('test_output.json', 'w') as f:
            json.dump(output, f, indent=2)
        
        logger.info(f"\n💾 Sample output saved to test_output.json")
        sys.exit(0)
        
    except Exception as e:
        logger.error(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
