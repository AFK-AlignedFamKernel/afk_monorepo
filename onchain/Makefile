RPC_PATH := lib/kakarot-rpc
CAIRO_CONTRACTS_PATH := cairo
SOL_CONTRACTS_PATH := solidity_contracts
LOCAL_ENV_PATH := .env
MAKE := make

setup:
	git submodule update --init --recursive && pnpm install . && cp .env.example .env

start:
	@echo "Starting Kakarot (L2 node) and Anvil (L1 node)"
	$(MAKE) -C $(RPC_PATH) local-rpc-up

deploy-l1: copy-env
	pnpm hardhat run scripts/deploy.ts --network l1Rpc

copy-env:
	@echo "Updating .env file with keys from Kakarot RPC container..."
	@container_id=$$(docker-compose -f $(RPC_PATH)/docker-compose.yaml ps -q kakarot-rpc); \
	if docker cp $$container_id:/usr/src/app/.env /tmp/kakarot_temp.env; then \
		while IFS= read -r line; do \
			key=$$(echo $$line | cut -d'=' -f1); \
			value=$$(echo $$line | cut -d'=' -f2-); \
			if grep -q "^$$key=" $(LOCAL_ENV_PATH); then \
				sed -i.bak "s|^$$key=.*|$$key=$$value|" $(LOCAL_ENV_PATH) && rm $(LOCAL_ENV_PATH).bak; \
			else \
				echo $$line >> $(LOCAL_ENV_PATH); \
			fi; \
		done < /tmp/kakarot_temp.env; \
		rm /tmp/kakarot_temp.env; \
		echo ".env file updated at $(LOCAL_ENV_PATH)"; \
	else \
		echo "Failed to copy .env file from container."; \
		exit 1; \
	fi

build: build-cairo build-sol

build-cairo:
	@echo "Building Cairo contracts..."
	cd $(CAIRO_CONTRACTS_PATH) && scarb build

build-sol:
	@echo "Building Solidity contracts..."
	forge build

stop:
	@echo "Stopping Kakarot (L2 node) and Anvil (L1 node)"
	cd $(RPC_PATH) && docker-compose down -v & killall anvil

whitelist-contract: copy-env
	@if [ -z "$(CONTRACT_ADDRESS)" ]; then \
		echo "Error: CONTRACT_ADDRESS is required. Usage: make whitelist-contract CONTRACT_ADDRESS=0x..."; \
		exit 1; \
	fi
	@if [ ! -f $(LOCAL_ENV_PATH) ]; then \
		echo "Error: .env file not found at $(LOCAL_ENV_PATH)"; \
		exit 1; \
	fi
	@KAKAROT_ADDRESS=$$(grep KAKAROT_ADDRESS $(LOCAL_ENV_PATH) | cut -d '=' -f2); \
	if [ -z "$$KAKAROT_ADDRESS" ]; then \
		echo "Error: KAKAROT_ADDRESS not found in .env file"; \
		exit 1; \
	fi; \
	echo "Using KAKAROT_ADDRESS: $$KAKAROT_ADDRESS"; \
	echo "Whitelisting CONTRACT_ADDRESS: $(CONTRACT_ADDRESS)"; \
	starkli invoke $$KAKAROT_ADDRESS set_authorized_cairo_precompile_caller $(CONTRACT_ADDRESS) 1

test: copy-env build
	@echo "Running tests..."
	pnpm hardhat test
