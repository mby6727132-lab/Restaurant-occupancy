// Runs a real local PostgreSQL server without Docker (uses the `embedded-postgres` binaries).
// Usage: npm run db:local   (keep the terminal open; Ctrl+C stops the server)
//
// It matches the defaults in .env.example: user/password "restaurant", port 5432,
// databases "restaurant_db" (development) and "restaurant_test" (automated tests).
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const port = Number(process.env.LOCAL_PG_PORT ?? 5432);
// Kept outside the project folder: PostgreSQL on Windows dislikes non-ASCII paths, and data must not be zipped.
const databaseDir = process.env.LOCAL_PG_DIR ?? join(homedir(), '.restaurant-occupancy-pgdata');
const isNew = !existsSync(join(databaseDir, 'PG_VERSION'));

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'restaurant',
  password: 'restaurant',
  port,
  persistent: true,
  onLog: () => {},
});

if (isNew) {
  console.log(`Initialising a new PostgreSQL data directory at ${databaseDir} ...`);
  await pg.initialise();
}
await pg.start();

for (const name of ['restaurant_db', 'restaurant_test']) {
  try {
    await pg.createDatabase(name);
    console.log(`Created database ${name}`);
  } catch {
    // already exists
  }
}

console.log(`PostgreSQL is running on localhost:${port} (data: ${databaseDir}). Press Ctrl+C to stop.`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
