import { config } from "dotenv";
import { initializeHostelCollection } from "@/lib/typesense";
import { syncAllHostelsToTypesense } from "@/lib/typesense-sync";

// Load environment variables from .env.local
config({ path: ".env.local" });

/**
 * Script to initialize Typesense and sync all hostels
 * 
 * Usage:
 *   npx tsx scripts/setup-typesense.ts
 */
async function main() {
  try {
    console.log("🔍 Setting up Typesense for HostelLo...\n");

    // Verify environment variables
    if (!process.env.TYPESENSE_HOST || !process.env.TYPESENSE_API_KEY) {
      throw new Error(
        "Missing Typesense configuration. Set TYPESENSE_HOST and TYPESENSE_API_KEY in .env.local"
      );
    }

    console.log(`✓ Connected to Typesense at ${process.env.TYPESENSE_HOST}\n`);

    // Step 1: Initialize collection schema
    console.log("Step 1: Initializing Typesense collection schema");
    await initializeHostelCollection();

    // Step 2: Sync all active hostels
    console.log("\nStep 2: Syncing hostels to Typesense");
    await syncAllHostelsToTypesense();

    console.log("\n✅ Typesense setup complete!");
  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  }
}

main();
