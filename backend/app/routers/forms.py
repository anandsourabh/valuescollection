import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models.form_schema import FormSchema
from app.deps import CurrentUser

router = APIRouter(tags=["forms"])

DEFAULT_SCHEMA = {
    "sections": [
        {
            "id": "s1",
            "label": "Property identity",
            "fields": [
                {"id": "f-addr", "label": "Street address", "type": "address", "required": True},
                {"id": "f-occ", "label": "Primary occupancy", "type": "select", "required": True,
                 "options": ["Warehouse", "Manufacturing", "Office", "Retail", "Cold storage"]},
            ],
        },
        {
            "id": "s2",
            "label": "COPE attributes",
            "fields": [
                {"id": "f-year", "label": "Year built", "type": "number", "required": True},
                {"id": "f-cons", "label": "Construction class", "type": "select", "required": True,
                 "options": ["Class 1", "Class 2", "Class 3", "Class 4"]},
                {"id": "f-spr", "label": "Sprinkler coverage", "type": "select",
                 "options": ["None", "Partial", "Full coverage"]},
            ],
        },
        {
            "id": "s3",
            "label": "Values (per building)",
            "repeating": True,
            "fields": [
                {"id": "f-tiv-bldg", "label": "Building replacement cost", "type": "currency", "required": True},
                {"id": "f-tiv-cont", "label": "Contents TIV", "type": "currency", "required": True},
                {"id": "f-tiv-bi", "label": "BI (12 months)", "type": "currency"},
                {"id": "f-tiv-tot", "label": "Total TIV", "type": "calculated",
                 "formula": "building_tiv + contents_tiv + bi_12mo"},
            ],
        },
        {
            "id": "s4",
            "label": "Attachments",
            "fields": [
                {"id": "f-val", "label": "Valuation letter", "type": "file"},
                {"id": "f-photos", "label": "Property photos", "type": "files"},
            ],
        },
    ]
}


class FormSchemaUpdate(BaseModel):
    schema_data: dict


class FormSchemaOut(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    version: int
    schema: dict
    is_published: bool
    model_config = {"from_attributes": True}


@router.get("/api/campaigns/{campaign_id}/form-schema", response_model=FormSchemaOut)
async def get_form_schema(
    campaign_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FormSchema).where(FormSchema.campaign_id == campaign_id))
    fs = result.scalar_one_or_none()
    if not fs:
        # Return default schema stub
        fs = FormSchema(campaign_id=campaign_id, schema=DEFAULT_SCHEMA)
        db.add(fs)
        await db.flush()
    return fs


@router.put("/api/campaigns/{campaign_id}/form-schema", response_model=FormSchemaOut)
async def update_form_schema(
    campaign_id: uuid.UUID,
    body: FormSchemaUpdate,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FormSchema).where(FormSchema.campaign_id == campaign_id))
    fs = result.scalar_one_or_none()
    if not fs:
        fs = FormSchema(campaign_id=campaign_id, schema=body.schema_data)
        db.add(fs)
    else:
        fs.schema = body.schema_data
        fs.version += 1
        fs.is_published = False
    await db.flush()
    return fs


@router.post("/api/campaigns/{campaign_id}/form-schema/publish", response_model=FormSchemaOut)
async def publish_form_schema(
    campaign_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FormSchema).where(FormSchema.campaign_id == campaign_id))
    fs = result.scalar_one_or_none()
    if not fs:
        raise HTTPException(status_code=404, detail="No form schema found")
    fs.is_published = True
    await db.flush()
    return fs
