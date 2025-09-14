# Experimental Website Components

This folder contains experimental and alternative versions of website components for testing and development.

## 🏠 Homepage Alternatives

### Current Production Homepage: `/src/app/page.tsx`
- **Research-backed content** with $1T+ problem statistics
- **Buyer group intelligence focus** with credible sources
- **Product bento boxes** with modern features
- **Trust elements** (footer, privacy policy, etc.)

### Experimental Versions:
- **`RevolutionaryLanding.tsx`** - Advanced homepage with dark mode, theme switching
- **`ModernLanding.tsx`** - Cleaner modern design alternative
- **`page.tsx`** - Currently uses RevolutionaryLanding

## 🧩 Experimental Components

### Interactive Components:
- **`AdvancedScheduler.tsx`** - Alternative scheduling interface
- **`InstantSignup.tsx`** - Quick signup flow experiment  
- **`MagicalOnboarding.tsx`** - Enhanced onboarding experience
- **`VideoConference.tsx`** - Video call integration component

### Layout & Theme:
- **`layout.tsx`** - Alternative layout with dark/light theme support

## 📄 Alternative Pages

### Basic Pages (Experimental):
- **`about/page.tsx`** - Simple about page
- **`contact/page.tsx`** - Basic contact form
- **`pricing/page.tsx`** - Alternative pricing page

### Production Pages (Main App):
- **Platform**: `/src/app/platform/page.tsx`
- **Company**: `/src/app/company/page.tsx` 
- **Research**: `/src/app/research/page.tsx`
- **Pricing**: `/src/app/pricing/page.tsx` (split-screen with custom quote)
- **Find Buyer Group**: `/src/app/find-buyer-group/page.tsx`
- **Privacy**: `/src/app/privacy/page.tsx`

## 🔄 How to Test Alternatives

1. **Switch Homepage**: Change `/src/app/(website)/page.tsx` to use different landing:
   ```tsx
   import ModernLanding from "./ModernLanding";
   export default function WebsitePage() {
     return <ModernLanding />;
   }
   ```

2. **Access via Route**: Visit `localhost:3000/(website)` to see experimental version

3. **Test Components**: Import experimental components into main pages for testing

## 📝 Notes

- **Main website** uses standard Next.js routing (`/src/app/`)
- **Experimental folder** uses Next.js route groups `(website)` for testing
- **Theme support** available in experimental versions only
- **Keep production pages** in main app folder for stability 