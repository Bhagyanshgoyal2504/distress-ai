from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

import models, database, ai_engine
from sqlalchemy.exc import OperationalError

try:
    models.Base.metadata.create_all(bind=database.engine)
except OperationalError:
    pass

app = FastAPI(title="D.I.S.T.R.E.S.S. A.I. Backend")

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class RegisterRequest(BaseModel):
    name: str

class EndSessionRequest(BaseModel):
    session_id: int

class AnswerRequest(BaseModel):
    session_id: int
    question: str
    answer: str

class MCQRequest(BaseModel):
    user_id: int = 1
    scores: List[int]

class TestSessionResponse(BaseModel):
    session_id: int
    first_question: str

@app.get("/")
def read_root():
    return {"message": "Welcome to D.I.S.T.R.E.S.S. A.I. API"}

@app.post("/user/register")
def register_user(req: RegisterRequest, db: Session = Depends(database.get_db)):
    # Check if a user with this name already exists to prevent duplicate accounts
    existing_user = db.query(models.User).filter(models.User.name.ilike(req.name)).first()
    if existing_user:
        return {"user_id": existing_user.id, "name": existing_user.name}

    import time, random
    unique_email = f"user_{int(time.time())}_{random.randint(1000,9999)}@example.com"
    new_user = models.User(name=req.name, email=unique_email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"user_id": new_user.id, "name": new_user.name}

@app.get("/user/{identifier}")
def get_user(identifier: str, db: Session = Depends(database.get_db)):
    if identifier.isdigit():
        db_user = db.query(models.User).filter(models.User.id == int(identifier)).first()
    else:
        db_user = db.query(models.User).filter(models.User.name.ilike(identifier)).first()
        
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": db_user.id, "name": db_user.name}

@app.get("/test/questions")
def get_custom_questions(user_id: int, db: Session = Depends(database.get_db)):
    past_sessions = db.query(models.TestSession).filter(
        models.TestSession.user_id == user_id, 
        models.TestSession.advice != None
    ).order_by(models.TestSession.date.desc()).all()
    
    default_questions = [
        "1. Over the last week, how often have you felt overwhelmed by your emotions?",
        "2. How often have you had trouble sleeping or staying asleep?",
        "3. Have you lost interest or pleasure in activities you normally enjoy?",
        "4. How often do you feel a sense of hopelessness or fear about the future?",
        "5. Do you find it difficult to concentrate on everyday tasks?",
        "6. How often have you felt nervous, anxious, or on edge?",
        "7. Have you had unexplainable physical symptoms (like headaches, stomach aches)?",
        "8. Do you find yourself avoiding people or social situations?",
        "9. How often have you felt easily annoyed or irritable?",
        "10. Have you felt bad about yourself, or that you are a failure?"
    ]

    if not past_sessions:
        return {"questions": default_questions}
        
    last_session = past_sessions[0]
    past_advice = last_session.advice
    
    try:
        custom_qs = ai_engine.generate_custom_mcq(past_advice)
        # Ensure exactly 10 questions are returned
        if len(custom_qs) == 10:
            return {"questions": custom_qs}
        else:
            return {"questions": default_questions}
    except Exception as e:
        print("Error generating custom MCQ:", e)
        return {"questions": default_questions}

class StartTestRequest(BaseModel):
    user_id: int = 1

@app.post("/test/start", response_model=TestSessionResponse)
def start_test(req: StartTestRequest, db: Session = Depends(database.get_db)):
    user_id = req.user_id
    # Create a dummy user if it doesn't exist
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        db_user = models.User(id=user_id, name=f"User {user_id}", email=f"user_{user_id}@example.com")
        db.add(db_user)
        db.commit()

    # Create a new session
    db_session = models.TestSession(user_id=user_id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    # Get past context to remember the user
    past_sessions = db.query(models.TestSession).filter(
        models.TestSession.user_id == user_id, 
        models.TestSession.advice != None
    ).order_by(models.TestSession.date.desc()).all()
    
    user_context = ""
    if past_sessions:
        # Use the most recent advice/insights as memory
        user_context = past_sessions[0].advice

    # Generate the first question with empty history, but pass context
    first_q = ai_engine.generate_next_question([], user_context)
    
    return {"session_id": db_session.id, "first_question": first_q}


@app.post("/test/end")
def end_session(req: EndSessionRequest, db: Session = Depends(database.get_db)):
    db_session = db.query(models.TestSession).filter(models.TestSession.id == req.session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    past_responses = db.query(models.TestResponse).filter(models.TestResponse.session_id == req.session_id).all()
    history = [{"question": r.question_text, "answer": r.user_answer} for r in past_responses]
    
    if len(history) == 0:
        db_session.distress_score = 0
        db_session.color_code = "GREEN"
        db_session.advice = "Session ended early."
        db.commit()
        return {"status": "completed", "score": 0, "color": "GREEN", "advice": "Session ended early."}
        
    evaluation = ai_engine.evaluate_test_session(history)
    db_session.distress_score = evaluation.distress_score
    db_session.color_code = evaluation.color_code
    db_session.advice = evaluation.advice
    db.commit()
    
    return {
        "status": "completed",
        "score": evaluation.distress_score,
        "color": evaluation.color_code,
        "advice": evaluation.advice
    }

@app.post("/test/answer")
def answer_question(req: AnswerRequest, db: Session = Depends(database.get_db)):
    db_session = db.query(models.TestSession).filter(models.TestSession.id == req.session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Save the response
    new_resp = models.TestResponse(
        session_id=req.session_id,
        question_text=req.question,
        user_answer=req.answer
    )
    db.add(new_resp)
    db.commit()
    
    past_responses = db.query(models.TestResponse).filter(models.TestResponse.session_id == req.session_id).all()
    history = [{"question": r.question_text, "answer": r.user_answer} for r in past_responses]
    
    # Get past context to remember the user
    past_sessions = db.query(models.TestSession).filter(
        models.TestSession.user_id == db_session.user_id, 
        models.TestSession.advice != None
    ).order_by(models.TestSession.date.desc()).all()
    
    user_context = ""
    if past_sessions:
        user_context = past_sessions[0].advice

    # Generate next question
    next_q = ai_engine.generate_next_question(history, user_context)
    return {
        "status": "ongoing",
        "next_question": next_q
    }

class EvaluateRequest(BaseModel):
    session_id: int

@app.post("/test/evaluate")
def evaluate_session(req: EvaluateRequest, db: Session = Depends(database.get_db)):
    db_session = db.query(models.TestSession).filter(models.TestSession.id == req.session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    past_responses = db.query(models.TestResponse).filter(models.TestResponse.session_id == req.session_id).all()
    history = [{"question": r.question_text, "answer": r.user_answer} for r in past_responses]
    
    evaluation = ai_engine.evaluate_test_session(history)
    db_session.distress_score = evaluation.distress_score
    db_session.color_code = evaluation.color_code
    db_session.advice = evaluation.advice
    db.commit()
    
    return {
        "status": "completed",
        "score": evaluation.distress_score,
        "color": evaluation.color_code,
        "advice": evaluation.advice
    }

@app.post("/test/mcq")
def submit_mcq(req: MCQRequest, db: Session = Depends(database.get_db)):
    total_score = sum(req.scores)
    # Normalize a 30-point scale (10 questions x 3 max points) to 0-100
    normalized_score = min(100, int((total_score / 30.0) * 100))
    
    if normalized_score < 40:
        color = "GREEN"
        advice = "Your responses indicate a stable baseline. Keep practicing good self-care! Try adding 10 minutes of 'Pranayama' (deep breathing) to your daily morning routine to maintain this balance."
    elif normalized_score < 75:
        color = "YELLOW"
        advice = "Your responses indicate moderate distress. We recommend talking to our AI companion. Also, practicing 'Balasana' (Child's Pose) before sleep and keeping a daily gratitude journal can help lower this stress."
    else:
        color = "RED"
        advice = "You appear to be experiencing a high level of distress. Please reach out to our emergency support resources immediately. Simple grounding exercises like 'Shavasana' and limiting screen time can offer small relief, but professional help is strongly advised."
        
    db_user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not db_user:
        db_user = models.User(id=req.user_id, name=f"User {req.user_id}", email=f"user_{req.user_id}@example.com")
        db.add(db_user)
        db.commit()

    db_session = models.TestSession(
        user_id=req.user_id,
        distress_score=normalized_score,
        color_code=color,
        advice=advice
    )
    db.add(db_session)
    db.commit()
    
    return {
        "status": "completed",
        "score": normalized_score,
        "color": color,
        "advice": advice
    }

@app.get("/dashboard/stats")
def get_dashboard_stats(user_id: int = 1, db: Session = Depends(database.get_db)):
    sessions = db.query(models.TestSession).filter(models.TestSession.user_id == user_id).order_by(models.TestSession.date).all()
    
    stats = []
    for s in sessions:
        if s.distress_score is not None:
            stats.append({
                "date": s.date.strftime("%Y-%m-%d %H:%M"),
                "score": s.distress_score,
                "color": s.color_code,
                "advice": s.advice
            })
            
    return stats
# fixed encoding
# model fix

@app.get("/test/history")
def get_user_history(user_id: int, db: Session = Depends(database.get_db)):
    sessions = db.query(models.TestSession).filter(models.TestSession.user_id == user_id).order_by(models.TestSession.date.desc()).all()
    
    history_list = []
    for s in sessions:
        responses = db.query(models.TestResponse).filter(models.TestResponse.session_id == s.id).all()
        if responses:
            qa_pairs = [{"question": r.question_text, "answer": r.user_answer} for r in responses]
            history_list.append({
                "session_id": s.id,
                "date": s.date.strftime("%b %d, %Y - %H:%M"),
                "chat": qa_pairs
            })
            
    return history_list

@app.delete("/test/history/{session_id}")
def delete_history(session_id: int, db: Session = Depends(database.get_db)):
    db_session = db.query(models.TestSession).filter(models.TestSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Delete associated responses
    db.query(models.TestResponse).filter(models.TestResponse.session_id == session_id).delete()
    
    # Delete session
    db.delete(db_session)
    db.commit()
    return {"status": "success"}

@app.delete("/test/session/{session_id}")
def delete_session(session_id: int, db: Session = Depends(database.get_db)):
    # Delete responses first to clean up chat messages
    db.query(models.TestResponse).filter(models.TestResponse.session_id == session_id).delete()
    
    # Delete the session itself
    db_session = db.query(models.TestSession).filter(models.TestSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db.delete(db_session)
    db.commit()
    return {"status": "deleted"}


class ExplainRequest(BaseModel):
    question_text: str


class Phase1Request(BaseModel):
    user_id: int
    trauma_events: list[str]
    symptoms: dict[str, str]

@app.post("/test/adaptive")
def get_adaptive_questions(req: Phase1Request):
    # Summarize what the user flagged for Gemini
    summary = f"Trauma/Events: {', '.join(req.trauma_events) if req.trauma_events else 'None'}\n"
    summary += "Symptoms:\n"
    for category, answer in req.symptoms.items():
        summary += f"- {category}: {answer}\n"
        
    custom_qs = ai_engine.generate_adaptive_questions(summary)
    return {"questions": custom_qs}

class FullAdaptiveRequest(BaseModel):
    user_id: int
    transcript: str
    x_score: float # So we can save the raw math if needed
    y_score: float

@app.post("/test/submit_adaptive")
def submit_adaptive_test(req: FullAdaptiveRequest, db: Session = Depends(database.get_db)):
    result = ai_engine.evaluate_adaptive_session(req.transcript)
    
    # Save the test session just like the old MCQ
    # Using the AI's determined score and color
    db_session = models.TestSession(
        user_id=req.user_id,
        distress_score=result["score"],
        color_code=result["color"],
        advice=result["advice"]
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    # Save the test transcript into TestResponses so it appears in History
    lines = req.transcript.split('\n')
    current_q = ""
    for line in lines:
        if line.startswith("Q: "):
            current_q = line[3:]
        elif line.startswith("A: "):
            current_a = line[3:]
            if current_q and current_a:
                new_resp = models.TestResponse(
                    session_id=db_session.id,
                    question_text=current_q,
                    user_answer=current_a
                )
                db.add(new_resp)
                current_q = ""
    db.commit()
    
    return {
        "status": "completed",
        "score": result["score"],
        "color": result["color"],
        "advice": result["advice"]
    }

@app.post("/test/explain")
def explain_question_api(req: ExplainRequest):
    explanation = ai_engine.explain_question(req.question_text)
    return {"explanation": explanation}

@app.get("/test/daily_baseline")
def get_daily_baseline(user_id: int, db: Session = Depends(database.get_db)):
    past_tests = db.query(models.TestSession).filter(models.TestSession.user_id == user_id).order_by(models.TestSession.date.desc()).limit(1).all()
    history_summary = "No previous history found."
    if past_tests:
        last = past_tests[0]
        history_summary = f"Last test: Distress Score {last.distress_score}/100, Color {last.color_code}. Advice given: {last.advice}."
    
    questions = ai_engine.generate_daily_baseline(history_summary)
    # Format them for frontend
    formatted_qs = []
    for q in questions:
        formatted_qs.append({
            "category": "Daily Check-in",
            "type": "single_select",
            "text": q["text"],
            "options": q["options"]
        })
    return {"questions": formatted_qs}
