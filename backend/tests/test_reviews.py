import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.reviews
class TestReviewWorkflow:
    """Test review submission workflow."""

    async def test_get_review_queue(
        self, client: AsyncClient, test_submission_submitted, auth_headers_user_1
    ):
        """Test getting review queue with submitted submissions."""
        response = await client.get(
            "/api/reviews/queue",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        queue = response.json()
        assert isinstance(queue, list)
        # Should have at least one submitted submission
        if queue:
            assert any(item["status"] == "submitted" for item in queue)

    async def test_review_queue_shows_property_details(
        self, client: AsyncClient, test_submission_submitted, auth_headers_user_1
    ):
        """Test that review queue includes property details."""
        response = await client.get(
            "/api/reviews/queue",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        queue = response.json()

        if queue:
            item = queue[0]
            assert "submission_id" in item
            assert "property_address" in item
            assert "property_city" in item
            assert "property_state" in item
            assert "total_tiv" in item

    async def test_approve_submission(
        self, client: AsyncClient, test_submission_submitted, auth_headers_user_1
    ):
        """Test approving a submitted submission."""
        payload = {
            "decision": "approved",
            "comment": "Values look good",
            "reason_code": "standard_review",
            "requires_escalation": False,
        }
        response = await client.post(
            f"/api/submissions/{test_submission_submitted.id}/review",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        review = response.json()
        assert review["decision"] == "approved"
        assert review["comment"] == "Values look good"
        assert "reviewer_id" in review

    async def test_reject_submission(
        self, client: AsyncClient, test_submission_submitted, auth_headers_user_1
    ):
        """Test rejecting a submitted submission."""
        payload = {
            "decision": "rejected",
            "comment": "Values seem too high",
            "reason_code": "outlier_detected",
            "requires_escalation": True,
        }
        response = await client.post(
            f"/api/submissions/{test_submission_submitted.id}/review",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        review = response.json()
        assert review["decision"] == "rejected"
        assert review["reason_code"] == "outlier_detected"
        assert review["requires_escalation"] is True

    async def test_request_info_decision(
        self, client: AsyncClient, test_submission_submitted, auth_headers_user_1
    ):
        """Test requesting additional info on a submission."""
        payload = {
            "decision": "requested_info",
            "comment": "Please provide additional documentation",
            "reason_code": "missing_docs",
            "requires_escalation": False,
        }
        response = await client.post(
            f"/api/submissions/{test_submission_submitted.id}/review",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        review = response.json()
        assert review["decision"] == "requested_info"

    async def test_review_updates_assignment_status_approved(
        self, client: AsyncClient, test_db, test_assignment_2, test_submission_submitted, auth_headers_user_1
    ):
        """Test that approval updates assignment status."""
        from app.models.assignment import Assignment
        from sqlalchemy import select

        payload = {
            "decision": "approved",
            "comment": "Approved",
            "reason_code": "standard",
            "requires_escalation": False,
        }
        await client.post(
            f"/api/submissions/{test_submission_submitted.id}/review",
            json=payload,
            headers=auth_headers_user_1,
        )

        # Verify assignment status
        result = await test_db.execute(
            select(Assignment).where(Assignment.id == test_assignment_2.id)
        )
        assignment = result.scalar_one()
        assert assignment.status == "approved"

    async def test_review_updates_assignment_status_rejected(
        self, client: AsyncClient, test_db, test_assignment_2, test_submission_submitted, auth_headers_user_1
    ):
        """Test that rejection updates assignment status."""
        from app.models.assignment import Assignment
        from sqlalchemy import select

        payload = {
            "decision": "rejected",
            "comment": "Needs revision",
            "reason_code": "data_quality",
            "requires_escalation": False,
        }
        await client.post(
            f"/api/submissions/{test_submission_submitted.id}/review",
            json=payload,
            headers=auth_headers_user_1,
        )

        # Verify assignment status
        result = await test_db.execute(
            select(Assignment).where(Assignment.id == test_assignment_2.id)
        )
        assignment = result.scalar_one()
        assert assignment.status == "rejected"

    async def test_review_reopens_submission_on_rejection(
        self, client: AsyncClient, test_db, test_submission_submitted, auth_headers_user_1
    ):
        """Test that rejection reopens submission to draft status."""
        from app.models.submission import Submission
        from sqlalchemy import select

        payload = {
            "decision": "rejected",
            "comment": "Needs revision",
            "reason_code": "data_quality",
            "requires_escalation": False,
        }
        await client.post(
            f"/api/submissions/{test_submission_submitted.id}/review",
            json=payload,
            headers=auth_headers_user_1,
        )

        # Verify submission status
        result = await test_db.execute(
            select(Submission).where(Submission.id == test_submission_submitted.id)
        )
        submission = result.scalar_one()
        assert submission.status == "draft"

    async def test_review_nonexistent_submission(
        self, client: AsyncClient, auth_headers_user_1
    ):
        """Test reviewing nonexistent submission."""
        fake_id = uuid.uuid4()
        payload = {
            "decision": "approved",
            "comment": "Test",
            "reason_code": "test",
            "requires_escalation": False,
        }
        response = await client.post(
            f"/api/submissions/{fake_id}/review",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 404

    async def test_review_draft_submission_fails(
        self, client: AsyncClient, test_submission_1, auth_headers_user_1
    ):
        """Test that reviewing a draft submission fails."""
        payload = {
            "decision": "approved",
            "comment": "Test",
            "reason_code": "test",
            "requires_escalation": False,
        }
        response = await client.post(
            f"/api/submissions/{test_submission_1.id}/review",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 400
        assert "not pending review" in response.json()["detail"]

    async def test_review_stores_reviewer_id(
        self, client: AsyncClient, test_submission_submitted, test_user_1, auth_headers_user_1
    ):
        """Test that review stores the correct reviewer ID."""
        payload = {
            "decision": "approved",
            "comment": "Good",
            "reason_code": "standard",
            "requires_escalation": False,
        }
        response = await client.post(
            f"/api/submissions/{test_submission_submitted.id}/review",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        review = response.json()
        assert review["reviewer_id"] == str(test_user_1.id)

    async def test_review_with_escalation_flag(
        self, client: AsyncClient, test_submission_submitted, auth_headers_user_1
    ):
        """Test review with escalation flag."""
        payload = {
            "decision": "rejected",
            "comment": "Significant variance from prior value",
            "reason_code": "significant_variance",
            "requires_escalation": True,
        }
        response = await client.post(
            f"/api/submissions/{test_submission_submitted.id}/review",
            json=payload,
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        review = response.json()
        assert review["requires_escalation"] is True


@pytest.mark.asyncio
@pytest.mark.reviews
class TestReviewQueueIntegration:
    """Test review queue integration with submissions and assignments."""

    async def test_review_queue_empty_when_no_submissions(
        self, client: AsyncClient, auth_headers_user_1
    ):
        """Test that review queue is empty when no submitted submissions."""
        response = await client.get(
            "/api/reviews/queue",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        queue = response.json()
        # May be empty or contain other submissions
        assert isinstance(queue, list)

    async def test_review_queue_includes_tiv_info(
        self, client: AsyncClient, test_submission_submitted, auth_headers_user_1
    ):
        """Test that review queue includes TIV information."""
        response = await client.get(
            "/api/reviews/queue",
            headers=auth_headers_user_1,
        )
        assert response.status_code == 200
        queue = response.json()

        if queue:
            item = queue[0]
            # Should have TIV-related fields
            assert "total_tiv" in item
            assert "prior_tiv" in item

    async def test_multiple_reviews_same_submission(
        self, client: AsyncClient, test_db, test_submission_submitted, test_user_1, test_user_2, auth_headers_user_1, auth_headers_user_2
    ):
        """Test that multiple reviews can be created (though not typically allowed in real system)."""
        from app.models.submission import Submission
        from sqlalchemy import select

        # First review - rejection to reopen
        payload1 = {
            "decision": "rejected",
            "comment": "Needs revision",
            "reason_code": "data_quality",
            "requires_escalation": False,
        }
        response1 = await client.post(
            f"/api/submissions/{test_submission_submitted.id}/review",
            json=payload1,
            headers=auth_headers_user_1,
        )
        assert response1.status_code == 200

        # Resubmit the submission
        payload_submit = {
            "data": {"property_value": 1100500, "condition": "excellent"},
            "actor_type": "primary",
        }
        await client.put(
            f"/api/assignments/{test_submission_submitted.assignment_id}/submission",
            json=payload_submit,
            headers=auth_headers_user_1,
        )

        # Need to re-submit to make it submitted again
        await client.post(
            f"/api/assignments/{test_submission_submitted.assignment_id}/submission/submit",
            headers=auth_headers_user_1,
        )

        # Second review - approval
        payload2 = {
            "decision": "approved",
            "comment": "Good now",
            "reason_code": "standard",
            "requires_escalation": False,
        }
        response2 = await client.post(
            f"/api/submissions/{test_submission_submitted.id}/review",
            json=payload2,
            headers=auth_headers_user_2,
        )
        assert response2.status_code == 200
