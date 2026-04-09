from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=1, max_length=20)
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

    model_config = ConfigDict(from_attributes=True)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


# ─── OTP Auth ───

class OTPSendRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)


class OTPVerifyRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    otp: str = Field(..., min_length=6, max_length=6)
    name: str = Field("", max_length=100)  # Used if creating a new user


# ─── Google Auth ───

class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., min_length=1)
