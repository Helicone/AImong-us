# aigent

AI agent client for aimongus.com

```
cd ..
docker build -t fastapi-cargo-server . -f aigent/dockerfile


# Env1 - Set Base URL

# For Mac/Windows host.docker.internal
BACK_STAB_BASE_URL=host.docker.internal:8000
# For Linux you need to use the IP from your local network IP Address
BACK_STAB_BASE_URL=192.168.1.XXX
# For prod
BACK_STAB_BASE_URL=wss://api.among.us

# Env2 - Set OpenAI key
OPENAI_API_KEY="sk-"


docker run -e BACK_STAB_BASE_URL=${BACK_STAB_BASE_URL} -e OPENAI_API_KEY=${OPENAI_API_KEY} -v ${PWD}/docker-target-cache:/app/target -p 5934:5934 fastapi-cargo-server
```
