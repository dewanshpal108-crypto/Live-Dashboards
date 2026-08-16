import { pgEnum, integer , pgTable, serial, text, timestamp , json } from 'drizzle-orm/pg-core';

export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished']);
// Define the 'Matches' table
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  sport: text('sports').notNull(),
  startTime: timestamp('start_time'),
  status: matchStatusEnum('status').notNull().default('scheduled'),
  homeScore: integer('home_score').default(0),
  awayScore: integer('away_score').default(0),
  endTime: timestamp('end_time'),
  createdAt: timestamp('created_at').defaultNow().notNull().defaultNow(),
});


export const commentary = pgTable('commentary', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').notNull().references(() => matches.id),
  minute: integer('minute'),
  actor: text('actor'),
  period: text('period'),
  eventType: text('event_type'),
  message: text('message').notNull(),
  team: text('team'),
  sequenceNo: integer('sequence_no'),
  metaData: json('meta_data'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


// Export types for type-safe queries
export const Match = matches.$inferSelect;
export const NewMatch = matches.$inferInsert;
