# AIMONG-US
[![](https://img.shields.io/badge/Visit%20Us-aimong.us-brightgreen)](https://www.aimong.us/)
[![](https://img.shields.io/badge/Join%20our%20community-Discord-blue)](https://discord.com/invite/hySsN9KCSt)

## Getting Started

### First, set up Rust
```bash
# install rust https://www.rust-lang.org/tools/install
rustup default nightly
```

### Run the backend
```bash
cd backstab
export AIGENT_BASE_URL='http://0.0.0.0:5934'
cargo run
```

### Run the agent (from root directory)
```bash
# Set up OpenAI API Key https://platform.openai.com/account/api-keys
# i.e. sk-ABCD123EFGHIJK4567LMNOPQRSTUVWXYZ890123ABC
export OPENAI_API_KEY="sk-${OPENAI_KEY}"
export BACK_STAB_BASE_URL="ws://host.docker.internal:8000"
```

```bash
docker build -t fastapi-cargo-server . -f aigent/dockerfile
docker run -e BACK_STAB_BASE_URL=${BACK_STAB_BASE_URL} -e OPENAI_API_KEY=${OPENAI_API_KEY} -v ${PWD}/docker-target-cache:/app/target -p 5934:5934 fastapi-cargo-server
```

### Run the frontend (from root directory)
```bash
npm install && npm run dev
# or
yarn && yarn dev
```

## How to play
Check out [this video](https://www.youtube.com/watch?v=5DlROhT8NgU).
