from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from nlp_engine import get_bot_response

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "API is live"}

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    user_input = data.get("message")
    if not user_input:
        return {"response": "Please provide a message."}
    
    response = get_bot_response(user_input)
    return {"response": response}
