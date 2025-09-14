# 📁 PIPELINE INPUT FILES

**Essential CSV files for pipeline testing and execution**

## 🎯 **ACTIVE INPUT FILES**

| File | Companies | Purpose | Usage |
|------|-----------|---------|-------|
| **3-companies.csv** | 3 | Quick testing | Development & debugging |
| **10-companies.csv** | 10 | Standard testing | Feature validation |
| **all-1000-companies.csv** | 1,000 | Production dataset | Full pipeline testing |
| **all-1233-companies.csv** | 1,233 | Extended dataset | Comprehensive testing |

## 📊 **FILE FORMAT**

All CSV files follow this standard format:
```csv
Website,Top 1000,Account Owner
www.snowflake.com,1,Brian Stearns
www.stripe.com,1,Jamie Halpin
www.zendesk.com,1,Tracy Hansen
```

### **Required Columns**
- **Website**: Company domain (with or without www/http)
- **Top 1000**: Flag (1 = Yes, 0 = No) for premium processing
- **Account Owner**: Sales rep assigned to the account

## 🚀 **USAGE EXAMPLES**

### **Quick Development Test**
```bash
# Test with 3 companies (fastest)
npm run core -- --input 3-companies.csv
```

### **Standard Validation**
```bash
# Test with 10 companies (balanced)
npm run advanced -- --input 10-companies.csv
```

### **Production Testing**
```bash
# Full pipeline test with 1000 companies
npm run powerhouse -- --input all-1000-companies.csv
```

## 📁 **ARCHIVE FOLDER**

The `archive/` folder contains:
- Historical batch files
- Test-specific datasets
- Experimental input files

These are kept for reference but not used in active development.

## 🎯 **BEST PRACTICES**

### **File Selection Guide**
- **Development**: Use `3-companies.csv` for quick iterations
- **Testing**: Use `10-companies.csv` for feature validation  
- **Staging**: Use `all-1000-companies.csv` for pre-production
- **Research**: Use `all-1233-companies.csv` for comprehensive analysis

### **Performance Expectations**
| File | Core | Advanced | Powerhouse |
|------|------|----------|------------|
| 3 companies | 3s | 17s | 25s |
| 10 companies | 11s | 58s | 82s |
| 1000 companies | 18min | 97min | 137min |

---

**🎆 BOTTOM LINE**: These four essential files provide everything needed for development, testing, and production pipeline execution.
