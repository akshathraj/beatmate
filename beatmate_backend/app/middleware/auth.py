"""
Authentication Middleware for Supabase
Validates JWT tokens and extracts user information
"""
from fastapi import HTTPException, Security, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import jwt
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from app.services.supabase_service import get_supabase_service

# HTTP Bearer token security scheme
security = HTTPBearer()

def get_optional_credentials(request: Request) -> Optional[HTTPAuthorizationCredentials]:
    """
    Extract credentials from request without raising errors
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    
    try:
        scheme, credentials = auth_header.split()
        if scheme.lower() == "bearer":
            return HTTPAuthorizationCredentials(scheme=scheme, credentials=credentials)
    except ValueError:
        return None
    
    return None

class AuthUser:
    """
    Authenticated user object
    Contains user information extracted from JWT token
    """
    def __init__(self, user_id: str, email: str, user_metadata: dict = None):
        self.user_id = user_id
        self.email = email
        self.user_metadata = user_metadata or {}
    
    def __str__(self):
        return f"AuthUser(id={self.user_id}, email={self.email})"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> AuthUser:
    """
    Dependency to get the current authenticated user from JWT token
    
    Usage in endpoints:
        @router.get('/protected')
        async def protected_route(user: AuthUser = Depends(get_current_user)):
            print(f"User ID: {user.user_id}")
            ...
    
    Raises:
        HTTPException: If token is invalid or missing
    
    Returns:
        AuthUser object with user information
    """
    token = credentials.credentials
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token"
        )
    
    try:
        # Decode and verify the JWT token with Supabase
        supabase = get_supabase_service()
        user_info = supabase.verify_token(token)
        
        if not user_info:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )
        
        # Extract user information
        user_id = user_info.get("id")
        email = user_info.get("email")
        user_metadata = user_info.get("user_metadata", {})
        
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token payload"
            )
        
        return AuthUser(
            user_id=user_id,
            email=email,
            user_metadata=user_metadata
        )
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(get_optional_credentials)
) -> Optional[AuthUser]:
    """
    Optional authentication dependency
    Returns user if authenticated, None otherwise
    
    Useful for endpoints that work with or without authentication
    
    Usage:
        @router.get('/optional-auth')
        async def optional_route(user: Optional[AuthUser] = Depends(get_optional_user)):
            if user:
                print(f"Authenticated: {user.user_id}")
            else:
                print("Anonymous user")
    """
    if not credentials:
        return None
    
    try:
        # Manually validate the token
        token = credentials.credentials
        
        if not token:
            return None
        
        # Verify the token with Supabase
        supabase = get_supabase_service()
        user_info = supabase.verify_token(token)
        
        if not user_info:
            return None
        
        # Extract user information
        user_id = user_info.get("id")
        email = user_info.get("email")
        user_metadata = user_info.get("user_metadata", {})
        
        if not user_id:
            return None
        
        return AuthUser(
            user_id=user_id,
            email=email,
            user_metadata=user_metadata
        )
    except Exception as e:
        print(f"Optional authentication failed: {e}")
        return None

