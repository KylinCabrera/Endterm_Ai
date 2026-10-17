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

class CartItemCreate(BaseModel):
    user_email: EmailStr
    item_name: str
    calories: float = Field(default=0.0, ge=0)
    protein: float = Field(default=0.0, ge=0)
    carbs: float = Field(default=0.0, ge=0)
    fat: float = Field(default=0.0, ge=0)
    quantity: int = Field(default=1, ge=1)

class CartItemUpdate(BaseModel):
    item_name: Optional[str] = None
    calories: Optional[float] = Field(default=None, ge=0)
    protein: Optional[float] = Field(default=None, ge=0)
    carbs: Optional[float] = Field(default=None, ge=0)
    fat: Optional[float] = Field(default=None, ge=0)
    quantity: Optional[int] = Field(default=None, ge=1)

class CartItemResponse(BaseModel):
    id: str
    user_email: str
    item_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    quantity: int