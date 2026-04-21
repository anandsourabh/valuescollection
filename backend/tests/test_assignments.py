import pytest
import uuid
from datetime import date, timedelta
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.assignments
class TestAssignmentsCRUD:
    """Test assignment CRUD operations."""

    async def test_list_campaign_assignments(
        self, client: AsyncClient, test_campaign_1, test_assignment_1, auth_headers_user_1
    ):
        """Test listing assignments for a campaign."""
        response = await client.get(
            f"/api/campaigns/{test_campaign_1.id}/assignments",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["id"] == str(test_assignment_1.id)

    async def test_list_assignments_with_status_filter(
        self, client: AsyncClient, test_db, test_campaign_1, test_user_1, auth_headers_user_1
    ):
        """Test listing assignments with status filter."""
        # Create an assignment in progress
        from app.models.assignment import Assignment

        assignment = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=uuid.uuid4(),
            primary_assignee_id=test_user_1.id,
            status="in_progress",
            due_date=date.today() + timedelta(days=21),
        )
        test_db.add(assignment)
        await test_db.flush()

        response = await client.get(
            f"/api/campaigns/{test_campaign_1.id}/assignments?status=in_progress",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert all(item["status"] == "in_progress" for item in data)

    async def test_create_assignment(
        self, client: AsyncClient, test_campaign_active, test_property_1, test_user_1, auth_headers_user_1
    ):
        """Test creating a new assignment."""
        payload = {
            "property_id": str(test_property_1.id),
            "primary_assignee_id": str(test_user_1.id),
            "assignee_type": "internal",
            "due_date": (date.today() + timedelta(days=21)).isoformat(),
        }
        response = await client.post(
            f"/api/campaigns/{test_campaign_active.id}/assignments",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["property_id"] == str(test_property_1.id)
        assert data["primary_assignee_id"] == str(test_user_1.id)
        assert data["status"] == "not_started"

    async def test_create_assignment_with_delegations(
        self, client: AsyncClient, test_db, test_campaign_active, test_property_1, test_user_1, test_user_2, test_user_3, auth_headers_user_1
    ):
        """Test creating assignment with l1 and l2 delegates."""
        payload = {
            "property_id": str(test_property_1.id),
            "primary_assignee_id": str(test_user_1.id),
            "delegate_l1_id": str(test_user_2.id),
            "delegate_l2_id": str(test_user_3.id),
            "assignee_type": "internal",
            "due_date": (date.today() + timedelta(days=21)).isoformat(),
        }
        response = await client.post(
            f"/api/campaigns/{test_campaign_active.id}/assignments",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data

    async def test_create_external_assignment(
        self, client: AsyncClient, test_campaign_active, test_property_1, auth_headers_user_1
    ):
        """Test creating an external assignment."""
        payload = {
            "property_id": str(test_property_1.id),
            "external_email": "contractor@external.local",
            "assignee_type": "external",
            "due_date": (date.today() + timedelta(days=14)).isoformat(),
        }
        response = await client.post(
            f"/api/campaigns/{test_campaign_active.id}/assignments",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["assignee_type"] == "external"
        assert data["external_email"] == "contractor@external.local"

    async def test_get_assignment(
        self, client: AsyncClient, test_assignment_1, auth_headers_user_1
    ):
        """Test getting a specific assignment."""
        response = await client.get(
            f"/api/assignments/{test_assignment_1.id}",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_assignment_1.id)
        assert data["status"] == "not_started"

    async def test_get_nonexistent_assignment(
        self, client: AsyncClient, auth_headers_user_1
    ):
        """Test getting a nonexistent assignment."""
        fake_id = uuid.uuid4()
        response = await client.get(
            f"/api/assignments/{fake_id}",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 404

    async def test_update_assignment(
        self, client: AsyncClient, test_assignment_1, test_user_2, auth_headers_user_1
    ):
        """Test updating an assignment."""
        payload = {
            "primary_assignee_id": str(test_user_2.id),
            "status": "in_progress",
        }
        response = await client.put(
            f"/api/assignments/{test_assignment_1.id}",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"
        assert data["primary_assignee_id"] == str(test_user_2.id)

    async def test_update_assignment_status(
        self, client: AsyncClient, test_assignment_1, auth_headers_user_1
    ):
        """Test updating assignment status."""
        payload = {"status": "submitted"}
        response = await client.put(
            f"/api/assignments/{test_assignment_1.id}",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "submitted"


@pytest.mark.asyncio
@pytest.mark.assignments
class TestAssignmentDeadlineExtension:
    """Test assignment deadline extension."""

    async def test_extend_assignment_deadline(
        self, client: AsyncClient, test_assignment_1, auth_headers_user_1
    ):
        """Test extending an assignment deadline."""
        original_due = test_assignment_1.due_date
        payload = {
            "days": 7,
            "reason_code": "client_request",
            "reason_note": "Client requested more time",
            "notify_assignees": False,
        }
        response = await client.post(
            f"/api/assignments/{test_assignment_1.id}/extend-deadline",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["due_date"] > original_due.isoformat()

    async def test_extend_deadline_non_existent(
        self, client: AsyncClient, auth_headers_user_1
    ):
        """Test extending deadline for nonexistent assignment."""
        fake_id = uuid.uuid4()
        payload = {
            "days": 7,
            "reason_code": "test",
            "notify_assignees": False,
        }
        response = await client.post(
            f"/api/assignments/{fake_id}/extend-deadline",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.assignments
class TestAssignmentBulkActions:
    """Test assignment bulk actions."""

    async def test_bulk_action_remind(
        self, client: AsyncClient, test_db, test_campaign_1, test_property_1, test_property_2, test_user_1, auth_headers_user_1
    ):
        """Test bulk remind action."""
        from app.models.assignment import Assignment

        # Create two assignments
        a1 = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=test_property_1.id,
            primary_assignee_id=test_user_1.id,
            status="not_started",
            due_date=date.today() + timedelta(days=21),
        )
        a2 = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=test_property_2.id,
            primary_assignee_id=test_user_1.id,
            status="not_started",
            due_date=date.today() + timedelta(days=21),
        )
        test_db.add(a1)
        test_db.add(a2)
        await test_db.flush()

        payload = {
            "action": "remind",
            "ids": [str(a1.id), str(a2.id)],
        }
        response = await client.post(
            "/api/assignments/bulk-action",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        assert "Reminders sent" in response.json()["detail"]

    async def test_bulk_action_reassign(
        self, client: AsyncClient, test_db, test_campaign_1, test_property_1, test_property_2, test_user_1, test_user_2, auth_headers_user_1
    ):
        """Test bulk reassign action."""
        from app.models.assignment import Assignment

        a1 = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=test_property_1.id,
            primary_assignee_id=test_user_1.id,
            status="not_started",
            due_date=date.today() + timedelta(days=21),
        )
        a2 = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=test_property_2.id,
            primary_assignee_id=test_user_1.id,
            status="not_started",
            due_date=date.today() + timedelta(days=21),
        )
        test_db.add(a1)
        test_db.add(a2)
        await test_db.flush()

        payload = {
            "action": "reassign",
            "ids": [str(a1.id), str(a2.id)],
            "payload": {"assignee_id": str(test_user_2.id)},
        }
        response = await client.post(
            "/api/assignments/bulk-action",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        assert "reassigned" in response.json()["detail"]

    async def test_bulk_action_approve(
        self, client: AsyncClient, test_db, test_campaign_1, test_property_1, test_property_2, test_user_1, auth_headers_user_1
    ):
        """Test bulk approve action."""
        from app.models.assignment import Assignment

        a1 = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=test_property_1.id,
            primary_assignee_id=test_user_1.id,
            status="submitted",
            due_date=date.today() + timedelta(days=21),
        )
        a2 = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=test_property_2.id,
            primary_assignee_id=test_user_1.id,
            status="submitted",
            due_date=date.today() + timedelta(days=21),
        )
        test_db.add(a1)
        test_db.add(a2)
        await test_db.flush()

        payload = {
            "action": "bulk_approve",
            "ids": [str(a1.id), str(a2.id)],
        }
        response = await client.post(
            "/api/assignments/bulk-action",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        assert "approved" in response.json()["detail"]

    async def test_bulk_action_extend_deadline(
        self, client: AsyncClient, test_db, test_campaign_1, test_property_1, test_property_2, test_user_1, auth_headers_user_1
    ):
        """Test bulk extend deadline action."""
        from app.models.assignment import Assignment

        original_due = date.today() + timedelta(days=21)
        a1 = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=test_property_1.id,
            primary_assignee_id=test_user_1.id,
            status="not_started",
            due_date=original_due,
        )
        a2 = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=test_property_2.id,
            primary_assignee_id=test_user_1.id,
            status="not_started",
            due_date=original_due,
        )
        test_db.add(a1)
        test_db.add(a2)
        await test_db.flush()

        payload = {
            "action": "extend_deadline",
            "ids": [str(a1.id), str(a2.id)],
            "payload": {
                "days": 14,
                "reason_code": "bulk_extension",
                "notify_assignees": False,
            },
        }
        response = await client.post(
            "/api/assignments/bulk-action",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        assert "Deadlines extended" in response.json()["detail"]

    async def test_bulk_action_delegate(
        self, client: AsyncClient, test_db, test_campaign_1, test_property_1, test_property_2, test_user_1, test_user_2, auth_headers_user_1
    ):
        """Test bulk delegate action."""
        from app.models.assignment import Assignment

        a1 = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=test_property_1.id,
            primary_assignee_id=test_user_1.id,
            status="not_started",
            due_date=date.today() + timedelta(days=21),
        )
        a2 = Assignment(
            campaign_id=test_campaign_1.id,
            property_id=test_property_2.id,
            primary_assignee_id=test_user_1.id,
            status="not_started",
            due_date=date.today() + timedelta(days=21),
        )
        test_db.add(a1)
        test_db.add(a2)
        await test_db.flush()

        payload = {
            "action": "delegate",
            "ids": [str(a1.id), str(a2.id)],
            "payload": {
                "delegate_id": str(test_user_2.id),
                "level": 1,
            },
        }
        response = await client.post(
            "/api/assignments/bulk-action",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        assert "Delegated" in response.json()["detail"]

    async def test_bulk_action_invalid_action(
        self, client: AsyncClient, test_assignment_1, auth_headers_user_1
    ):
        """Test bulk action with invalid action type."""
        payload = {
            "action": "invalid_action",
            "ids": [str(test_assignment_1.id)],
        }
        response = await client.post(
            "/api/assignments/bulk-action",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 400
        assert "Unknown action" in response.json()["detail"]

    async def test_bulk_action_reassign_missing_payload(
        self, client: AsyncClient, test_assignment_1, auth_headers_user_1
    ):
        """Test reassign action without assignee_id in payload."""
        payload = {
            "action": "reassign",
            "ids": [str(test_assignment_1.id)],
            "payload": {},
        }
        response = await client.post(
            "/api/assignments/bulk-action",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 400
        assert "assignee_id required" in response.json()["detail"]

    async def test_bulk_action_delegate_missing_delegate_id(
        self, client: AsyncClient, test_assignment_1, auth_headers_user_1
    ):
        """Test delegate action without delegate_id in payload."""
        payload = {
            "action": "delegate",
            "ids": [str(test_assignment_1.id)],
            "payload": {},
        }
        response = await client.post(
            "/api/assignments/bulk-action",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 400
        assert "delegate_id required" in response.json()["detail"]
