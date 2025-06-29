-- TODO: unique, ... constraints

CREATE TABLE Pixels (
  address char(64) NOT NULL,
  position integer NOT NULL,
  day integer NOT NULL,
  color integer NOT NULL,
  time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT NULL,
  shield JSONB DEFAULT NULL
);
CREATE INDEX pixels_address_index ON Pixels (address);
CREATE INDEX pixels_position_index ON Pixels (position);
CREATE INDEX pixels_day_index ON Pixels (day);
CREATE INDEX pixels_color_index ON Pixels (color);
CREATE INDEX pixels_time_index ON Pixels (time);

CREATE TABLE LastPlacedTime (
  address char(64) NOT NULL,
  time timestamp NOT NULL,
  UNIQUE (address)
);
CREATE INDEX lastPlacedTime_address_index ON LastPlacedTime (address);
CREATE INDEX lastPlacedTime_time_index ON LastPlacedTime (time);

CREATE TABLE ExtraPixels (
  address char(64) NOT NULL UNIQUE,
  available integer NOT NULL,
  used integer NOT NULL
);
CREATE INDEX extraPixels_address_index ON ExtraPixels (address);

CREATE TABLE Users (
  address char(64) NOT NULL,
  name text NOT NULL
);
CREATE INDEX user_address_index ON Users (address);

CREATE TABLE Days (
  -- Postgres auto-incrementing primary key
  key integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  day_index integer NOT NULL,
  day_start timestamp NOT NULL
);
CREATE INDEX days_day_index_index ON Days (day_index);

CREATE TABLE DailyQuests (
  day_index integer NOT NULL,
  quest_id integer NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  reward integer NOT NULL,
  quest_type text NOT NULL,
  PRIMARY KEY (day_index, quest_id)
);
CREATE INDEX dailyQuests_day_index_index ON DailyQuests (day_index);
CREATE INDEX dailyQuests_quest_id_index ON DailyQuests (quest_id);

CREATE TABLE DailyQuestsInput (
  day_index integer NOT NULL,
  quest_id integer NOT NULL,
  input_key integer NOT NULL,
  input_value integer NOT NULL,
  PRIMARY KEY (day_index, quest_id, input_key)
);
CREATE INDEX dailyQuestsInput_day_index_index ON DailyQuestsInput (day_index);
CREATE INDEX dailyQuestsInput_quest_id_index ON DailyQuestsInput (quest_id);
CREATE INDEX dailyQuestsInput_input_key_index ON DailyQuestsInput (input_key);

CREATE TABLE DailyQuestsClaimParams (
  day_index integer NOT NULL,
  quest_id integer NOT NULL,
  claim_key integer NOT NULL,
  claim_type text NOT NULL,
  name text NOT NULL,
  example text,
  input boolean NOT NULL,
  PRIMARY KEY (day_index, quest_id, claim_key)
);
CREATE INDEX dailyQuestsClaimParams_day_index_index ON DailyQuestsClaimParams (day_index);
CREATE INDEX dailyQuestsClaimParams_quest_id_index ON DailyQuestsClaimParams (quest_id);
CREATE INDEX dailyQuestsClaimParams_claim_key_index ON DailyQuestsClaimParams (claim_key);

-- Table for storing the daily quests that the user has completed
CREATE TABLE UserDailyQuests (
  -- Postgres auto-incrementing primary key
  key integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_address char(64) NOT NULL,
  day_index integer NOT NULL,
  quest_id integer NOT NULL,
  completed boolean NOT NULL,
  completed_at timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_address, day_index, quest_id)
);
CREATE INDEX userDailyQuests_user_address_index ON UserDailyQuests (user_address);
CREATE INDEX userDailyQuests_quest_id_index ON UserDailyQuests (quest_id);

CREATE TABLE MainQuests (
  -- Postgres auto-incrementing primary key
  key integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  description text NOT NULL,
  reward integer NOT NULL,
  quest_type text NOT NULL
);

CREATE TABLE MainQuestsInput (
  quest_id integer NOT NULL,
  input_key integer NOT NULL,
  input_value integer NOT NULL,
  PRIMARY KEY (quest_id, input_key)
);
CREATE INDEX mainQuestsInput_quest_id_index ON MainQuestsInput (quest_id);
CREATE INDEX mainQuestsInput_input_key_index ON MainQuestsInput (input_key);

CREATE TABLE MainQuestsClaimParams (
  quest_id integer NOT NULL,
  claim_key integer NOT NULL,
  claim_type text NOT NULL,
  name text NOT NULL,
  example text,
  input boolean NOT NULL,
  PRIMARY KEY (quest_id, claim_key)
);
CREATE INDEX mainQuestsClaimParams_quest_id_index ON MainQuestsClaimParams (quest_id);
CREATE INDEX mainQuestsClaimParams_claim_key_index ON MainQuestsClaimParams (claim_key);

-- Table for storing the main quests that the user has completed
CREATE TABLE UserMainQuests (
  -- Postgres auto-incrementing primary key
  key integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_address char(64) NOT NULL,
  quest_id integer NOT NULL,
  completed boolean NOT NULL,
  completed_at timestamp
);
CREATE INDEX userMainQuests_user_address_index ON UserMainQuests (user_address);
CREATE INDEX userMainQuests_quest_id_index ON UserMainQuests (quest_id);

-- TODO: key to color_idx
CREATE TABLE Colors (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  color_key integer NOT NULL,
  hex text NOT NULL
);
CREATE INDEX colors_color_key_index ON Colors (color_key);

-- TODO: Add day_index
CREATE TABLE VotableColors (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  day_index integer NOT NULL,
  color_key integer NOT NULL,
  hex text NOT NULL,
  UNIQUE (day_index, color_key)
);
CREATE INDEX votableColors_day_index_index ON VotableColors (day_index);
CREATE INDEX votableColors_color_key_index ON VotableColors (color_key);

CREATE TABLE ColorVotes (
  -- Postgres auto-incrementing primary key
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_address char(64) NOT NULL,
  day_index integer NOT NULL,
  color_key integer NOT NULL,
  UNIQUE (user_address, day_index)
);
CREATE INDEX colorVotes_user_address_index ON ColorVotes (user_address);
CREATE INDEX colorVotes_day_index ON ColorVotes (day_index);
CREATE INDEX colorVotes_color_key_index ON ColorVotes (color_key);

CREATE TABLE TemplateData (
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hash text NOT NULL,
  data bytea NOT NULL
);

-- TODO: key -> template_id?
CREATE TABLE Templates (
  key integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  hash text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  position integer NOT NULL,
  reward integer NOT NULL,
  reward_token char(64) NOT NULL
);

CREATE TABLE StencilData (
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hash text NOT NULL,
  data bytea NOT NULL
);

CREATE TABLE Stencils (
  stencil_id integer NOT NULL,
  world_id integer NOT NULL,
  hash text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  position integer NOT NULL,
  ipfs_hash text,
  UNIQUE (stencil_id, world_id)
);
CREATE INDEX stencils_stencil_id_index ON Stencils (stencil_id);
CREATE INDEX stencils_world_id_index ON Stencils (world_id);

CREATE TABLE StencilFavorites (
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  stencil_id integer NOT NULL,
  world_id integer NOT NULL,
  user_address char(64) NOT NULL,
  UNIQUE (stencil_id, world_id, user_address)
);
CREATE INDEX stencilFavorites_stencil_id_index ON StencilFavorites (stencil_id);
CREATE INDEX stencilFavorites_world_id_index ON StencilFavorites (world_id);
CREATE INDEX stencilFavorites_user_index ON StencilFavorites (user_address);

CREATE TABLE NFTs (
  token_id integer NOT NULL PRIMARY KEY,
  position integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  name text NOT NULL,
  image_hash text NOT NULL,
  block_number integer NOT NULL,
  day_index integer NOT NULL,
  minter char(64) NOT NULL,
  owner char(64) NOT NULL
);

CREATE TABLE NFTLikes (
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nftKey integer NOT NULL,
  liker char(64) NOT NULL,
  UNIQUE (nftKey, liker)
);
CREATE INDEX nftLikes_nft_key_index ON NFTLikes (nftKey);
CREATE INDEX nftLikes_liker_index ON NFTLikes (liker);

CREATE TABLE Factions (
  faction_id integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  leader char(64) NOT NULL,
  joinable boolean NOT NULL,
  allocation integer NOT NULL
);
CREATE INDEX factions_leader_index ON Factions (leader);
CREATE INDEX factions_joinable_index ON Factions (joinable);

CREATE TABLE ChainFactions (
  faction_id integer NOT NULL PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE FactionLinks (
  faction_id integer NOT NULL,
  icon text NOT NULL,
  telegram text,
  twitter text,
  github text,
  site text,
  PRIMARY KEY (faction_id)
);
CREATE INDEX factionLinks_faction_id_index ON FactionLinks (faction_id);

CREATE TABLE ChainFactionLinks (
  faction_id integer NOT NULL,
  icon text NOT NULL,
  telegram text,
  twitter text,
  github text,
  site text,
  PRIMARY KEY (faction_id)
);
CREATE INDEX chainFactionLinks_faction_id_index ON ChainFactionLinks (faction_id);

CREATE TABLE FactionMembersInfo (
  faction_id integer NOT NULL,
  user_address char(64) NOT NULL,
  last_placed_time timestamp NOT NULL,
  member_pixels integer NOT NULL,
  UNIQUE (faction_id, user_address)
);
CREATE INDEX factionMembersInfo_faction_id_index ON FactionMembersInfo (faction_id);
CREATE INDEX factionMembersInfo_user_address_index ON FactionMembersInfo (user_address);

CREATE TABLE ChainFactionMembersInfo (
  faction_id integer NOT NULL,
  user_address char(64) NOT NULL,
  last_placed_time timestamp NOT NULL,
  member_pixels integer NOT NULL,
  UNIQUE (faction_id, user_address)
);
CREATE INDEX chainFactionMembersInfo_faction_id_index ON ChainFactionMembersInfo (faction_id);
CREATE INDEX chainFactionMembersInfo_user_address_index ON ChainFactionMembersInfo (user_address);

CREATE TABLE FactionTemplates (
  template_id integer NOT NULL,
  faction_id integer NOT NULL,
  hash text NOT NULL,
  position integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  stale boolean NOT NULL
);
CREATE INDEX factionTemplates_template_id_index ON FactionTemplates (template_id);
CREATE INDEX factionTemplates_faction_id_index ON FactionTemplates (faction_id);
CREATE INDEX factionTemplates_stale_index ON FactionTemplates (stale);

CREATE TABLE ChainFactionTemplates (
  template_id integer NOT NULL,
  faction_id integer NOT NULL,
  hash text NOT NULL,
  position integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  stale boolean NOT NULL
);
CREATE INDEX chainFactionTemplates_template_id_index ON ChainFactionTemplates (template_id);
CREATE INDEX chainFactionTemplates_faction_id_index ON ChainFactionTemplates (faction_id);
CREATE INDEX chainFactionTemplates_stale_index ON ChainFactionTemplates (stale);

-- TODO: allow marking claimed
CREATE TABLE AwardWinners (
  address char(64) NOT NULL,
  amount int NOT NULL,
  type text NOT NULL
);
CREATE INDEX address ON AwardWinners (address);
CREATE INDEX type ON AwardWinners (type);

CREATE TABLE Worlds (
  world_id integer NOT NULL PRIMARY KEY,
  host char(64) NOT NULL,
  name text NOT NULL,
  unique_name text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  pixels_per_time integer NOT NULL,
  time_between_pixels integer NOT NULL,
  start_time timestamp NOT NULL,
  end_time timestamp NOT NULL
);
CREATE INDEX worlds_host_index ON Worlds (host);
CREATE INDEX worlds_unique_name_index ON Worlds (unique_name);
CREATE INDEX worlds_start_time_index ON Worlds (start_time);
CREATE INDEX worlds_end_time_index ON Worlds (end_time);

CREATE TABLE WorldFavorites (
  key int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  world_id integer NOT NULL,
  user_address char(64) NOT NULL,
  UNIQUE (world_id, user_address)
);
CREATE INDEX worldFavorites_world_id_index ON WorldFavorites (world_id);
CREATE INDEX worldFavorites_user_index ON WorldFavorites (user_address);

CREATE TABLE WorldsPixels (
  world_id integer NOT NULL,
  address char(64) NOT NULL,
  position integer NOT NULL,
  color integer NOT NULL,
  time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX worldspixels_world_id_index ON WorldsPixels (world_id);
CREATE INDEX worldspixels_address_index ON WorldsPixels (address);
CREATE INDEX worldspixels_position_index ON WorldsPixels (position);
CREATE INDEX worldspixels_color_index ON WorldsPixels (color);
CREATE INDEX worldspixels_time_index ON WorldsPixels (time);

CREATE TABLE WorldsLastPlacedTime (
  world_id integer NOT NULL,
  address char(64) NOT NULL,
  time timestamp NOT NULL,
  UNIQUE (world_id, address)
);
CREATE INDEX worldlastPlacedTime_world_id_index ON WorldsLastPlacedTime (world_id);
CREATE INDEX worldlastPlacedTime_address_index ON WorldsLastPlacedTime (address);
CREATE INDEX worldlastPlacedTime_time_index ON WorldsLastPlacedTime (time);

CREATE TABLE WorldsExtraPixels (
  world_id integer NOT NULL,
  address char(64) NOT NULL,
  available integer NOT NULL,
  used integer NOT NULL,
  UNIQUE (world_id, address)
);
CREATE INDEX worldextraPixels_world_id_index ON WorldsExtraPixels (world_id);
CREATE INDEX worldextraPixels_address_index ON WorldsExtraPixels (address);

CREATE TABLE WorldsColors (
  -- Postgres auto-incrementing primary key
  world_id integer NOT NULL,
  color_key integer NOT NULL,
  hex text NOT NULL,
  UNIQUE (world_id, color_key)
);
CREATE INDEX worldcolors_world_id_index ON WorldsColors (world_id);
CREATE INDEX worldcolors_color_key_index ON WorldsColors (color_key);

CREATE TABLE PixelShields (
  address char(64) NOT NULL,
  position bigint NOT NULL,
  shield_type int NOT NULL,
  amount_paid numeric NOT NULL,
  placed_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (address, position, shield_type)
);
CREATE INDEX pixelShields_address_index ON PixelShields (address);
CREATE INDEX pixelShields_position_index ON PixelShields (position);
CREATE INDEX pixelShields_shield_type_index ON PixelShields (shield_type);
CREATE INDEX pixelShields_placed_at_index ON PixelShields (placed_at);

CREATE TABLE stencil_images (
  id SERIAL PRIMARY KEY,          
  hash VARCHAR(64) NOT NULL,      
  ipfs_hash VARCHAR(64) NOT NULL, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hash ON stencil_images (hash);
CREATE INDEX idx_ipfs_hash ON stencil_images (ipfs_hash);