from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, auth
from ..config import settings
from ..email_utils import send_password_reset_email

router = APIRouter()


@router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    return crud.create_user(db=db, user=user)


@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(auth.get_current_user)):
    return current_user


# MUser Authentication Endpoints
@router.post("/signup", response_model=schemas.MUserAuth)
def signup_m_user(user_data: schemas.MUserSignup, db: Session = Depends(get_db)):
    """Signup endpoint for creating new MUser"""
    # Check if email already exists
    existing_user = crud.get_m_user_by_email(db, email=user_data.email_id)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = crud.create_m_user_auth(db, user_data)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login_m_user(
    login_data: schemas.MUserLogin,
    db: Session = Depends(get_db)
):
    """Login endpoint for MUser"""
    user = auth.authenticate_m_user(db, login_data.email_id, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = auth.create_access_token(
        data={"sub": user.email_id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me-m", response_model=schemas.MUserAuth)
async def read_m_user_me(current_user = Depends(auth.get_current_m_user)):
    """Get current MUser info"""
    return current_user


@router.post("/forgot-password", response_model=schemas.PasswordResetResponse)
async def forgot_password(
    request: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Request password reset email"""
    # Create reset token
    reset_token = crud.create_password_reset_token(db, request.email_id)
    
    if not reset_token:
        # For security, return success even if email doesn't exist
        # This prevents email enumeration attacks
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Get user to send email
    user = crud.get_m_user_by_email(db, request.email_id)
    
    # Send email in background
    background_tasks.add_task(
        send_password_reset_email,
        user.email_id,
        reset_token,
        user.first_name or "User"
    )
    
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password", response_model=schemas.PasswordResetResponse)
def reset_password(
    request: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password using reset token"""
    success = crud.reset_user_password(db, request.token, request.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return {"message": "Password has been reset successfully"}
