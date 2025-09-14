#!/usr/bin/env node

/**
 * ✅ VALIDATION ENGINE MODULE
 * 
 * Comprehensive validation system for executive data:
 * 1. Multi-source cross-validation
 * 2. Data freshness verification
 * 3. Executive change detection
 * 4. Confidence scoring and risk assessment
 * 5. Quality assurance and accuracy metrics
 */

const fetch = require('node-fetch');

class ValidationEngine {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            VALIDATION_THRESHOLD: config.VALIDATION_THRESHOLD || 80,
            FRESHNESS_THRESHOLD_DAYS: config.FRESHNESS_THRESHOLD_DAYS || 90,
            ...config
        };

        this.validationCache = new Map();
        this.riskFactors = this.initializeRiskFactors();
    }

    /**
     * ✅ MAIN VALIDATION PROCESS
     */
    async validateExecutiveData(contactEnrichment, executiveDetection, companyResolution) {
        console.log(`\n✅ VALIDATING DATA: ${companyResolution.companyName}`);
        console.log('=' .repeat(60));

        const validation = {
            companyName: companyResolution.companyName,
            validationTimestamp: new Date().toISOString(),
            overallScore: 0,
            riskLevel: 'UNKNOWN',
            validationResults: {
                ceo: null,
                cfo: null,
                company: null
            },
            qualityMetrics: {
                dataFreshness: 0,
                sourceReliability: 0,
                crossValidation: 0,
                contactAccuracy: 0
            },
            recommendations: [],
            warnings: [],
            timestamp: new Date().toISOString()
        };

        try {
            // STEP 1: Company-level validation
            console.log('🏢 STEP 1: Company Validation');
            validation.validationResults.company = await this.validateCompany(companyResolution);
            
            // STEP 2: CEO validation
            if (contactEnrichment.enrichedExecutives.ceo) {
                console.log('\n👨‍💼 STEP 2: CEO Validation');
                validation.validationResults.ceo = await this.validateExecutive(
                    contactEnrichment.enrichedExecutives.ceo,
                    'CEO',
                    companyResolution
                );
            }

            // STEP 3: CFO validation
            if (contactEnrichment.enrichedExecutives.cfo) {
                console.log('\n💰 STEP 3: CFO Validation');
                validation.validationResults.cfo = await this.validateExecutive(
                    contactEnrichment.enrichedExecutives.cfo,
                    'CFO',
                    companyResolution
                );
            }

            // STEP 4: Quality metrics calculation
            console.log('\n📊 STEP 4: Quality Metrics');
            validation.qualityMetrics = this.calculateQualityMetrics(
                validation.validationResults,
                executiveDetection,
                contactEnrichment
            );

            // STEP 5: Overall scoring and risk assessment
            console.log('\n🎯 STEP 5: Risk Assessment');
            const riskAssessment = this.assessRisk(validation);
            validation.overallScore = riskAssessment.score;
            validation.riskLevel = riskAssessment.level;
            validation.recommendations = riskAssessment.recommendations;
            validation.warnings = riskAssessment.warnings;

            console.log(`✅ VALIDATION COMPLETE`);
            console.log(`   Overall Score: ${validation.overallScore}%`);
            console.log(`   Risk Level: ${validation.riskLevel}`);
            console.log(`   Recommendations: ${validation.recommendations.length}`);

            return validation;

        } catch (error) {
            console.error(`❌ Validation failed: ${error.message}`);
            validation.warnings.push(`Validation error: ${error.message}`);
            validation.riskLevel = 'HIGH';
            return validation;
        }
    }

    /**
     * 🏢 COMPANY VALIDATION
     */
    async validateCompany(companyResolution) {
        const validation = {
            companyExists: false,
            statusAccurate: false,
            acquisitionVerified: false,
            domainValid: false,
            confidence: 0,
            notes: [],
            lastVerified: new Date().toISOString()
        };

        try {
            // Validate company existence and current status
            const prompt = `Verify the current status of ${companyResolution.companyName}:

Company: ${companyResolution.companyName}
Website: ${companyResolution.finalUrl}
Reported Status: ${companyResolution.companyStatus}
${companyResolution.isAcquired ? `Acquired by: ${companyResolution.parentCompany?.name}` : ''}

Please verify:
1. Does this company currently exist and operate?
2. Is the reported status accurate as of 2025?
3. If acquired, is the acquisition information correct?
4. Is the website/domain still valid and active?

Provide ONLY a JSON response:
{
    "companyExists": true/false,
    "currentStatus": "active/acquired/merged/defunct",
    "statusAccurate": true/false,
    "acquisitionVerified": true/false,
    "domainValid": true/false,
    "confidence": 0.90,
    "notes": ["Verification note 1", "Verification note 2"],
    "lastUpdate": "2025-01-17",
    "sources": ["company_website", "news", "sec_filings"]
}`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 800
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        
                        validation.companyExists = result.companyExists;
                        validation.statusAccurate = result.statusAccurate;
                        validation.acquisitionVerified = result.acquisitionVerified;
                        validation.domainValid = result.domainValid;
                        validation.confidence = Math.round(result.confidence * 100);
                        validation.notes = result.notes || [];
                        
                        console.log(`   ✅ Company verified: ${validation.confidence}% confidence`);
                        return validation;
                    }
                } catch (parseError) {
                    validation.notes.push('Company validation parsing failed');
                }
            }
        } catch (error) {
            validation.notes.push(`Company validation error: ${error.message}`);
        }

        validation.confidence = 30; // Low confidence if validation failed
        return validation;
    }

    /**
     * 👔 EXECUTIVE VALIDATION
     */
    async validateExecutive(executive, role, companyResolution) {
        const validation = {
            executiveName: executive.name,
            role: role,
            currentlyEmployed: false,
            titleAccurate: false,
            contactsValid: false,
            dataFresh: false,
            confidence: 0,
            riskFactors: [],
            validationNotes: [],
            contactValidation: {
                emails: [],
                phones: [],
                profiles: []
            },
            lastVerified: new Date().toISOString()
        };

        try {
            // STEP 1: Employment and title verification
            console.log(`   🔍 Verifying ${role}: ${executive.name}...`);
            const employmentCheck = await this.verifyEmploymentStatus(
                executive.name,
                role,
                companyResolution.companyName
            );
            
            validation.currentlyEmployed = employmentCheck.isCurrentlyEmployed;
            validation.titleAccurate = employmentCheck.titleAccurate;
            validation.dataFresh = employmentCheck.dataFresh;
            validation.validationNotes.push(...employmentCheck.notes);

            // STEP 2: Contact validation
            console.log(`   📧 Validating contacts...`);
            if (executive.contacts) {
                validation.contactValidation = await this.validateContacts(
                    executive.contacts,
                    executive.name,
                    companyResolution
                );
                validation.contactsValid = this.assessContactValidity(validation.contactValidation);
            }

            // STEP 3: Risk factor assessment
            validation.riskFactors = this.identifyRiskFactors(executive, employmentCheck);

            // STEP 4: Confidence calculation
            validation.confidence = this.calculateExecutiveConfidence(validation);

            console.log(`   ✅ ${role} validated: ${validation.confidence}% confidence`);
            if (validation.riskFactors.length > 0) {
                console.log(`   ⚠️  Risk factors: ${validation.riskFactors.length}`);
            }

            return validation;

        } catch (error) {
            validation.validationNotes.push(`Executive validation error: ${error.message}`);
            validation.confidence = 20;
            return validation;
        }
    }

    /**
     * 👔 VERIFY EMPLOYMENT STATUS
     */
    async verifyEmploymentStatus(executiveName, role, companyName) {
        try {
            const prompt = `Verify the current employment status of ${executiveName} as ${role} at ${companyName}:

Please check:
1. Is this person currently employed at this company as of 2025?
2. Is their title accurate and current?
3. Have there been any recent leadership changes?
4. When was this information last updated?

Provide ONLY a JSON response:
{
    "isCurrentlyEmployed": true/false,
    "titleAccurate": true/false,
    "currentTitle": "Current title or null",
    "employmentEndDate": "YYYY-MM-DD or null if still employed",
    "dataFresh": true/false,
    "lastUpdate": "2025-01-XX",
    "confidence": 0.85,
    "notes": ["Verification details"],
    "sources": ["company_website", "press_releases", "news"]
}

Do not use LinkedIn data for verification.`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-sonar-large-128k-online',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 600
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Employment verification parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Employment verification error: ${error.message}`);
        }

        return {
            isCurrentlyEmployed: false,
            titleAccurate: false,
            dataFresh: false,
            confidence: 0.3,
            notes: ['Employment verification failed']
        };
    }

    /**
     * 📧 VALIDATE CONTACTS
     */
    async validateContacts(contacts, executiveName, companyResolution) {
        const validation = {
            emails: [],
            phones: [],
            profiles: []
        };

        // Validate emails
        if (contacts.emails) {
            for (const email of contacts.emails) {
                const emailValidation = {
                    email: email.email,
                    isValid: email.isValid || false,
                    confidence: email.confidence || 0,
                    deliverable: false,
                    riskLevel: 'UNKNOWN'
                };

                // Additional validation could be added here
                // For now, use the existing validation from ContactEnricher
                emailValidation.deliverable = email.isValid && email.confidence > 70;
                emailValidation.riskLevel = email.confidence > 80 ? 'LOW' : 
                                          email.confidence > 60 ? 'MEDIUM' : 'HIGH';

                validation.emails.push(emailValidation);
            }
        }

        // Validate phones
        if (contacts.phones) {
            validation.phones = contacts.phones.map(phone => ({
                number: phone.number,
                type: phone.type,
                confidence: phone.confidence || 50,
                verified: phone.confidence > 70
            }));
        }

        // Validate profiles
        if (contacts.profiles) {
            validation.profiles = contacts.profiles.map(profile => ({
                url: profile.url,
                platform: profile.platform,
                confidence: profile.confidence || 50,
                accessible: true // Would need to check if URL is accessible
            }));
        }

        return validation;
    }

    /**
     * 📊 CALCULATE QUALITY METRICS
     */
    calculateQualityMetrics(validationResults, executiveDetection, contactEnrichment) {
        const metrics = {
            dataFreshness: 0,
            sourceReliability: 0,
            crossValidation: 0,
            contactAccuracy: 0
        };

        // Data freshness (based on source dates and validation)
        const freshnessScores = [];
        if (validationResults.ceo?.dataFresh) freshnessScores.push(90);
        if (validationResults.cfo?.dataFresh) freshnessScores.push(90);
        if (validationResults.company?.confidence > 80) freshnessScores.push(85);
        
        metrics.dataFreshness = freshnessScores.length > 0 
            ? Math.round(freshnessScores.reduce((a, b) => a + b, 0) / freshnessScores.length)
            : 50;

        // Source reliability (based on detection sources)
        const sourceWeights = {
            'SEC_EDGAR': 100,
            'Website': 85,
            'AI_Research': 80,
            'CoreSignal': 75,
            'AI_Basic': 60
        };

        const sources = executiveDetection.sources || [];
        const sourceScores = sources.map(source => sourceWeights[source] || 50);
        metrics.sourceReliability = sourceScores.length > 0
            ? Math.round(sourceScores.reduce((a, b) => a + b, 0) / sourceScores.length)
            : 50;

        // Cross-validation (multiple sources agreeing)
        const crossValidationScore = sources.length >= 2 ? 85 : sources.length === 1 ? 60 : 30;
        metrics.crossValidation = crossValidationScore;

        // Contact accuracy (based on email validation rates)
        const emailStats = contactEnrichment.enrichmentStats;
        if (emailStats.emailsGenerated > 0) {
            const validationRate = emailStats.emailsValidated / emailStats.emailsGenerated;
            metrics.contactAccuracy = Math.round(validationRate * 100);
        } else {
            metrics.contactAccuracy = 0;
        }

        return metrics;
    }

    /**
     * 🎯 ASSESS RISK
     */
    assessRisk(validation) {
        const risks = [];
        const recommendations = [];
        let totalScore = 0;
        let scoreComponents = 0;

        // Company-level risks
        if (validation.validationResults.company) {
            const companyValidation = validation.validationResults.company;
            if (!companyValidation.companyExists) {
                risks.push('Company existence not verified');
                recommendations.push('Verify company is still in business');
            }
            if (!companyValidation.statusAccurate) {
                risks.push('Company status information may be outdated');
                recommendations.push('Update company status information');
            }
            totalScore += companyValidation.confidence;
            scoreComponents++;
        }

        // Executive-level risks
        ['ceo', 'cfo'].forEach(role => {
            const execValidation = validation.validationResults[role];
            if (execValidation) {
                if (!execValidation.currentlyEmployed) {
                    risks.push(`${role.toUpperCase()} employment status uncertain`);
                    recommendations.push(`Verify ${role.toUpperCase()} current employment`);
                }
                if (!execValidation.titleAccurate) {
                    risks.push(`${role.toUpperCase()} title may be inaccurate`);
                    recommendations.push(`Update ${role.toUpperCase()} title information`);
                }
                if (execValidation.riskFactors.length > 0) {
                    risks.push(...execValidation.riskFactors);
                }
                totalScore += execValidation.confidence;
                scoreComponents++;
            }
        });

        // Quality metric risks
        const metrics = validation.qualityMetrics;
        if (metrics.dataFreshness < 70) {
            risks.push('Data may be stale');
            recommendations.push('Refresh data from primary sources');
        }
        if (metrics.sourceReliability < 70) {
            risks.push('Source reliability concerns');
            recommendations.push('Validate with additional reliable sources');
        }
        if (metrics.crossValidation < 60) {
            risks.push('Limited cross-validation');
            recommendations.push('Verify data with multiple independent sources');
        }

        // Calculate overall score
        const overallScore = scoreComponents > 0 ? Math.round(totalScore / scoreComponents) : 0;

        // Determine risk level
        let riskLevel;
        if (overallScore >= 85) riskLevel = 'LOW';
        else if (overallScore >= 70) riskLevel = 'MEDIUM';
        else if (overallScore >= 50) riskLevel = 'HIGH';
        else riskLevel = 'CRITICAL';

        return {
            score: overallScore,
            level: riskLevel,
            recommendations,
            warnings: risks
        };
    }

    /**
     * 🔧 UTILITY METHODS
     */
    assessContactValidity(contactValidation) {
        const validEmails = contactValidation.emails.filter(e => e.isValid).length;
        const totalEmails = contactValidation.emails.length;
        const validPhones = contactValidation.phones.filter(p => p.verified).length;
        
        return (totalEmails > 0 && validEmails / totalEmails > 0.5) || validPhones > 0;
    }

    identifyRiskFactors(executive, employmentCheck) {
        const risks = [];
        
        if (executive.confidence < 70) {
            risks.push('Low detection confidence');
        }
        if (!employmentCheck.dataFresh) {
            risks.push('Potentially outdated information');
        }
        if (executive.source === 'AI_Basic') {
            risks.push('Low-confidence detection method used');
        }
        
        return risks;
    }

    calculateExecutiveConfidence(validation) {
        let confidence = 0;
        let factors = 0;

        if (validation.currentlyEmployed) {
            confidence += 90;
            factors++;
        } else {
            confidence += 20;
            factors++;
        }

        if (validation.titleAccurate) {
            confidence += 85;
            factors++;
        }

        if (validation.contactsValid) {
            confidence += 75;
            factors++;
        }

        if (validation.dataFresh) {
            confidence += 80;
            factors++;
        }

        // Risk factor penalties
        confidence -= validation.riskFactors.length * 10;

        const finalConfidence = factors > 0 ? Math.round(confidence / factors) : 0;
        return Math.max(0, Math.min(100, finalConfidence));
    }

    initializeRiskFactors() {
        return {
            HIGH_RISK: [
                'Executive not currently employed',
                'Company status unknown',
                'No contact validation possible',
                'Data over 6 months old'
            ],
            MEDIUM_RISK: [
                'Title accuracy uncertain',
                'Limited source validation',
                'Contact deliverability unknown',
                'Company recently acquired'
            ],
            LOW_RISK: [
                'Minor title variations',
                'Single source validation',
                'Recent data updates available'
            ]
        };
    }
}

module.exports = { ValidationEngine };
