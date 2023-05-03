import subprocess
from fastapi import FastAPI

app = FastAPI()

# Build the Rust app in release mode when the server starts
subprocess.run(["cargo", "build", "--release"])

@app.get("/")
async def run_cargo(room_id: str, aicode: str):
    # Execute the binary on each HTTP request
    binary_path = "target/release/aigent"  
    
    # Timeout after 20 minutes
    cmd = f"timeout 1200 {binary_path} {room_id} {aicode}"
    subprocess.Popen(cmd, shell=True)
    return {"message": "Process started", "room_id": room_id, "aicode": aicode}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5934)
