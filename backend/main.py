from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import requests
import os
import logging

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardcoded API keys
GEMINI_API_KEY = "AIzaSyBOkRelpC9AwXvYsPiOFI89N8VRGxEu7aM"
GOOGLE_CLIENT_ID = "860274569373-66po3v4vviid9fq5gef5dlfkk6kpjkmf.apps.googleusercontent.com"

genai.configure(api_key=GEMINI_API_KEY)

class Message(BaseModel):
    message: str

def verify_google_token(token: str):
    google_url = f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={token}"
    response = requests.get(google_url)
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    return response.json()

@app.post("/chat")
async def chat(request: Request, message: Message):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = token.replace("Bearer ", "")  # Remove 'Bearer ' prefix
    user_info = verify_google_token(token)  # Validate token

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(message.message)
        return {"response": response.text}
    except Exception as e:
        logger.error(f"Error generating content: {e}")
        raise HTTPException(status_code=500, detail=str(e))