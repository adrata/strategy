const fs = require("fs");
const csv = require("csv-parser");

// Sample data structure - you'll need to replace this with your actual CSV data
const leadData = `Rank,company,stage,status,name,Title,role,Person Linkedin Url,Email,Mobile Phone,Other Phone,Work Phone,Company Phone,City,State,Country,Time Zone,LI Requested,Errors
1,Airtable,Generate,Called,Jordan Daniel,Sales Leader Strategic Accounts,Champion,http://www.linkedin.com/in/jordan-daniel,jordan.daniel@airtable.com,+1 516-232-6121,+1 212-994-3974,,+1 202-304-1916,New York,New York,United States,Now (EST),Yes,
2,Airtable,Generate,Called,Lindsay Mullaney,Sales Leadership Strategic Accounts,Champion,http://www.linkedin.com/in/lindsay-mullaney-b919b45,lindsay.mullaney@airtable.com,+1 617-759-9283,+1 781-897-2253,,+1 202-304-1916,Hingham,Massachusetts,United States,Now (EST),Yes,`;

// Transform the CSV data into database format
function transformLeadData() {
  const leads = [];
  const persons = [];

  // Parse CSV data (you'll replace this with actual CSV parsing)
  const rows = leadData.split("\n").slice(1); // Skip header

  rows.forEach((row, index) => {
    if (!row.trim()) return;

    const columns = row.split(",");
    if (columns.length < 18) return;

    const [
      rank,
      company,
      stage,
      status,
      name,
      title,
      role,
      linkedinUrl,
      email,
      mobilePhone,
      otherPhone,
      workPhone,
      companyPhone,
      city,
      state,
      country,
      timeZone,
      liRequested,
      errors,
    ] = columns;

    // Create Person record
    const [firstName, ...lastNameParts] = name.trim().split(" ");
    const lastName = lastNameParts.join(" ");

    const person = {
      id: `person_${index + 1}`,
      firstName: firstName || "",
      lastName: lastName || "",
      fullName: name.trim(),
      email: email.trim(),
      phone: mobilePhone.trim() || otherPhone.trim() || workPhone.trim(),
      linkedinUrl: linkedinUrl.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      // Additional professional details
      currentTitle: title.trim(),
      currentCompany: company.trim(),
      workspaceId: "adrata_workspace", // Dan's workspace
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create Lead record
    const lead = {
      id: `lead_${index + 1}`,
      personId: person.id,
      companyName: company.trim(),
      status: mapStatus(status.trim()),
      source: "Data Import",
      currentStage: mapStage(stage.trim()),
      stages: ["Generate", "Initiate", "Educate"],
      completedStages: getCompletedStages(stage.trim(), status.trim()),
      nextAction: getNextAction(status.trim(), role.trim()),
      notes: `${role.trim()} at ${company.trim()}. ${title.trim()}. Status: ${status.trim()}`,
      // Qualification fields
      qualificationScore: getQualificationScore(role.trim(), status.trim()),
      buyerPersona: mapBuyerPersona(role.trim()),
      assignedToUserId: "dan_user_id", // Dan's user ID
      workspaceId: "adrata_workspace",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persons.push(person);
    leads.push(lead);
  });

  return { persons, leads };
}

// Helper functions
function mapStatus(status) {
  const statusMap = {
    Called: "Contacted",
    "Intro call or demo booked or held": "Qualified",
    "Incorrect company/phone data": "Unqualified",
    "Have not called": "New",
    "Skipped bc they're CROs and I want Directional Intelligence before I call":
      "Research",
  };
  return statusMap[status] || "New";
}

function mapStage(stage) {
  if (stage === "Generate") return "Generate";
  return "Generate"; // Default to Generate since all are currently in Generate stage
}

function getCompletedStages(stage, status) {
  const completed = [];

  if (["Called", "Intro call or demo booked or held"].includes(status)) {
    completed.push("Generate");
  }

  if (status === "Intro call or demo booked or held") {
    completed.push("Initiate");
  }

  return completed;
}

function getNextAction(status, role) {
  const nextActions = {
    Called: "Follow up on initial conversation",
    "Intro call or demo booked or held": "Prepare for demo and discovery call",
    "Incorrect company/phone data": "Research and verify contact information",
    "Have not called": "Initial outreach and qualification call",
    "Skipped bc they're CROs and I want Directional Intelligence before I call":
      "Gather directional intelligence before outreach",
  };

  return nextActions[status] || "Initial qualification and discovery";
}

function getQualificationScore(role, status) {
  let score = 50; // Base score

  // Role-based scoring
  if (role.includes("Champion")) score += 30;
  else if (role.includes("Decision Maker")) score += 40;
  else if (role.includes("Stakeholder")) score += 20;
  else if (role.includes("Opener")) score += 10;

  // Status-based scoring
  if (status === "Intro call or demo booked or held") score += 20;
  else if (status === "Called") score += 10;
  else if (status === "Incorrect company/phone data") score -= 20;

  return Math.min(100, Math.max(0, score));
}

function mapBuyerPersona(role) {
  if (
    role.includes("Decision Maker") ||
    role.includes("CRO") ||
    role.includes("Chief")
  ) {
    return "Executive Decision Maker";
  } else if (role.includes("Champion")) {
    return "Internal Champion";
  } else if (role.includes("Stakeholder")) {
    return "Key Stakeholder";
  } else {
    return "Initial Contact";
  }
}

// Generate SQL for database insertion
function generateSQL(data) {
  const { persons, leads } = data;

  let sql = "-- Lead Data Import for Dan @ Adrata\n\n";

  // Person inserts
  sql += "-- Insert Person records\n";
  persons.forEach((person) => {
    sql += `INSERT INTO "Person" (
      "id", "firstName", "lastName", "fullName", "email", "phone", 
      "linkedinUrl", "city", "state", "country", "currentTitle", 
      "currentCompany", "workspaceId", "createdAt", "updatedAt"
    ) VALUES (
      '${person.id}', '${person.firstName.replace(/'/g, "''")}', '${person.lastName.replace(/'/g, "''")}', 
      '${person.fullName.replace(/'/g, "''")}', '${person.email}', '${person.phone}', 
      '${person.linkedinUrl}', '${person.city.replace(/'/g, "''")}', '${person.state.replace(/'/g, "''")}', 
      '${person.country.replace(/'/g, "''")}', '${person.currentTitle.replace(/'/g, "''")}', 
      '${person.currentCompany.replace(/'/g, "''")}', '${person.workspaceId}', 
      '${person.createdAt}', '${person.updatedAt}'
    );\n`;
  });

  sql += "\n-- Insert Lead records\n";
  leads.forEach((lead) => {
    sql += `INSERT INTO "Lead" (
      "id", "personId", "companyName", "status", "source", "currentStage", 
      "stages", "completedStages", "nextAction", "notes", "qualificationScore", 
      "buyerPersona", "assignedToUserId", "workspaceId", "createdAt", "updatedAt"
    ) VALUES (
      '${lead.id}', '${lead.personId}', '${lead.companyName.replace(/'/g, "''")}', 
      '${lead.status}', '${lead.source}', '${lead.currentStage}', 
      '{${lead.stages.join(",")}}', '{${lead.completedStages.join(",")}}', 
      '${lead.nextAction.replace(/'/g, "''")}', '${lead.notes.replace(/'/g, "''")}', 
      ${lead.qualificationScore}, '${lead.buyerPersona}', '${lead.assignedToUserId}', 
      '${lead.workspaceId}', '${lead.createdAt}', '${lead.updatedAt}'
    );\n`;
  });

  return sql;
}

// Main execution
function main() {
  console.log("🚀 Preparing lead data for Adrata workspace...\n");

  const transformedData = transformLeadData();
  const sql = generateSQL(transformedData);

  // Write SQL file
  fs.writeFileSync("lead-import.sql", sql);

  // Write JSON for review
  fs.writeFileSync("lead-data.json", JSON.stringify(transformedData, null, 2));

  console.log(`✅ Generated ${transformedData.persons.length} Person records`);
  console.log(`✅ Generated ${transformedData.leads.length} Lead records`);
  console.log(`📄 SQL file: lead-import.sql`);
  console.log(`📄 JSON file: lead-data.json`);
  console.log("\n🔄 Next steps:");
  console.log("1. Review the generated data in lead-data.json");
  console.log("2. Run the SQL file against your database");
  console.log("3. Verify data in Action Platform Acquire > Leads");
}

// Note: This is a template. You'll need to:
// 1. Install csv-parser: npm install csv-parser
// 2. Replace the sample data with your actual CSV
// 3. Adjust the workspace and user IDs
console.log("⚠️  This is a template script. Please:");
console.log("1. Replace the sample data with your actual CSV");
console.log("2. Update workspace and user IDs");
console.log("3. Install dependencies: npm install csv-parser");
console.log("4. Run: node prepare-lead-data.js");
