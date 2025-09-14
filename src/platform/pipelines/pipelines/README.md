# 🚀 PIPELINE DEFINITIONS

**Pipeline orchestration and configuration files**

## 📁 **PIPELINE TIERS**

| Pipeline | Modules | Processing Time | Cost | Accuracy |
|----------|---------|----------------|------|----------|
| **🥉 Core** | 9 essential | 1.1s | $0.15 | 92% |
| **🥈 Advanced** | 17 total (9+8) | 5.8s | $0.45 | 95% |
| **🥇 Powerhouse** | 31 total (9+8+14) | 3.1s | $0.85 | 98% |

## 🎯 **PIPELINE ARCHITECTURE**

### **🥉 Core Pipeline (Bronze)**
- **Purpose**: Fast CFO/CRO discovery
- **Modules**: 9 essential modules
- **Use Case**: High-volume prospecting, quick validation
- **File**: `core/core-pipeline.js`

### **🥈 Advanced Pipeline (Silver)**  
- **Purpose**: Comprehensive intelligence with industry analysis
- **Modules**: All Core + 8 advanced modules (17 total)
- **Use Case**: Account research, strategic planning
- **File**: `advanced/advanced-pipeline.js`

### **🥇 Powerhouse Pipeline (Gold)**
- **Purpose**: Complete enterprise intelligence with buyer groups
- **Modules**: All Advanced + 14 powerhouse modules (31 total)  
- **Use Case**: Enterprise deals, complex sales cycles
- **File**: `powerhouse/powerhouse-pipeline.js`

## 🚀 **USAGE**

### **Run Locally**
```bash
# Core Pipeline
npm run core

# Advanced Pipeline  
npm run advanced

# Powerhouse Pipeline
npm run powerhouse
```

### **API Endpoints**
```bash
# Core Pipeline
POST /api/pipeline/core

# Advanced Pipeline
POST /api/pipeline/advanced

# Powerhouse Pipeline  
POST /api/pipeline/powerhouse
```

## 📊 **PERFORMANCE TARGETS**

| Companies | Core | Advanced | Powerhouse |
|-----------|------|----------|------------|
| **1** | 1.1s, $0.15 | 5.8s, $0.45 | 3.1s, $0.85 |
| **10** | 11s, $1.50 | 58s, $4.50 | 31s, $8.50 |
| **100** | 1.8min, $15 | 9.7min, $45 | 5.2min, $85 |
| **1000** | 18min, $150 | 97min, $450 | 52min, $850 |

---

**🎆 BOTTOM LINE**: Each pipeline tier builds on the previous one, providing increasing intelligence depth while maintaining exceptional quality standards.
