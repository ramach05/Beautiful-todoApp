ALTER TABLE "todos" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "todos_user_position_idx" ON "todos" USING btree ("user_id","position");