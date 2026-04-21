import asyncio
import os
import uuid
from datetime import datetime, date, timezone, timedelta
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from passlib.context import CryptContext

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app
from app.database import Base, AsyncSessionLocal, get_db
from app.config import settings
from app.models.user import User
from app.models.campaign import Campaign
from app.models.assignment import Assignment
from app.models.portfolio import Portfolio, Property, CampaignPortfolio
from app.models.delegation import Delegation
from app.models.submission import Submission, SubmissionHistory, Attachment
from app.models.review import Review
from app.utils.jwt import create_access_token, create_refresh_token


# ==================== Test Database Setup ====================

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    # Use an in-memory SQLite database for testing
    # SQLite doesn't support async by default, so we use a separate database URL
    test_db_url = os.getenv("TEST_DATABASE_URL", "sqlite+aiosqlite:///:memory:")

    engine = create_async_engine(
        test_db_url,
        echo=False,
        future=True,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
def override_get_db(test_db):
    """Override the get_db dependency."""
    async def _get_test_db():
        yield test_db
    return _get_test_db


@pytest_asyncio.fixture
async def client(test_db, override_get_db):
    """Create a test client with overridden database dependency."""
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ==================== Test User Fixtures ====================

@pytest_asyncio.fixture
async def test_user_1(test_db) -> User:
    """Create a test internal user."""
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user = User(
        id=uuid.uuid4(),
        email="user1@test.local",
        name="Test User 1",
        hashed_password=pwd_context.hash("password123"),
        roles=["contributor", "reviewer"],
        is_active=True,
        team_type="internal",
    )
    test_db.add(user)
    await test_db.flush()
    return user


@pytest_asyncio.fixture
async def test_user_2(test_db) -> User:
    """Create another test internal user."""
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user = User(
        id=uuid.uuid4(),
        email="user2@test.local",
        name="Test User 2",
        hashed_password=pwd_context.hash("password456"),
        roles=["contributor"],
        is_active=True,
        team_type="internal",
    )
    test_db.add(user)
    await test_db.flush()
    return user


@pytest_asyncio.fixture
async def test_user_3(test_db) -> User:
    """Create an external test user."""
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user = User(
        id=uuid.uuid4(),
        email="external@test.local",
        name="External User",
        hashed_password=pwd_context.hash("external123"),
        roles=[],
        is_active=True,
        team_type="external",
    )
    test_db.add(user)
    await test_db.flush()
    return user


# ==================== Auth Token Fixtures ====================

@pytest.fixture
def access_token_user_1(test_user_1):
    """Generate an access token for test_user_1."""
    return create_access_token(str(test_user_1.id))


@pytest.fixture
def refresh_token_user_1(test_user_1):
    """Generate a refresh token for test_user_1."""
    return create_refresh_token(str(test_user_1.id))


@pytest.fixture
def access_token_user_2(test_user_2):
    """Generate an access token for test_user_2."""
    return create_access_token(str(test_user_2.id))


@pytest.fixture
def auth_headers_user_1(access_token_user_1):
    """Create authorization headers for test_user_1."""
    return {"Authorization": f"Bearer {access_token_user_1}"}


@pytest.fixture
def auth_headers_user_2(access_token_user_2):
    """Create authorization headers for test_user_2."""
    return {"Authorization": f"Bearer {access_token_user_2}"}


# ==================== Portfolio Fixtures ====================

@pytest_asyncio.fixture
async def test_portfolio(test_db) -> Portfolio:
    """Create a test portfolio."""
    portfolio = Portfolio(
        id=uuid.uuid4(),
        name="Test Portfolio",
        description="A test portfolio",
    )
    test_db.add(portfolio)
    await test_db.flush()
    return portfolio


# ==================== Campaign Fixtures ====================

@pytest_asyncio.fixture
async def test_campaign_1(test_db, test_user_1, test_portfolio) -> Campaign:
    """Create a test campaign in draft status."""
    campaign = Campaign(
        id=uuid.uuid4(),
        name="Test Campaign 1",
        description="A test campaign",
        owner_id=test_user_1.id,
        status="draft",
        due_date=date.today() + timedelta(days=30),
        sla_days=21,
        link_model="bundled",
        breach_policy="escalate_and_continue",
    )
    test_db.add(campaign)
    await test_db.flush()

    # Add portfolio association
    cp = CampaignPortfolio(campaign_id=campaign.id, portfolio_id=test_portfolio.id)
    test_db.add(cp)
    await test_db.flush()

    return campaign


@pytest_asyncio.fixture
async def test_campaign_active(test_db, test_user_1, test_portfolio) -> Campaign:
    """Create an active test campaign."""
    campaign = Campaign(
        id=uuid.uuid4(),
        name="Active Campaign",
        description="An active campaign",
        owner_id=test_user_1.id,
        status="active",
        due_date=date.today() + timedelta(days=30),
        sla_days=21,
        link_model="per_location",
        breach_policy="continue",
    )
    test_db.add(campaign)
    await test_db.flush()

    # Add portfolio association
    cp = CampaignPortfolio(campaign_id=campaign.id, portfolio_id=test_portfolio.id)
    test_db.add(cp)
    await test_db.flush()

    return campaign


# ==================== Property Fixtures ====================

@pytest_asyncio.fixture
async def test_property_1(test_db) -> Property:
    """Create a test property."""
    property_obj = Property(
        id=uuid.uuid4(),
        address="123 Main St",
        city="Anytown",
        state="CA",
        zip_code="12345",
        property_type="residential",
        prior_tiv=500000.00,
    )
    test_db.add(property_obj)
    await test_db.flush()
    return property_obj


@pytest_asyncio.fixture
async def test_property_2(test_db) -> Property:
    """Create another test property."""
    property_obj = Property(
        id=uuid.uuid4(),
        address="456 Oak Ave",
        city="Somewhere",
        state="NY",
        zip_code="54321",
        property_type="commercial",
        prior_tiv=1000000.00,
    )
    test_db.add(property_obj)
    await test_db.flush()
    return property_obj


# ==================== Assignment Fixtures ====================

@pytest_asyncio.fixture
async def test_assignment_1(test_db, test_campaign_1, test_property_1, test_user_1) -> Assignment:
    """Create a test assignment in not_started status."""
    assignment = Assignment(
        id=uuid.uuid4(),
        campaign_id=test_campaign_1.id,
        property_id=test_property_1.id,
        primary_assignee_id=test_user_1.id,
        assignee_type="internal",
        status="not_started",
        due_date=date.today() + timedelta(days=21),
    )
    test_db.add(assignment)
    await test_db.flush()
    return assignment


@pytest_asyncio.fixture
async def test_assignment_2(test_db, test_campaign_active, test_property_2, test_user_2) -> Assignment:
    """Create another test assignment."""
    assignment = Assignment(
        id=uuid.uuid4(),
        campaign_id=test_campaign_active.id,
        property_id=test_property_2.id,
        primary_assignee_id=test_user_2.id,
        external_email=None,
        assignee_type="internal",
        status="not_started",
        due_date=date.today() + timedelta(days=21),
    )
    test_db.add(assignment)
    await test_db.flush()
    return assignment


@pytest_asyncio.fixture
async def test_assignment_external(test_db, test_campaign_active, test_property_1) -> Assignment:
    """Create an assignment for external user."""
    assignment = Assignment(
        id=uuid.uuid4(),
        campaign_id=test_campaign_active.id,
        property_id=test_property_1.id,
        primary_assignee_id=None,
        external_email="contractor@external.local",
        assignee_type="external",
        status="not_started",
        due_date=date.today() + timedelta(days=14),
    )
    test_db.add(assignment)
    await test_db.flush()
    return assignment


# ==================== Delegation Fixtures ====================

@pytest_asyncio.fixture
async def test_delegation_1(test_db, test_assignment_1, test_user_1, test_user_2) -> Delegation:
    """Create a test delegation."""
    delegation = Delegation(
        id=uuid.uuid4(),
        assignment_id=test_assignment_1.id,
        delegator_id=test_user_1.id,
        delegate_id=test_user_2.id,
        level=1,
        delegation_type="specific",
        is_active=True,
        created_by_id=test_user_1.id,
    )
    test_db.add(delegation)
    await test_db.flush()
    return delegation


@pytest_asyncio.fixture
async def test_ooo_delegation(test_db, test_user_1, test_user_2) -> Delegation:
    """Create an OOO blanket delegation."""
    delegation = Delegation(
        id=uuid.uuid4(),
        assignment_id=None,
        delegator_id=test_user_1.id,
        delegate_id=test_user_2.id,
        level=1,
        delegation_type="ooo_blanket",
        is_active=True,
        ooo_start=date.today(),
        ooo_end=date.today() + timedelta(days=7),
        reason="On vacation",
        created_by_id=test_user_1.id,
    )
    test_db.add(delegation)
    await test_db.flush()
    return delegation


# ==================== Submission Fixtures ====================

@pytest_asyncio.fixture
async def test_submission_1(test_db, test_assignment_1, test_user_1) -> Submission:
    """Create a test submission in draft status."""
    submission = Submission(
        id=uuid.uuid4(),
        assignment_id=test_assignment_1.id,
        data={"property_value": 550000, "condition": "good"},
        status="draft",
        version=1,
        submitted_by_id=test_user_1.id,
        actor_type="internal",
        total_tiv=550000.00,
    )
    test_db.add(submission)
    await test_db.flush()
    return submission


@pytest_asyncio.fixture
async def test_submission_submitted(test_db, test_assignment_2, test_user_2) -> Submission:
    """Create a submitted submission."""
    now = datetime.now(timezone.utc)
    submission = Submission(
        id=uuid.uuid4(),
        assignment_id=test_assignment_2.id,
        data={"property_value": 1100000, "condition": "excellent"},
        status="submitted",
        version=2,
        submitted_by_id=test_user_2.id,
        actor_type="internal",
        total_tiv=1100000.00,
        submitted_at=now,
    )
    test_db.add(submission)
    await test_db.flush()
    return submission


# ==================== Submission History Fixtures ====================

@pytest_asyncio.fixture
async def test_submission_history(test_db, test_submission_1, test_user_1) -> SubmissionHistory:
    """Create a submission history entry."""
    history = SubmissionHistory(
        id=uuid.uuid4(),
        submission_id=test_submission_1.id,
        data={"property_value": 500000, "condition": "fair"},
        version=1,
        saved_by_id=test_user_1.id,
    )
    test_db.add(history)
    await test_db.flush()
    return history


# ==================== Review Fixtures ====================

@pytest_asyncio.fixture
async def test_review_approved(test_db, test_submission_submitted, test_user_1) -> Review:
    """Create an approved review."""
    review = Review(
        id=uuid.uuid4(),
        submission_id=test_submission_submitted.id,
        reviewer_id=test_user_1.id,
        decision="approved",
        comment="Values look reasonable",
        reason_code="standard_review",
        requires_escalation=False,
    )
    test_db.add(review)
    await test_db.flush()
    return review


@pytest_asyncio.fixture
async def test_review_rejected(test_db, test_user_1) -> Review:
    """Create a rejected review."""
    review = Review(
        id=uuid.uuid4(),
        submission_id=uuid.uuid4(),
        reviewer_id=test_user_1.id,
        decision="rejected",
        comment="Values seem too high",
        reason_code="outlier_detected",
        requires_escalation=True,
    )
    test_db.add(review)
    await test_db.flush()
    return review


# ==================== Helper Functions ====================

@pytest.fixture
def pwd_context():
    """Provide password context for hashing."""
    return CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture
def valid_login_credentials():
    """Provide valid login credentials."""
    return {
        "email": "user1@test.local",
        "password": "password123",
    }


@pytest.fixture
def invalid_login_credentials():
    """Provide invalid login credentials."""
    return {
        "email": "user1@test.local",
        "password": "wrongpassword",
    }
