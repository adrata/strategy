# Develop-First Workflow

## **New Paradigm: Everything Goes to Develop First**

### **✅ MANDATORY RULE**
**ALL development work must happen on `develop` branch first. NEVER commit directly to `main` or `staging`.**

## 🔄 **Your New Workflow**

### **1. Daily Development**
```bash
# Always start here
git checkout develop
git pull origin develop

# Make your changes
# ... code, code, code ...

# Commit to develop
git add .
git commit -m "Your changes"
git push origin develop
```

### **2. Testing (When Ready)**
```bash
# Deploy to staging for testing
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# Test on staging.adrata.com
```

### **3. Production (When Tested)**
```bash
# Deploy to production
git checkout main
git pull origin main
git merge staging
git push origin main

# Production deploys to adrata.com
```

## 🚨 **What Changed**

### **❌ OLD WAY (Don't Do This)**
```bash
git checkout main
git commit -m "changes"  # ❌ WRONG - Direct to main
```

### **✅ NEW WAY (Always Do This)**
```bash
git checkout develop
git commit -m "changes"  # ✅ CORRECT - Develop first
```

## 🎯 **Benefits**

1. **Safety**: No accidental production deployments
2. **Testing**: Always test on staging first
3. **Rollback**: Easy to revert if issues arise
4. **Professional**: Industry-standard workflow
5. **Consistency**: Same process every time

## 📝 **Quick Commands**

```bash
# Daily work (use this 90% of the time)
git checkout develop

# Deploy to staging
git checkout staging && git merge develop && git push origin staging

# Deploy to production
git checkout main && git merge staging && git push origin main
```

## 🎉 **You're Now Set Up!**

- ✅ Git Flow implemented
- ✅ Cursor rules updated
- ✅ All branches synced
- ✅ Develop-first paradigm active

**Remember: Develop → Staging → Main. Always!** 🚀
