from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ExternalVerifyRequest(BaseModel):
    token: str
    passcode: str


class ExternalTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    assignment_ids: list[str]
    link_model: str
