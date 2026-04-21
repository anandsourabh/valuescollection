"""Tests for authentication endpoints."""
import pytest
from fastapi import status
from jose import jwt

from app.config import settings
from app.utils.jwt import verify_token


@pytest.mark.asyncio
@pytest.mark.auth
class TestLogin:
    """Test login endpoint."""

    async def test_login_success(self, client, valid_login_credentials):
        """Test successful login."""
        response = await client.post(
            "/api/auth/login",
            json=valid_login_credentials,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

        # Verify tokens are valid
        access_payload = verify_token(data["access_token"])
        assert access_payload is not None
        assert access_payload["type"] == "internal"

        refresh_payload = verify_token(data["refresh_token"])
        assert refresh_payload is not None
        assert refresh_payload["type"] == "refresh"

    async def test_login_invalid_email(self, client):
        """Test login with non-existent email."""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@test.local",
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid credentials" in response.json()["detail"]

    async def test_login_invalid_password(self, client, valid_login_credentials):
        """Test login with incorrect password."""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": valid_login_credentials["email"],
                "password": "wrongpassword",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid credentials" in response.json()["detail"]

    async def test_login_inactive_user(self, test_db, client):
        """Test login with inactive user."""
        from passlib.context import CryptContext
        from app.models.user import User
        import uuid

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        inactive_user = User(
            id=uuid.uuid4(),
            email="inactive@test.local",
            name="Inactive User",
            hashed_password=pwd_context.hash("password123"),
            is_active=False,
        )
        test_db.add(inactive_user)
        await test_db.flush()

        response = await client.post(
            "/api/auth/login",
            json={
                "email": "inactive@test.local",
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Account inactive" in response.json()["detail"]

    async def test_login_no_password_set(self, test_db, client):
        """Test login when user has no password."""
        from app.models.user import User
        import uuid

        no_pwd_user = User(
            id=uuid.uuid4(),
            email="nopwd@test.local",
            name="No Password User",
            hashed_password=None,
            is_active=True,
        )
        test_db.add(no_pwd_user)
        await test_db.flush()

        response = await client.post(
            "/api/auth/login",
            json={
                "email": "nopwd@test.local",
                "password": "anypassword",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.auth
class TestRefreshToken:
    """Test refresh token endpoint."""

    async def test_refresh_success(self, client, refresh_token_user_1, test_user_1):
        """Test successful token refresh."""
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token_user_1},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

        # Verify new tokens are valid
        access_payload = verify_token(data["access_token"])
        assert access_payload is not None
        assert access_payload["type"] == "internal"
        assert access_payload["sub"] == str(test_user_1.id)

    async def test_refresh_with_invalid_token(self, client):
        """Test refresh with invalid token."""
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid refresh token" in response.json()["detail"]

    async def test_refresh_with_access_token(self, client, access_token_user_1):
        """Test refresh with access token (wrong token type)."""
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": access_token_user_1},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_refresh_inactive_user(self, test_db, client):
        """Test refresh when user becomes inactive."""
        from app.utils.jwt import create_refresh_token
        import uuid

        # Create an active user, generate token, then deactivate
        user_id = uuid.uuid4()
        refresh_token = create_refresh_token(str(user_id))

        # Now deactivate the user
        from app.models.user import User
        user = User(
            id=user_id,
            email="will_deactivate@test.local",
            name="Will Deactivate",
            hashed_password="hash",
            is_active=False,
        )
        test_db.add(user)
        await test_db.flush()

        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "User not found" in response.json()["detail"]


@pytest.mark.asyncio
@pytest.mark.auth
class TestLogout:
    """Test logout endpoint."""

    async def test_logout_success(self, client, auth_headers_user_1):
        """Test successful logout."""
        response = await client.post(
            "/api/auth/logout",
            headers=auth_headers_user_1,
        )
        assert response.status_code == status.HTTP_200_OK
        assert "Logged out" in response.json()["detail"]

    async def test_logout_unauthorized(self, client):
        """Test logout without authentication."""
        response = await client.post("/api/auth/logout")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_logout_invalid_token(self, client):
        """Test logout with invalid token."""
        response = await client.post(
            "/api/auth/logout",
            headers={"Authorization": "Bearer invalid.token"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.auth
class TestExternalVerify:
    """Test external link verification endpoint."""

    async def test_external_verify_invalid_token(self, client):
        """Test external verify with invalid token."""
        response = await client.post(
            "/api/auth/external-verify",
            json={
                "token": "invalid.token",
                "passcode": "1234",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_external_verify_revoked_link(self, test_db, client):
        """Test external verify with revoked link."""
        from app.models.signed_link import SignedLink
        from app.utils.jwt import create_external_token
        from datetime import datetime, timezone, timedelta
        import uuid

        # Create a signed link
        link_id = uuid.uuid4()
        link = SignedLink(
            id=link_id,
            contributor_email="contractor@external.local",
            passcode_hash="hash",
            is_revoked=True,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            link_model="bundled",
        )
        test_db.add(link)
        await test_db.flush()

        # Create token for the link
        token = create_external_token(str(link_id), [], "contractor@external.local")

        response = await client.post(
            "/api/auth/external-verify",
            json={
                "token": token,
                "passcode": "wrongpass",
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "revoked" in response.json()["detail"]

    async def test_external_verify_expired_link(self, test_db, client):
        """Test external verify with expired link."""
        from app.models.signed_link import SignedLink
        from app.utils.jwt import create_external_token
        from datetime import datetime, timezone, timedelta
        import uuid

        # Create an expired signed link
        link_id = uuid.uuid4()
        link = SignedLink(
            id=link_id,
            contributor_email="contractor@external.local",
            passcode_hash="hash",
            is_revoked=False,
            expires_at=datetime.now(timezone.utc) - timedelta(days=1),
            link_model="bundled",
        )
        test_db.add(link)
        await test_db.flush()

        # Create token for the link
        token = create_external_token(str(link_id), [], "contractor@external.local")

        response = await client.post(
            "/api/auth/external-verify",
            json={
                "token": token,
                "passcode": "1234",
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "expired" in response.json()["detail"]

    async def test_external_verify_invalid_passcode(self, test_db, client):
        """Test external verify with incorrect passcode."""
        from app.models.signed_link import SignedLink
        from app.utils.jwt import create_external_token
        from datetime import datetime, timezone, timedelta
        from passlib.context import CryptContext
        import uuid

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Create a signed link with a correct passcode hash
        link_id = uuid.uuid4()
        link = SignedLink(
            id=link_id,
            contributor_email="contractor@external.local",
            passcode_hash=pwd_context.hash("correctcode"),
            is_revoked=False,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            link_model="bundled",
        )
        test_db.add(link)
        await test_db.flush()

        # Create token for the link
        token = create_external_token(str(link_id), [], "contractor@external.local")

        response = await client.post(
            "/api/auth/external-verify",
            json={
                "token": token,
                "passcode": "wrongcode",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid passcode" in response.json()["detail"]
