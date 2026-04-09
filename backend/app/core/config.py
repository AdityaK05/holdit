from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE_PATH = BACKEND_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    postgres_url: str = Field(..., alias="POSTGRES_URL")
    redis_url: str = Field(..., alias="REDIS_URL")
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_expiry: int = Field(..., alias="JWT_EXPIRY")
    twilio_account_sid: str = Field("", alias="TWILIO_ACCOUNT_SID")
    twilio_auth_token: str = Field("", alias="TWILIO_AUTH_TOKEN")
    twilio_phone_number: str = Field("", alias="TWILIO_PHONE_NUMBER")
    firebase_credentials_json: str = Field("", alias="FIREBASE_CREDENTIALS_JSON")
    google_maps_api_key: str = Field("", alias="GOOGLE_MAPS_API_KEY")
    aws_access_key_id: str = Field("", alias="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str = Field("", alias="AWS_SECRET_ACCESS_KEY")
    aws_s3_bucket: str = Field("", alias="AWS_S3_BUCKET")
    google_client_id: str = Field("", alias="GOOGLE_CLIENT_ID")
    razorpay_key_id: str = Field("", alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str = Field("", alias="RAZORPAY_KEY_SECRET")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

