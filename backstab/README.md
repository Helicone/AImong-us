# backstab

backend for aimong.us

```
# Make sure you run the aigent server before running this server (../aigent)
cd ../aigent
cargo build --release
cd ../backstab

export OPENAI_API_KEY='sk-gaaa'
export BACK_STAB_BASE_URL=ws://localhost:8000
cargo run
```
