import pytest
import uuid
from datetime import date, timedelta, datetime, timezone
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.delegations
class TestDelegationsCRUD:
    """Test delegation CRUD operations."""

    async def test_get_my_delegations(
        self, client: AsyncClient, test_user_1, test_delegation_1, auth_headers_user_1
    ):
        """Test getting delegations for current user."""
        response = await client.get(
            "/api/delegations",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # User 1 is the delegator in test_delegation_1
        assert any(d["id"] == str(test_delegation_1.id) for d in data)

    async def test_get_campaign_delegations(
        self, client: AsyncClient, test_campaign_1, test_delegation_1, auth_headers_user_1
    ):
        """Test getting delegations for a campaign."""
        response = await client.get(
            f"/api/delegations/campaign/{test_campaign_1.id}",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should include active delegations for assignments in this campaign
        if data:
            assert all(d["is_active"] for d in data)

    async def test_create_delegation(
        self, client: AsyncClient, test_db, test_assignment_1, test_user_1, test_user_2, auth_headers_user_1
    ):
        """Test creating a new delegation."""
        payload = {
            "assignment_id": str(test_assignment_1.id),
            "delegator_id": str(test_user_1.id),
            "delegate_id": str(test_user_2.id),
            "level": 1,
            "delegation_type": "specific",
        }
        response = await client.post(
            "/api/delegations",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["assignment_id"] == str(test_assignment_1.id)
        assert data["delegator_id"] == str(test_user_1.id)
        assert data["delegate_id"] == str(test_user_2.id)
        assert data["level"] == 1
        assert data["is_active"] is True

    async def test_create_level_2_delegation(
        self, client: AsyncClient, test_assignment_1, test_user_1, test_user_3, auth_headers_user_1
    ):
        """Test creating a level 2 delegation."""
        payload = {
            "assignment_id": str(test_assignment_1.id),
            "delegator_id": str(test_user_1.id),
            "delegate_id": str(test_user_3.id),
            "level": 2,
            "delegation_type": "specific",
        }
        response = await client.post(
            "/api/delegations",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["level"] == 2

    async def test_revoke_delegation(
        self, client: AsyncClient, test_delegation_1, auth_headers_user_1
    ):
        """Test revoking a delegation."""
        response = await client.delete(
            f"/api/delegations/{test_delegation_1.id}",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 204

    async def test_revoke_nonexistent_delegation(
        self, client: AsyncClient, auth_headers_user_1
    ):
        """Test revoking a nonexistent delegation."""
        fake_id = uuid.uuid4()
        response = await client.delete(
            f"/api/delegations/{fake_id}",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.delegations
class TestOOODelegation:
    """Test Out-Of-Office (OOO) blanket delegation."""

    async def test_get_user_ooo_delegation(
        self, client: AsyncClient, test_user_1, test_ooo_delegation, auth_headers_user_1
    ):
        """Test getting OOO blanket delegation for a user."""
        response = await client.get(
            f"/api/delegations/users/{test_user_1.id}/ooo",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        if data:
            assert data["delegation_type"] == "ooo_blanket"
            assert data["delegator_id"] == str(test_user_1.id)

    async def test_get_no_ooo_delegation(
        self, client: AsyncClient, test_user_3, auth_headers_user_1
    ):
        """Test getting OOO delegation when none exists."""
        response = await client.get(
            f"/api/delegations/users/{test_user_3.id}/ooo",
            headers=auth_headers_user_1,
        )
        # Should return 200 with null/None data or empty
        assert response.status_code == 200

    async def test_set_user_ooo_delegation(
        self, client: AsyncClient, test_user_1, test_user_2, auth_headers_user_1
    ):
        """Test setting an OOO blanket delegation."""
        ooo_start = date.today()
        ooo_end = date.today() + timedelta(days=7)

        payload = {
            "delegate_id": str(test_user_2.id),
            "ooo_start": ooo_start.isoformat(),
            "ooo_end": ooo_end.isoformat(),
            "reason": "Vacation",
        }
        response = await client.post(
            f"/api/delegations/users/{test_user_1.id}/ooo",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["delegation_type"] == "ooo_blanket"
        assert data["delegator_id"] == str(test_user_1.id)
        assert data["delegate_id"] == str(test_user_2.id)
        assert data["reason"] == "Vacation"
        assert data["is_active"] is True

    async def test_set_ooo_with_dates(
        self, client: AsyncClient, test_user_1, test_user_2, auth_headers_user_1
    ):
        """Test setting OOO delegation with proper date ranges."""
        ooo_start = (date.today() + timedelta(days=1)).isoformat()
        ooo_end = (date.today() + timedelta(days=10)).isoformat()

        payload = {
            "delegate_id": str(test_user_2.id),
            "ooo_start": ooo_start,
            "ooo_end": ooo_end,
            "reason": "Business trip",
        }
        response = await client.post(
            f"/api/delegations/users/{test_user_1.id}/ooo",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["ooo_start"] == ooo_start
        assert data["ooo_end"] == ooo_end


@pytest.mark.asyncio
@pytest.mark.delegations
class TestDelegationIntegration:
    """Test delegation integration with assignments."""

    async def test_delegation_created_with_assignment(
        self, client: AsyncClient, test_db, test_campaign_active, test_property_1, test_user_1, test_user_2, auth_headers_user_1
    ):
        """Test creating assignment with delegation in one call."""
        payload = {
            "property_id": str(test_property_1.id),
            "primary_assignee_id": str(test_user_1.id),
            "delegate_l1_id": str(test_user_2.id),
            "assignee_type": "internal",
            "due_date": (date.today() + timedelta(days=21)).isoformat(),
        }
        response = await client.post(
            f"/api/campaigns/{test_campaign_active.id}/assignments",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 201
        assignment_data = response.json()
        assignment_id = assignment_data["id"]

        # Verify delegation was created by checking campaign delegations
        response2 = await client.get(
            f"/api/delegations/campaign/{test_campaign_active.id}",
            headers=auth_headers_user_1,
        )
        assert response2.status_code == 200
        delegations = response2.json()
        # Should have delegations for this assignment
        assert any(d["assignment_id"] == assignment_id for d in delegations)

    async def test_multiple_delegations_same_assignment(
        self, client: AsyncClient, test_assignment_1, test_user_1, test_user_2, test_user_3, auth_headers_user_1
    ):
        """Test creating multiple delegations for same assignment."""
        # Create L1 delegation
        payload1 = {
            "assignment_id": str(test_assignment_1.id),
            "delegator_id": str(test_user_1.id),
            "delegate_id": str(test_user_2.id),
            "level": 1,
        }
        response1 = await client.post(
            "/api/delegations",
            json=payload1,
            headers=auth_headers_user_1,
        )
        assert response1.status_code == 201
        delegation1 = response1.json()

        # Create L2 delegation
        payload2 = {
            "assignment_id": str(test_assignment_1.id),
            "delegator_id": str(test_user_1.id),
            "delegate_id": str(test_user_3.id),
            "level": 2,
        }
        response2 = await client.post(
            "/api/delegations",
            json=payload2,
            headers=auth_headers_user_1,
        )
        assert response2.status_code == 201
        delegation2 = response2.json()

        # Verify both exist
        assert delegation1["level"] == 1
        assert delegation2["level"] == 2
        assert delegation1["assignment_id"] == delegation2["assignment_id"]

    async def test_revoked_delegation_not_active(
        self, client: AsyncClient, test_db, test_delegation_1, auth_headers_user_1
    ):
        """Test that revoked delegation is not returned as active."""
        # Revoke the delegation
        response = await client.delete(
            f"/api/delegations/{test_delegation_1.id}",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 204

        # Verify it doesn't appear in active delegations
        response2 = await client.get(
            "/api/delegations",
            headers=auth_headers_user_1,
        )
        assert response2.status_code == 200
        delegations = response2.json()
        assert not any(d["id"] == str(test_delegation_1.id) for d in delegations)
