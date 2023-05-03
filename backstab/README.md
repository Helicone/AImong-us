# backstab

backend for aimong.us

```
# Make sure you run the aigent server before running this server (../aigent)

export AIGENT_BASE_URL='https://127.0.0.1:5934'
cargo run
```

running in prod

```
cd ..
docker build -t backstab . -f backstab/dockerfile
docker run -p 8000:8000 backstab
```
