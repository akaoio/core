# No Hardcoded Decorations Principle - Mobile-First UI/UX

## Core Principle
**"NO HARDCODED DECORATIONS (like =====================) BECAUSE ON SMALL SCREEN DEVICES THEY ARE BROKEN AND VERY UGLY"**

This is a fundamental UI/UX rule that ensures our interfaces work beautifully on all device sizes.

## Universal Rule - No Exceptions
- **NEVER use hardcoded separator lines** (=====================)
- **NEVER use fixed-width ASCII borders** (--------------------)
- **NEVER use fixed character counts** for visual elements
- **ALL decorations MUST be responsive** and adapt to screen size

## Critical Impact
- Small terminal windows become unusable with hardcoded decorations
- Mobile web interfaces break with fixed-width elements
- Responsive design principles are fundamental to modern UX

## Correct Alternatives
- **Terminal**: Use `tput cols` for dynamic width detection
- **Web**: Use CSS flexible layouts and semantic elements
- **Documentation**: Use markdown native separators (`---`)
- **CLI**: Calculate proportional decorations based on viewport

## Technical Implementation Examples
```bash
# ✅ CORRECT: Dynamic terminal width
COLS=$(tput cols)
printf "%*s\n" "$COLS" "" | tr ' ' '-'

# ✅ CORRECT: Responsive CSS
.separator {
  width: 100%;
  border-top: 1px solid #ccc;
  margin: 1rem 0;
}

# ❌ WRONG: Fixed width
echo "=========================="
```

## Vision
Our interfaces must be beautiful and functional across all devices and screen sizes. By eliminating hardcoded decorations, we create a truly inclusive user experience that adapts elegantly to any viewport, from mobile phones to ultrawide monitors.

This principle reflects our commitment to accessibility and modern responsive design standards.

---
*Story captured from UI/UX accessibility discussions and mobile-first design requirements*