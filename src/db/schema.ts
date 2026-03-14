import { pgTable, text, timestamp, doublePrecision, integer, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  currency: text('currency').default('BRL'),
  language: text('language').default('pt-BR'),
  theme: text('theme').default('light'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().references(() => users.id),
  description: text('description').notNull(),
  amount: doublePrecision('amount').notNull(),
  category: text('category').notNull(),
  date: timestamp('date').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const fixedExpenses = pgTable('fixed_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().references(() => users.id),
  name: text('name').notNull(),
  amount: doublePrecision('amount').notNull(),
  category: text('category').notNull(),
  dueDay: integer('due_day').notNull(),
  status: text('status', { enum: ['pending', 'paid'] }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cards = pgTable('cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().references(() => users.id),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  limit: doublePrecision('limit').notNull(),
  closingDay: integer('closing_day').notNull(),
  dueDay: integer('due_day').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cardPurchases = pgTable('card_purchases', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().references(() => users.id),
  cardId: uuid('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: doublePrecision('amount').notNull(),
  category: text('category').notNull(),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
