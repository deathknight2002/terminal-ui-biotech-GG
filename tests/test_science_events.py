"""
Tests for Science Event Store API

Verifies the persistent, queryable, versioned science event/evidence store.
"""

import pytest
from datetime import datetime, timedelta
from bt_platform.core.schema import ScienceEvent, Evidence, EventRelationship
from bt_platform.core.contracts import ScienceEventContract, EventRelationshipContract


def test_science_event_creation():
    """Test creating a basic science event"""
    event_data = {
        "event_type": "CLINICAL_READOUT",
        "event_category": "CLINICAL",
        "title": "Phase III IBD Trial Shows Positive Results",
        "summary": "BPX-IL23 demonstrated statistically significant improvement in primary endpoint",
        "event_date": datetime.utcnow(),
        "entity_type": "DRUG",
        "entity_id": "BPX-IL23",
        "entity_name": "BPX-IL23",
        "source_type": "CT.gov",
        "evidence_class": "CLINICAL",
        "confidence_score": 0.95,
        "impact_score": 0.85
    }
    
    # Validate with contract
    event_contract = ScienceEventContract(**event_data)
    assert event_contract.event_type == "CLINICAL_READOUT"
    assert event_contract.confidence_score == 0.95


def test_science_event_versioning():
    """Test that events can be versioned"""
    # Create initial event
    event = ScienceEvent(
        event_type="MECHANISM_INSIGHT",
        title="IL-23 Target Validation",
        event_date=datetime.utcnow(),
        version=1,
        is_current=True
    )
    
    assert event.version == 1
    assert event.is_current is True
    
    # Create updated version
    event_v2 = ScienceEvent(
        event_type="MECHANISM_INSIGHT",
        title="IL-23 Target Validation - Updated",
        event_date=datetime.utcnow(),
        version=2,
        parent_version_id=event.id,
        is_current=True,
        change_summary="Added new genetic evidence"
    )
    
    assert event_v2.version == 2
    assert event_v2.parent_version_id == event.id


def test_event_relationship_contract():
    """Test event relationship validation"""
    rel_data = {
        "source_event_id": 1,
        "target_event_id": 2,
        "relationship_type": "SUPPORTS",
        "confidence": 0.9
    }
    
    rel = EventRelationshipContract(**rel_data)
    assert rel.relationship_type == "SUPPORTS"
    assert rel.confidence == 0.9
    
    # Test validation: source and target cannot be the same
    with pytest.raises(ValueError):
        EventRelationshipContract(
            source_event_id=1,
            target_event_id=1,
            relationship_type="SUPPORTS"
        )


def test_evidence_entity_linking():
    """Test that evidence can be linked to entities without catalyst events"""
    evidence = Evidence(
        evidence_type="GENETIC_EVIDENCE",
        title="Open Targets Genetic Association",
        entity_type="TARGET",
        entity_id="IL-23",
        evidence_class="GENETIC",
        strength_score=0.85,
        version=1,
        is_current=True
    )
    
    assert evidence.catalyst_event_id is None  # Can be standalone
    assert evidence.entity_type == "TARGET"
    assert evidence.entity_id == "IL-23"


def test_science_event_required_fields():
    """Test that required fields are enforced"""
    # Missing required fields should raise validation error
    with pytest.raises(ValueError):
        ScienceEventContract(
            event_category="CLINICAL",
            title="Test Event"
            # Missing event_type and event_date
        )


def test_science_event_related_entities():
    """Test related entities structure"""
    event_data = {
        "event_type": "REGULATORY_CHANGE",
        "title": "FDA Label Update",
        "event_date": datetime.utcnow(),
        "entity_type": "DRUG",
        "entity_id": "DRUG-001",
        "related_entities": [
            {"type": "COMPANY", "id": "COMP-001", "name": "BioPharma X"},
            {"type": "INDICATION", "id": "IBD", "name": "Inflammatory Bowel Disease"}
        ]
    }
    
    event = ScienceEventContract(**event_data)
    assert len(event.related_entities) == 2
    assert event.related_entities[0]["type"] == "COMPANY"


def test_event_tags_and_filtering():
    """Test that events can be tagged for filtering"""
    event = ScienceEvent(
        event_type="CLINICAL_READOUT",
        title="Phase II Data",
        event_date=datetime.utcnow(),
        tags=["oncology", "phase-ii", "positive"],
        version=1,
        is_current=True
    )
    
    assert "oncology" in event.tags
    assert len(event.tags) == 3


def test_evidence_citations():
    """Test evidence citation structure"""
    from bt_platform.core.contracts import EvidenceContract
    
    evidence_data = {
        "evidence_type": "CLINICAL_DATA",
        "title": "Trial Results",
        "citations": [
            {
                "type": "pubmed",
                "id": "PMID:12345678",
                "url": "https://pubmed.ncbi.nlm.nih.gov/12345678"
            }
        ],
        "linkage_verified": True
    }
    
    evidence = EvidenceContract(**evidence_data)
    assert evidence.linkage_verified is True
    assert len(evidence.citations) == 1


if __name__ == "__main__":
    # Run basic tests
    test_science_event_creation()
    test_science_event_versioning()
    test_event_relationship_contract()
    test_evidence_entity_linking()
    test_science_event_related_entities()
    test_event_tags_and_filtering()
    test_evidence_citations()
    print("✓ All basic tests passed")
