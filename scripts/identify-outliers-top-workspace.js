/**
 * Script to identify companies in TOP workspace that don't belong there.
 * Most companies should be legitimate, but this flags outliers that seem miscategorized.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const os = require('os');

const prisma = new PrismaClient();

// Keywords that indicate a utility/energy/telecom company
const UTILITY_KEYWORDS = [
    'electric', 'power', 'energy', 'utility', 'utilities', 'cooperative', 'co-op',
    'generation', 'transmission', 'distribution', 'grid', 'hydro', 'nuclear',
    'renewable', 'solar', 'wind', 'gas', 'water', 'sewer', 'telecom', 'telecommunications',
    'communications', 'broadband', 'fiber', 'cable', 'wireless', 'network',
    'irrigation', 'district', 'authority', 'municipal', 'public', 'rural',
    'electric membership', 'emc', 'pud', 'rea', 'mdu', 'l&g', 'light & power',
    'power & light', 'water & power', 'light gas water'
];

// Keywords that indicate a company probably DOESN'T belong
const NON_UTILITY_KEYWORDS = [
    'restaurant', 'cafe', 'bistro', 'hotel', 'motel', 'inn', 'bar', 'pub',
    'magazine', 'newspaper', 'publishing', 'media', 'news', 'magazine',
    'foundation', 'charity', 'non-profit', 'nonprofit', 'ministries', 'church',
    'club', 'association', 'society', 'library', 'museum', 'gallery', 'art',
    'healthcare', 'hospital', 'medical', 'dental', 'clinic', 'pediatric',
    'consulting', 'grant', 'startup', 'business', 'careers', 'job',
    'landscaping', 'helicopter', 'transport', 'mudancas', 'truck rental',
    'sign company', 'walking sticks', 'band', 'football', 'hall of fame',
    'boys & girls', 'big brothers', 'humane society', 'ymca', 'ymca',
    'career coaching', 'cloud', 'visual', 'comunicação', 'pooled inventory',
    'smart home', 'temps', 'credit union', 'bank', 'financial'
];

// Industry patterns that are clearly NOT utility/energy
const NON_UTILITY_PATTERNS = [
    /restaurant/i,
    /cafe/i,
    /bistro/i,
    /hotel/i,
    /motel/i,
    /inn/i,
    /magazine/i,
    /newspaper/i,
    /publishing/i,
    /foundation/i,
    /charity/i,
    /ministries/i,
    /church/i,
    /club/i,
    /library/i,
    /museum/i,
    /gallery/i,
    /art/i,
    /healthcare/i,
    /hospital/i,
    /medical/i,
    /dental/i,
    /clinic/i,
    /pediatric/i,
    /landscaping/i,
    /helicopter/i,
    /transport/i,
    /band/i,
    /football/i,
    /boys.*girls/i,
    /big.*brothers/i,
    /humane.*society/i,
    /ymca/i,
    /career.*coaching/i,
    /credit.*union/i,
    /bank/i,
    /financial/i,
    /grant/i,
    /startup/i,
    /careers.*at/i,
    /sign.*company/i,
    /walking.*sticks/i
];

function hasUtilityKeywords(companyName) {
    const lower = companyName.toLowerCase();
    return UTILITY_KEYWORDS.some(keyword => lower.includes(keyword));
}

function hasNonUtilityKeywords(companyName) {
    const lower = companyName.toLowerCase();
    
    // Check explicit non-utility keywords
    if (NON_UTILITY_KEYWORDS.some(keyword => lower.includes(keyword))) {
        return true;
    }
    
    // Check patterns
    if (NON_UTILITY_PATTERNS.some(pattern => pattern.test(companyName))) {
        return true;
    }
    
    return false;
}

function analyzeCompany(companyName) {
    const hasUtility = hasUtilityKeywords(companyName);
    const hasNonUtility = hasNonUtilityKeywords(companyName);
    
    let category = 'UNKNOWN';
    let confidence = 'MEDIUM';
    let reason = '';
    
    if (hasNonUtility && !hasUtility) {
        category = 'LIKELY_OUTLIER';
        confidence = 'HIGH';
        reason = 'Contains non-utility keywords and no utility keywords';
    } else if (hasNonUtility && hasUtility) {
        category = 'POSSIBLE_OUTLIER';
        confidence = 'MEDIUM';
        reason = 'Contains both utility and non-utility keywords - may be miscategorized';
    } else if (!hasUtility && !hasNonUtility) {
        category = 'NEEDS_REVIEW';
        confidence = 'LOW';
        reason = 'No clear utility or non-utility indicators';
    } else if (hasUtility && !hasNonUtility) {
        category = 'LIKELY_VALID';
        confidence = 'HIGH';
        reason = 'Contains utility keywords and no non-utility keywords';
    }
    
    return { category, confidence, reason, hasUtility, hasNonUtility };
}

async function getTopWorkspaceCompanies() {
    console.log("Searching for 'TOP' workspace...");
    
    const workspace = await prisma.workspaces.findFirst({
        where: {
            name: {
                contains: 'TOP',
                mode: 'insensitive'
            },
            deletedAt: null
        },
        select: {
            id: true,
            name: true,
            slug: true
        }
    });
    
    if (!workspace) {
        console.error("❌ Could not find a workspace with 'TOP' in the name");
        return null;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id})`);
    
    const companies = await prisma.companies.findMany({
        where: {
            workspaceId: workspace.id,
            deletedAt: null
        },
        select: {
            id: true,
            name: true,
            industry: true
        },
        orderBy: {
            name: 'asc'
        }
    });
    
    console.log(`✅ Found ${companies.length} companies in ${workspace.name} workspace`);
    
    return {
        workspace,
        companies
    };
}

function loadReferenceList() {
    return [
        "Austin Energy",
        "El Paso Electric Company",
        "FLORIDA POWER",
        "Los Angeles Department of Water & Power",
        "Northern Virginia Electric Cooperative",
        "PSEG Long Island",
        "WEC Energy Group",
        "Columbia Water & Light",
        "Omaha Public Power District",
        "M & A Electric Power Cooperative",
        "Corn Belt Power Cooperative",
        "Duke Energy Corporation Telecommunications",
        "Bonneville Power Administration",
        "Eversource Energy",
        "Otter Tail Power Company",
        "Eversource",
        "Arkansas Electric Cooperative Corp.",
        "CPS Energy",
        "PSEG Long Island Power Authority",
        "Public Service Enterprise Group",
        "Grant County Public Utility District No. 2",
        "Montana-Dakota Utilities Co.",
        "TxDOT",
        "Sacramento Municipal Utility District",
        "Rappahannock Electric Cooperative",
        "JEA",
        "Pacific Gas & Electric",
        "Exelon Corporation",
        "National Grid USA",
        "Memphis Light, Gas & Water Division",
        "Cleco Power LLC",
        "Vermont Electric Power Company",
        "CenterPoint Energy",
        "Avista Corp.",
    ];
}

async function main() {
    try {
        console.log("=".repeat(80));
        console.log("Identifying outliers in TOP workspace");
        console.log("=".repeat(80));
        console.log();
        
        const referenceList = loadReferenceList();
        const workspaceData = await getTopWorkspaceCompanies();
        if (!workspaceData) {
            await prisma.$disconnect();
            process.exit(1);
        }
        
        const { workspace, companies } = workspaceData;
        
        // Analyze all companies
        const analyzed = companies.map(company => {
            const analysis = analyzeCompany(company.name);
            return {
                ...company,
                ...analysis
            };
        });
        
        // Categorize
        const likelyOutliers = analyzed.filter(c => c.category === 'LIKELY_OUTLIER');
        const possibleOutliers = analyzed.filter(c => c.category === 'POSSIBLE_OUTLIER');
        const needsReview = analyzed.filter(c => c.category === 'NEEDS_REVIEW');
        const likelyValid = analyzed.filter(c => c.category === 'LIKELY_VALID');
        
        console.log("\n" + "=".repeat(80));
        console.log("ANALYSIS RESULTS");
        console.log("=".repeat(80));
        console.log(`Total companies analyzed: ${analyzed.length}`);
        console.log(`\n📊 Categories:`);
        console.log(`   ✅ Likely Valid (${likelyValid.length}): Companies that appear to be utility/energy related`);
        console.log(`   ⚠️  Likely Outliers (${likelyOutliers.length}): Companies that probably don't belong`);
        console.log(`   ⚠️  Possible Outliers (${possibleOutliers.length}): Companies that may be miscategorized`);
        console.log(`   ❓ Needs Review (${needsReview.length}): Companies with unclear categorization`);
        
        // Show likely outliers
        if (likelyOutliers.length > 0) {
            console.log("\n" + "=".repeat(80));
            console.log("🚨 LIKELY OUTLIERS - Companies that probably don't belong:");
            console.log("=".repeat(80));
            likelyOutliers.forEach((company, index) => {
                console.log(`${index + 1}. ${company.name}`);
                console.log(`   Reason: ${company.reason}`);
                if (company.industry) {
                    console.log(`   Industry: ${company.industry}`);
                }
                console.log();
            });
        }
        
        // Show possible outliers
        if (possibleOutliers.length > 0) {
            console.log("\n" + "=".repeat(80));
            console.log("⚠️  POSSIBLE OUTLIERS - May be miscategorized:");
            console.log("=".repeat(80));
            possibleOutliers.forEach((company, index) => {
                console.log(`${index + 1}. ${company.name}`);
                console.log(`   Reason: ${company.reason}`);
                if (company.industry) {
                    console.log(`   Industry: ${company.industry}`);
                }
                console.log();
            });
        }
        
        // Generate output files
        const desktopPath = path.join(os.homedir(), 'Desktop');
        
        // Detailed report
        const reportLines = [];
        reportLines.push("OUTLIER ANALYSIS FOR TOP WORKSPACE");
        reportLines.push("=".repeat(80));
        reportLines.push(`Workspace: ${workspace.name} (${workspace.slug})`);
        reportLines.push(`Workspace ID: ${workspace.id}`);
        reportLines.push(`Analysis Date: ${new Date().toISOString()}`);
        reportLines.push("");
        reportLines.push("=".repeat(80));
        reportLines.push("SUMMARY");
        reportLines.push("=".repeat(80));
        reportLines.push(`Total companies: ${analyzed.length}`);
        reportLines.push(`Likely Valid: ${likelyValid.length}`);
        reportLines.push(`Likely Outliers: ${likelyOutliers.length}`);
        reportLines.push(`Possible Outliers: ${possibleOutliers.length}`);
        reportLines.push(`Needs Review: ${needsReview.length}`);
        reportLines.push("");
        
        if (likelyOutliers.length > 0) {
            reportLines.push("=".repeat(80));
            reportLines.push("🚨 LIKELY OUTLIERS - Companies that probably don't belong:");
            reportLines.push("=".repeat(80));
            likelyOutliers.forEach((company, index) => {
                reportLines.push(`${index + 1}. ${company.name}`);
                reportLines.push(`   Reason: ${company.reason}`);
                reportLines.push(`   Confidence: ${company.confidence}`);
                if (company.industry) {
                    reportLines.push(`   Industry: ${company.industry}`);
                }
                reportLines.push("");
            });
        }
        
        if (possibleOutliers.length > 0) {
            reportLines.push("=".repeat(80));
            reportLines.push("⚠️  POSSIBLE OUTLIERS - May be miscategorized:");
            reportLines.push("=".repeat(80));
            possibleOutliers.forEach((company, index) => {
                reportLines.push(`${index + 1}. ${company.name}`);
                reportLines.push(`   Reason: ${company.reason}`);
                reportLines.push(`   Confidence: ${company.confidence}`);
                if (company.industry) {
                    reportLines.push(`   Industry: ${company.industry}`);
                }
                reportLines.push("");
            });
        }
        
        if (needsReview.length > 0) {
            reportLines.push("=".repeat(80));
            reportLines.push("❓ NEEDS REVIEW - Unclear categorization:");
            reportLines.push("=".repeat(80));
            needsReview.forEach((company, index) => {
                reportLines.push(`${index + 1}. ${company.name}`);
                if (company.industry) {
                    reportLines.push(`   Industry: ${company.industry}`);
                }
                reportLines.push("");
            });
        }
        
        const reportFile = path.join(desktopPath, 'top_workspace_outliers.txt');
        fs.writeFileSync(reportFile, reportLines.join('\n'), 'utf8');
        console.log(`\n📄 Detailed report saved to: ${reportFile}`);
        
        // CSV file
        const csvLines = ['Company Name,Category,Confidence,Reason,Has Utility Keywords,Has Non-Utility Keywords,Industry'];
        analyzed.forEach(company => {
            csvLines.push([
                `"${company.name}"`,
                company.category,
                company.confidence,
                `"${company.reason}"`,
                company.hasUtility,
                company.hasNonUtility,
                company.industry ? `"${company.industry}"` : ''
            ].join(','));
        });
        
        const csvFile = path.join(desktopPath, 'top_workspace_outliers.csv');
        fs.writeFileSync(csvFile, csvLines.join('\n'), 'utf8');
        console.log(`📊 CSV file saved to: ${csvFile}`);
        
        // Summary CSV with just outliers
        const outlierCsvLines = ['Company Name,Category,Confidence,Reason,Industry'];
        [...likelyOutliers, ...possibleOutliers].forEach(company => {
            outlierCsvLines.push([
                `"${company.name}"`,
                company.category,
                company.confidence,
                `"${company.reason}"`,
                company.industry ? `"${company.industry}"` : ''
            ].join(','));
        });
        
        const outlierCsvFile = path.join(desktopPath, 'top_workspace_outliers_only.csv');
        fs.writeFileSync(outlierCsvFile, outlierCsvLines.join('\n'), 'utf8');
        console.log(`🎯 Outliers-only CSV saved to: ${outlierCsvFile}`);
        
    } catch (error) {
        console.error("❌ Error:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

