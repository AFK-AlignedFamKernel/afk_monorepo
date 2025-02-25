CREATE TABLE IF NOT EXISTS "dao_creation" (
	"_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" bigint,
	"hash" text,
	"creator" text,
	"token_address" text,
	"contract_address" text,
	"starknet_address" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dao_proposal" (
	"contract_address" text,
	"proposal_id" bigint,
	"creator" text,
	"created_at" integer,
	"end_at" integer,
	"is_canceled" boolean,
	"result" text,
	CONSTRAINT "dao_proposal_contract_address_proposal_id_pk" PRIMARY KEY("contract_address","proposal_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dao_proposal_vote" (
	"contract_address" text,
	"proposal_id" bigint,
	"voter" text,
	"vote" text,
	"votes" bigint,
	"total_votes" bigint,
	"voted_at" integer,
	CONSTRAINT "dao_proposal_vote_contract_address_proposal_id_voter_pk" PRIMARY KEY("contract_address","proposal_id","voter")
);
