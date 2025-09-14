# 🌐 Website Organization Guide

## 📍 **PRODUCTION WEBSITE** (`/src/app/`)

Your live website uses these files:

### Core Pages:
- **`/page.tsx`** → Homepage with research-backed content & bento boxes
- **`/platform/page.tsx`** → Enterprise platform features  
- **`/company/page.tsx`** → Company info and team details
- **`/research/page.tsx`** → Research and insights page
- **`/pricing/page.tsx`** → Split-screen custom quote form
- **`/find-buyer-group/page.tsx`** → Lead capture flow
- **`/privacy/page.tsx`** → Privacy policy page

### Features:
✅ Research-backed $1T+ problem sections  
✅ Buyer group intelligence focus  
✅ Modern product bento boxes  
✅ Trust elements & security badges  
✅ Fast Next.js navigation  

---

## 🧪 **EXPERIMENTAL WEBSITE** (`/src/app/(website)/`)

Alternative versions and experimental components for testing:

### 📁 **alternatives/homepage/**
- **`RevolutionaryLanding.tsx`** - Advanced homepage with dark mode & theme switching
- **`ModernLanding.tsx`** - Clean, minimalist design alternative

### 📁 **alternatives/components/**  
- **`AdvancedScheduler.tsx`** - Enhanced scheduling interface
- **`InstantSignup.tsx`** - Quick signup flow experiment
- **`MagicalOnboarding.tsx`** - Advanced onboarding experience  
- **`VideoConference.tsx`** - Video call integration

### 📁 **alternatives/pages/**
- **`about/page.tsx`** - Simple about page alternative
- **`contact/page.tsx`** - Basic contact form  
- **`pricing/page.tsx`** - Alternative pricing design

### Core Files:
- **`page.tsx`** - Entry point (currently uses RevolutionaryLanding)
- **`layout.tsx`** - Alternative layout with dark/light theme support

---

## 🔄 **How to Update & Test**

### Switch Homepage Design:
```tsx
// Edit /src/app/(website)/page.tsx
import ModernLanding from "./alternatives/homepage/ModernLanding";
// or
import RevolutionaryLanding from "./alternatives/homepage/RevolutionaryLanding";

export default function WebsitePage() {
  return <ModernLanding />; // or <RevolutionaryLanding />
}
```

### Test Experimental Version:
- Visit: `localhost:3000/(website)` 
- Compare with production: `localhost:3000/`

### Use Experimental Components:
```tsx
// Import into production pages for testing
import AdvancedScheduler from "./(website)/alternatives/components/AdvancedScheduler";
```

---

## 💡 **Recommendations**

### For Updates:
1. **Production changes** → Edit files in `/src/app/`
2. **Experiments** → Use `/src/app/(website)/alternatives/`
3. **A/B testing** → Switch between homepage versions
4. **New features** → Prototype in alternatives first

### File Structure Benefits:
✅ **Clear separation** between production & experimental  
✅ **Easy testing** without affecting live site  
✅ **Organized components** by purpose  
✅ **Maintainable** codebase with clear ownership  

---

## 🎯 **Quick Reference**

| **Need** | **Location** |
|----------|-------------|
| Update live homepage | `/src/app/page.tsx` |
| Test new homepage design | `/src/app/(website)/alternatives/homepage/` |
| Add experimental component | `/src/app/(website)/alternatives/components/` |
| Modify production pages | `/src/app/[page]/page.tsx` |
| Preview experiments | `localhost:3000/(website)` | 