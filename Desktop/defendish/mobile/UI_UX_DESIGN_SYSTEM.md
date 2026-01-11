# AllerSafe UI/UX Design System Guide

## Overview

This guide explains how to use the AllerSafe design system components, constants, and patterns throughout the mobile application.

## Design System Constants

### Colors (`mobile/constants/Colors.ts`)

Complete color palette with light and dark mode support:

```typescript
import { Colors } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';

// In your component:
const { colors, colorScheme, isDark } = useTheme();

// Use colors:
<View style={{ backgroundColor: colors.primary }}>
  <Text style={{ color: colors.text }}>Hello</Text>
</View>
```

**Available Color Categories:**
- Primary/Secondary colors
- Status colors (success, warning, danger, info)
- Background colors
- Text colors (primary, secondary, tertiary, disabled)
- Border colors
- Semantic colors with backgrounds and borders

### Typography (`mobile/constants/Typography.ts`)

Consistent font sizes, weights, and text styles:

```typescript
import { TextStyles, FontSize, FontWeight } from '../constants/Typography';

// Use pre-configured text styles:
<Text style={TextStyles.h1}>Heading 1</Text>
<Text style={TextStyles.body}>Body text</Text>
<Text style={TextStyles.caption}>Small caption</Text>

// Or use individual values:
<Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.bold }}>
  Custom styled text
</Text>
```

**Available Text Styles:**
- Display: `displayLarge`, `displayMedium`, `displaySmall`
- Headings: `h1`, `h2`, `h3`, `h4`
- Body: `bodyLarge`, `body`, `bodySmall`
- Labels: `label`, `labelSmall`
- Buttons: `button`, `buttonLarge`, `buttonSmall`
- Captions: `caption`, `captionBold`

### Spacing (`mobile/constants/Spacing.ts`)

Consistent spacing, border radius, shadows, and dimensions:

```typescript
import { Spacing, BorderRadius, Shadows, IconSize } from '../constants/Spacing';

<View style={{
  padding: Spacing.base,          // 16px
  marginVertical: Spacing.lg,     // 20px
  borderRadius: BorderRadius.lg,  // 12px
  ...Shadows.md,                  // Medium shadow
}}>
```

**Available Values:**
- Spacing: `xs`, `sm`, `md`, `base`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`, `7xl`
- Border Radius: `none`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `full`
- Shadows: `none`, `sm`, `md`, `lg`, `xl`, `2xl`
- Icon Sizes: `xs`, `sm`, `base`, `md`, `lg`, `xl`, `2xl`, `3xl`

## Reusable Components

### Button (`mobile/components/Button.tsx`)

Versatile button component with animations and variants:

```typescript
import { Button } from '../components/Button';

<Button
  title="Save Product"
  onPress={handleSave}
  variant="primary"     // primary, secondary, danger, success, outline, ghost
  size="lg"             // sm, md, lg, xl
  loading={isSaving}
  disabled={!isValid}
  fullWidth
  icon={<Icon name="check" />}
  iconPosition="left"   // left or right
/>
```

**Features:**
- Scale animation on press (0.95)
- Loading state with spinner
- Multiple variants and sizes
- Icon support
- Haptic feedback ready
- Light/dark mode support

### Card (`mobile/components/Card.tsx`)

Container component with elevation:

```typescript
import { Card } from '../components/Card';

<Card 
  variant="elevated"    // elevated, outlined, filled
  onPress={() => {}}    // Optional, makes card tappable
  animateOnPress        // Scale animation when pressed
>
  <Text>Card content</Text>
</Card>
```

### Badge (`mobile/components/Badge.tsx`)

Status and label badges:

```typescript
import { Badge } from '../components/Badge';

<Badge 
  label="Allergen Warning"
  variant="danger"      // success, warning, danger, info, neutral
  size="md"             // sm, md, lg
  icon={<Icon name="alert" />}
/>
```

### Input (`mobile/components/Input.tsx`)

Enhanced text input with states:

```typescript
import { Input } from '../components/Input';

<Input
  label="Product Name"
  placeholder="Enter name..."
  value={name}
  onChangeText={setName}
  error={errors.name}
  success="Looks good!"
  helperText="Required field"
  required
  size="md"             // sm, md, lg
  leftIcon={<Icon name="box" />}
  rightIcon={<Icon name="check" />}
/>
```

**Features:**
- Focus animation (border color change)
- Error, success, disabled states
- Icon support (left/right)
- Helper text and labels
- Required field indicator

### LoadingSkeleton (`mobile/components/LoadingSkeleton.tsx`)

Skeleton screens for loading states:

```typescript
import { LoadingSkeleton } from '../components/LoadingSkeleton';

// Pre-configured variants:
<LoadingSkeleton variant="product-card" />
<LoadingSkeleton variant="dashboard-stats" />
<LoadingSkeleton variant="list-item" />

// Custom skeleton:
<LoadingSkeleton
  variant="rect"
  width="100%"
  height={40}
  borderRadius={8}
/>
```

**Available Variants:**
- `product-card`: Full product card layout
- `product-detail`: Detailed product view
- `dashboard-stats`: Stats cards
- `list-item`: List item with image
- `circle`: Circular skeleton
- `rect`: Custom rectangle

### SuccessAnimation (`mobile/components/SuccessAnimation.tsx`)

Animated success checkmark:

```typescript
import { SuccessAnimation } from '../components/SuccessAnimation';

const [showSuccess, setShowSuccess] = useState(false);

<SuccessAnimation
  visible={showSuccess}
  onComplete={() => setShowSuccess(false)}
  duration={2000}
  size={80}
/>

// Trigger after successful action:
setShowSuccess(true);
```

### EmptyState (`mobile/components/EmptyState.tsx`)

Empty state with call-to-action:

```typescript
import { EmptyState } from '../components/EmptyState';

<EmptyState
  icon="📦"
  title="No Products Yet"
  description="Start by scanning your first product"
  actionLabel="Scan Now"
  onAction={() => router.push('/scan')}
/>
```

### Divider (`mobile/components/Divider.tsx`)

Section divider:

```typescript
import { Divider } from '../components/Divider';

<Divider spacing={16} thickness={1} />
```

## Utilities

### Haptic Feedback (`mobile/utils/haptics.ts`)

Tactile feedback for user interactions:

```typescript
import { hapticFeedback } from '../utils/haptics';

// Light tap:
hapticFeedback.light();

// Success notification:
hapticFeedback.success();

// Error notification:
hapticFeedback.error();

// Warning:
hapticFeedback.warning();

// Selection changed:
hapticFeedback.selection();
```

**Usage Examples:**
```typescript
const handleSave = async () => {
  try {
    await saveProduct();
    hapticFeedback.success();  // Success vibration
    setShowSuccess(true);       // Show success animation
  } catch (error) {
    hapticFeedback.error();     // Error vibration
    Alert.alert('Error', error.message);
  }
};

const handleButtonPress = () => {
  hapticFeedback.light();       // Light tap feedback
  // Handle action...
};
```

### Theme Hook (`mobile/hooks/useTheme.ts`)

Access theme colors and detect dark mode:

```typescript
import { useTheme } from '../hooks/useTheme';

const { colors, colorScheme, isDark } = useTheme();

<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>
    {isDark ? 'Dark mode' : 'Light mode'}
  </Text>
</View>
```

## Onboarding Flow

New user onboarding with 3 screens (`mobile/app/onboarding.tsx`):

**Features:**
- Swipeable carousel
- Animated dot indicators
- Skip button
- Next/Get Started buttons
- AsyncStorage integration
- Auto-navigate on completion

**Screens:**
1. Scan Products Easily (barcode scanning intro)
2. AI Detects Allergens (ingredient analysis)
3. Get Personalized Warnings (allergen alerts)

## Animation Specifications

### Button Press Animation
- Duration: 100ms
- Scale: 0.95
- Native driver: true

### Card Press Animation
- Duration: 200ms
- Scale: 0.98
- Spring animation with bounce

### Skeleton Pulse
- Duration: 1000ms (fade in) + 1000ms (fade out)
- Opacity: 0.3 → 0.7 → 0.3
- Infinite loop

### Success Checkmark
- Circle scale: 0 → 1 (spring animation)
- Checkmark scale: 0 → 1 (spring with bounce)
- Hold: 1500ms
- Fade out: 300ms

### Input Focus
- Border color change: 200ms
- Spring animation with bounce

### Onboarding Pagination
- Dot width: 8px → 24px (active)
- Opacity: 0.3 → 1 (active)
- Interpolated based on scroll position

## Best Practices

### 1. Always Use Design System Constants

❌ **Don't:**
```typescript
<View style={{ padding: 16, borderRadius: 12, backgroundColor: '#4A90E2' }}>
```

✅ **Do:**
```typescript
<View style={{ 
  padding: Spacing.base, 
  borderRadius: BorderRadius.lg, 
  backgroundColor: colors.primary 
}}>
```

### 2. Use Pre-built Components

❌ **Don't:**
```typescript
<TouchableOpacity style={customButtonStyle} onPress={handlePress}>
  <Text style={customTextStyle}>Submit</Text>
</TouchableOpacity>
```

✅ **Do:**
```typescript
<Button title="Submit" onPress={handlePress} variant="primary" size="lg" />
```

### 3. Add Haptic Feedback to Interactive Elements

```typescript
<Button 
  title="Delete" 
  onPress={() => {
    hapticFeedback.heavy();  // Heavy feedback for destructive action
    handleDelete();
  }} 
  variant="danger" 
/>
```

### 4. Show Loading Skeletons Instead of Spinners

❌ **Don't:**
```typescript
{loading && <ActivityIndicator />}
{!loading && <ProductList />}
```

✅ **Do:**
```typescript
{loading ? (
  <>
    <LoadingSkeleton variant="product-card" />
    <LoadingSkeleton variant="product-card" />
    <LoadingSkeleton variant="product-card" />
  </>
) : (
  <ProductList />
)}
```

### 5. Use EmptyState for Empty Views

```typescript
{products.length === 0 ? (
  <EmptyState
    icon="📦"
    title="No Products"
    description="Add your first product to get started"
    actionLabel="Add Product"
    onAction={() => router.push('/product/add')}
  />
) : (
  <ProductList products={products} />
)}
```

### 6. Show Success Feedback

```typescript
const handleSave = async () => {
  try {
    await saveProduct();
    hapticFeedback.success();
    setShowSuccess(true);
    setTimeout(() => router.back(), 2000);
  } catch (error) {
    hapticFeedback.error();
    setError(error.message);
  }
};

return (
  <>
    {/* Your form */}
    <SuccessAnimation 
      visible={showSuccess} 
      onComplete={() => setShowSuccess(false)} 
    />
  </>
);
```

## Migration Guide

To update existing screens to use the new design system:

### Step 1: Import design system constants
```typescript
import { Colors } from '../constants/Colors';
import { TextStyles, FontSize, FontWeight } from '../constants/Typography';
import { Spacing, BorderRadius, Shadows } from '../constants/Spacing';
import { useTheme } from '../hooks/useTheme';
```

### Step 2: Use theme hook
```typescript
const { colors, colorScheme } = useTheme();
```

### Step 3: Replace hardcoded values
```typescript
// Before:
<View style={{ padding: 16, backgroundColor: '#FFF' }}>

// After:
<View style={{ padding: Spacing.base, backgroundColor: colors.card }}>
```

### Step 4: Replace custom components with design system components
```typescript
// Before:
<TouchableOpacity style={customButton} onPress={handlePress}>
  <Text>Save</Text>
</TouchableOpacity>

// After:
<Button title="Save" onPress={handlePress} variant="primary" />
```

### Step 5: Add animations and feedback
```typescript
import { hapticFeedback } from '../utils/haptics';

const handlePress = () => {
  hapticFeedback.light();
  // ... rest of handler
};
```

## Performance Considerations

- Use `React.memo` for expensive components
- Use `useMemo` and `useCallback` for expensive computations
- Use native driver for animations where possible
- Lazy load images with fade-in animation
- Virtualize long lists with FlatList
- Debounce search inputs

## Accessibility

All components include:
- `accessibilityLabel` on interactive elements
- `accessibilityHint` for context
- Color contrast meeting WCAG AA (4.5:1)
- Support for system text scaling
- Screen reader optimization

Example:
```typescript
<Button
  title="Delete Product"
  onPress={handleDelete}
  variant="danger"
  accessibilityLabel="Delete this product"
  accessibilityHint="This action cannot be undone"
/>
```

## Testing the Design System

Test all components in both light and dark modes:

```typescript
// Force dark mode for testing:
const { colors } = useTheme();
// Or pass colorScheme prop to components:
<Button title="Test" variant="primary" colorScheme="dark" />
```

## Next Steps

1. Update existing screens to use new components
2. Add custom app icon (512x512px)
3. Customize splash screen
4. Configure dark mode colors
5. Add Lottie animations (optional)
6. Implement gesture handlers for swipe-to-delete
7. Add toast notifications
8. Create modal component
9. Add bottom sheet for modals

## Resources

- Design tokens: `mobile/constants/`
- Components: `mobile/components/`
- Utilities: `mobile/utils/`
- Hooks: `mobile/hooks/`
- Example: `mobile/app/onboarding.tsx`
