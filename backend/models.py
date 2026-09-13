from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sessions = relationship("TestSession", back_populates="user")


class TestSession(Base):
    __tablename__ = "test_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    
    # 0-100 score
    distress_score = Column(Float, nullable=True) 
    # RED, YELLOW, GREEN
    color_code = Column(String, nullable=True)
    # AI generated advice
    advice = Column(String, nullable=True)
    
    user = relationship("User", back_populates="sessions")
    responses = relationship("TestResponse", back_populates="session")


class TestResponse(Base):
    __tablename__ = "test_responses"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"))
    question_text = Column(String)
    user_answer = Column(String)
    # Could be a sentiment score -1.0 to 1.0 or similar
    sentiment_score = Column(Float, nullable=True)
    
    session = relationship("TestSession", back_populates="responses")
