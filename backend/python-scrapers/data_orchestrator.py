import subprocess
import json
import os
import sys
from pathlib import Path
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataOrchestrator:
    """Orchestrates real-time data collection from multiple Python scrapers"""
    
    def __init__(self, scrapers_dir: str):
        self.scrapers_dir = Path(scrapers_dir)
        self.output_dir = self.scrapers_dir / "output"
        self.output_dir.mkdir(exist_ok=True)
        
    def run_scraper(self, scraper_name: str) -> dict:
        """Run a specific Python scraper and return results"""
        try:
            scraper_path = self.scrapers_dir / f"{scraper_name}.py"
            
            if not scraper_path.exists():
                raise FileNotFoundError(f"Scraper {scraper_name}.py not found")
            
            logger.info(f"🚀 Running {scraper_name} scraper...")
            
            # Run the Python scraper
            result = subprocess.run([
                sys.executable, str(scraper_path)
            ], cwd=str(self.scrapers_dir), capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                logger.error(f"❌ {scraper_name} failed: {result.stderr}")
                return {"error": result.stderr, "scraper": scraper_name}
            
            # Look for output JSON file
            output_files = list(self.scrapers_dir.glob("*.json"))
            if output_files:
                latest_file = max(output_files, key=os.path.getctime)
                with open(latest_file, 'r') as f:
                    data = json.load(f)
                
                logger.info(f"✅ {scraper_name} completed successfully")
                return data
            else:
                logger.warning(f"⚠️ No output file found for {scraper_name}")
                return {"warning": "No output file generated", "scraper": scraper_name}
                
        except subprocess.TimeoutExpired:
            logger.error(f"⏰ {scraper_name} timed out")
            return {"error": "Scraper timed out", "scraper": scraper_name}
        except Exception as e:
            logger.error(f"❌ Error running {scraper_name}: {e}")
            return {"error": str(e), "scraper": scraper_name}
    
    def collect_all_data(self) -> dict:
        """Run all scrapers and combine data"""
        logger.info("🔄 Starting comprehensive data collection...")
        
        start_time = datetime.now()
        
        # Run biotech scraper
        biotech_data = self.run_scraper("biotech_scraper")
        
        # Run financial scraper  
        financial_data = self.run_scraper("financial_scraper")
        
        # Combine all data
        combined_data = {
            "meta": {
                "collection_started": start_time.isoformat(),
                "collection_completed": datetime.now().isoformat(),
                "data_sources": ["clinical_trials", "market_data", "financial_intelligence"],
                "status": "SUCCESS"
            },
            "biotech": biotech_data,
            "financial": financial_data,
            "timestamp": datetime.now().isoformat()
        }
        
        # Save combined data
        output_file = self.output_dir / "live_biotech_data.json"
        with open(output_file, 'w') as f:
            json.dump(combined_data, f, indent=2)
        
        logger.info(f"✅ All data collected and saved to {output_file}")
        return combined_data

def main():
    """Main execution"""
    current_dir = Path(__file__).parent
    orchestrator = DataOrchestrator(str(current_dir))
    
    data = orchestrator.collect_all_data()
    print(json.dumps(data, indent=2))
    
    return data

if __name__ == "__main__":
    main()