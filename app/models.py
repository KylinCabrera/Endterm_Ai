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
    item_name: str = Field(min_length=1, max_length=200)

    calories: float = Field(
        default=0, ge=0, allow_inf_nan=False
    )
    protein: float = Field(
        default=0, ge=0, allow_inf_nan=False
    )
    carbs: float = Field(
        default=0, ge=0, allow_inf_nan=False
    )
    fat: float = Field(
        default=0, ge=0, allow_inf_nan=False
    )

    quantity: int = Field(default=1, ge=1)
    price: float = Field(
        default=0, ge=0, allow_inf_nan=False
    )


class CartItemUpdate(BaseModel):
    item_name: Optional[str] = Field(
        default=None, min_length=1, max_length=200
    )

    calories: Optional[float] = Field(
        default=None, ge=0, allow_inf_nan=False
    )
    protein: Optional[float] = Field(
        default=None, ge=0, allow_inf_nan=False
    )
    carbs: Optional[float] = Field(
        default=None, ge=0, allow_inf_nan=False
    )
    fat: Optional[float] = Field(
        default=None, ge=0, allow_inf_nan=False
    )

    quantity: Optional[int] = Field(default=None, ge=1)
    price: Optional[float] = Field(
        default=None, ge=0, allow_inf_nan=False
    )


class CartItemResponse(CartItemCreate):
    id: str