import pytest
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.submissions
class TestSubmissionUpsert:
    """Test submission upsert operations."""

    async def test_get_submission_draft(
        self, client: AsyncClient, test_assignment_1, test_submission_1, auth_headers_user_1
    ):
        """Test getting a draft submission."""
        response = await client.get(
            f"/api/assignments/{test_assignment_1.id}/submission",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_submission_1.id)
        assert data["status"] == "draft"
        assert data["version"] == 1

    async def test_get_nonexistent_submission(
        self, client: AsyncClient, auth_headers_user_1
    ):
        """Test getting submission for assignment with no submission."""
        fake_assignment_id = uuid.uuid4()
        response = await client.get(
            f"/api/assignments/{fake_assignment_id}/submission",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 404

    async def test_upsert_submission_creates_new(
        self, client: AsyncClient, test_db, test_assignment_2, auth_headers_user_2
    ):
        """Test creating a new submission via upsert."""
        from app.models.assignment import Assignment
        from sqlalchemy import select

        # Ensure assignment has no submission
        result = await test_db.execute(
            select(Assignment).where(Assignment.id == test_assignment_2.id)
        )
        assignment = result.scalar_one()
        assert assignment.status == "not_started"

        payload = {
            "data": {"property_value": 1200000, "condition": "excellent"},
            "actor_type": "primary",
        }
        response = await client.put(
            f"/api/assignments/{test_assignment_2.id}/submission",
            json=payload,
            headers=auth_headers_user_2,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "draft"
        assert data["version"] == 1
        assert data["data"]["property_value"] == 1200000
        assert data["total_tiv"] is not None

    async def test_upsert_submission_updates_existing(
        self, client: AsyncClient, test_assignment_1, test_submission_1, auth_headers_user_1
    ):
        """Test updating an existing draft submission."""
        payload = {
            "data": {"property_value": 575000, "condition": "excellent"},
            "actor_type": "primary",
        }
        response = await client.put(
            f"/api/assignments/{test_assignment_1.id}/submission",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == 2
        assert data["data"]["property_value"] == 575000

    async def test_upsert_submission_creates_history(
        self, client: AsyncClient, test_assignment_1, test_submission_1, auth_headers_user_1
    ):
        """Test that updating submission creates history entry."""
        payload = {
            "data": {"property_value": 600000, "condition": "good"},
            "actor_type": "primary",
        }
        response = await client.put(
            f"/api/assignments/{test_assignment_1.id}/submission",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200

        # Check history endpoint
        response2 = await client.get(
            f"/api/submissions/{test_submission_1.id}/history",
            headers=auth_headers_user_1,
        )
        assert response2.status_code == 200
        history = response2.json()
        assert len(history) > 0

    async def test_upsert_updates_assignment_status(
        self, client: AsyncClient, test_db, test_assignment_2, auth_headers_user_2
    ):
        """Test that first upsert updates assignment from not_started to in_progress."""
        from app.models.assignment import Assignment
        from sqlalchemy import select

        # Verify initial status
        result = await test_db.execute(
            select(Assignment).where(Assignment.id == test_assignment_2.id)
        )
        assignment = result.scalar_one()
        assert assignment.status == "not_started"

        payload = {
            "data": {"property_value": 950000, "condition": "good"},
            "actor_type": "primary",
        }
        await client.put(
            f"/api/assignments/{test_assignment_2.id}/submission",
            json=payload,
            headers=auth_headers_user_2,
        )

        # Verify status changed
        await test_db.refresh(assignment)
        assert assignment.status == "in_progress"

    async def test_upsert_cannot_edit_submitted(
        self, client: AsyncClient, test_assignment_2, test_submission_submitted, auth_headers_user_2
    ):
        """Test that submitted submissions cannot be edited."""
        payload = {
            "data": {"property_value": 999999, "condition": "poor"},
            "actor_type": "primary",
        }
        response = await client.put(
            f"/api/assignments/{test_assignment_2.id}/submission",
            json=payload,
            headers=auth_headers_user_2,
        )
        assert response.status_code == 400
        assert "Cannot edit a submitted form" in response.json()["detail"]


@pytest.mark.asyncio
@pytest.mark.submissions
class TestSubmissionSubmit:
    """Test submission submission (final submit)."""

    async def test_submit_submission(
        self, client: AsyncClient, test_assignment_1, test_submission_1, auth_headers_user_1
    ):
        """Test submitting a draft submission."""
        response = await client.post(
            f"/api/assignments/{test_assignment_1.id}/submission/submit",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "submitted"
        assert data["submitted_at"] is not None

    async def test_submit_nonexistent_assignment(
        self, client: AsyncClient, auth_headers_user_1
    ):
        """Test submitting for nonexistent assignment."""
        fake_id = uuid.uuid4()
        response = await client.post(
            f"/api/assignments/{fake_id}/submission/submit",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 404

    async def test_submit_empty_submission(
        self, client: AsyncClient, test_db, test_assignment_2, auth_headers_user_2
    ):
        """Test submitting a submission with no data."""
        from app.models.submission import Submission

        # Create empty submission
        sub = Submission(
            assignment_id=test_assignment_2.id,
            data={},
            status="draft",
        )
        test_db.add(sub)
        await test_db.flush()

        response = await client.post(
            f"/api/assignments/{test_assignment_2.id}/submission/submit",
            headers=auth_headers_user_2,
        )
        assert response.status_code == 400
        assert "No data to submit" in response.json()["detail"]

    async def test_submit_updates_assignment_status(
        self, client: AsyncClient, test_db, test_assignment_1, test_submission_1, auth_headers_user_1
    ):
        """Test that submitting updates assignment status to submitted."""
        from app.models.assignment import Assignment
        from sqlalchemy import select

        response = await client.post(
            f"/api/assignments/{test_assignment_1.id}/submission/submit",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200

        # Verify assignment status
        result = await test_db.execute(
            select(Assignment).where(Assignment.id == test_assignment_1.id)
        )
        assignment = result.scalar_one()
        assert assignment.status == "submitted"


@pytest.mark.asyncio
@pytest.mark.submissions
class TestSubmissionHistory:
    """Test submission history tracking."""

    async def test_get_submission_history(
        self, client: AsyncClient, test_submission_1, test_submission_history, auth_headers_user_1
    ):
        """Test getting submission history."""
        response = await client.get(
            f"/api/submissions/{test_submission_1.id}/history",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        history = response.json()
        assert isinstance(history, list)
        assert len(history) >= 1

    async def test_history_ordered_by_version_desc(
        self, client: AsyncClient, test_db, test_assignment_1, test_submission_1, test_user_1, auth_headers_user_1
    ):
        """Test that history is ordered by version descending."""
        from app.models.submission import SubmissionHistory

        # Add multiple history entries
        for v in range(2, 5):
            history = SubmissionHistory(
                submission_id=test_submission_1.id,
                data={"property_value": 500000 + (v * 1000), "version": v},
                version=v,
                saved_by_id=test_user_1.id,
            )
            test_db.add(history)
        await test_db.flush()

        response = await client.get(
            f"/api/submissions/{test_submission_1.id}/history",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        history = response.json()
        # Should be ordered by version descending
        versions = [h["version"] for h in history]
        assert versions == sorted(versions, reverse=True)

    async def test_history_created_on_update(
        self, client: AsyncClient, test_db, test_assignment_1, test_submission_1, auth_headers_user_1
    ):
        """Test that history entry is created when submission is updated."""
        from app.models.submission import SubmissionHistory
        from sqlalchemy import select

        # Get initial history count
        result = await test_db.execute(
            select(SubmissionHistory).where(SubmissionHistory.submission_id == test_submission_1.id)
        )
        initial_count = len(result.scalars().all())

        # Update submission
        payload = {
            "data": {"property_value": 625000, "condition": "excellent"},
            "actor_type": "primary",
        }
        await client.put(
            f"/api/assignments/{test_assignment_1.id}/submission",
            json=payload,
            headers=auth_headers_user_1,
        )

        # Check history count increased
        result = await test_db.execute(
            select(SubmissionHistory).where(SubmissionHistory.submission_id == test_submission_1.id)
        )
        final_count = len(result.scalars().all())
        assert final_count > initial_count

    async def test_history_preserves_previous_data(
        self, client: AsyncClient, test_db, test_assignment_1, test_submission_1, auth_headers_user_1
    ):
        """Test that history preserves previous submission data."""
        original_data = test_submission_1.data.copy()

        # Update submission
        new_data = {"property_value": 700000, "condition": "excellent"}
        payload = {"data": new_data, "actor_type": "primary"}
        await client.put(
            f"/api/assignments/{test_assignment_1.id}/submission",
            json=payload,
            headers=auth_headers_user_1,
        )

        # Get history
        response = await client.get(
            f"/api/submissions/{test_submission_1.id}/history",
            headers=auth_headers_user_1,
        )
        history = response.json()

        # Find the history entry with original data
        assert any(h["data"] == original_data for h in history)


@pytest.mark.asyncio
@pytest.mark.submissions
class TestSubmissionActor:
    """Test submission actor_type tracking."""

    async def test_upsert_with_different_actor_types(
        self, client: AsyncClient, test_db, test_assignment_1, auth_headers_user_1
    ):
        """Test saving submission with different actor types."""
        payload = {
            "data": {"property_value": 550000, "condition": "good"},
            "actor_type": "delegate_l1",
        }
        response = await client.put(
            f"/api/assignments/{test_assignment_1.id}/submission",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["actor_type"] == "delegate_l1"

    async def test_actor_type_external(
        self, client: AsyncClient, test_db, test_assignment_external, auth_headers_user_1
    ):
        """Test saving submission as external actor."""
        payload = {
            "data": {"property_value": 550000, "condition": "good"},
            "actor_type": "external",
        }
        response = await client.put(
            f"/api/assignments/{test_assignment_external.id}/submission",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["actor_type"] == "external"
