/**
 * Script to check if companies from a list are in the reference list.
 * Handles typos and variations in company names.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

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

function loadCompanyList() {
    // Companies from the user's first list
    return [
        "Exelon Corporation",
        "National Grid USA Service Company",
        "Northern Virgina Electic Cooperative",
        "Northern Virgina Electic Cooperative",
        "Public Service Enterprise Group",
        "Public Service Enterprise Group",
        "Public Service Enterprise Group",
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
        "Great River Energy",
        "MINNESOTA POWER",
        "Minnesota Power",
        "MINNESOTA POWER",
        "Minnesota Power",
        "Montana-Dakota Utilities Co.",
        "Otter Tail Power Company",
        "Otter Tail Power Company",
        "ADB",
        "CenterPoint Energy",
        "CenterPoint Energy",
        "CPS Energy",
        "CPS Energy",
        "CPS Energy",
        "Irby Utilities",
        "Lower Colorado River Authority",
        "Lower Colorado River Authority",
        "Lower Colorado River Authority",
        "Lower Colorado River Authority",
        "Cleco Power LLC",
        "YUBA Water Agency",
        "Nevada Energy",
        "Nevada Energy",
        "Nevada Energy",
        "Nevada Energy",
        "Wesco",
        "Telecom by Design LLC",
        "Sacremento Municipal Utility District",
        "Portland General Electric Company",
        "PowerTrunk",
        "Graybar",
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
        "Pacific Gas & Electric Company",
        "Utility Telecom Consulting Group Inc.",
        "Gillespie, Prudhon and Associates",
        "Lockard & White, Inc.",
    ];
}

function findBestMatch(query, referenceList, threshold = 0.7) {
    const queryNorm = normalizeCompanyName(query);
    let bestMatch = null;
    let bestScore = 0;
    
    referenceList.forEach(refCompany => {
        const refNorm = normalizeCompanyName(refCompany);
        const similarity = findSimilarity(queryNorm, refNorm);
        if (similarity > bestScore) {
            bestScore = similarity;
            bestMatch = refCompany;
        }
    });
    
    if (bestScore >= threshold) {
        return { match: bestMatch, score: bestScore };
    }
    
    return null;
}

function main() {
    console.log("=".repeat(80));
    console.log("Checking companies against reference list");
    console.log("=".repeat(80));
    console.log();
    
    const referenceList = loadReferenceList();
    const companyList = loadCompanyList();
    
    // Remove duplicates from company list
    const uniqueCompanies = [...new Set(companyList)];
    
    console.log(`Reference list: ${referenceList.length} companies`);
    console.log(`Company list: ${companyList.length} total (${uniqueCompanies.length} unique)`);
    console.log();
    
    // Create normalized reference set for exact matching
    const normalizedReference = new Set();
    referenceList.forEach(company => {
        normalizedReference.add(normalizeCompanyName(company));
    });
    
    const results = {
        inReference: [],
        notInReference: [],
        possibleMatches: []
    };
    
    uniqueCompanies.forEach(company => {
        const normalized = normalizeCompanyName(company);
        
        // Check for exact match (after normalization)
        if (normalizedReference.has(normalized)) {
            results.inReference.push({ company, match: company, type: 'exact' });
        } else {
            // Try to find a similar match
            const bestMatch = findBestMatch(company, referenceList, 0.7);
            if (bestMatch) {
                results.possibleMatches.push({
                    company,
                    match: bestMatch.match,
                    score: bestMatch.score,
                    type: 'similar'
                });
            } else {
                results.notInReference.push({ company, type: 'none' });
            }
        }
    });
    
    // Display results
    console.log("=".repeat(80));
    console.log("RESULTS");
    console.log("=".repeat(80));
    console.log();
    
    if (results.inReference.length > 0) {
        console.log(`✅ IN REFERENCE LIST (${results.inReference.length}):`);
        console.log("-".repeat(80));
        results.inReference.forEach((item, index) => {
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
    
    if (results.notInReference.length > 0) {
        console.log(`❌ NOT IN REFERENCE LIST (${results.notInReference.length}):`);
        console.log("-".repeat(80));
        results.notInReference.forEach((item, index) => {
            console.log(`${index + 1}. ${item.company}`);
        });
        console.log();
    }
    
    // Generate output files
    const desktopPath = path.join(os.homedir(), 'Desktop');
    
    // Summary report
    const reportLines = [];
    reportLines.push("COMPANY CHECK AGAINST REFERENCE LIST");
    reportLines.push("=".repeat(80));
    reportLines.push(`Analysis Date: ${new Date().toISOString()}`);
    reportLines.push("");
    reportLines.push("SUMMARY");
    reportLines.push("-".repeat(80));
    reportLines.push(`Total companies checked: ${uniqueCompanies.length}`);
    reportLines.push(`In reference list: ${results.inReference.length}`);
    reportLines.push(`Possible matches: ${results.possibleMatches.length}`);
    reportLines.push(`Not in reference list: ${results.notInReference.length}`);
    reportLines.push("");
    
    if (results.inReference.length > 0) {
        reportLines.push("=".repeat(80));
        reportLines.push(`✅ IN REFERENCE LIST (${results.inReference.length})`);
        reportLines.push("=".repeat(80));
        results.inReference.forEach((item, index) => {
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
    
    if (results.notInReference.length > 0) {
        reportLines.push("=".repeat(80));
        reportLines.push(`❌ NOT IN REFERENCE LIST (${results.notInReference.length})`);
        reportLines.push("=".repeat(80));
        results.notInReference.forEach((item, index) => {
            reportLines.push(`${index + 1}. ${item.company}`);
        });
    }
    
    const reportFile = path.join(desktopPath, 'company_check_results.txt');
    fs.writeFileSync(reportFile, reportLines.join('\n'), 'utf8');
    console.log(`📄 Report saved to: ${reportFile}`);
    
    // CSV file
    const csvLines = ['Company Name,Status,Match,Similarity Score'];
    results.inReference.forEach(item => {
        csvLines.push(`"${item.company}","In Reference","${item.match}","100%"`);
    });
    results.possibleMatches.forEach(item => {
        csvLines.push(`"${item.company}","Possible Match","${item.match}","${(item.score * 100).toFixed(1)}%"`);
    });
    results.notInReference.forEach(item => {
        csvLines.push(`"${item.company}","Not in Reference","",""`);
    });
    
    const csvFile = path.join(desktopPath, 'company_check_results.csv');
    fs.writeFileSync(csvFile, csvLines.join('\n'), 'utf8');
    console.log(`📊 CSV file saved to: ${csvFile}`);
    
    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total unique companies: ${uniqueCompanies.length}`);
    console.log(`✅ In reference list: ${results.inReference.length}`);
    console.log(`⚠️  Possible matches: ${results.possibleMatches.length}`);
    console.log(`❌ Not in reference list: ${results.notInReference.length}`);
    console.log("=".repeat(80));
}

main();

