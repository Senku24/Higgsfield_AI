import 'dotenv/config';
import { Temporal } from '@js-temporal/polyfill';

if (typeof globalThis.Temporal === 'undefined') {
  (globalThis as any).Temporal = Temporal;
}

import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './schema.d';
import contractJson from './schema.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL_UNPOOLED']!,
});
