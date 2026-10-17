// Writes the OpenAPI document to ./openapi.json (for client code generation / Postman import).
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openApiDocument } from '../src/docs/openapi';

const target = resolve(__dirname, '..', 'openapi.json');
writeFileSync(target, `${JSON.stringify(openApiDocument, null, 2)}\n`, 'utf8');
console.log(`OpenAPI document written to ${target}`);
