from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from app.models import CartItemCreate, CartItemResponse, CartItemUpdate
from app.database import get_database

router = APIRouter(prefix="/api/cart", tags=["Grocery Cart CRUD"])

def parse_item_doc(doc: dict) -> dict:
    """Helper to convert MongoDB _id to string id for Pydantic response."""
    return {
        "id": str(doc["_id"]),
        "user_email": doc.get("user_email"),
        "item_name": doc.get("item_name"),
        "calories": doc.get("calories", 0.0),
        "protein": doc.get("protein", 0.0),
        "carbs": doc.get("carbs", 0.0),
        "fat": doc.get("fat", 0.0),
        "quantity": doc.get("quantity", 1),
    }

@router.post("", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def create_cart_item(item_data: CartItemCreate):
    """CREATE: Add a new grocery item to the user's cart."""
    db = get_database()
    item_dict = item_data.model_dump()
    
    result = await db.cart_items.insert_one(item_dict)
    inserted_doc = await db.cart_items.find_one({"_id": result.inserted_id})
    return parse_item_doc(inserted_doc)

@router.get("", response_model=List[CartItemResponse])
async def get_cart_items(user_email: str):
    """READ (List): Fetch all cart items belonging to a specific user."""
    db = get_database()
    cursor = db.cart_items.find({"user_email": user_email})
    items = []
    async for doc in cursor:
        items.append(parse_item_doc(doc))
    return items

@router.get("/{item_id}", response_model=CartItemResponse)
async def get_single_cart_item(item_id: str):
    """READ (Detail): Get a specific cart item by ID."""
    db = get_database()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID format")
        
    doc = await db.cart_items.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return parse_item_doc(doc)

@router.put("/{item_id}", response_model=CartItemResponse)
async def update_cart_item(item_id: str, update_data: CartItemUpdate):
    """UPDATE: Modify an existing cart item's details."""
    db = get_database()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID format")
        
    fields_to_update = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not fields_to_update:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    result = await db.cart_items.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": fields_to_update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")

    updated_doc = await db.cart_items.find_one({"_id": ObjectId(item_id)})
    return parse_item_doc(updated_doc)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cart_item(item_id: str):
    """DELETE: Remove an item from the cart."""
    db = get_database()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID format")
        
    result = await db.cart_items.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return None