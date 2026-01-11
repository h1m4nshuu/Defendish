# Product Scan Design Specification
**Defendish Food Safety App**

## Core Principle
**Guide the user's camera behavior - do not assume users know where information is printed.**

## Design Goals
- ✅ ≥90% users complete scan in one session
- ✅ ≤10% need manual edit
- ✅ ≤15% require partial re-scan
- ✅ Average scan time ≤ 6 seconds

---

## 1. Single Guided Scan Flow

### User Journey
```
[Tap "Scan Product"] 
    ↓
[Camera Opens - Live View]
    ↓
[Guided Multi-Angle Capture]
    ↓
[Auto-Capture Required Regions]
    ↓
[Confirmation Screen]
    ↓
[Confirm or Edit]
```

**Not**: Take photo → Upload → Wait → Retry
**Yes**: Continuous guided session with real-time feedback

---

## 2. Camera Screen Design

### A. Live Overlay Components

```
┌─────────────────────────────────┐
│  ✅ Ingredients  ⏳ Expiry ⏳ MFG │  ← Progress chips
├─────────────────────────────────┤
│                                 │
│     ┌───────────────────┐      │
│     │                   │      │  ← Flexible framing box
│     │   [Product Area]  │      │
│     │                   │      │
│     └───────────────────┘      │
│                                 │
│  "Slowly rotate the package    │  ← Instruction text
│   so we can read ingredients   │
│   and expiry details"           │
│                                 │
│  💡 Dates are usually near the │  ← Contextual hint
│     bottom seal or side panel   │
├─────────────────────────────────┤
│     [🔦 Flash]    [✓ Done]     │  ← Action buttons
└─────────────────────────────────┘
```

### B. Progressive Capture Indicators

**Top chips show real-time status:**
- ✅ **Ingredients detected** (green checkmark)
- ⏳ **Expiry date scanning** (spinner)
- ⏳ **Manufacturing date scanning** (spinner)

**Benefits:**
- Builds trust
- Prevents premature movement
- Improves completion rate

---

## 3. Visual Feedback System

### A. Lighting Assistance
```javascript
if (lightLevel < threshold) {
  showAlert("Low light detected. Turn on flash for better accuracy.")
  enableFlashButton()
}
```

### B. Blur Detection
```javascript
if (blurDetected) {
  showOverlay("Hold steady for a moment")
  pauseCapture()
}
```

### C. Text Detection Feedback
```javascript
if (textRegionDetected) {
  highlightRegion(boundingBox)
  updateProgressChip(detectedType)
}
```

---

## 4. Region Awareness Guidance

### Animated Hints
- **Back panel** → Ingredients list
- **Bottom seal / side panel** → MFG/EXP dates

### Visual Cues
```
"📍 Dates are usually printed near the seal or bottom edge"
"🔄 Slowly rotate to show all sides"
"👁️ Looking for manufacturing and expiry dates..."
```

**Impact**: +25-30% date detection accuracy

---

## 5. Confirmation Screen Design

### Layout Structure
```
┌─────────────────────────────────────┐
│  Product Scan Results               │
├─────────────────────────────────────┤
│                                     │
│  📦 INGREDIENTS                     │
│  ┌─────────────────────────────┐  │
│  │ Water, Sugar, Salt          │  │
│  │ ⚠️ Contains: Peanuts       │  │ ← Allergen highlight
│  │ (Scroll to see all)         │  │
│  └─────────────────────────────┘  │
│                                     │
│  📅 MANUFACTURING DATE              │
│  ┌─────────────────────────────┐  │
│  │  15/01/2025  [Confidence: High] │ ← Confidence indicator
│  │  ✏️ Edit                     │  │
│  └─────────────────────────────┘  │
│                                     │
│  ⏰ EXPIRY DATE                     │
│  ┌─────────────────────────────┐  │
│  │  15/01/2026  [Confidence: Medium]│
│  │  ✏️ Edit                     │  │
│  └─────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  [✓ Confirm All]  [Re-scan]        │
└─────────────────────────────────────┘
```

### Key Features
1. ✅ Scrollable ingredients with allergen highlights
2. ✅ Confidence indicators for each field
3. ✅ Individual field edit buttons
4. ✅ Clear confirm/re-scan actions

### Critical Rule
**Never auto-save extracted dates without user confirmation**

---

## 6. Error-Friendly Re-Scan

### Instead of Generic "Scan Again"
```
❌ Bad: "Scan failed. Please try again."

✅ Good: "We couldn't confidently detect the expiry date.
         Would you like to quickly capture just that area?"
         
         [📸 Capture Expiry Date]  [✏️ Enter Manually]
```

### Targeted Re-Scan Flow
```javascript
if (expiryDateMissing) {
  showTargetedScan({
    field: 'expiry',
    guidance: 'Focus on the expiry date printed near the seal',
    overlay: expiryDateFraming
  })
}
```

---

## 7. Ingredient List Presentation

### Interactive Features
```
┌─────────────────────────────────┐
│  INGREDIENTS                    │
├─────────────────────────────────┤
│  Water                          │
│  Sugar                          │
│  Salt                           │
│  Peanuts ⚠️ ALLERGEN           │ ← Highlighted
│  Wheat flour ⚠️ ALLERGEN       │
│                                 │
│  ✅ Safe for profile            │ ← Suitability
│  ❌ Contains allergens          │
│                                 │
│  [Tap to review full list]      │
└─────────────────────────────────┘
```

### Design Goal
Make manual verification feel easy, not tedious

---

## 8. Accessibility & Indian Context

### Multi-Script Support
- ✅ English
- ✅ Hindi (Devanagari)
- ✅ Regional languages

### Device Considerations
- ✅ Support low-end device cameras
- ✅ Handle small fonts on packaging
- ✅ Optimize for varying network conditions

### Avoid
- ❌ Tiny text
- ❌ Overloaded screens
- ❌ Excessive animations during scan

---

## 9. What NOT to Do

### Critical Mistakes to Avoid
```
❌ Rely on "take one photo" UX
❌ Hide confidence or uncertainty
❌ Auto-dismiss scan early
❌ Skip confirmation step
❌ Force re-scan of entire product
❌ Auto-save unconfirmed data
```

**These will drop accuracy below 70%**

---

## 10. Technical Implementation Notes

### Backend OCR Service
- ✅ Tesseract.js integrated
- ✅ Multi-pattern date detection
- ✅ Confidence scoring
- ✅ Detailed logging

### Mobile App Requirements
1. Live camera preview with overlays
2. Real-time text detection feedback
3. Progressive capture state management
4. Image quality analysis (blur, lighting)
5. Multi-frame capture and stitching
6. Confirmation screen with edit capability

---

## 11. Success Metrics

### KPIs to Track
| Metric | Target | Current |
|--------|--------|---------|
| One-session completion | ≥90% | TBD |
| Manual edit rate | ≤10% | TBD |
| Partial re-scan rate | ≤15% | TBD |
| Average scan time | ≤6s | TBD |
| Date detection accuracy | ≥85% | TBD |
| Ingredient extraction | ≥95% | TBD |

---

## 12. Implementation Priority

### Phase 1: Critical (Week 1)
1. ✅ Guided camera overlay with framing
2. ✅ Progressive capture indicators
3. ✅ Confirmation screen with edit
4. ✅ Basic blur/lighting detection

### Phase 2: Enhanced (Week 2)
1. Region awareness hints
2. Targeted re-scan for missing fields
3. Allergen highlighting
4. Confidence indicators

### Phase 3: Polish (Week 3)
1. Multi-script support
2. Advanced image quality analysis
3. Multi-frame capture optimization
4. Analytics integration

---

## Design Resources Needed

### UI Components
- [ ] Camera overlay component
- [ ] Progress chip component
- [ ] Confirmation card component
- [ ] Allergen badge component
- [ ] Confidence indicator component

### Animations
- [ ] Region detection highlight
- [ ] Progress chip transitions
- [ ] Hint arrow animations
- [ ] Loading states

### Icons & Assets
- [ ] Framing guide graphics
- [ ] Progress icons (checkmark, spinner)
- [ ] Alert icons (low light, blur)
- [ ] Edit/confirm buttons

---

## Conclusion

This design transforms the scan experience from:
- **Passive photo capture** → **Active guided session**
- **Blind automation** → **Human-in-loop verification**
- **Binary success/fail** → **Progressive feedback**

**Expected outcome**: 90%+ accuracy with user confidence
