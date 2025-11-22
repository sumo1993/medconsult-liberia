# Dark Mode Implementation Guide

## ✅ What's Implemented

A complete dark mode system with:
- Theme context for global state management
- Toggle component with smooth transitions
- localStorage persistence
- System preference detection
- Accessible controls

---

## 🚀 Setup Instructions

### 1. Update Tailwind Config

Edit `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Your existing theme config
    },
  },
  plugins: [],
};
export default config;
```

### 2. Wrap App with ThemeProvider

Edit `app/layout.tsx`:

```typescript
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 3. Add Theme Toggle to Navigation

```typescript
import { ThemeToggle } from '@/components/ThemeToggle';

// In your header/navigation:
<div className="flex items-center space-x-4">
  <ThemeToggle />
  {/* Other nav items */}
</div>
```

---

## 🎨 Dark Mode Color Palette

### Background Colors
```
Light: bg-white, bg-gray-50, bg-gray-100
Dark:  dark:bg-gray-900, dark:bg-gray-800, dark:bg-gray-700
```

### Text Colors
```
Light: text-gray-900, text-gray-700, text-gray-600
Dark:  dark:text-gray-100, dark:text-gray-300, dark:text-gray-400
```

### Border Colors
```
Light: border-gray-300, border-gray-200
Dark:  dark:border-gray-700, dark:border-gray-600
```

### Component Colors
```
Emerald (Primary):
  Light: bg-emerald-600, hover:bg-emerald-700
  Dark:  dark:bg-emerald-500, dark:hover:bg-emerald-600

Blue (Info):
  Light: bg-blue-600, text-blue-900
  Dark:  dark:bg-blue-500, dark:text-blue-100
```

---

## 📝 Usage Examples

### Basic Component

```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <h1 className="text-2xl font-bold">Hello World</h1>
  <p className="text-gray-600 dark:text-gray-400">Description text</p>
</div>
```

### Button

```typescript
<button className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors">
  Click Me
</button>
```

### Card

```typescript
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Card Title</h2>
  <p className="text-gray-600 dark:text-gray-400">Card content</p>
</div>
```

### Input

```typescript
<input
  type="text"
  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
  placeholder="Enter text..."
/>
```

---

## 🔧 Customization

### Change Default Theme

Edit `ThemeContext.tsx`:

```typescript
const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark
```

### Disable System Preference

```typescript
// Remove this block in ThemeContext.tsx:
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const systemTheme = prefersDark ? 'dark' : 'light';
```

### Add Theme Transition

Add to your global CSS:

```css
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

---

## 🎯 Converting Existing Components

### Step-by-Step Process

1. **Identify background colors**
   ```
   bg-white → bg-white dark:bg-gray-800
   bg-gray-50 → bg-gray-50 dark:bg-gray-900
   ```

2. **Update text colors**
   ```
   text-gray-900 → text-gray-900 dark:text-gray-100
   text-gray-600 → text-gray-600 dark:text-gray-400
   ```

3. **Fix borders**
   ```
   border-gray-300 → border-gray-300 dark:border-gray-700
   ```

4. **Adjust shadows**
   ```
   shadow-lg → shadow-lg dark:shadow-gray-900/50
   ```

5. **Update hover states**
   ```
   hover:bg-gray-100 → hover:bg-gray-100 dark:hover:bg-gray-700
   ```

---

## 🧪 Testing

### Manual Testing

1. Toggle theme and verify all pages
2. Check localStorage persistence
3. Test system preference detection
4. Verify accessibility (keyboard navigation)
5. Test on different browsers

### Automated Testing

```typescript
// Example test
describe('Dark Mode', () => {
  it('should toggle theme', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.theme).toBe('dark');
  });
});
```

---

## 📊 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ⚠️ IE11 (not supported)

---

## 🐛 Troubleshooting

**Flash of unstyled content?**
- Ensure ThemeProvider is at root level
- Check mounted state in ThemeContext

**Theme not persisting?**
- Verify localStorage is enabled
- Check browser privacy settings

**Colors not changing?**
- Ensure `darkMode: 'class'` in tailwind.config
- Verify `dark:` prefix on all color classes

**Transition too slow/fast?**
- Adjust transition duration in CSS
- Use `transition-none` for instant changes

---

## 🎨 Design Tips

1. **Maintain contrast ratios** (WCAG AA: 4.5:1)
2. **Test with real content**
3. **Use semantic colors** (success, error, warning)
4. **Keep shadows subtle** in dark mode
5. **Avoid pure black** (#000) - use dark gray instead

---

## 📈 Future Enhancements

- [ ] Auto theme based on time of day
- [ ] Multiple theme options (blue, purple, etc.)
- [ ] Per-page theme preferences
- [ ] Theme preview before applying
- [ ] Smooth color transitions
- [ ] High contrast mode

---

**Status:** ✅ Ready to Use  
**Accessibility:** ✅ WCAG Compliant  
**Performance:** ✅ Optimized  
**Browser Support:** ✅ Modern Browsers
