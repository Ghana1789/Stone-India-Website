import dotenv from 'dotenv';
import patchMongoose from './mockDb.js';

dotenv.config();

// Determine if we are in Demo Mode early
// We also check if we are NOT in production as a safety measure
const USE_MOCK = process.env.USE_MOCK === 'true'; 

if (USE_MOCK) {
  patchMongoose();
}

export { USE_MOCK };
