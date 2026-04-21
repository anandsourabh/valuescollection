"""Tests for campaign endpoints."""
import pytest
from fastapi import status
from datetime import date, timedelta
import uuid


@pytest.mark.asyncio
@pytest.mark.campaigns
class TestListCampaigns:
    """Test list campaigns endpoint."""

    async def test_list_campaigns_empty(self, client, auth_headers_user_1):
        """Test listing campaigns when none exist."""
        response = await client.get(
            "/api/campaigns",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    async def test_list_campaigns_success(
        self, client, auth_headers_user_1, test_campaign_1, test_campaign_active
    ):
        """Test listing multiple campaigns."""
        response = await client.get(
            "/api/campaigns",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        campaigns = response.json()
        assert len(campaigns) == 2

        # Should be ordered by created_at descending
        assert campaigns[0]["status"] == "active"
        assert campaigns[1]["status"] == "draft"

    async def test_list_campaigns_filtered_by_status(
        self, client, auth_headers_user_1, test_campaign_1, test_campaign_active
    ):
        """Test filtering campaigns by status."""
        response = await client.get(
            "/api/campaigns?status=draft",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        campaigns = response.json()
        assert len(campaigns) == 1
        assert campaigns[0]["status"] == "draft"

    async def test_list_campaigns_unauthorized(self, client):
        """Test listing campaigns without authentication."""
        response = await client.get("/api/campaigns")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.campaigns
class TestCreateCampaign:
    """Test create campaign endpoint."""

    async def test_create_campaign_success(self, client, auth_headers_user_1, test_property_1):
        """Test successful campaign creation."""
        payload = {
            "name": "New Campaign",
            "description": "A newly created campaign",
            "due_date": str(date.today() + timedelta(days=30)),
            "sla_days": 14,
            "link_model": "bundled",
            "breach_policy": "escalate",
            "portfolio_ids": [],
        }
        response = await client.post(
            "/api/campaigns",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "New Campaign"
        assert data["status"] == "draft"
        assert data["description"] == "A newly created campaign"

    async def test_create_campaign_with_portfolios(
        self, client, auth_headers_user_1, test_db, test_property_1
    ):
        """Test campaign creation with portfolio associations."""
        # Assuming we need property IDs as portfolio IDs for this test
        payload = {
            "name": "Portfolio Campaign",
            "description": "Campaign with portfolios",
            "due_date": str(date.today() + timedelta(days=45)),
            "sla_days": 21,
            "link_model": "per_location",
            "breach_policy": "continue",
            "portfolio_ids": [str(test_property_1.id)],
        }
        response = await client.post(
            "/api/campaigns",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Portfolio Campaign"

    async def test_create_campaign_unauthorized(self, client):
        """Test creating campaign without authentication."""
        response = await client.post(
            "/api/campaigns",
            json={
                "name": "Unauthorized Campaign",
                "description": "Should fail",
                "due_date": str(date.today() + timedelta(days=30)),
                "sla_days": 21,
                "link_model": "bundled",
                "breach_policy": "escalate",
                "portfolio_ids": [],
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.campaigns
class TestGetCampaign:
    """Test get campaign endpoint."""

    async def test_get_campaign_success(self, client, auth_headers_user_1, test_campaign_1):
        """Test retrieving a campaign."""
        response = await client.get(
            f"/api/campaigns/{test_campaign_1.id}",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(test_campaign_1.id)
        assert data["name"] == "Test Campaign 1"

    async def test_get_campaign_not_found(self, client, auth_headers_user_1):
        """Test retrieving non-existent campaign."""
        fake_id = uuid.uuid4()
        response = await client.get(
            f"/api/campaigns/{fake_id}",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_campaign_unauthorized(self, client, test_campaign_1):
        """Test retrieving campaign without authentication."""
        response = await client.get(f"/api/campaigns/{test_campaign_1.id}")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.campaigns
class TestUpdateCampaign:
    """Test update campaign endpoint."""

    async def test_update_campaign_success(self, client, auth_headers_user_1, test_campaign_1):
        """Test updating campaign fields."""
        new_due_date = date.today() + timedelta(days=60)
        payload = {
            "name": "Updated Campaign Name",
            "description": "Updated description",
            "due_date": str(new_due_date),
            "sla_days": 28,
        }
        response = await client.put(
            f"/api/campaigns/{test_campaign_1.id}",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Updated Campaign Name"
        assert data["description"] == "Updated description"
        assert data["sla_days"] == 28

    async def test_update_campaign_partial(self, client, auth_headers_user_1, test_campaign_1):
        """Test partial campaign update."""
        payload = {"name": "Partially Updated"}
        response = await client.put(
            f"/api/campaigns/{test_campaign_1.id}",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Partially Updated"
        # Other fields should remain unchanged
        assert data["description"] == "A test campaign"

    async def test_update_campaign_not_found(self, client, auth_headers_user_1):
        """Test updating non-existent campaign."""
        fake_id = uuid.uuid4()
        response = await client.put(
            f"/api/campaigns/{fake_id}",
            json={"name": "New Name"},
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
@pytest.mark.campaigns
class TestActivateCampaign:
    """Test activate campaign endpoint."""

    async def test_activate_campaign_success(self, client, auth_headers_user_1, test_campaign_1):
        """Test activating a draft campaign."""
        assert test_campaign_1.status == "draft"

        response = await client.post(
            f"/api/campaigns/{test_campaign_1.id}/activate",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "active"

    async def test_activate_already_active_campaign(
        self, client, auth_headers_user_1, test_campaign_active
    ):
        """Test activating an already active campaign."""
        response = await client.post(
            f"/api/campaigns/{test_campaign_active.id}/activate",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "not in draft status" in response.json()["detail"]

    async def test_activate_nonexistent_campaign(self, client, auth_headers_user_1):
        """Test activating non-existent campaign."""
        fake_id = uuid.uuid4()
        response = await client.post(
            f"/api/campaigns/{fake_id}/activate",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
@pytest.mark.campaigns
class TestExtendCampaignDeadline:
    """Test extend campaign deadline endpoint."""

    async def test_extend_deadline_success(self, client, auth_headers_user_1, test_campaign_1):
        """Test extending campaign deadline."""
        original_due = test_campaign_1.due_date

        payload = {
            "days": 14,
            "reason_code": "request_for_extension",
            "reason_note": "Requesting more time",
            "notify_assignees": False,
        }
        response = await client.post(
            f"/api/campaigns/{test_campaign_1.id}/extend-deadline",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Due date should be extended
        assert data["due_date"] != original_due.isoformat()

    async def test_extend_deadline_with_notification(
        self, client, auth_headers_user_1, test_campaign_1
    ):
        """Test extending deadline with assignee notification."""
        payload = {
            "days": 7,
            "reason_code": "force_majeure",
            "reason_note": "Weather delay",
            "notify_assignees": True,
        }
        response = await client.post(
            f"/api/campaigns/{test_campaign_1.id}/extend-deadline",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK

    async def test_extend_nonexistent_campaign_deadline(self, client, auth_headers_user_1):
        """Test extending deadline for non-existent campaign."""
        fake_id = uuid.uuid4()
        payload = {
            "days": 14,
            "reason_code": "test",
            "reason_note": "Test",
            "notify_assignees": False,
        }
        response = await client.post(
            f"/api/campaigns/{fake_id}/extend-deadline",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
@pytest.mark.campaigns
class TestCampaignStats:
    """Test campaign stats endpoint."""

    async def test_get_campaign_stats_empty(self, client, auth_headers_user_1, test_campaign_1):
        """Test getting stats for campaign with no assignments."""
        response = await client.get(
            f"/api/campaigns/{test_campaign_1.id}/stats",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["campaign_id"] == str(test_campaign_1.id)
        assert data["total"] == 0
        assert data["status_counts"] == {}

    async def test_get_campaign_stats_with_assignments(
        self,
        client,
        auth_headers_user_1,
        test_campaign_1,
        test_assignment_1,
    ):
        """Test getting stats for campaign with assignments."""
        response = await client.get(
            f"/api/campaigns/{test_campaign_1.id}/stats",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["campaign_id"] == str(test_campaign_1.id)
        assert data["total"] == 1
        assert data["status_counts"]["not_started"] == 1

    async def test_get_stats_nonexistent_campaign(self, client, auth_headers_user_1):
        """Test getting stats for non-existent campaign."""
        fake_id = uuid.uuid4()
        response = await client.get(
            f"/api/campaigns/{fake_id}/stats",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
