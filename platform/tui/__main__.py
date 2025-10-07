#!/usr/bin/env python3
"""
Biotech Terminal CLI Entry Point

Launches the Biotech Portfolio Analysis Terminal UI.
"""

import sys


def main() -> int:
    """Main entry point for the terminal application."""
    try:
        from platform.tui.app import run_app

        run_app()
        return 0
    except KeyboardInterrupt:
        print("\n\nGoodbye!")
        return 0
    except Exception as e:
        print(f"Error starting terminal: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
