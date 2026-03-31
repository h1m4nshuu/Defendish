# Animated Splash Screen Setup

## Overview
Your app now includes a professional animated splash screen featuring the Defendish logo that displays when the app starts.

## Animation Features
✨ **Professional Animations:**
- **Fade-In Effect**: Logo gracefully fades in from transparent
- **Scale Animation**: Logo bounces in with a slight scale effect (0.3x → 1.1x → 1x)
- **Rotation**: Subtle 5-degree rotation for dynamism
- **Animated Dots**: Loading indicator with pulsing animation
- **Brand Text**: "Defendish" text fades in below the logo
- **Duration**: 3 seconds (customizable)

## How to Add the Logo Image

The AnimatedSplash component is ready, but you need to add the logo image to complete the setup:

### Step 1: Save the Logo Image
1. The logo image (the Defendish illustration) was provided to you
2. Save it as a PNG file to: `mobile/assets/defendish-logo.png`
3. Make sure the image dimensions are at least 400x400 pixels for best quality

### Step 2: Verification
Once saved, your app will automatically use the logo. To test:
```bash
cd mobile
npm start
# or
expo start
```

## Customization Options

You can customize the splash screen by editing [AnimatedSplash.tsx](./components/AnimatedSplash.tsx):

### Change Animation Duration
```typescript
<AnimatedSplash
  duration={2000}  // Change from 3000ms to any value (in milliseconds)
  onAnimationComplete={() => setShowSplash(false)}
/>
```

### Change Colors
Edit the `Colors.light.tint` in your Colors constants, or modify the styles directly:
```typescript
// In styles.brandName
color: '#2563eb', // Change the brand color
```

### Add Background Effects
You can enhance the background in the `background` style:
```typescript
backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
```

### Modify Animation Timing
Inside`AnimatedSplash.tsx`, adjust the interpolation values:
```typescript
[0, 0.3, 1],  // Timing keyframes
[0.3, 1.1, 1], // Scale values
```

## Component Location
- **Component**: `mobile/components/AnimatedSplash.tsx`
- **Usage**: `mobile/app/index.tsx` (integrated automatically)
- **Logo Path**: `mobile/assets/defendish-logo.png` (needs to be added)

## Animation Flow
1. ⏱️ Splash screen appears for 3 seconds
2. 📈 Logo scales and fades in
3. 🔤 "Defendish" text appears
4. ⚪ Animated dots pulse below
5. 🚀 After animation, app proceeds to onboarding or welcome screen

## Troubleshooting

**Image not showing?**
- Verify the image path: `mobile/assets/defendish-logo.png`
- Check image format is PNG
- Ensure image dimensions are at least 400x400px

**Animation too fast/slow?**
- Adjust the `duration` prop (in milliseconds)
- Default is 3000ms (3 seconds)

**Splash screen doesn't appear?**
- Clear cache: `expo start --clear`
- Rebuild the app: `expo run:android` or `expo run:ios`

## Next Steps
1. ✅ Save the logo image to `mobile/assets/defendish-logo.png`
2. ✅ Test the app with `expo start`
3. ✅ Optionally customize colors and timing (see Customization section)
