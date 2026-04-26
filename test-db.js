require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient({ errorFormat: 'pretty' });

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log('✓ Database connected successfully!');
    console.log('Query result:', result);
    process.exit(0);
  } catch (err) {
    console.error('✗ Database connection failed!');
    console.error('Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

testConnection();
