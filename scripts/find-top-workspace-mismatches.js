/**
 * Script to find companies in the 'TOP' workspace that are not in the reference list.
 * This queries the actual database to get companies from the TOP workspace.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const os = require('os');

const prisma = new PrismaClient();

function normalizeCompanyName(name) {
    if (!name) return "";
    
    // Strip and lowercase
    let normalized = name.trim().toLowerCase();
    
    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Remove common punctuation that might cause mismatches
    normalized = normalized.replace(/,/g, '');
    normalized = normalized.replace(/\./g, '');
    normalized = normalized.replace(/&/g, 'and');
    normalized = normalized.replace(/\+/g, 'and');
    
    return normalized;
}

function findSimilarity(str1, str2) {
    // Simple similarity using longest common subsequence ratio
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

function loadReferenceList() {
    const referenceCompanies = [
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
    
    const normalizedReference = new Set();
    referenceCompanies.forEach(company => {
        normalizedReference.add(normalizeCompanyName(company));
    });
    
    return { normalizedReference, originalReference: referenceCompanies };
}

async function getTopWorkspaceCompanies() {
    console.log("Searching for 'TOP' workspace...");
    
    // Try to find workspace by name (case-insensitive)
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
        console.log("\nAvailable workspaces:");
        const allWorkspaces = await prisma.workspaces.findMany({
            where: { deletedAt: null },
            select: { id: true, name: true, slug: true },
            take: 20
        });
        allWorkspaces.forEach(w => {
            console.log(`  - ${w.name} (${w.slug}) - ID: ${w.id}`);
        });
        return null;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id})`);
    
    // Get all companies from this workspace
    console.log("\nFetching companies from TOP workspace...");
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

function findSimilarName(query, referenceList, threshold = 0.6) {
    const queryNorm = normalizeCompanyName(query);
    const similarities = [];
    
    referenceList.forEach(refCompany => {
        const refNorm = normalizeCompanyName(refCompany);
        const similarity = findSimilarity(queryNorm, refNorm);
        if (similarity >= threshold) {
            similarities.push({ name: refCompany, score: similarity });
        }
    });
    
    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, 3);
}

function findMismatches(normalizedReference, originalReference, topList) {
    const mismatches = [];
    const seenNormalized = new Set();
    const similarMatches = {};
    
    topList.forEach(company => {
        const normalized = normalizeCompanyName(company);
        
        if (seenNormalized.has(normalized)) {
            return; // Skip duplicates
        }
        
        seenNormalized.add(normalized);
        
        if (!normalizedReference.has(normalized)) {
            mismatches.push({ original: company, normalized });
            
            const similar = findSimilarName(company, originalReference, 0.6);
            if (similar.length > 0) {
                similarMatches[company] = similar;
            }
        }
    });
    
    return { mismatches, similarMatches };
}

async function main() {
    try {
        console.log("=".repeat(80));
        console.log("Finding companies in TOP workspace that are NOT in reference list");
        console.log("=".repeat(80));
        console.log();
        
        // Load reference list
        console.log("Loading reference list...");
        const { normalizedReference, originalReference } = loadReferenceList();
        console.log(`✅ Loaded ${originalReference.length} reference companies`);
        
        // Get companies from TOP workspace
        const workspaceData = await getTopWorkspaceCompanies();
        if (!workspaceData) {
            await prisma.$disconnect();
            process.exit(1);
        }
        
        const { workspace, companies: topList } = workspaceData;
        console.log(`✅ Loaded ${topList.length} companies from ${workspace.name} workspace`);
        
        // Find mismatches
        console.log("\nFinding mismatches...");
        const { mismatches, similarMatches } = findMismatches(
            normalizedReference, 
            originalReference, 
            topList
        );
        
        console.log(`\nFound ${mismatches.length} companies in '${workspace.name}' workspace that are NOT in reference list:\n`);
        console.log("=".repeat(80));
        
        const outputLines = [];
        outputLines.push(`Companies in '${workspace.name}' workspace that are NOT in the reference list:`);
        outputLines.push(`Workspace ID: ${workspace.id}`);
        outputLines.push(`Workspace Slug: ${workspace.slug}`);
        outputLines.push("=".repeat(80));
        outputLines.push("");
        
        mismatches.forEach((item, index) => {
            const line = `${index + 1}. ${item.original}`;
            console.log(line);
            outputLines.push(line);
            
            if (similarMatches[item.original]) {
                outputLines.push("   (Possible matches in reference list:)");
                similarMatches[item.original].forEach(match => {
                    const matchLine = `      - ${match.name} (similarity: ${(match.score * 100).toFixed(2)}%)`;
                    outputLines.push(matchLine);
                });
                outputLines.push("");
            }
        });
        
        outputLines.push("");
        outputLines.push("=".repeat(80));
        outputLines.push(`\nTotal mismatches: ${mismatches.length}`);
        
        if (Object.keys(similarMatches).length > 0) {
            outputLines.push(`Companies with potential matches: ${Object.keys(similarMatches).length}`);
        }
        
        // Save to file
        const desktopPath = path.join(os.homedir(), 'Desktop');
        const outputFile = path.join(desktopPath, 'top_workspace_mismatches.txt');
        const csvFile = path.join(desktopPath, 'top_workspace_mismatches.csv');
        
        fs.writeFileSync(outputFile, outputLines.join('\n'), 'utf8');
        console.log(`\n\nResults saved to: ${outputFile}`);
        
        // Create CSV
        const csvLines = ['Original Name,Normalized Name,Similar Match 1,Similarity 1,Similar Match 2,Similarity 2,Similar Match 3,Similarity 3'];
        mismatches.forEach(item => {
            const row = [`"${item.original}"`, `"${item.normalized}"`];
            if (similarMatches[item.original]) {
                similarMatches[item.original].forEach(match => {
                    row.push(`"${match.name}"`);
                    row.push(`${(match.score * 100).toFixed(2)}%`);
                });
                while (row.length < 8) {
                    row.push('""');
                    row.push('""');
                }
            } else {
                row.push('""', '""', '""', '""', '""', '""');
            }
            csvLines.push(row.join(','));
        });
        
        fs.writeFileSync(csvFile, csvLines.join('\n'), 'utf8');
        console.log(`CSV file saved to: ${csvFile}`);
        
        // Summary
        console.log("\n" + "=".repeat(80));
        console.log("SUMMARY");
        console.log("=".repeat(80));
        const uniqueTop = new Set(topList.map(c => normalizeCompanyName(c)));
        console.log(`Workspace: ${workspace.name} (${workspace.slug})`);
        console.log(`Total unique companies in workspace: ${uniqueTop.size}`);
        console.log(`Companies NOT in reference list: ${mismatches.length}`);
        if (Object.keys(similarMatches).length > 0) {
            console.log(`Companies with potential matches: ${Object.keys(similarMatches).length}`);
        }
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

