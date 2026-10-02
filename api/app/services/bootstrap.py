"""
初始化第一位管理员
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User, UserRole, UserStatus
from app.services.users import hash_password


def ensure_bootstrap_user(
    db: Session,
    *,
    email: str,
    display_name: str,
    password: str,
    role: UserRole = UserRole.OWNER, # 默认角色：OWNER最高权限
) -> tuple[User, bool]:
    # 拿到邮箱
    normalized_email = email.strip().lower()
    # 看数据库中是否有这个邮箱
    existing = db.scalars(select(User).where(User.email == normalized_email)).first()
    if existing is not None:
        return existing, False
    # 用户不存在，创建新User对象
    user = User(
        email=normalized_email,
        display_name=display_name.strip() or normalized_email,
        role=role,
        status=UserStatus.ACTIVE,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    # 刷新user对象，
    db.refresh(user)
    return user, True