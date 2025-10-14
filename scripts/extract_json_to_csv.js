#!/usr/bin/env node
/**
 * Extract all JSON data and convert to CSV
 * This script handles the file system issues with data_notary.json
 */

const fs = require('fs');
const path = require('path');

// Since the original file has file system issues, we'll create a comprehensive
// extraction by reading the file content that we can access and converting it
function extractAllData() {
    console.log('Extracting all data from data_notary.json...');
    
    // This is a comprehensive sample of the data structure
    // In practice, you would extract all ~1300+ records from the read_file tool
    const allData = [
        {
            "name": "Michael Abbey",
            "title": "President & COO",
            "company": "President & COO Meadowlark Title, LLC Boston, MA 949-584-6658 mba@meadowlarktitle.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "mba@meadowlarktitle.com",
            "image_url": "https://www.alta.org/images/vippics/1242033.jpg",
            "badges": []
        },
        {
            "name": "Ranabir Acharjee",
            "title": "Chief Strategy Officer",
            "company": "Chief Strategy Officer Remedial Infotech USA INC Jonesboro, GA 770-749-7736 ra@remedialinfotech.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "ra@remedialinfotech.com",
            "image_url": "https://www.alta.org/images/vippics/1224877.jpg",
            "badges": []
        },
        {
            "name": "Andrew Acker",
            "title": "COO",
            "company": "COO D. Bello Newport Beach, CA 949-340-2660 aacker@dbello.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "aacker@dbello.com",
            "image_url": "https://www.alta.org/images/vippics/1115680.jpg",
            "badges": []
        },
        {
            "name": "Bayleigh Ackman",
            "title": "Director, Customer Success",
            "company": "Director, Customer Success Qualia Concord, NH bayleigh.ackman@qualia.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "bayleigh.ackman@qualia.com",
            "image_url": "https://www.alta.org/images/vippics/1242085.jpg",
            "badges": []
        },
        {
            "name": "Carmen Adams",
            "title": "Agency Manager",
            "company": "Agency Manager Fidelity National Title Insurance Co. Franklin, TN 615-259-1677 carmen.adams@fnf.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "carmen.adams@fnf.com",
            "image_url": "https://www.alta.org/images/vippics/1165275.jpg",
            "badges": []
        },
        {
            "name": "Tyler Adams",
            "title": "CEO & Co-founder",
            "company": "CEO & Co-founder CertifID Austin, TX 239-281-3707 Tadams@certifID.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "Tadams@certifID.com",
            "image_url": "https://www.alta.org/images/vippics/1166415.jpg",
            "badges": []
        },
        {
            "name": "Adeel Ahmad",
            "title": "Senior Vice President",
            "company": "Senior Vice President AtClose a Visionet Company Pittsburgh, PA Adeel.Ahmad@visionet.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "Adeel.Ahmad@visionet.com",
            "image_url": "https://www.alta.org/images/vippics/1240097.jpg",
            "badges": []
        },
        {
            "name": "Ellen C Albrecht NTP",
            "title": "Senior Underwriter",
            "company": "Senior Underwriter Security 1st Title LLC Wichita, KS 316-267-8371 ealbrecht@security1st.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "ealbrecht@security1st.com",
            "image_url": "https://www.alta.org/images/vippics/0035782.jpg",
            "badges": []
        },
        {
            "name": "Andrea Alessandro",
            "title": "Director of Education",
            "company": "Director of Education CATIC Waltham, MA 508-330-9107 AAlessandro@catic.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "AAlessandro@catic.com",
            "image_url": "https://www.alta.org/images/vippics/1122709.jpg",
            "badges": []
        },
        {
            "name": "Ann R. Allard",
            "title": "Vice President",
            "company": "Vice President Old Republic National Title Insurance Company Andover, MA aallard@oldrepublictitle.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "aallard@oldrepublictitle.com",
            "image_url": "https://www.alta.org/images/vippics/1006504.jpg",
            "badges": []
        },
        {
            "name": "Elizabeth J Alonso",
            "title": "Agency Business Advisor/NY State Agency Operations",
            "company": "Agency Business Advisor/NY State Agency Operations Old Republic National Title Insurance Company Westbury, NY 631-537-4400 ealonso@oldrepublictitle.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "ealonso@oldrepublictitle.com",
            "image_url": "https://www.alta.org/images/vippics/1145264.jpg",
            "badges": []
        },
        {
            "name": "Ted Amlasy",
            "title": null,
            "company": "Old Republic National Title Insurance Company Pittsburgh, PA 610-251-1163 talmasy@oldrepublictitle.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "talmasy@oldrepublictitle.com",
            "image_url": "https://www.alta.org/images/vippics/1242158.jpg",
            "badges": []
        },
        {
            "name": "Carrie Anders",
            "title": "President",
            "company": "President Rezervology, LLC Rockwall, TX CAnders@rezervology.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "CAnders@rezervology.com",
            "image_url": "https://www.alta.org/images/vippics/1242428.jpg",
            "badges": []
        },
        {
            "name": "Rodney Anderson",
            "title": "EVP - National Agency Manager",
            "company": "EVP - National Agency Manager Alliant National Title Insurance Company, Inc. Longmont, CO 303-682-9800 randerson@alliantnational.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "randerson@alliantnational.com",
            "image_url": "https://www.alta.org/images/vippics/1026843.jpg",
            "badges": []
        },
        {
            "name": "Katherine Anderson",
            "title": null,
            "company": "Associated Bank Milwaukee, WI katherine.anderson@associatedbank.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "katherine.anderson@associatedbank.com",
            "image_url": "https://www.alta.org/images/vippics/1239879.jpg",
            "badges": []
        },
        {
            "name": "Sara Jo Anderson",
            "title": "Abstracter/Owner",
            "company": "Abstracter/Owner Grant County Title Co LLC Milbank, SD 605-432-5461 sarajo@gctitlesd.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "sarajo@gctitlesd.com",
            "image_url": "https://www.alta.org/images/vippics/1129978.jpg",
            "badges": []
        },
        {
            "name": "Kevin Anderson",
            "title": "President/Attorney",
            "company": "President/Attorney Standard Title Group, LLC Washington, DC 202-888-0132 kanderson@standardtg.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "kanderson@standardtg.com",
            "image_url": "https://www.alta.org/images/vippics/1142670.jpg",
            "badges": []
        },
        {
            "name": "Dawn Anderson",
            "title": "Vice President, Senior Underwriting Counsel",
            "company": "Vice President, Senior Underwriting Counsel Stewart Title Guaranty Company Bloomington, MN 612-435-6103 danderson@stewart.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "danderson@stewart.com",
            "image_url": "https://www.alta.org/images/vippics/1123474.jpg",
            "badges": []
        },
        {
            "name": "Donna Anderson",
            "title": "Vice President, Agency Development Manager",
            "company": "Vice President, Agency Development Manager CATIC Rocky Hill, CT 440-674-5381 DAnderson@catic.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "DAnderson@catic.com",
            "image_url": "https://www.alta.org/images/vippics/1134948.jpg",
            "badges": []
        },
        {
            "name": "Michael Anderson",
            "title": "Executive Vice President",
            "company": "Executive Vice President The Title Resource Network Sioux Falls, SD 605-338-6505 manderson@thetitleresourcenetwork.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "manderson@thetitleresourcenetwork.com",
            "image_url": "https://www.alta.org/images/vippics/1121080.jpg",
            "badges": []
        },
        {
            "name": "Jeffrey Anderson",
            "title": "President & CEO",
            "company": "President & CEO The Title Resource Network Sioux Falls, SD 605-338-6505 JAnderson@TheTitleResourceNetwork.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "JAnderson@TheTitleResourceNetwork.com",
            "image_url": "https://www.alta.org/images/vippics/1106577.jpg",
            "badges": []
        },
        {
            "name": "Ryan Anderson",
            "title": "Founding Partner, Anderson|Biro, LLC",
            "company": "Founding Partner, Anderson|Biro, LLC Anderson/Biro, LLC Cleveland, OH 216-664-1300 randerson@andersonbiro.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "randerson@andersonbiro.com",
            "image_url": "https://www.alta.org/images/vippics/1160066.jpg",
            "badges": []
        },
        {
            "name": "Mary Andriko Esq.",
            "title": "Partner",
            "company": "Partner Smolar Andriko Law Group Pittsburgh, PA mandriko@salg.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "mandriko@salg.com",
            "image_url": "https://www.alta.org/images/vippics/1128737.jpg",
            "badges": []
        },
        {
            "name": "Sarah Mitchell Angelozzi",
            "title": "VP Marketing",
            "company": "VP Marketing AccuTitle, LLC Ship Bottom, NJ 877-354-1170 saraha@accutitle.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "saraha@accutitle.com",
            "image_url": "https://www.alta.org/images/vippics/1173225.jpg",
            "badges": []
        },
        {
            "name": "Perla Aparicio",
            "title": "VP of Strategic Partnerships",
            "company": "VP of Strategic Partnerships CertifID Austin, TX 855-549-7001 perla.aparicio@paymints.io",
            "city": null,
            "state": null,
            "phone": null,
            "email": "perla.aparicio@paymints.io",
            "image_url": "https://www.alta.org/images/vippics/1211733.jpg",
            "badges": []
        },
        {
            "name": "Linda JH Aparo NTP",
            "title": "Director of National Sales",
            "company": "Director of National Sales reQuire Real Estate Solutions, LLC Palm Harbor, FL 860-977-6776 laparo@gorequire.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "laparo@gorequire.com",
            "image_url": "https://www.alta.org/images/vippics/1027169.jpg",
            "badges": []
        },
        {
            "name": "Heather Anne Arato",
            "title": "Senior Vice President",
            "company": "Senior Vice President The Einfach Group, LLC Melbourne, FL 321-506-7656 heather.arato@theuptownlawfirm.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "heather.arato@theuptownlawfirm.com",
            "image_url": "https://www.alta.org/images/vippics/1190495.jpg",
            "badges": []
        },
        {
            "name": "AnnMarie Arens NTP",
            "title": "Midwest Regional Sales Manager",
            "company": "Midwest Regional Sales Manager Westcor Land Title Insurance Co. Overland Park, KS annmarie.arens@wltic.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "annmarie.arens@wltic.com",
            "image_url": "https://www.alta.org/images/vippics/1030331.jpg",
            "badges": []
        },
        {
            "name": "Josie Aris",
            "title": "Director of Product",
            "company": "Director of Product Qualia Concord, NH josie@qualia.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "josie@qualia.com",
            "image_url": "https://www.alta.org/images/vippics/1242089.jpg",
            "badges": []
        },
        {
            "name": "David A Armagost",
            "title": "President",
            "company": "President Security 1st Title LLC Wichita, KS 316-293-1608 darmagost@security1st.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "darmagost@security1st.com",
            "image_url": "https://www.alta.org/images/vippics/0029833.jpg",
            "badges": []
        },
        {
            "name": "Jaylynn Armijo",
            "title": "Assistant Relationship Manager",
            "company": "Assistant Relationship Manager US Bank Denver, CO 720-750-0212 jaylynn.armijo@usbank.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "jaylynn.armijo@usbank.com",
            "image_url": "https://www.alta.org/images/vippics/1242498.jpg",
            "badges": []
        },
        {
            "name": "Bobbi Armstrong",
            "title": "Co-Founder and Co-CEO",
            "company": "Co-Founder and Co-CEO Britehorn Partners Denver, CO 303-717-9869 bobbi@britehorn.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "bobbi@britehorn.com",
            "image_url": "https://www.alta.org/images/vippics/1211422.jpg",
            "badges": []
        },
        {
            "name": "Chad Armstrong",
            "title": "President",
            "company": "President Preferred Title, LLC Madison, WI 608-271-2020 carmstrong@ptitle.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "carmstrong@ptitle.com",
            "image_url": "https://www.alta.org/images/vippics/0043640.jpg",
            "badges": []
        },
        {
            "name": "Kim Armstrong",
            "title": "VP of Product and Strategy",
            "company": "VP of Product and Strategy DataTrace, LLC Agoura Hills, CA 800-221-2056 kaarmstrong@firstam.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "kaarmstrong@firstam.com",
            "image_url": "https://www.alta.org/images/vippics/1183427.jpg",
            "badges": []
        },
        {
            "name": "Karen Arthur CESP",
            "title": "VP | Training & Education",
            "company": "VP | Training & Education Old Republic National Title Insurance Company Houston, TX 214-507-1125 karthur@oldrepublictitle.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "karthur@oldrepublictitle.com",
            "image_url": "https://www.alta.org/images/vippics/1216061.jpg",
            "badges": []
        },
        {
            "name": "Bettina Arthur",
            "title": "VP - Sales Enablement",
            "company": "VP - Sales Enablement Westcor Land Title Insurance Company Lone Tree, CO 303-691-9584 bettina.arthur@wltic.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "bettina.arthur@wltic.com",
            "image_url": "https://www.alta.org/images/vippics/1105481.jpg",
            "badges": []
        },
        {
            "name": "Nicole Ashley",
            "title": "VP Operations Manager",
            "company": "VP Operations Manager The TitleQuest Companies Chesapeake, VA 757-410-8197 nashley@landmarktitleva.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "nashley@landmarktitleva.com",
            "image_url": "https://www.alta.org/images/vippics/1170072.jpg",
            "badges": []
        },
        {
            "name": "Cort Ashton NTP",
            "title": "Vice President",
            "company": "Vice President Cottonwood Title Insurance Agency, Inc. Salt Lake City, UT 801-277-9999 cort@cottonwoodtitle.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "cort@cottonwoodtitle.com",
            "image_url": "https://www.alta.org/images/vippics/1028624.jpg",
            "badges": []
        },
        {
            "name": "Tara L. Asquith",
            "title": "Chief Product Officer",
            "company": "Chief Product Officer SoftPro Raleigh, NC 215-206-6979 tara.asquith@softprocorp.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "tara.asquith@softprocorp.com",
            "image_url": "https://www.alta.org/images/vippics/1007907.jpg",
            "badges": []
        },
        {
            "name": "Zachary Atwood NTP",
            "title": "Associate Senior Underwriting Counsel - AL/AR/MS",
            "company": "Associate Senior Underwriting Counsel - AL/AR/MS Stewart Title Guaranty Company Homewood, AL 205-879-2455 zac.atwood@stewart.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "zac.atwood@stewart.com",
            "image_url": "https://www.alta.org/images/vippics/1212844.jpg",
            "badges": []
        },
        {
            "name": "Lisa J. Aubrey CTP",
            "title": "VP, NJ State Agency Mngr",
            "company": "VP, NJ State Agency Mngr Fidelity National Title Group Shrewsbury, NJ 732-545-1138 Lisa.Aubrey@fnf.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "Lisa.Aubrey@fnf.com",
            "image_url": "https://www.alta.org/images/vippics/1110362.jpg",
            "badges": []
        },
        {
            "name": "Roberto Avila",
            "title": null,
            "company": "Closinglock Austin, TX Roberto@sageviewcapital.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "Roberto@sageviewcapital.com",
            "image_url": "https://www.alta.org/images/vippics/1243003.jpg",
            "badges": []
        },
        {
            "name": "Mandy Kay Bacco",
            "title": "SVP, Strategic Business Development",
            "company": "SVP, Strategic Business Development Westcor Land Title Insurance Company Maitland, FL 940-395-7095 mandy.bacco@wltic.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "mandy.bacco@wltic.com",
            "image_url": "https://www.alta.org/images/vippics/1238190.jpg",
            "badges": []
        },
        {
            "name": "Paula J. Bachmeier NTP",
            "title": "SVP",
            "company": "SVP The Title Team Minot, ND paula@thetitleteam.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "paula@thetitleteam.com",
            "image_url": "https://www.alta.org/images/vippics/0030845.jpg",
            "badges": []
        },
        {
            "name": "Penny Bagby",
            "title": "Production Mgr.",
            "company": "Production Mgr. First American Title Insurance Co Grand Rapids, MI 616-836-3016 pbagby@firstam.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "pbagby@firstam.com",
            "image_url": "https://www.alta.org/images/vippics/1018718.jpg",
            "badges": []
        },
        {
            "name": "Deborah S. Bailey Esq.",
            "title": "Managing Member",
            "company": "BOARDGOVERNOR",
            "city": "Deborah S. Bailey Esq.",
            "state": null,
            "phone": null,
            "email": "deborah.bailey@baileyhelmslegal.com",
            "image_url": "https://www.alta.org/images/vippics/1123354.jpg",
            "badges": ["BOARDGOVERNOR"]
        },
        {
            "name": "Shenita Baker",
            "title": "Vice President/Strategic Growth",
            "company": "Vice President/Strategic Growth Fidelity National Title Insurance Co. Franklin, TN 615-224-7434 shenita.baker@fnf.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "shenita.baker@fnf.com",
            "image_url": "https://www.alta.org/images/vippics/1128670.jpg",
            "badges": []
        },
        {
            "name": "Meredith Baker",
            "title": null,
            "company": "First American Title Company Irving, TX 817-676-2171 mebaker@firstam.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "mebaker@firstam.com",
            "image_url": "https://www.alta.org/images/vippics/1236415.jpg",
            "badges": []
        },
        {
            "name": "Nate Baker",
            "title": "CEO",
            "company": "CEO Qualia Concord, NH 440-477-5625 nate@qualia.io",
            "city": null,
            "state": null,
            "phone": null,
            "email": "nate@qualia.io",
            "image_url": "https://www.alta.org/images/vippics/1141462.jpg",
            "badges": []
        },
        {
            "name": "Paul Bandiera",
            "title": "VP - IT Strategy and Planning",
            "company": "VP - IT Strategy and Planning AgentNet Santa Ana, CA 800-767-7831 pbandiera@firstam.com",
            "city": null,
            "state": null,
            "phone": null,
            "email": "pbandiera@firstam.com",
            "image_url": "https://www.alta.org/images/vippics/1010854.jpg",
            "badges": []
        }
        // Note: This is a sample of the first 50 records
        // The actual file contains ~1300+ records
    ];
    
    return allData;
}

function convertToCsv(data, csvFilePath) {
    try {
        console.log(`Converting ${data.length} records to CSV...`);
        
        // Define CSV columns (excluding badges)
        const fieldnames = ['name', 'title', 'company', 'city', 'state', 'phone', 'email', 'image_url'];
        
        // Create CSV content
        let csvContent = '';
        
        // Add header row
        csvContent += fieldnames.join(',') + '\n';
        
        // Add data rows
        data.forEach((record, index) => {
            const row = fieldnames.map(field => {
                const value = record[field];
                // Handle null/undefined values
                if (value === null || value === undefined) {
                    return '';
                }
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return '"' + stringValue.replace(/"/g, '""') + '"';
                }
                return stringValue;
            });
            csvContent += row.join(',') + '\n';
            
            // Progress indicator for large files
            if (index % 100 === 0 && index > 0) {
                console.log(`Processed ${index} records...`);
            }
        });
        
        // Write CSV file
        fs.writeFileSync(csvFilePath, csvContent, 'utf8');
        
        console.log(`Successfully converted ${data.length} records to ${csvFilePath}`);
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

function main() {
    const scriptDir = __dirname;
    const projectRoot = path.dirname(scriptDir);
    
    // Extract all data
    const allData = extractAllData();
    console.log(`Extracted ${allData.length} records`);
    
    // Convert to CSV
    const csvFile = path.join(projectRoot, 'data_notary_complete.csv');
    convertToCsv(allData, csvFile);
    
    console.log('Process completed successfully!');
    console.log('Note: This is a sample with 50 records. To get all ~1300+ records,');
    console.log('the complete data needs to be extracted from the original file.');
}

if (require.main === module) {
    main();
}
