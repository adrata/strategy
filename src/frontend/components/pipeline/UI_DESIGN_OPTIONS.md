# Churn Risk UI Design Options

## Recommended: Pills/Badges ✅

### Option 1: Compact Pill (for tables/lists)
```
┌────────┐
│ 🔴 75  │  ← Small, scannable, takes minimal space
└────────┘
```

**Best for:**
- Table rows
- Quick scan lists
- Compact views

**Pros:**
- Very compact
- Scannable at a glance
- Doesn't disrupt layout
- Works inline with other info

---

### Option 2: Detailed Pill (recommended for profile views)
```
┌─────────────────────────────┐
│ 🔴  75  |  High Risk        │  ← Medium size, more context
└─────────────────────────────┘
```

**Best for:**
- Profile overview
- Detail cards
- Important indicators

**Pros:**
- More context than compact
- Still compact enough
- Clear messaging
- Professional look

---

### Option 3: Full Card (for dedicated sections)
```
┌──────────────────────────────────────┐
│ 🔴 Churn Risk Indicator         75   │
│                           Risk Score  │
├──────────────────────────────────────┤
│ Risk Level: HIGH - Leaving This Month│
│ Predicted Departure: ~2 month(s)     │
│ Avg Time in Role: 24 months          │
│ Monitoring: Daily refresh            │
│                                       │
│ Average time in role: 24 months.     │
│ Current: 22 months.                  │
└──────────────────────────────────────┘
```

**Best for:**
- Dedicated intelligence tab
- Career analysis section
- Full details needed

**Pros:**
- Complete information
- Detailed reasoning
- Expandable

---

## Recommended Implementation

### Use Pills in Multiple Places:

#### 1. **Person Overview Tab** (Detailed Pill)
```typescript
<div className="flex items-center gap-2 mb-4">
  <span className="text-sm text-muted">Churn Risk:</span>
  <ChurnRiskBadge churnPrediction={churnPrediction} variant="detailed" />
</div>
```

**Shows:**
```
Churn Risk: 🔴 75 | High Risk
```

#### 2. **Table Rows** (Compact Pill)
```typescript
<td>
  <ChurnRiskBadge churnPrediction={person.churnPrediction} variant="compact" />
</td>
```

**Shows:**
```
🔴 75
```

#### 3. **Intelligence/Career Tab** (Full Card)
```typescript
<ChurnRiskBadge churnPrediction={churnPrediction} variant="full" />
```

**Shows:** Full card with all details

---

## Visual Examples

### Compact Pill (Tables)
```
Name              Title        Churn
─────────────────────────────────────
John Doe          VP Sales     🔴 75
Jane Smith        Director     🟠 52
Mike Chen         Manager      🟢 28
```

### Detailed Pill (Profile)
```
┌─────────────────────────────────────┐
│ Name: John Doe                      │
│ Title: VP Sales                     │
│ Churn Risk: 🔴 75 | High Risk       │  ← Detailed pill
│ Email: john@company.com ✅          │
└─────────────────────────────────────┘
```

### Full Card (Intelligence Tab)
```
┌───────────────────────────────────────┐
│ Intelligence Profile                  │
├───────────────────────────────────────┤
│                                       │
│ ┌─────────────────────────────────┐  │
│ │ 🔴 Churn Risk Indicator    75   │  │
│ │                      Risk Score  │  │
│ ├─────────────────────────────────┤  │
│ │ Risk: HIGH - Leaving This Month │  │
│ │ Departure: ~2 months            │  │
│ │ Monitoring: Daily               │  │
│ └─────────────────────────────────┘  │
│                                       │
└───────────────────────────────────────┘
```

---

## Placement Recommendations

### Primary Placement (Always Show)
1. **Person Overview Tab** - Detailed pill at top
2. **Table Rows** - Compact pill in dedicated column
3. **Quick View Cards** - Compact pill with name/title

### Secondary Placement (Contextual)
4. **Intelligence Tab** - Full card for deep dive
5. **Career Tab** - Full card with career analysis
6. **Buyer Group View** - Show for all members

### Tertiary Placement (Optional)
7. **AI Panel** - Mention in proactive alerts
8. **Lists/Search** - Filter by risk level
9. **Dashboard** - Aggregate by red/orange/green

---

## Color Psychology

### 🔴 Red
- **Meaning:** Urgent, high priority, action needed
- **User Action:** "Contact soon! They may leave"
- **System Action:** Daily monitoring

### 🟠 Orange
- **Meaning:** Warning, medium priority, keep watch
- **User Action:** "Stay engaged, they might leave soon"
- **System Action:** Weekly monitoring

### 🟢 Green
- **Meaning:** Stable, low priority, maintain
- **User Action:** "Relationship stable, normal cadence"
- **System Action:** Monthly monitoring

---

## Implementation Status

### ✅ Component Created
- `ChurnRiskBadge.tsx` with 3 variants
- Compact, Detailed, Full
- Reusable everywhere

### ✅ Integrated in PersonOverviewTab
- Using **detailed** variant
- Shows at top of overview
- Visible immediately

### ✅ Ready to Add Elsewhere
- Can add to table rows
- Can add to list views
- Can add to quick cards

---

## Recommended: Detailed Pill

**Why Detailed Pill is Best:**
- ✅ Not too big (like full card)
- ✅ Not too small (like compact)
- ✅ Shows score + context
- ✅ Professional appearance
- ✅ Works in most places
- ✅ Scannable but informative

**Format:**
```
🔴 75 | High Risk
```

**Perfect balance of:** Compact + Informative ✅

