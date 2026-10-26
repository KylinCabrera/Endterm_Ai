from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo import ReturnDocument

from app.clerk_auth import get_current_user_id
from app.database import get_database
from app.models import CartItemCreate, CartItemResponse, CartItemUpdate


router = APIRouter(
    prefix="/api/cart",
    tags=["Grocery Cart CRUD"],
)


def parse_item_doc(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "item_name": doc["item_name"],
        "calories": doc.get("calories", 0.0),
        "protein": doc.get("protein", 0.0),
        "carbs": doc.get("carbs", 0.0),
        "fat": doc.get("fat", 0.0),
        "quantity": doc.get("quantity", 1),
        "price": doc.get("price", 0.0),
    }


def get_item_filter(item_id: str, user_id: str) -> dict:
    if not ObjectId.is_valid(item_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid item ID format",
        )

    # Only access documents belonging to the signed-in user.
    return {
        "_id": ObjectId(item_id),
        "user_id": user_id,
    }


@router.post(
    "",
    response_model=CartItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_cart_item(
    item_data: CartItemCreate,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    item_dict = item_data.model_dump()

    # This ID comes from the verified Clerk token.
    item_dict["user_id"] = user_id

    result = await db.cart_items.insert_one(item_dict)
    item_dict["_id"] = result.inserted_id

    return parse_item_doc(item_dict)


@router.get("", response_model=List[CartItemResponse])
async def get_cart_items(
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    cursor = db.cart_items.find({
        "user_id": user_id,
    })

    return [
        parse_item_doc(doc)
        async for doc in cursor
    ]


@router.get("/{item_id}", response_model=CartItemResponse)
async def get_single_cart_item(
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    doc = await db.cart_items.find_one(
        get_item_filter(item_id, user_id)
    )

    if doc is None:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found",
        )

    return parse_item_doc(doc)


@router.put("/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: str,
    update_data: CartItemUpdate,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    fields_to_update = update_data.model_dump(
        exclude_none=True,
    )

    if not fields_to_update:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update",
        )

    updated_doc = await db.cart_items.find_one_and_update(
        get_item_filter(item_id, user_id),
        {"$set": fields_to_update},
        return_document=ReturnDocument.AFTER,
    )

    if updated_doc is None:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found",
        )

    return parse_item_doc(updated_doc)


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_cart_item(
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    result = await db.cart_items.delete_one(
        get_item_filter(item_id, user_id)
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found",
        )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )