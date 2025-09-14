# 🚨 EMERGENCY CREDENTIAL ROTATION CHECKLIST

**Incident**: AWS credentials exposed in GitHub commit `1689e48eb868ee836436598ffec4c87ca8b0e48c`
**File**: `.env.backup.20250822_163704`
**Date**: August 30, 2025

## IMMEDIATE PRIORITY (Complete in Next 2 Hours)

### ✅ AWS Credentials (CRITICAL - Account Limited)
- [ ] Create new AWS access key pair
- [ ] Update all `.env` files with new keys  
- [ ] Test new keys work with applications
- [ ] Deactivate old key: `AKIAZD7QCO47FUMHRP73`
- [ ] Delete old key after testing

### ✅ Git History Cleanup (CRITICAL - Public Exposure)
- [ ] Run `scripts/security/remove-exposed-credentials.sh`
- [ ] Force push to remove file from GitHub
- [ ] Notify team to re-clone repository

## HIGH PRIORITY (Complete Today)

### ✅ OpenAI API Key
- **Exposed Key**: `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`
- [ ] Generate new OpenAI API key
- [ ] Update all environment files
- [ ] Delete old key from OpenAI dashboard

### ✅ Twilio Credentials (Phone System)
- **Exposed**: Account SID, Auth Token, API Key, API Secret
- [ ] Rotate Twilio Auth Token
- [ ] Create new API Key/Secret pair
- [ ] Update all environment files
- [ ] Test phone calling functionality

### ✅ Database Connection
- **Exposed**: PostgreSQL connection string with credentials
- [ ] Change database password
- [ ] Update connection strings
- [ ] Test database connectivity

## MEDIUM PRIORITY (Complete This Week)

### ✅ Email Credentials
- **Exposed**: SMTP password for ross@adrata.com
- [ ] Change email password
- [ ] Update SMTP configuration
- [ ] Test email functionality

### ✅ Pusher Credentials (Real-time Features)
- **Exposed**: App ID, Key, Secret
- [ ] Regenerate Pusher app credentials
- [ ] Update environment variables
- [ ] Test real-time messaging

### ✅ Zoho CRM Integration
- **Exposed**: Client ID, Client Secret, Org ID
- [ ] Regenerate Zoho app credentials
- [ ] Update environment variables
- [ ] Test CRM integration

### ✅ Third-Party API Keys
- [ ] **Perplexity**: `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`
- [ ] **Coresignal**: `hzwQmb13cF21if4arzLpx0SRWyoOUyzP`
- [ ] **Zerobounce**: `92c3ef20f1c345d0923cb50e69d36476`
- [ ] **Prospeo**: `6a1b513fda9e48728fcc134e4365e8eb`
- [ ] **Lusha**: `95f6ebea-312b-44d5-b24e-5b73dc4ab1ac`
- [ ] **MyEmailVerifier**: `XG4WBFCJMSONM71D`
- [ ] **DropContact**: `HKxcV8LCjgeln7VQ3UoDb2hCU2zrIo`
- [ ] **ElevenLabs**: `sk_92efb7516d9283105c219510992f35c59cfabeedc4edb93d`

## POST-INCIDENT SECURITY IMPROVEMENTS

### ✅ Prevent Future Exposures
- [ ] Add `.env*` to `.gitignore` (already done)
- [ ] Set up pre-commit hooks to scan for secrets
- [ ] Implement secret scanning in CI/CD
- [ ] Use environment variable management service
- [ ] Regular security audits

### ✅ AWS Support Case Response
- [ ] Complete AWS security steps 1-3
- [ ] Respond to support case #175640070300167
- [ ] Request account access restoration
- [ ] Request billing adjustment if needed

## VERIFICATION CHECKLIST

After completing rotations:
- [ ] All applications still work
- [ ] No hardcoded credentials remain
- [ ] Git history is clean
- [ ] Team has been notified
- [ ] AWS account access restored
- [ ] Security monitoring in place

---

**Contact AWS Support**: https://console.aws.amazon.com/support/home#/case/?displayId=175640070300167&language=en
