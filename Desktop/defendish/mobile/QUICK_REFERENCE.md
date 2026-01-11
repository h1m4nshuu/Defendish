# AllerSafe Design System - Quick Reference

## 🎨 Import Cheat Sheet

```typescript
// Design Constants
import { Colors } from '../constants/Colors';
import { TextStyles, FontSize, FontWeight } from '../constants/Typography';
import { Spacing, BorderRadius, Shadows, IconSize } from '../constants/Spacing';

// Components
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { Divider } from '../components/Divider';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { EmptyState } from '../components/EmptyState';

// Utilities & Hooks
import { useTheme } from '../hooks/useTheme';
import { hapticFeedback } from '../utils/haptics';
```

---

## 🎯 Common Patterns

### Get Theme Colors
```typescript
const { colors, colorScheme, isDark } = useTheme();
```

### Button with Haptic
```typescript
<Button 
  title="Save" 
  onPress={() => {
    hapticFeedback.light();
    handleSave();
  }}
  variant="primary" 
  size="lg" 
/>
```

### Form Input
```typescript
<Input
  label="Name"
  value={name}
  onChangeText={setName}
  error={errors.name}
  required
  placeholder="Enter name"
/>
```

### Loading State
```typescript
{loading ? (
  <LoadingSkeleton variant="product-card" />
) : (
  <ProductCard product={product} />
)}
```

### Empty State
```typescript
{items.length === 0 && (
  <EmptyState
    icon="📦"
    title="No Items"
    description="Get started by adding your first item"
    actionLabel="Add Item"
    onAction={() => router.push('/add')}
  />
)}
```

### Success Feedback
```typescript
const [showSuccess, setShowSuccess] = useState(false);

const handleSave = async () => {
  await save();
  hapticFeedback.success();
  setShowSuccess(true);
};

<SuccessAnimation 
  visible={showSuccess}
  onComplete={() => setShowSuccess(false)}
/>
```

---

## 📏 Spacing Scale

```
xs   = 4px     sm  = 8px     md    = 12px
base = 16px    lg  = 20px    xl    = 24px
2xl  = 32px    3xl = 40px    4xl   = 48px
5xl  = 64px    6xl = 80px    7xl   = 96px
```

---

## 🎨 Color Categories

```typescript
// Status
colors.success   // Green
colors.warning   // Orange
colors.danger    // Red
colors.info      // Blue

// Text
colors.text              // Primary text
colors.textSecondary     // Secondary text
colors.textTertiary      // Tertiary text
colors.textDisabled      // Disabled text

// Background
colors.background        // Main background
colors.backgroundSecondary
colors.card              // Card background
```

---

## 📝 Typography Styles

```typescript
TextStyles.displayLarge    // 48px bold
TextStyles.h1              // 30px bold
TextStyles.h2              // 24px bold
TextStyles.h3              // 20px semibold
TextStyles.h4              // 18px semibold
TextStyles.body            // 16px regular
TextStyles.bodySmall       // 14px regular
TextStyles.caption         // 12px regular
TextStyles.button          // 16px semibold
TextStyles.label           // 14px medium
```

---

## 🔘 Button Variants

```typescript
variant="primary"     // Blue, filled
variant="secondary"   // Green, filled
variant="danger"      // Red, filled
variant="success"     // Green, filled
variant="outline"     // Bordered, transparent
variant="ghost"       // No border, transparent
```

---

## 🏷️ Badge Variants

```typescript
variant="success"     // Green
variant="warning"     // Orange
variant="danger"      // Red
variant="info"        // Blue
variant="neutral"     // Gray
```

---

## 💫 Haptic Feedback

```typescript
hapticFeedback.light()      // Light tap (buttons)
hapticFeedback.medium()     // Medium impact
hapticFeedback.heavy()      // Heavy impact (delete)
hapticFeedback.success()    // Success vibration
hapticFeedback.error()      // Error vibration
hapticFeedback.warning()    // Warning vibration
hapticFeedback.selection()  // Picker change
```

---

## 📦 Loading Skeletons

```typescript
<LoadingSkeleton variant="product-card" />
<LoadingSkeleton variant="dashboard-stats" />
<LoadingSkeleton variant="list-item" />
<LoadingSkeleton variant="circle" height={40} />
<LoadingSkeleton variant="rect" width="100%" height={20} />
```

---

## 🎭 Common Component Combos

### Card with Button
```typescript
<Card variant="elevated">
  <Text style={TextStyles.h3}>Title</Text>
  <Text style={[TextStyles.body, { marginVertical: Spacing.sm }]}>
    Description
  </Text>
  <Button title="Action" onPress={handlePress} variant="primary" />
</Card>
```

### Form Section
```typescript
<View style={{ padding: Spacing.base }}>
  <Text style={TextStyles.h3}>Section Title</Text>
  <Divider spacing={Spacing.md} />
  <Input label="Field 1" value={value1} onChangeText={setValue1} />
  <Input label="Field 2" value={value2} onChangeText={setValue2} />
  <Button title="Submit" onPress={handleSubmit} fullWidth />
</View>
```

### Stats Card
```typescript
<Card variant="elevated">
  <Text style={[TextStyles.displayLarge, { color: colors.primary }]}>
    42
  </Text>
  <Text style={[TextStyles.label, { color: colors.textSecondary }]}>
    Total Products
  </Text>
</Card>
```

### Product Badge Group
```typescript
<View style={{ flexDirection: 'row', gap: Spacing.sm }}>
  {product.hasAllergens && (
    <Badge label="Allergen" variant="danger" size="sm" />
  )}
  {product.isExpiring && (
    <Badge label="Expiring Soon" variant="warning" size="sm" />
  )}
</View>
```

---

## 🔧 Utility Patterns

### Safe Area Padding
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

<View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
```

### Responsive Width
```typescript
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - Spacing.base * 3) / 2; // 2 columns with gaps
```

### Conditional Rendering with Theme
```typescript
const { isDark } = useTheme();

<Icon 
  name={isDark ? "moon" : "sun"} 
  color={colors.text}
  size={IconSize.md} 
/>
```

---

## 🚨 Error Handling Pattern

```typescript
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  try {
    setLoading(true);
    setError('');
    await doSomething();
    hapticFeedback.success();
  } catch (err) {
    hapticFeedback.error();
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

<Input 
  error={error}
  // ... other props
/>
<Button 
  loading={loading}
  disabled={loading}
  // ... other props
/>
```

---

## ✅ Best Practices

1. **Always use design constants**
   - ❌ `padding: 16` → ✅ `padding: Spacing.base`

2. **Use theme hook for colors**
   - ❌ `color: '#4A90E2'` → ✅ `color: colors.primary`

3. **Add haptic feedback to interactions**
   - ✅ Call `hapticFeedback.light()` on button presses

4. **Show loading skeletons**
   - ✅ Use `<LoadingSkeleton />` instead of `<ActivityIndicator />`

5. **Provide empty states**
   - ✅ Use `<EmptyState />` when lists are empty

6. **Give success feedback**
   - ✅ Show `<SuccessAnimation />` after successful actions

7. **Use consistent spacing**
   - ✅ Gap between elements: `Spacing.sm` or `Spacing.md`

8. **Apply shadows consistently**
   - ✅ Cards: `...Shadows.md`

---

## 📱 Screen Template

```typescript
import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { hapticFeedback } from '../utils/haptics';
import { Spacing, BorderRadius } from '../constants/Spacing';
import { TextStyles } from '../constants/Typography';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export default function ScreenName() {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: Spacing.base }}>
        {/* Header */}
        <Text style={[TextStyles.h2, { color: colors.text }]}>
          Screen Title
        </Text>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton variant="product-card" />
        ) : (
          <Card variant="elevated">
            <Text style={[TextStyles.body, { color: colors.text }]}>
              Content
            </Text>
          </Card>
        )}

        {/* Action */}
        <Button
          title="Action"
          onPress={() => {
            hapticFeedback.light();
            // Handle action
          }}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}
```

---

## 🎯 Component Decision Tree

**Need a button?**
→ Use `<Button />`

**Need a container?**
→ Use `<Card />`

**Need a status indicator?**
→ Use `<Badge />`

**Need a text input?**
→ Use `<Input />`

**Need to show loading?**
→ Use `<LoadingSkeleton />`

**Need to show success?**
→ Use `<SuccessAnimation />`

**Need to show empty state?**
→ Use `<EmptyState />`

**Need to separate sections?**
→ Use `<Divider />`

---

## 📚 Full Documentation
See `UI_UX_DESIGN_SYSTEM.md` for complete documentation.
