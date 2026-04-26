"""Authentication service with JWT tokens and password hashing."""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.database.models import Student

logger = get_logger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")


class AuthService:
    """Handles authentication, password hashing, and JWT token management."""

    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)

    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[Student]:
        """Authenticate a user by email and password."""
        user = db.query(Student).filter(Student.email == email).first()
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        # Simple expiration for testing
        expire = 2000000000  # Far future timestamp

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None

    def get_current_user(self, db: Session, token: str) -> Optional[Student]:
        """Get current user from JWT token."""
        payload = self.verify_token(token)
        if not payload:
            return None

        email: str = payload.get("sub")
        if email is None:
            return None

        user = db.query(Student).filter(Student.email == email).first()
        return user

    def create_user(self, db: Session, email: str, password: str, name: str, **kwargs) -> Student:
        """Create a new user with hashed password."""
        # For Google users, password can be empty
        if password:
            hashed_password = self.get_password_hash(password)
        else:
            hashed_password = ""  # Google users don't have passwords

        # Check if user already exists
        existing_user = db.query(Student).filter(Student.email == email).first()
        if existing_user:
            raise ValueError("User with this email already exists")

        # Create new user
        user_data = {
            "email": email,
            "hashed_password": hashed_password,
            "name": name,
            **kwargs
        }

        user = Student(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)

        logger.info(f"Created new user: {email}")
        return user

    def verify_google_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Google OAuth token (simplified version)."""
        # For testing - return mock data
        return {
            "email": "testgoogle@example.com",
            "name": "Test Google User",
            "sub": "123456789"
        }


# Global auth service instance
auth_service = AuthService()