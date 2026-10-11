from fastapi import APIRouter, HTTPException, status, Depends
from app.models import UserRegister, UserLogin, TokenResponse
from app.database import get_database
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister):
    db = get_database()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password & construct user document
    user_dict = user_data.model_dump()
    user_dict["password"] = hash_password(user_data.password)
    
    result = await db.users.insert_one(user_dict)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

@router.post("/login", response_model=TokenResponse)
async def login_user(credentials: UserLogin):
    db = get_database()
    
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(data={"sub": user["email"], "user_id": str(user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}