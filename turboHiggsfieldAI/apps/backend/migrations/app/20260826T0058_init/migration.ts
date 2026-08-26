#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/302cc6ae930b8bff7a54952fba43aa1a609aa737a5eec8e837543644372d02b8/contract';
import endContract from '../../snapshots/302cc6ae930b8bff7a54952fba43aa1a609aa737a5eec8e837543644372d02b8/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'avatar',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'avatarImage',
        columns: [
          col('avatarId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('avatarImage_type_check_7e4b911f', "\"type\" IN ('User', 'Model')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'avatarVideo',
        columns: [
          col('duration', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('endFrame', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('height', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('prompt', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('startFrame', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('width', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'avatarVideo_status_check_e5c75c8b',
            "\"status\" IN ('Pending', 'Done', 'Error')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'avatarVideoReference',
        columns: [
          col('avatarId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('avatarVideoId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('username', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'avatarVideoReference',
        constraint: 'avatarVideoReference_avatarVideoId_avatarId_key',
        columns: ['avatarVideoId', 'avatarId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_username_key',
        columns: ['username'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'avatar',
        index: 'avatar_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'avatarImage',
        index: 'avatarImage_avatarId_idx_14b51a84',
        columns: ['avatarId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'avatarVideo',
        index: 'avatarVideo_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'avatarVideoReference',
        index: 'avatarVideoReference_avatarId_idx_14b51a84',
        columns: ['avatarId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'avatarVideoReference',
        index: 'avatarVideoReference_avatarVideoId_idx_f4e58f10',
        columns: ['avatarVideoId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'avatar',
        foreignKey: {
          name: 'avatar_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'avatarImage',
        foreignKey: {
          name: 'avatarImage_avatarId_fkey',
          columns: ['avatarId'],
          references: { schema: 'public', table: 'avatar', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'avatarVideo',
        foreignKey: {
          name: 'avatarVideo_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'avatarVideoReference',
        foreignKey: {
          name: 'avatarVideoReference_avatarId_fkey',
          columns: ['avatarId'],
          references: { schema: 'public', table: 'avatar', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'avatarVideoReference',
        foreignKey: {
          name: 'avatarVideoReference_avatarVideoId_fkey',
          columns: ['avatarVideoId'],
          references: { schema: 'public', table: 'avatarVideo', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
