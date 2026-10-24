from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.clerk_auth import get_current_user_id
from app.database import get_database


router = APIRouter(
    prefix="/api/profile",
    tags=["User Profile"],
)


class ProfileData(BaseModel):
    height: float = Field(
        ge=50,
        le=250,
        allow_inf_nan=False,
    )
    weight: float = Field(
        ge=10,
        le=400,
        allow_inf_nan=False,
    )
    calorieLimit: float = Field(
        ge=200,
        le=10000,
        allow_inf_nan=False,
    )


@router.get("", response_model=ProfileData | None)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    return await db.user_profiles.find_one({
        "_id": user_id,
    })


@router.put("", response_model=ProfileData)
async def save_profile(
    profile: ProfileData,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()
    data = profile.model_dump()

    await db.user_profiles.update_one(
        {"_id": user_id},
        {"$set": data},
        upsert=True,
    )

    return data