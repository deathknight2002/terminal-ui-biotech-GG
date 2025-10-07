# TUI Usage Examples

This document provides practical examples of using the Biotech Terminal TUI.

## Example 1: First Time Launch

When you first launch the TUI:

```bash
python3 -m platform.tui
```

You'll see:
1. ✅ Onboarding panel with command instructions
2. ✅ Empty watchlist sidebar
3. ✅ Empty recent assets
4. ✅ Command input ready for your commands

The onboarding shows all available commands and keyboard shortcuts.

## Example 2: Viewing an Asset

To view detailed information about a biotech asset:

```bash
> view BCRX-001
```

**What happens:**
- Asset details displayed with formatted output
- Risk metrics shown (success probability, burn rate, runway)
- Asset is automatically added to recent assets
- Both onboarding panel and recent assets widget update

**Output shows:**
```
╔════════════════════════════════════════════════════════════╗
║  ASSET DETAILS:              BCRX-001                     ║
╚════════════════════════════════════════════════════════════╝

RISK ASSESSMENT
────────────────────────────────────────────────────────────
  Success Probability:  65.0%
  Monthly Burn Rate:    $4.8M
  Runway:               18 months
  Risk Category:        Medium

FINANCIAL OVERVIEW
────────────────────────────────────────────────────────────
  Market Cap:           $8.9B
  Pipeline Stage:       Phase III
  Indication:           Oncology
```

## Example 3: Building a Watchlist

Add multiple assets to track:

```bash
> watch BCRX-001
✓ Added BCRX-001 to watchlist

> watch SRPT-001
✓ Added SRPT-001 to watchlist

> watch BEAM-001
✓ Added BEAM-001 to watchlist
```

**What happens:**
- Each asset is added to the watchlist
- Sidebar updates immediately
- Success confirmation shown

View your complete watchlist:

```bash
> watchlist
```

**Output:**
```
Current Watchlist:

  1. BCRX-001
  2. BEAM-001
  3. SRPT-001

Total: 3 asset(s)
```

## Example 4: Managing Your Watchlist

Remove an asset you no longer want to track:

```bash
> unwatch BCRX-001
✓ Removed BCRX-001 from watchlist
```

**What happens:**
- Asset removed from watchlist
- Sidebar updates immediately
- Count decrements

Try to add a duplicate:

```bash
> watch SRPT-001
! SRPT-001 is already in watchlist
```

## Example 5: Recent Assets Tracking

As you view assets, the system automatically tracks the last 3:

```bash
> view BCRX-001
> view NTLA-001
> view REGN-001
```

**Recent Assets widget now shows:**
```
═══ RECENT ASSETS ═══

1. REGN-001
2. NTLA-001
3. BCRX-001
```

**Note:** Most recent is always shown first.

If you view a 4th asset:

```bash
> view BEAM-001
```

**Recent Assets updates to:**
```
═══ RECENT ASSETS ═══

1. BEAM-001
2. REGN-001
3. NTLA-001
```

BCRX-001 is removed (oldest is dropped).

## Example 6: Refreshing Data

To refresh data from all sources:

```bash
> refresh
```

**What you'll see:**

1. **Starting:**
   ```
   Status: ⟳ Refreshing data...
   ```

2. **During refresh (2 seconds):**
   - Loading indicator in status bar
   - Command input remains responsive

3. **On success:**
   ```
   Status: ✓ Data refreshed successfully
   ✓ Data refresh completed successfully!
   ```

4. **On error (if backend unavailable):**
   ```
   Status: ✗ Refresh failed
   ✗ Data refresh failed:
   Connection refused
   
   Please check your connection and try again.
   ```

## Example 7: Keyboard Shortcuts

### F1 - Toggle Onboarding

Press `F1` at any time to show/hide the onboarding panel:

**First press:** Hides onboarding, gives more screen space
**Second press:** Shows onboarding again

### Ctrl+R - Quick Refresh

Instead of typing `refresh`, press `Ctrl+R` for instant data refresh.

### Ctrl+C - Quick Exit

Press `Ctrl+C` at any time to exit immediately.

## Example 8: Complete Workflow

Here's a typical analyst workflow:

```bash
# 1. Launch TUI
python3 -m platform.tui

# 2. View a promising asset
> view BCRX-001

# 3. Add it to watchlist for tracking
> watch BCRX-001

# 4. Explore more assets
> view SRPT-001
> view BEAM-001

# 5. Add another to watchlist
> watch BEAM-001

# 6. Review your watchlist
> watchlist
Current Watchlist:
  1. BCRX-001
  2. BEAM-001

# 7. Check recent assets (auto-tracked)
(See sidebar showing: BEAM-001, SRPT-001, BCRX-001)

# 8. Refresh data
> refresh
✓ Data refreshed successfully!

# 9. Remove asset after analysis
> unwatch BEAM-001
✓ Removed BEAM-001 from watchlist

# 10. Exit when done
> quit
```

## Example 9: Error Handling

### Unknown Command
```bash
> invalid_command
Unknown command: invalid_command
Type 'help' for available commands.
```

### Missing Asset ID
```bash
> watch
Unknown command: watch
Type 'help' for available commands.
```

(Note: Proper usage requires asset ID after command)

### Asset Not in Watchlist
```bash
> unwatch UNKNOWN-999
! UNKNOWN-999 is not in watchlist
```

## Example 10: Session State

**Important:** Watchlist and recent assets are session-based:
- Persist only while TUI is running
- Lost when you quit
- Start fresh each launch

**Future enhancement:** Persistent storage across sessions.

## Tips and Tricks

### Quickly Review Recent Work
The recent assets widget acts as your session history. Use it to quickly return to assets you were just analyzing.

### Watchlist as Shortlist
Use the watchlist to build a shortlist of assets for deeper analysis. You can quickly review them later.

### Help is Always Available
Forgot a command? Press `F1` or type `help` to see all available commands and shortcuts.

### Case Insensitive Commands
Commands are case-insensitive:
- `VIEW BCRX-001` = `view BCRX-001` = `View BCRX-001`

### Multiple Assets
View multiple assets in sequence to build up your recent assets list for easy reference.

## Troubleshooting

### TUI Won't Launch
```bash
ModuleNotFoundError: No module named 'textual'
```
**Solution:** Install dependencies
```bash
pip install textual rich
```

### Display Issues
If colors or formatting look wrong, ensure your terminal supports 256 colors:
```bash
echo $TERM  # Should show something like xterm-256color
```

### Import Errors
```bash
ModuleNotFoundError: No module named 'platform.tui'
```
**Solution:** Run with PYTHONPATH set
```bash
PYTHONPATH=/path/to/project python3 -m platform.tui
```

## Next Steps

- Read the full [TUI Documentation](../docs/TUI.md)
- Explore risk metrics for different assets
- Build your own watchlist strategy
- Provide feedback for improvements
