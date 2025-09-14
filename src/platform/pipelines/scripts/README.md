# 🔧 PIPELINE SCRIPTS

**Utility scripts for pipeline management and execution**

## 📁 **SCRIPT FILES**

| Script | Purpose | Usage |
|--------|---------|-------|
| **setup-api-keys.js** | API key validation and setup | `npm run setup` |
| **run-core-pipeline.js** | Core pipeline runner | `npm run core` |
| **run-advanced-pipeline.js** | Advanced pipeline runner | `npm run advanced` |
| **run-powerhouse-pipeline.js** | Powerhouse pipeline runner | `npm run powerhouse` |
| **version-manager.js** | Version management for outputs | Used internally |

## 🚀 **QUICK START**

### **1. Setup API Keys**
```bash
npm run setup
```
Validates and configures all required API keys for pipeline execution.

### **2. Run Pipelines**
```bash
# Fast CFO/CRO discovery
npm run core

# Comprehensive intelligence  
npm run advanced

# Complete enterprise analysis
npm run powerhouse
```

## 🔑 **API KEY REQUIREMENTS**

### **Critical (Required)**
- `PERPLEXITY_API_KEY` - AI research and web intelligence
- `OPENAI_API_KEY` - Buyer group analysis and advanced AI

### **High Priority (Recommended)**
- `CORESIGNAL_API_KEY` - Professional people data
- `LUSHA_API_KEY` - Contact discovery and validation

### **Medium Priority (Optional)**
- `ZEROBOUNCE_API_KEY` - Email validation
- `MYEMAILVERIFIER_API_KEY` - Additional email validation
- `DROPCONTACT_API_KEY` - Email enrichment
- `PROSPEO_API_KEY` - Email discovery

## 📊 **SCRIPT FEATURES**

### **Automatic API Key Setup**
- Copies keys from main project `.env` file
- Validates all required keys before execution
- Provides clear setup instructions for missing keys

### **Pipeline Execution**
- Pre-flight API key validation
- Real-time progress monitoring
- Error handling and recovery
- Performance metrics tracking

### **Version Management**
- Auto-incrementing version numbers
- Output file organization
- Version tracking and history

---

**🎆 BOTTOM LINE**: These scripts provide a complete toolkit for pipeline management, from API key setup to execution and monitoring.
