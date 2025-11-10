/**
 * Script to compare a combined company list against companies in the TOP workspace.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const os = require('os');

const prisma = new PrismaClient();

function normalizeCompanyName(name) {
    if (!name) return "";
    
    let normalized = name.trim().toLowerCase();
    normalized = normalized.replace(/\s+/g, ' ');
    normalized = normalized.replace(/,/g, '');
    normalized = normalized.replace(/\./g, '');
    normalized = normalized.replace(/&/g, 'and');
    normalized = normalized.replace(/\+/g, 'and');
    normalized = normalized.replace(/-/g, ' ');
    normalized = normalized.replace(/\//g, ' ');
    
    // Fix common typos
    normalized = normalized.replace(/electic/gi, 'electric');
    normalized = normalized.replace(/virgina/gi, 'virginia');
    normalized = normalized.replace(/sacremento/gi, 'sacramento');
    
    return normalized;
}

function findSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
}

function loadCombinedList() {
    // Combined list from user (first section + reference list)
    const companies = [
        "Exelon Corporation",
        "National Grid USA Service Company",
        "Northern Virgina Electic Cooperative",
        "Public Service Enterprise Group",
        "Vermont Electric Power Company",
        "Duke Energy Corporation",
        "Memphis Light, Gas & Water Division",
        "Southern Company",
        "Basin Electric Power Cooperative",
        "Calhoun Communications, Inc.",
        "Dairyland Power Cooperative",
        "East River Electric Power Cooperative",
        "Great River Energy",
        "MINNESOTA POWER",
        "Minnesota Power",
        "Montana-Dakota Utilities Co.",
        "Otter Tail Power Company",
        "ADB",
        "CenterPoint Energy",
        "CPS Energy",
        "Irby Utilities",
        "Lower Colorado River Authority",
        "Cleco Power LLC",
        "YUBA Water Agency",
        "Nevada Energy",
        "Wesco",
        "Telecom by Design LLC",
        "Sacremento Municipal Utility District",
        "Portland General Electric Company",
        "PowerTrunk",
        "Graybar",
        "Viavi Solutions",
        "Grant County PUD",
        "Catalyst Communications Technologies, Inc.",
        "Belden",
        "Padtec",
        "Westermo Data Communications, Inc.",
        "Tri-State Generation and Transmission Association Inc.",
        "Northwestern Corporation",
        "Washoe County Utilities Division",
        "Southwest Gas Corporation",
        "Wells Rural Electric Company",
        "Pacific Gas & Electric Company",
        "Utility Telecom Consulting Group Inc.",
        "Gillespie, Prudhon and Associates",
        "Lockard & White, Inc.",
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
        "Eversource",
        "Arkansas Electric Cooperative Corp.",
        "PSEG Long Island Power Authority",
        "Grant County Public Utility District No. 2",
        "TxDOT",
        "Sacramento Municipal Utility District",
        "Rappahannock Electric Cooperative",
        "JEA",
        "Pacific Gas & Electric",
        "National Grid USA",
        "Vermont Electric Power Company",
        "Avista Corp.",
    ];
    
    // Remove duplicates and return unique list
    return [...new Set(companies)];
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
            name: true
        },
        orderBy: {
            name: 'asc'
        }
    });
    
    console.log(`✅ Found ${companies.length} companies in ${workspace.name} workspace`);
    
    return {
        workspace,
        companies: companies.map(c => c.name)
    };
}

function findBestMatch(query, targetList, threshold = 0.7) {
    const queryNorm = normalizeCompanyName(query);
    let bestMatch = null;
    let bestScore = 0;
    
    targetList.forEach(targetCompany => {
        const targetNorm = normalizeCompanyName(targetCompany);
        const similarity = findSimilarity(queryNorm, targetNorm);
        if (similarity > bestScore) {
            bestScore = similarity;
            bestMatch = targetCompany;
        }
    });
    
    if (bestScore >= threshold) {
        return { match: bestMatch, score: bestScore };
    }
    
    return null;
}

async function main() {
    try {
        console.log("=".repeat(80));
        console.log("Comparing combined list against TOP workspace");
        console.log("=".repeat(80));
        console.log();
        
        const combinedList = loadCombinedList();
        console.log(`✅ Loaded ${combinedList.length} unique companies from combined list`);
        
        const workspaceData = await getTopWorkspaceCompanies();
        if (!workspaceData) {
            await prisma.$disconnect();
            process.exit(1);
        }
        
        const { workspace, companies: topCompanies } = workspaceData;
        console.log(`✅ Loaded ${topCompanies.length} companies from ${workspace.name} workspace`);
        console.log();
        
        // Create normalized set for exact matching
        const normalizedTop = new Set();
        topCompanies.forEach(company => {
            normalizedTop.add(normalizeCompanyName(company));
        });
        
        const results = {
            inTopWorkspace: [],
            possibleMatches: [],
            notInTopWorkspace: []
        };
        
        combinedList.forEach(company => {
            const normalized = normalizeCompanyName(company);
            
            // Check for exact match
            if (normalizedTop.has(normalized)) {
                results.inTopWorkspace.push({ company, match: company, type: 'exact' });
            } else {
                // Try to find a similar match
                const bestMatch = findBestMatch(company, topCompanies, 0.7);
                if (bestMatch) {
                    results.possibleMatches.push({
                        company,
                        match: bestMatch.match,
                        score: bestMatch.score,
                        type: 'similar'
                    });
                } else {
                    results.notInTopWorkspace.push({ company, type: 'none' });
                }
            }
        });
        
        // Display results
        console.log("=".repeat(80));
        console.log("RESULTS");
        console.log("=".repeat(80));
        console.log();
        
        if (results.inTopWorkspace.length > 0) {
            console.log(`✅ IN TOP WORKSPACE (${results.inTopWorkspace.length}):`);
            console.log("-".repeat(80));
            results.inTopWorkspace.forEach((item, index) => {
                console.log(`${index + 1}. ${item.company}`);
            });
            console.log();
        }
        
        if (results.possibleMatches.length > 0) {
            console.log(`⚠️  POSSIBLE MATCHES (${results.possibleMatches.length}):`);
            console.log("-".repeat(80));
            results.possibleMatches.forEach((item, index) => {
                console.log(`${index + 1}. ${item.company}`);
                console.log(`   → Matches: ${item.match} (${(item.score * 100).toFixed(1)}% similarity)`);
            });
            console.log();
        }
        
        if (results.notInTopWorkspace.length > 0) {
            console.log(`❌ NOT IN TOP WORKSPACE (${results.notInTopWorkspace.length}):`);
            console.log("-".repeat(80));
            results.notInTopWorkspace.forEach((item, index) => {
                console.log(`${index + 1}. ${item.company}`);
            });
            console.log();
        }
        
        // Generate output files
        const desktopPath = path.join(os.homedir(), 'Desktop');
        
        // Summary report
        const reportLines = [];
        reportLines.push("COMPARISON: COMBINED LIST vs TOP WORKSPACE");
        reportLines.push("=".repeat(80));
        reportLines.push(`Workspace: ${workspace.name} (${workspace.slug})`);
        reportLines.push(`Workspace ID: ${workspace.id}`);
        reportLines.push(`Analysis Date: ${new Date().toISOString()}`);
        reportLines.push("");
        reportLines.push("SUMMARY");
        reportLines.push("-".repeat(80));
        reportLines.push(`Total companies in combined list: ${combinedList.length}`);
        reportLines.push(`Companies in TOP workspace: ${topCompanies.length}`);
        reportLines.push(`✅ In TOP workspace: ${results.inTopWorkspace.length}`);
        reportLines.push(`⚠️  Possible matches: ${results.possibleMatches.length}`);
        reportLines.push(`❌ Not in TOP workspace: ${results.notInTopWorkspace.length}`);
        reportLines.push("");
        
        if (results.inTopWorkspace.length > 0) {
            reportLines.push("=".repeat(80));
            reportLines.push(`✅ IN TOP WORKSPACE (${results.inTopWorkspace.length})`);
            reportLines.push("=".repeat(80));
            results.inTopWorkspace.forEach((item, index) => {
                reportLines.push(`${index + 1}. ${item.company}`);
            });
            reportLines.push("");
        }
        
        if (results.possibleMatches.length > 0) {
            reportLines.push("=".repeat(80));
            reportLines.push(`⚠️  POSSIBLE MATCHES (${results.possibleMatches.length})`);
            reportLines.push("=".repeat(80));
            results.possibleMatches.forEach((item, index) => {
                reportLines.push(`${index + 1}. ${item.company}`);
                reportLines.push(`   → Matches: ${item.match} (${(item.score * 100).toFixed(1)}% similarity)`);
                reportLines.push("");
            });
        }
        
        if (results.notInTopWorkspace.length > 0) {
            reportLines.push("=".repeat(80));
            reportLines.push(`❌ NOT IN TOP WORKSPACE (${results.notInTopWorkspace.length})`);
            reportLines.push("=".repeat(80));
            results.notInTopWorkspace.forEach((item, index) => {
                reportLines.push(`${index + 1}. ${item.company}`);
            });
        }
        
        const reportFile = path.join(desktopPath, 'combined_list_vs_top_workspace.txt');
        fs.writeFileSync(reportFile, reportLines.join('\n'), 'utf8');
        console.log(`📄 Report saved to: ${reportFile}`);
        
        // CSV file
        const csvLines = ['Company Name,Status,Match in TOP Workspace,Similarity Score'];
        results.inTopWorkspace.forEach(item => {
            csvLines.push(`"${item.company}","In TOP Workspace","${item.match}","100%"`);
        });
        results.possibleMatches.forEach(item => {
            csvLines.push(`"${item.company}","Possible Match","${item.match}","${(item.score * 100).toFixed(1)}%"`);
        });
        results.notInTopWorkspace.forEach(item => {
            csvLines.push(`"${item.company}","Not in TOP Workspace","",""`);
        });
        
        const csvFile = path.join(desktopPath, 'combined_list_vs_top_workspace.csv');
        fs.writeFileSync(csvFile, csvLines.join('\n'), 'utf8');
        console.log(`📊 CSV file saved to: ${csvFile}`);
        
        // Summary
        console.log("\n" + "=".repeat(80));
        console.log("SUMMARY");
        console.log("=".repeat(80));
        console.log(`Total companies in combined list: ${combinedList.length}`);
        console.log(`Companies in TOP workspace: ${topCompanies.length}`);
        console.log(`✅ In TOP workspace: ${results.inTopWorkspace.length} (${((results.inTopWorkspace.length / combinedList.length) * 100).toFixed(1)}%)`);
        console.log(`⚠️  Possible matches: ${results.possibleMatches.length} (${((results.possibleMatches.length / combinedList.length) * 100).toFixed(1)}%)`);
        console.log(`❌ Not in TOP workspace: ${results.notInTopWorkspace.length} (${((results.notInTopWorkspace.length / combinedList.length) * 100).toFixed(1)}%)`);
        console.log("=".repeat(80));
        
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

