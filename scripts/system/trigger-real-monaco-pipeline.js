require("dotenv").config();

async function triggerRealMonacoPipeline() {
  console.log("🚀 TRIGGERING REAL 30-STEP MONACO PIPELINE");
  console.log("==========================================\n");

  try {
    // Get production environment variables
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL not found in environment");
    }

    console.log("✅ Environment variables loaded");

    // Prepare Monaco Pipeline request
    const requestBody = {
      type: "real_monaco_pipeline_30_steps",
      workspaceId: "adrata", // Our clean workspace ID
      userId: "dan", // Dan's clean user ID
      runFullPipeline: true, // CRITICAL: This triggers the full 30-step pipeline
      realTimeUpdates: true,
      maxCompanies: 20, // Start with 20 leads for testing
      debugMode: true,
    };

    console.log("📋 Request body:", JSON.stringify(requestBody, null, 2));

    // Make request to our enrichment API
    const response = await fetch(
      "https://adrata-production.vercel.app/api/enrichment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Adrata-Monaco-Pipeline-Trigger/1.0",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}\n${errorText}`,
      );
    }

    const result = await response.json();

    console.log("\n🎉 MONACO PIPELINE TRIGGERED SUCCESSFULLY!");
    console.log("===========================================");
    console.log(`✅ Execution ID: ${result.executionId}`);
    console.log(`✅ Status: ${result.status}`);
    console.log(`✅ Pipeline Type: ${result.pipelineType}`);
    console.log(`✅ Estimated Duration: ${result.estimatedDuration}`);
    console.log(`✅ Poll URL: ${result.pollUrl}`);

    // Monitor the execution
    const executionId = result.executionId;
    if (executionId) {
      console.log("\n🔍 MONITORING EXECUTION PROGRESS...");
      await monitorExecution(executionId);
    }

    return result;
  } catch (error) {
    console.error("❌ Failed to trigger Monaco Pipeline:", error);
    throw error;
  }
}

async function monitorExecution(executionId) {
  const maxChecks = 30; // Monitor for up to 30 checks (15 minutes if checking every 30s)
  let checks = 0;

  while (checks < maxChecks) {
    try {
      console.log(
        `\n📊 Check ${checks + 1}/${maxChecks} - Polling execution status...`,
      );

      const response = await fetch(
        `https://adrata-production.vercel.app/api/enrichment?workspaceId=adrata`,
      );

      if (!response.ok) {
        console.warn(`⚠️ Failed to poll status: ${response.status}`);
        break;
      }

      const data = await response.json();
      const execution = data.executions?.find(
        (e) => e.executionId === executionId,
      );

      if (execution) {
        console.log(`   Status: ${execution.status}`);
        console.log(
          `   Step: ${execution.currentStep}/${execution.totalSteps}`,
        );
        console.log(
          `   Companies: ${execution.completedCompanies}/${execution.totalCompanies}`,
        );

        if (execution.status === "completed") {
          console.log("\n🎉 EXECUTION COMPLETED!");
          console.log(`   Total Steps: ${execution.totalSteps}`);
          console.log(`   Companies Enriched: ${execution.completedCompanies}`);
          console.log(
            `   Has Intelligence: ${execution.intelligence ? "Yes" : "No"}`,
          );
          console.log(`   Errors: ${execution.errors?.length || 0}`);
          break;
        } else if (execution.status === "failed") {
          console.log("\n❌ EXECUTION FAILED!");
          console.log(
            `   Errors: ${JSON.stringify(execution.errors, null, 2)}`,
          );
          break;
        } else if (execution.status === "running") {
          console.log(
            `   ⏳ Still running... (${((execution.currentStep / execution.totalSteps) * 100).toFixed(1)}% complete)`,
          );
        }
      } else {
        console.log(
          `   ⚠️ Execution ${executionId} not found in recent executions`,
        );
      }

      // Wait 30 seconds before next check
      if (checks < maxChecks - 1) {
        console.log("   ⏳ Waiting 30 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }

      checks++;
    } catch (error) {
      console.error(`❌ Error monitoring execution:`, error);
      break;
    }
  }

  if (checks >= maxChecks) {
    console.log(
      "\n⏰ Monitoring timeout reached. Execution may still be running.",
    );
  }
}

// Run the trigger
if (require.main === module) {
  triggerRealMonacoPipeline()
    .then(() => {
      console.log("\n✅ Monaco Pipeline trigger completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Monaco Pipeline trigger failed:", error);
      process.exit(1);
    });
}

module.exports = { triggerRealMonacoPipeline };
