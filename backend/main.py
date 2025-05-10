from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import requests
import mysql.connector
import logging
from datetime import datetime
from typing import Optional

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust as per your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardcoded API keys
GEMINI_API_KEY = "AIzaSyBOkRelpC9AwXvYsPiOFI89N8VRGxEu7aM"
GOOGLE_CLIENT_ID = "860274569373-66po3v4vviid9fq5gef5dlfkk6kpjkmf.apps.googleusercontent.com"

genai.configure(api_key=GEMINI_API_KEY)

# MySQL connection
db = mysql.connector.connect(
    host="localhost",
    user="root",  
    password="batman1104", 
    database="chatbot_db"
)
cursor = db.cursor(dictionary=True)

# Message schema
class Message(BaseModel):
    message: str

def verify_google_token(token: str):
    """Verify Google token for user authentication."""
    google_url = f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={token}"
    response = requests.get(google_url)
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    return response.json()

def save_user_info(email: str, name: str):
    """Save or fetch user info from the database."""
    try:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            cursor.execute("INSERT INTO users (username, email) VALUES (%s, %s)", (name, email))
            db.commit()
            return cursor.lastrowid
        return user["id"]
    except Exception as e:
        logger.error(f"Error saving user info: {e}")
        raise HTTPException(status_code=500, detail="Error saving user info")

def save_conversation(user_id: int, user_message: str, bot_response: str):
    """Save conversation to the database."""
    try:
        cursor.execute(
            "INSERT INTO conversations (user_id, user_message, bot_response) VALUES (%s, %s, %s)",
            (user_id, user_message, bot_response)
        )
        db.commit()
    except Exception as e:
        logger.error(f"Error saving conversation: {e}")

def get_conversation_history(user_id: int) -> str:
    """Fetch the entire conversation history for a user to provide context."""
    try:
        cursor.execute("""
            SELECT user_message, bot_response
            FROM conversations
            WHERE user_id = %s
            ORDER BY timestamp ASC
        """, (user_id,))
        records = cursor.fetchall()
        conversation = ""
        for row in records:
            conversation += f"User: {row['user_message']}\nBot: {row['bot_response']}\n"
        return conversation
    except Exception as e:
        logger.error(f"Error fetching conversation history: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch conversation history")

@app.post("/chat")
async def chat(request: Request, message: Message):
    """Handle chat request and generate responses and suggestions with context from previous messages."""
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = token.replace("Bearer ", "")
    user_info = verify_google_token(token)

    try:
        email = user_info.get("email")
        name = user_info.get("name", "Unknown")
        user_id = save_user_info(email, name)

        # Fetch the conversation history to provide context to the AI model
        conversation_history = get_conversation_history(user_id)

        model = genai.GenerativeModel("gemini-1.5-flash")

        # 1. Add conversation history to the prompt
        prompt = conversation_history + f"User: {message.message}\nBot:"
        response = model.generate_content(prompt)
        bot_response = response.text

        # 2. Generate follow-up suggestions (secondary prompt)
        suggestion_prompt = (
            f"Based on the user query: '{message.message}', suggest 3 to 5 relevant, helpful follow-up questions or topics the user might be interested in. "
            "Keep them concise and in plain text list format."
        )
        suggestion_response = model.generate_content(suggestion_prompt)
        
        # 3. Extract suggestions as a list
        raw_suggestions = suggestion_response.text
        suggestions = [line.strip("-• ") for line in raw_suggestions.splitlines() if line.strip()]

        # Save the new conversation to the database
        save_conversation(user_id, message.message, bot_response)

        return {
            "response": bot_response,
            "suggestions": suggestions
        }
    except Exception as e:
        logger.error(f"Error generating content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get chat history (grouped by date)
@app.get("/chat-history/{user_id}")
async def get_chat_history(user_id: int):
    """Retrieve chat history grouped by date."""
    try:
        cursor.execute("""
            SELECT id, DATE(timestamp) as date, timestamp
            FROM conversations
            WHERE user_id = %s
            ORDER BY timestamp DESC
        """, (user_id,))
        records = cursor.fetchall()

        grouped = {}
        for row in records:
            date_key = row["date"].strftime("%Y-%m-%d")
            if date_key not in grouped:
                grouped[date_key] = []
            grouped[date_key].append({
                "id": row["id"],
                "timestamp": row["timestamp"].strftime("%H:%M:%S")
            })

        return grouped
    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch chat history")

# Get full conversation
@app.get("/messages/{user_id}")
async def get_user_messages(user_id: int):
    """Retrieve the full conversation for a user."""
    try:
        cursor.execute("""
            SELECT user_message, bot_response, timestamp
            FROM conversations
            WHERE user_id = %s
            ORDER BY timestamp ASC
        """, (user_id,))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch messages")
