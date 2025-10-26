"""
Science Event Store Integration Examples

Demonstrates how the Terminal/UI layers can integrate with the new
persistent science event store for various use cases.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
import httpx


class ScienceEventStoreClient:
    """
    Client for interacting with the Science Event Store API.

    Used by Terminal/UI layers to query and display science events.
    """

    def __init__(self, base_url: str = "http://localhost:8000/api/v1"):
        self.base_url = base_url
        self.client = httpx.Client(base_url=base_url)

    def create_clinical_readout(
        self,
        drug_id: str,
        drug_name: str,
        title: str,
        description: str,
        key_findings: List[Dict[str, Any]],
        source_url: str,
        confidence: float = 0.9,
        impact: float = 0.8
    ) -> Dict[str, Any]:
        """
        Create a clinical readout event.

        Example use case: Ingestion pipeline parses CT.gov data and creates events.
        """
        event = {
            "event_type": "CLINICAL_READOUT",
            "event_category": "CLINICAL",
            "title": title,
            "description": description,
            "summary": title[:200],  # Truncated for timeline views
            "event_date": datetime.utcnow().isoformat(),
            "entity_type": "DRUG",
            "entity_id": drug_id,
            "entity_name": drug_name,
            "source_type": "CT.gov",
            "source_url": source_url,
            "key_findings": key_findings,
            "evidence_class": "CLINICAL",
            "confidence_score": confidence,
            "impact_score": impact,
            "tags": ["clinical", "phase-3", drug_id.lower()]
        }

        response = self.client.post("/science/science-events", json=event)
        return response.json()

    def get_drug_timeline(
        self,
        drug_id: str,
        days_back: int = 180
    ) -> List[Dict[str, Any]]:
        """
        Get timeline of events for a specific drug.

        Example use case: Evidence Journal "Today's Evidence" tab showing recent updates.
        """
        from_date = (datetime.utcnow() - timedelta(days=days_back)).isoformat()

        response = self.client.get(
            f"/science/science-events/timeline/DRUG/{drug_id}",
            params={"from_date": from_date}
        )

        return response.json()["timeline"]

    def get_company_events(
        self,
        ticker: str,
        event_types: List[str] = None,
        min_impact: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Get significant events for a company.

        Example use case: Company Scorecard showing key developments.
        """
        params = {
            "entity_type": "COMPANY",
            "entity_id": ticker,
            "min_impact": min_impact,
            "current_only": True
        }

        if event_types:
            params["event_type"] = ",".join(event_types)

        response = self.client.get("/science/science-events", params=params)
        return response.json()["events"]

    def search_mechanism_insights(
        self,
        target: str,
        evidence_class: str = "GENETIC"
    ) -> List[Dict[str, Any]]:
        """
        Search for mechanism insights about a specific target.

        Example use case: MoA Explorer showing genetic evidence for targets.
        """
        response = self.client.get(
            "/science/science-events",
            params={
                "event_type": "MECHANISM_INSIGHT",
                "evidence_class": evidence_class,
                "entity_type": "TARGET",
                "entity_id": target
            }
        )

        return response.json()["events"]

    def get_todays_evidence(self) -> Dict[str, Any]:
        """
        Get all events from the last 24 hours.

        Example use case: Evidence Journal "Today's Evidence" dashboard.
        """
        yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()

        response = self.client.get(
            "/science/science-events",
            params={
                "from_date": yesterday,
                "current_only": True
            }
        )

        events = response.json()["events"]

        # Group by event type for display
        grouped = {
            "clinical_readouts": [],
            "regulatory_changes": [],
            "mechanism_insights": [],
            "other": []
        }

        for event in events:
            event_type = event["event_type"]
            if event_type == "CLINICAL_READOUT":
                grouped["clinical_readouts"].append(event)
            elif event_type == "REGULATORY_CHANGE":
                grouped["regulatory_changes"].append(event)
            elif event_type == "MECHANISM_INSIGHT":
                grouped["mechanism_insights"].append(event)
            else:
                grouped["other"].append(event)

        return grouped

    def get_catalyst_board(self, days_ahead: int = 90) -> List[Dict[str, Any]]:
        """
        Get upcoming catalyst events.

        Example use case: Catalyst Board showing next 90 days of catalysts.
        """
        now = datetime.utcnow().isoformat()
        future = (datetime.utcnow() + timedelta(days=days_ahead)).isoformat()

        response = self.client.get(
            "/science/science-events",
            params={
                "event_category": "CLINICAL",
                "from_date": now,
                "to_date": future,
                "current_only": True
            }
        )

        return response.json()["events"]

    def create_event_link(
        self,
        source_event_id: int,
        target_event_id: int,
        relationship: str,
        explanation: str
    ):
        """
        Link two related events.

        Example use case: User indicates that preclinical findings support clinical results.
        """
        relationship_data = {
            "source_event_id": source_event_id,
            "target_event_id": target_event_id,
            "relationship_type": relationship,
            "description": explanation,
            "confidence": 0.85
        }

        response = self.client.post("/science/event-relationships", json=relationship_data)
        return response.json()

    def get_event_network(self, event_id: int) -> Dict[str, Any]:
        """
        Get the network of related events.

        Example use case: Knowledge graph visualization of event relationships.
        """
        response = self.client.get(
            f"/science/event-relationships/{event_id}",
            params={"direction": "both"}
        )

        return response.json()


# Example Terminal UI Integration
class EvidenceJournalUI:
    """
    Example UI component that uses the Science Event Store.
    """

    def __init__(self):
        self.store = ScienceEventStoreClient()

    def render_todays_evidence(self):
        """Render today's evidence updates"""
        evidence = self.store.get_todays_evidence()

        print("=== TODAY'S EVIDENCE ===\n")

        if evidence["clinical_readouts"]:
            print("📊 Clinical Readouts:")
            for event in evidence["clinical_readouts"]:
                print(f"  • {event['title']}")
                print(f"    Source: {event['source_type']} | Confidence: {event['confidence_score']:.0%}")
                print()

        if evidence["regulatory_changes"]:
            print("📋 Regulatory Changes:")
            for event in evidence["regulatory_changes"]:
                print(f"  • {event['title']}")
                print(f"    Source: {event['source_type']}")
                print()

        if evidence["mechanism_insights"]:
            print("🔬 Mechanism Insights:")
            for event in evidence["mechanism_insights"]:
                print(f"  • {event['title']}")
                print(f"    Target: {event['entity_id']} | Impact: {event['impact_score']:.0%}")
                print()

    def render_drug_timeline(self, drug_id: str):
        """Render evidence timeline for a drug"""
        timeline = self.store.get_drug_timeline(drug_id)

        print(f"=== EVIDENCE TIMELINE: {drug_id} ===\n")

        for event in timeline:
            date = event['event_date'][:10]  # YYYY-MM-DD
            print(f"{date} | {event['event_type']}")
            print(f"  {event['title']}")
            if event.get('key_findings'):
                print(f"  Key findings: {len(event['key_findings'])} items")
            print()

    def render_catalyst_board(self):
        """Render upcoming catalyst events"""
        catalysts = self.store.get_catalyst_board(days_ahead=90)

        print("=== CATALYST BOARD (Next 90 Days) ===\n")

        for catalyst in catalysts:
            date = catalyst['event_date'][:10]
            confidence = "●●●" if catalyst['confidence_score'] > 0.8 else "●●○" if catalyst['confidence_score'] > 0.5 else "●○○"

            print(f"{date} | {confidence}")
            print(f"  {catalyst['title']}")
            print(f"  {catalyst['entity_name']} | Impact: {catalyst['impact_score']:.0%}")
            print()


# Example usage
if __name__ == "__main__":
    # Initialize client
    store = ScienceEventStoreClient()

    # Example 1: Create a clinical readout event
    print("Example 1: Creating clinical readout event...")
    event = store.create_clinical_readout(
        drug_id="BPX-IL23",
        drug_name="BPX-IL23 (IL-23 inhibitor)",
        title="Phase III IBD Trial Shows Positive Results",
        description="BPX-IL23 demonstrated statistically significant improvement in primary endpoint...",
        key_findings=[
            {"finding": "Primary endpoint met", "p_value": 0.001},
            {"finding": "Favorable safety profile", "aes": "comparable to placebo"}
        ],
        source_url="https://clinicaltrials.gov/study/NCT12345678",
        confidence=0.95,
        impact=0.85
    )
    print(f"✓ Created event ID: {event['id']}\n")

    # Example 2: Query drug timeline
    print("Example 2: Querying drug timeline...")
    timeline = store.get_drug_timeline("BPX-IL23", days_back=180)
    print(f"✓ Found {len(timeline)} events in last 180 days\n")

    # Example 3: Today's evidence dashboard
    print("Example 3: Today's evidence dashboard...")
    ui = EvidenceJournalUI()
    ui.render_todays_evidence()

    # Example 4: Search mechanism insights
    print("Example 4: Searching genetic evidence for IL-23...")
    insights = store.search_mechanism_insights("IL-23", evidence_class="GENETIC")
    print(f"✓ Found {len(insights)} genetic insights\n")

    # Example 5: Catalyst board
    print("Example 5: Upcoming catalysts...")
    ui.render_catalyst_board()
