import { PrismaClient } from '../prisma/client.js';

const prisma = new PrismaClient();

async function fixMigrationNames() {
  try {
    console.log('Connecting to database...');
    
    // Get all migrations
    const migrations = await prisma._queryRaw(`
      SELECT migration_name, started_at, finished_at, execution_time FROM _prisma_migrations
      ORDER BY finished_at ASC
    `);
    
    console.log('Current migrations in database:');
    console.log(migrations);
    
    // Map old names to new names
    const renameMap: Record<string, string> = {
      '0_init': '20260101000000_init',
      '1_currency_int': '20260115000000_currency_int',
      '2_add_notifications': '20260201000000_add_notifications',
      '3_add_phone_verification': '20260215000000_add_phone_verification',
      '4_add_last_known_price': '20260301000000_add_last_known_price',
    };
    
    // Update each migration name
    for (const [oldName, newName] of Object.entries(renameMap)) {
      console.log(`\nUpdating ${oldName} → ${newName}`);
      const result = await prisma._executeRaw(`
        UPDATE _prisma_migrations 
        SET migration_name = $1 
        WHERE migration_name = $2
      `, [newName, oldName]);
      console.log(`Updated: ${result} rows`);
    }
    
    console.log('\n✓ Migration names updated successfully');
    
    // Verify
    const updated = await prisma._queryRaw(`
      SELECT migration_name FROM _prisma_migrations ORDER BY finished_at ASC
    `);
    console.log('\nVerification - migrations now in database:');
    console.log(updated);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigrationNames();
