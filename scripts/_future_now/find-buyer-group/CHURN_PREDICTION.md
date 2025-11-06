# Churn Prediction Feature

## Overview

The buyer group pipeline now calculates churn prediction for each buyer group member based on their career history and current tenure.

## How It Works

### Calculation Method

1. **Average Time in Role**: Calculates average duration across all completed roles (excluding current role)
2. **Current Time in Role**: Uses `duration_months` from current experience
3. **Predicted Departure**: `Average Time - Current Time = Months Until Likely Departure`
4. **Churn Risk Score**: 0-100 score based on:
   - How close current tenure is to average
   - Number of previous roles (job hoppers = higher risk)
   - Whether they've exceeded their average

### Data Stored

For each person, we now store:

- `averageTimeInRoleMonths`: Average months in previous roles
- `predictedDepartureMonths`: Months until predicted departure (0 if past average)
- `churnRiskScore`: 0-100 risk score (higher = more likely to leave soon)
- `churnRiskLevel`: 'low', 'medium', or 'high'
- `predictedDepartureDate`: ISO date string of predicted departure
- `yearsInRole`: Years in current role (also stored)

### Example

**Person A:**
- Previous roles: 18 months, 24 months, 30 months
- Average: 24 months
- Current role: 20 months
- **Predicted departure**: 4 months (24 - 20)
- **Churn risk**: Medium (approaching average)

**Person B:**
- Previous roles: 12 months, 15 months, 18 months
- Average: 15 months
- Current role: 18 months
- **Predicted departure**: 0 months (already past average)
- **Churn risk**: High (exceeded average)

## Database Fields

The following fields are saved to the `people` table:

- `yearsInRole` (Int)
- `averageTimeInRoleMonths` (Int) - stored in `customFields` or `aiIntelligence`
- `predictedDepartureMonths` (Int) - stored in `customFields` or `aiIntelligence`
- `churnRiskScore` (Float) - stored in `customFields` or `aiIntelligence`
- `churnRiskLevel` (String) - stored in `customFields` or `aiIntelligence`
- `predictedDepartureDate` (DateTime) - stored in `customFields` or `aiIntelligence`

## Usage

The churn prediction is automatically calculated for all buyer group members and stored in:
- `aiIntelligence.churnPrediction` (JSON object)
- Individual fields in the person record

## Fallback Logic

If no completed roles exist:
- Uses industry default: 24 months average
- Calculates risk based on current tenure vs default
- Provides reasoning in the prediction object

## Benefits

1. **Timing**: Know when to prioritize outreach (before predicted departure)
2. **Risk Assessment**: Identify high-risk contacts who may leave soon
3. **Strategic Planning**: Plan buyer group updates around predicted departures
4. **Data-Driven**: Based on actual career patterns, not assumptions

