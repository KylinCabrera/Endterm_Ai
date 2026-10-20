from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.models import UserRegister, UserLogin, TokenResponse
from app.database import get_database
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# REGISTER USER
@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED
)
async def register_user(user_data: UserRegister):
    db = get_database()

    # Normalize email for consistent lookup
    email = str(user_data.email).strip().lower()

    try:
        # Check whether email is already registered
        existing_user = await db.users.find_one({
            "email": email
        })

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )

        # Hash password before saving
        user_dict = user_data.model_dump()
        user_dict["email"] = email
        user_dict["password"] = hash_password(
            user_data.password
        )

        # Save user in MongoDB
        result = await db.users.insert_one(user_dict)

        return {
            "message": "User registered successfully",
            "user_id": str(result.inserted_id)
        }

    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


# LOGIN USER
@router.post(
    "/login",
    response_model=TokenResponse
)
async def login_user(credentials: UserLogin):
    db = get_database()

    email = str(credentials.email).strip().lower()

    try:
        # Find user by email
        user = await db.users.find_one({
            "email": email
        })

    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )

    # Verify credentials
    if not user or not verify_password(
        credentials.password,
        user["password"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Generate JWT token
    access_token = create_access_token(
        data={
            "sub": str(user["_id"]),
            "user_id": str(user["_id"]),
            "email": user["email"]
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
