import { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  var __MONGOD__: MongoMemoryServer | undefined;
}

/**
 * Starts an in-memory MongoDB before any test file is loaded, so the
 * application picks up its URI when the module graph is imported.
 */
export default async function globalSetup(): Promise<void> {
  const mongod = await MongoMemoryServer.create();
  globalThis.__MONGOD__ = mongod;
  process.env.MONGODB_URI = mongod.getUri('order-management-e2e');
}
