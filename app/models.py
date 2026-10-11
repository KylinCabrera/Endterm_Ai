from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class UserProfile(BaseModel):
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    dietary_preferences: List[str] = []
    allergens: List[str] = []

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    profile: Optional[UserProfile] = Field(default_factory=UserProfile)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"