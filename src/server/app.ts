import { startApp } from 'modelence/server';
import exampleModule from '@/server/example';
import tripwiseModule from '@/server/tripwise';
import { createDemoUser } from '@/server/migrations/createDemoUser';

// Start the app with error handling
startApp({
  modules: [exampleModule, tripwiseModule],
  migrations: [{
    version: 1,
    description: 'Create demo user',
    handler: createDemoUser,
  }],
}).catch((error) => {
  console.error('Failed to start Modelence app:', error);
  process.exit(1);
});
