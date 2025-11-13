from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Form, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path
import os
import uuid
import logging
import bcrypt
import jwt
import requests
import socketio
import shutil
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')

# Create FastAPI app
app = FastAPI(title="Social X API")
api_router = APIRouter(prefix="/api")

# WebSocket manager for real-time features
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_message(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                self.disconnect(user_id)

    async def broadcast(self, message: dict):
        disconnected = []
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except:
                disconnected.append(user_id)
        for user_id in disconnected:
            self.disconnect(user_id)

manager = ConnectionManager()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    cover_photo: Optional[str] = None
    bio: Optional[str] = None
    work: Optional[str] = None
    education: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    password_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content: str
    media_urls: List[str] = []
    post_type: str = "regular"  # regular, reel
    hashtags: List[str] = []
    mentions: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Reaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    user_id: str
    reaction_type: str  # like, love, haha, wow, sad, angry
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    parent_comment_id: Optional[str] = None
    user_id: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Connection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    target_user_id: str
    connection_type: str = "follow"  # follow, friend
    status: str = "accepted"  # pending, accepted, blocked
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    sender_id: str
    content: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participants: List[str]
    conversation_type: str = "direct"  # direct, group
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Story(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    media_url: str
    media_type: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    content: str
    read: bool = False
    link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Group(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    group_type: str = "public"  # public, private
    admin_user_ids: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarketplaceItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    price: float
    images: List[str] = []
    status: str = "active"  # active, sold
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    event_date: datetime
    location: str
    attendees: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JobProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    experience: List[Dict[str, Any]] = []
    skills: List[str] = []
    resume_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JobPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    title: str
    description: str
    requirements: str
    location: str
    salary_range: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
async def get_current_user(authorization: str = None) -> Optional[User]:
    if not authorization:
        return None
    
    # Try session token first
    try:
        if authorization.startswith('Bearer '):
            token = authorization.replace('Bearer ', '')
        else:
            token = authorization
        
        session = await db.user_sessions.find_one({"session_token": token})
        if session and session['expires_at'] > datetime.now(timezone.utc):
            user_doc = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
            if user_doc:
                return User(**user_doc)
    except:
        pass
    
    # Try JWT token
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_doc = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if user_doc:
            return User(**user_doc)
    except:
        pass
    
    return None

def create_jwt_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def create_notification(user_id: str, notification_type: str, content: str, link: Optional[str] = None):
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        content=content,
        link=link
    )
    doc = notification.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notifications.insert_one(doc)
    
    # Send real-time notification
    await manager.send_message(user_id, {
        'type': 'notification',
        'data': doc
    })

# File upload helper
async def save_upload_file(file: UploadFile, folder: str) -> str:
    file_ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = Path(f"/app/backend/uploads/{folder}/{filename}")
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return f"/uploads/{folder}/{filename}"

# Auth Routes
@api_router.post("/auth/register")
async def register(email: EmailStr = Form(...), password: str = Form(...), name: str = Form(...)):
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=email,
        name=name,
        password_hash=hash_password(password)
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    token = create_jwt_token(user.id)
    
    return {
        "success": True,
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name, "picture": user.picture}
    }

@api_router.post("/auth/login")
async def login(email: EmailStr = Form(...), password: str = Form(...)):
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user_doc['id'])
    
    return {
        "success": True,
        "token": token,
        "user": {"id": user_doc['id'], "email": user_doc['email'], "name": user_doc['name'], "picture": user_doc.get('picture')}
    }

@api_router.get("/auth/me")
async def get_me(authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": user.model_dump()}

@api_router.post("/auth/google/callback")
async def google_auth_callback(session_id: str = Form(...)):
    try:
        response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session")
        
        data = response.json()
        
        # Check if user exists
        user_doc = await db.users.find_one({"email": data['email']}, {"_id": 0})
        
        if not user_doc:
            # Create new user
            user = User(
                email=data['email'],
                name=data['name'],
                picture=data.get('picture')
            )
            doc = user.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.users.insert_one(doc)
            user_id = user.id
        else:
            user_id = user_doc['id']
        
        # Create session
        session = UserSession(
            user_id=user_id,
            session_token=data['session_token'],
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        
        session_doc = session.model_dump()
        session_doc['expires_at'] = session_doc['expires_at'].isoformat()
        session_doc['created_at'] = session_doc['created_at'].isoformat()
        await db.user_sessions.insert_one(session_doc)
        
        return {
            "success": True,
            "token": data['session_token'],
            "user": {"id": user_id, "email": data['email'], "name": data['name'], "picture": data.get('picture')}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Profile Routes
@api_router.get("/profile/{user_id}")
async def get_profile(user_id: str, authorization: str = Query(None)):
    current_user = await get_current_user(authorization)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get connection status
    connection = await db.connections.find_one({
        "user_id": current_user.id,
        "target_user_id": user_id
    })
    
    user['connection_status'] = connection['status'] if connection else None
    
    return user

@api_router.put("/profile")
async def update_profile(
    authorization: str = Query(None),
    bio: Optional[str] = Form(None),
    work: Optional[str] = Form(None),
    education: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    picture: Optional[UploadFile] = File(None),
    cover_photo: Optional[UploadFile] = File(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_data = {}
    if bio is not None:
        update_data['bio'] = bio
    if work is not None:
        update_data['work'] = work
    if education is not None:
        update_data['education'] = education
    if city is not None:
        update_data['city'] = city
    
    if picture:
        picture_url = await save_upload_file(picture, "profiles")
        update_data['picture'] = picture_url
    
    if cover_photo:
        cover_url = await save_upload_file(cover_photo, "profiles")
        update_data['cover_photo'] = cover_url
    
    if update_data:
        await db.users.update_one({"id": user.id}, {"$set": update_data})
    
    return {"success": True, "message": "Profile updated"}

# Connection Routes
@api_router.post("/connections/follow/{target_user_id}")
async def follow_user(target_user_id: str, authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    existing = await db.connections.find_one({
        "user_id": user.id,
        "target_user_id": target_user_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already following")
    
    connection = Connection(
        user_id=user.id,
        target_user_id=target_user_id,
        connection_type="follow"
    )
    
    doc = connection.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.connections.insert_one(doc)
    
    # Create notification
    target_user = await db.users.find_one({"id": target_user_id}, {"_id": 0})
    if target_user:
        await create_notification(
            target_user_id,
            "follow",
            f"{user.name} started following you",
            f"/profile/{user.id}"
        )
    
    return {"success": True}

@api_router.delete("/connections/unfollow/{target_user_id}")
async def unfollow_user(target_user_id: str, authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await db.connections.delete_one({
        "user_id": user.id,
        "target_user_id": target_user_id
    })
    
    return {"success": True}

@api_router.get("/connections/followers")
async def get_followers(authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    connections = await db.connections.find({"target_user_id": user.id}, {"_id": 0}).to_list(1000)
    follower_ids = [c['user_id'] for c in connections]
    
    followers = await db.users.find({"id": {"$in": follower_ids}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    return {"followers": followers}

@api_router.get("/connections/following")
async def get_following(authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    connections = await db.connections.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    following_ids = [c['target_user_id'] for c in connections]
    
    following = await db.users.find({"id": {"$in": following_ids}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    return {"following": following}

# Post Routes
@api_router.post("/posts")
async def create_post(
    authorization: str = Query(None),
    content: str = Form(...),
    post_type: str = Form("regular"),
    files: List[UploadFile] = File(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    media_urls = []
    if files:
        folder = "posts" if post_type == "regular" else "reels"
        for file in files:
            url = await save_upload_file(file, folder)
            media_urls.append(url)
    
    # Extract hashtags and mentions
    hashtags = [word[1:] for word in content.split() if word.startswith('#')]
    mentions = [word[1:] for word in content.split() if word.startswith('@')]
    
    post = Post(
        user_id=user.id,
        content=content,
        media_urls=media_urls,
        post_type=post_type,
        hashtags=hashtags,
        mentions=mentions
    )
    
    doc = post.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.posts.insert_one(doc)
    
    # Notify mentioned users
    for mention in mentions:
        mentioned_user = await db.users.find_one({"name": mention}, {"_id": 0})
        if mentioned_user:
            await create_notification(
                mentioned_user['id'],
                "mention",
                f"{user.name} mentioned you in a post",
                f"/post/{post.id}"
            )
    
    return {"success": True, "post": doc}

@api_router.get("/posts/feed")
async def get_feed(authorization: str = Query(None), skip: int = Query(0), limit: int = Query(20)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get following users
    connections = await db.connections.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    following_ids = [c['target_user_id'] for c in connections]
    following_ids.append(user.id)  # Include own posts
    
    # Get posts
    posts = await db.posts.find(
        {"user_id": {"$in": following_ids}, "post_type": "regular"},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user data and stats
    for post in posts:
        post_user = await db.users.find_one({"id": post['user_id']}, {"_id": 0, "password_hash": 0})
        post['user'] = post_user
        
        # Get reaction counts
        reactions = await db.reactions.find({"post_id": post['id']}, {"_id": 0}).to_list(1000)
        post['reaction_counts'] = {}
        for reaction in reactions:
            rtype = reaction['reaction_type']
            post['reaction_counts'][rtype] = post['reaction_counts'].get(rtype, 0) + 1
        
        # Check if current user reacted
        user_reaction = await db.reactions.find_one({"post_id": post['id'], "user_id": user.id})
        post['user_reaction'] = user_reaction['reaction_type'] if user_reaction else None
        
        # Get comment count
        comment_count = await db.comments.count_documents({"post_id": post['id']})
        post['comment_count'] = comment_count
    
    return {"posts": posts}

@api_router.get("/posts/reels")
async def get_reels(authorization: str = Query(None), skip: int = Query(0), limit: int = Query(10)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    reels = await db.posts.find(
        {"post_type": "reel"},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user data
    for reel in reels:
        reel_user = await db.users.find_one({"id": reel['user_id']}, {"_id": 0, "password_hash": 0})
        reel['user'] = reel_user
    
    return {"reels": reels}

@api_router.get("/posts/{post_id}")
async def get_post(post_id: str, authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get user data
    post_user = await db.users.find_one({"id": post['user_id']}, {"_id": 0, "password_hash": 0})
    post['user'] = post_user
    
    return post

# Reaction Routes
@api_router.post("/reactions/{post_id}")
async def add_reaction(
    post_id: str,
    reaction_type: str = Form(...),
    authorization: str = Query(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Remove existing reaction
    await db.reactions.delete_one({"post_id": post_id, "user_id": user.id})
    
    # Add new reaction
    reaction = Reaction(
        post_id=post_id,
        user_id=user.id,
        reaction_type=reaction_type
    )
    
    doc = reaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.reactions.insert_one(doc)
    
    # Notify post owner
    post = await db.posts.find_one({"id": post_id})
    if post and post['user_id'] != user.id:
        await create_notification(
            post['user_id'],
            "reaction",
            f"{user.name} reacted {reaction_type} to your post",
            f"/post/{post_id}"
        )
    
    return {"success": True}

@api_router.delete("/reactions/{post_id}")
async def remove_reaction(post_id: str, authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await db.reactions.delete_one({"post_id": post_id, "user_id": user.id})
    
    return {"success": True}

# Comment Routes
@api_router.post("/comments/{post_id}")
async def add_comment(
    post_id: str,
    content: str = Form(...),
    parent_comment_id: Optional[str] = Form(None),
    authorization: str = Query(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    comment = Comment(
        post_id=post_id,
        parent_comment_id=parent_comment_id,
        user_id=user.id,
        content=content
    )
    
    doc = comment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.comments.insert_one(doc)
    
    # Notify post owner
    post = await db.posts.find_one({"id": post_id})
    if post and post['user_id'] != user.id:
        await create_notification(
            post['user_id'],
            "comment",
            f"{user.name} commented on your post",
            f"/post/{post_id}"
        )
    
    return {"success": True, "comment": doc}

@api_router.get("/comments/{post_id}")
async def get_comments(post_id: str, authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    
    # Enrich with user data
    for comment in comments:
        comment_user = await db.users.find_one({"id": comment['user_id']}, {"_id": 0, "password_hash": 0})
        comment['user'] = comment_user
    
    return {"comments": comments}

# Story Routes
@api_router.post("/stories")
async def create_story(
    authorization: str = Query(None),
    file: UploadFile = File(...)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    media_url = await save_upload_file(file, "stories")
    
    story = Story(
        user_id=user.id,
        media_url=media_url,
        media_type=file.content_type,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
    )
    
    doc = story.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['expires_at'] = doc['expires_at'].isoformat()
    await db.stories.insert_one(doc)
    
    return {"success": True, "story": doc}

@api_router.get("/stories")
async def get_stories(authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get following users
    connections = await db.connections.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    following_ids = [c['target_user_id'] for c in connections]
    following_ids.append(user.id)
    
    # Get active stories
    now = datetime.now(timezone.utc).isoformat()
    stories = await db.stories.find(
        {"user_id": {"$in": following_ids}, "expires_at": {"$gt": now}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Group by user
    user_stories = {}
    for story in stories:
        if story['user_id'] not in user_stories:
            story_user = await db.users.find_one({"id": story['user_id']}, {"_id": 0, "password_hash": 0})
            user_stories[story['user_id']] = {
                "user": story_user,
                "stories": []
            }
        user_stories[story['user_id']]['stories'].append(story)
    
    return {"user_stories": list(user_stories.values())}

# Notification Routes
@api_router.get("/notifications")
async def get_notifications(authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    notifications = await db.notifications.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {"notifications": notifications}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await db.notifications.update_one(
        {"id": notification_id, "user_id": user.id},
        {"$set": {"read": True}}
    )
    
    return {"success": True}

# Message Routes
@api_router.post("/conversations")
async def create_conversation(
    participant_ids: List[str] = Form(...),
    conversation_type: str = Form("direct"),
    name: Optional[str] = Form(None),
    authorization: str = Query(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    participants = [user.id] + participant_ids
    
    # Check if conversation exists
    if conversation_type == "direct" and len(participants) == 2:
        existing = await db.conversations.find_one({
            "conversation_type": "direct",
            "participants": {"$all": participants}
        })
        if existing:
            return {"conversation_id": existing['id']}
    
    conversation = Conversation(
        participants=participants,
        conversation_type=conversation_type,
        name=name
    )
    
    doc = conversation.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.conversations.insert_one(doc)
    
    return {"conversation_id": conversation.id}

@api_router.get("/conversations")
async def get_conversations(authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conversations = await db.conversations.find(
        {"participants": user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with participant data and last message
    for conv in conversations:
        participants = await db.users.find(
            {"id": {"$in": conv['participants']}},
            {"_id": 0, "password_hash": 0}
        ).to_list(100)
        conv['participant_users'] = participants
        
        last_message = await db.messages.find_one(
            {"conversation_id": conv['id']},
            {"_id": 0}
        ).sort("created_at", -1)
        conv['last_message'] = last_message
    
    return {"conversations": conversations}

@api_router.post("/messages/{conversation_id}")
async def send_message(
    conversation_id: str,
    content: str = Form(...),
    authorization: str = Query(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    message = Message(
        conversation_id=conversation_id,
        sender_id=user.id,
        content=content
    )
    
    doc = message.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.messages.insert_one(doc)
    
    # Get conversation participants
    conversation = await db.conversations.find_one({"id": conversation_id})
    if conversation:
        for participant_id in conversation['participants']:
            if participant_id != user.id:
                await manager.send_message(participant_id, {
                    'type': 'message',
                    'data': doc
                })
    
    return {"success": True, "message": doc}

@api_router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str, authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    # Enrich with sender data
    for msg in messages:
        sender = await db.users.find_one({"id": msg['sender_id']}, {"_id": 0, "password_hash": 0})
        msg['sender'] = sender
    
    return {"messages": messages}

# Search Routes
@api_router.get("/search/users")
async def search_users(q: str = Query(...), authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    users = await db.users.find(
        {"$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0, "password_hash": 0}
    ).limit(20).to_list(20)
    
    return {"users": users}

# Group Routes
@api_router.post("/groups")
async def create_group(
    name: str = Form(...),
    description: str = Form(...),
    group_type: str = Form("public"),
    authorization: str = Query(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    group = Group(
        name=name,
        description=description,
        group_type=group_type,
        admin_user_ids=[user.id]
    )
    
    doc = group.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.groups.insert_one(doc)
    
    # Add creator as member
    await db.group_members.insert_one({
        "group_id": group.id,
        "user_id": user.id,
        "role": "admin",
        "joined_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "group": doc}

@api_router.get("/groups")
async def get_groups(authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get user's groups
    memberships = await db.group_members.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    group_ids = [m['group_id'] for m in memberships]
    
    groups = await db.groups.find({"id": {"$in": group_ids}}, {"_id": 0}).to_list(1000)
    
    return {"groups": groups}

# Marketplace Routes
@api_router.post("/marketplace")
async def create_marketplace_item(
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    authorization: str = Query(None),
    files: List[UploadFile] = File(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    images = []
    if files:
        for file in files:
            url = await save_upload_file(file, "marketplace")
            images.append(url)
    
    item = MarketplaceItem(
        user_id=user.id,
        title=title,
        description=description,
        price=price,
        images=images
    )
    
    doc = item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.marketplace_items.insert_one(doc)
    
    return {"success": True, "item": doc}

@api_router.get("/marketplace")
async def get_marketplace_items(authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    items = await db.marketplace_items.find(
        {"status": "active"},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    # Enrich with user data
    for item in items:
        seller = await db.users.find_one({"id": item['user_id']}, {"_id": 0, "password_hash": 0})
        item['seller'] = seller
    
    return {"items": items}

# Event Routes
@api_router.post("/events")
async def create_event(
    title: str = Form(...),
    description: str = Form(...),
    event_date: str = Form(...),
    location: str = Form(...),
    authorization: str = Query(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    event = Event(
        user_id=user.id,
        title=title,
        description=description,
        event_date=datetime.fromisoformat(event_date),
        location=location
    )
    
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['event_date'] = doc['event_date'].isoformat()
    await db.events.insert_one(doc)
    
    return {"success": True, "event": doc}

@api_router.get("/events")
async def get_events(authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    now = datetime.now(timezone.utc).isoformat()
    events = await db.events.find(
        {"event_date": {"$gte": now}},
        {"_id": 0}
    ).sort("event_date", 1).limit(50).to_list(50)
    
    return {"events": events}

# Job Routes
@api_router.post("/jobs/profile")
async def create_job_profile(
    experience: List[Dict] = Form(...),
    skills: List[str] = Form(...),
    authorization: str = Query(None),
    resume: Optional[UploadFile] = File(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    resume_url = None
    if resume:
        resume_url = await save_upload_file(resume, "resumes")
    
    profile = JobProfile(
        user_id=user.id,
        experience=experience,
        skills=skills,
        resume_url=resume_url
    )
    
    doc = profile.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.job_profiles.insert_one(doc)
    
    return {"success": True, "profile": doc}

@api_router.post("/jobs/posts")
async def create_job_post(
    title: str = Form(...),
    description: str = Form(...),
    requirements: str = Form(...),
    location: str = Form(...),
    salary_range: Optional[str] = Form(None),
    authorization: str = Query(None)
):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    job_post = JobPost(
        company_id=user.id,
        title=title,
        description=description,
        requirements=requirements,
        location=location,
        salary_range=salary_range
    )
    
    doc = job_post.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.job_posts.insert_one(doc)
    
    return {"success": True, "job_post": doc}

@api_router.get("/jobs/posts")
async def get_job_posts(authorization: str = Query(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    job_posts = await db.job_posts.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {"job_posts": job_posts}

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Static files
app.mount("/uploads", StaticFiles(directory="/app/backend/uploads"), name="uploads")

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
