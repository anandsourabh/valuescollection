"""Dev seed script — creates portfolios, properties, users, campaigns, assignments."""
import asyncio
import uuid
from datetime import date, timedelta
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.config import settings
from app.models.user import User
from app.models.portfolio import Portfolio, Property, CampaignPortfolio
from app.models.campaign import Campaign
from app.models.assignment import Assignment

# Import all models so tables are known
import app.models  # noqa

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        # ── Users ──────────────────────────────────────────────
        users_data = [
            {"email": "alex.morgan@hartwell.com",  "name": "Alex Morgan",  "roles": ["admin", "contributor"],         "team_type": "internal"},
            {"email": "priya.shah@hartwell.com",   "name": "Priya Shah",   "roles": ["reviewer"],                    "team_type": "internal"},
            {"email": "marcus.hale@hartwell.com",  "name": "Marcus Hale",  "roles": ["contributor"],                  "team_type": "internal"},
            {"email": "jing.chen@hartwell.com",    "name": "Jing Chen",    "roles": ["admin", "contributor"],         "team_type": "internal"},
            {"email": "sam@veritas-brokers.com",   "name": "Sam Okafor",   "roles": ["contributor"],                  "team_type": "external"},
            {"email": "l.rossi@acme-fm.it",        "name": "Linda Rossi",  "roles": ["contributor"],                  "team_type": "external"},
            {"email": "ben.t@northridge-co.com",   "name": "Ben Torres",   "roles": ["contributor"],                  "team_type": "external"},
        ]
        user_objs = {}
        for u in users_data:
            obj = User(
                email=u["email"],
                name=u["name"],
                hashed_password=pwd_context.hash("password123"),
                roles=u["roles"],
                team_type=u["team_type"],
            )
            db.add(obj)
            user_objs[u["name"]] = obj
        await db.flush()
        print(f"  ✓ Created {len(users_data)} users")

        # ── Portfolios ─────────────────────────────────────────
        pf_na = Portfolio(name="North America portfolio", description="US-based properties")
        pf_emea = Portfolio(name="EMEA retail sites", description="Europe, Middle East & Africa")
        pf_apac = Portfolio(name="APAC manufacturing", description="Asia-Pacific manufacturing sites")
        for pf in [pf_na, pf_emea, pf_apac]:
            db.add(pf)
        await db.flush()
        print("  ✓ Created 3 portfolios")

        # ── Properties ─────────────────────────────────────────
        props_data = [
            {"address": "1200 Commerce Way",       "city": "Atlanta",    "state": "GA", "type": "Warehouse",      "tiv": 18400000,  "pf": pf_na},
            {"address": "450 Industrial Pkwy",     "city": "Columbus",   "state": "OH", "type": "Manufacturing",  "tiv": 42100000,  "pf": pf_na},
            {"address": "77 Harbor Blvd",          "city": "Long Beach", "state": "CA", "type": "Cold storage",   "tiv": 29800000,  "pf": pf_na},
            {"address": "3301 Midland Dr",         "city": "Dallas",     "state": "TX", "type": "Office tower",   "tiv": 88500000,  "pf": pf_na},
            {"address": "50 Riverside Industrial", "city": "Pittsburgh", "state": "PA", "type": "Warehouse",      "tiv": 14200000,  "pf": pf_na},
            {"address": "219 Peachtree",           "city": "Atlanta",    "state": "GA", "type": "Retail",         "tiv": 7800000,   "pf": pf_na},
            {"address": "1100 Seaport Ave",        "city": "Seattle",    "state": "WA", "type": "Warehouse",      "tiv": 21600000,  "pf": pf_na},
            {"address": "505 Eagle Pass Rd",       "city": "El Paso",    "state": "TX", "type": "Cold storage",   "tiv": 19300000,  "pf": pf_na},
            {"address": "902 Meridian St",         "city": "Boise",      "state": "ID", "type": "Manufacturing",  "tiv": 34500000,  "pf": pf_na},
            {"address": "12 Lakeshore East",       "city": "Chicago",    "state": "IL", "type": "Office tower",   "tiv": 112400000, "pf": pf_na},
        ]
        prop_objs = []
        for p in props_data:
            obj = Property(
                portfolio_id=p["pf"].id,
                address=p["address"],
                city=p["city"],
                state=p["state"],
                country="US",
                property_type=p["type"],
                prior_tiv=p["tiv"],
            )
            db.add(obj)
            prop_objs.append(obj)
        await db.flush()
        print(f"  ✓ Created {len(props_data)} properties")

        # ── Campaign ───────────────────────────────────────────
        campaign = Campaign(
            name="NA Renewal 2026",
            description="Annual property values renewal for North America portfolio",
            owner_id=user_objs["Alex Morgan"].id,
            status="active",
            due_date=date(2026, 5, 30),
            sla_days=21,
            link_model="bundled",
        )
        db.add(campaign)
        await db.flush()
        db.add(CampaignPortfolio(campaign_id=campaign.id, portfolio_id=pf_na.id))
        await db.flush()
        print("  ✓ Created campaign: NA Renewal 2026")

        # ── Assignments ────────────────────────────────────────
        statuses = ["approved", "in_progress", "submitted", "under_review", "not_started",
                    "approved", "rejected", "in_progress", "submitted", "not_started"]
        assignees_cycle = [
            user_objs["Marcus Hale"], user_objs["Linda Rossi"], user_objs["Sam Okafor"],
            user_objs["Ben Torres"], user_objs["Jing Chen"],
        ]
        due_offsets = [-2, 5, 3, 12, 18, -7, 2, 9, 4, 21]

        for i, prop in enumerate(prop_objs):
            assignee = assignees_cycle[i % len(assignees_cycle)]
            a = Assignment(
                campaign_id=campaign.id,
                property_id=prop.id,
                primary_assignee_id=assignee.id,
                assignee_type="external" if assignee.team_type == "external" else "internal",
                status=statuses[i % len(statuses)],
                due_date=date(2026, 5, 15) + timedelta(days=due_offsets[i % len(due_offsets)]),
            )
            db.add(a)
        await db.flush()
        print(f"  ✓ Created {len(prop_objs)} assignments")

        await db.commit()
        print("\n✅ Seed complete.")


if __name__ == "__main__":
    print("🌱 Seeding database…")
    asyncio.run(seed())
