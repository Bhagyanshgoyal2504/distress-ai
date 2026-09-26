import os
from dotenv import load_dotenv
import concurrent.futures



load_dotenv()

from pydantic import BaseModel, Field

# Check for API key. If not present, we use a fallback mode.
API_KEY_EXISTS = bool(os.getenv("GEMINI_API_KEY"))

if API_KEY_EXISTS:
    from google import genai
    client = genai.Client()
else:
    client = None

class NextQuestionResponse(BaseModel):
    question: str = Field(description="The next empathetic question to ask the user.")

class TestEvaluationResponse(BaseModel):
    distress_score: int = Field(description="A score from 0 to 100 indicating the level of psychological distress.")
    color_code: str = Field(description="One of 'GREEN', 'YELLOW', or 'RED' based on distress score (Green < 40, Yellow 40-75, Red > 75).")
    advice: str = Field(description="Empathetic, actionable advice or next steps for the user.")

class CustomMCQResponse(BaseModel):
    questions: list[str] = Field(description="Exactly 10 multiple-choice questions tailored to the user's past history.")

def generate_next_question(past_qa_pairs: list[dict], user_context: str = "") -> str:
    if not API_KEY_EXISTS:
        questions = [
            "How have you been feeling over the past week?",
            "Over the last few days, have you found it difficult to concentrate, or noticed any changes in your sleep patterns?",
            "When you think about recent events, do you ever feel suddenly overwhelmed or find your heart racing?",
            "Are there specific moments or places that make you feel more anxious than usual?",
            "What kind of support - whether it's talking to someone, legal advice, or just a safe space - do you feel you need the most right now?"
        ]
        
        if not past_qa_pairs:
            return "Hello. I'm here to support you. To start, " + questions[0].lower()
            
        last_answer = past_qa_pairs[-1]['answer'].lower().strip()
        reaction = ""
        
        if len(last_answer) < 3 or not any(c.isalpha() for c in last_answer):
            reaction = "It's completely okay if it's hard to put into words right now. "
        else:
            distress_keywords = ['anxious', 'scared', 'bad', 'terrible', 'nightmare', 'sleep', 'overwhelmed', 'hard', 'difficult', 'sad', 'cry', 'fear', 'threat', 'alone', 'no']
            stable_keywords = ['good', 'fine', 'okay', 'ok', 'better', 'managing', 'well', 'happy', 'calm', 'safe', 'support', 'yes']
            
            if any(word in last_answer for word in distress_keywords):
                reaction = "I hear you, and that sounds really challenging. I'm so sorry you're going through that. "
            elif any(word in last_answer for word in stable_keywords):
                reaction = "I'm glad to hear that you have some stability there. "
            else:
                reaction = "Thank you for sharing that with me. "
                
        next_q_index = len(past_qa_pairs) % len(questions)
        return reaction + questions[next_q_index]

    hist_lines = []
    for qa in past_qa_pairs:
        hist_lines.append("Q: " + qa['question'])
        hist_lines.append("A: " + qa['answer'])
    history_text = chr(10).join(hist_lines)
    
    ctx = ""
    if user_context:
        ctx = "PAST CONTEXT FROM PREVIOUS SESSIONS:" + chr(10) + user_context + chr(10) + chr(10) + "Use this context to gently acknowledge their past struggles, making them feel remembered and valued." + chr(10)

    prompt = f"""You are an exceptionally warm, friendly, and deeply humanized clinical psychologist and companion.
You are conducting a dynamic mental health chat. 

{ctx}
Here is the conversation history so far:
{history_text}

INSTRUCTIONS:
1. Respond in short, pointed, and very easy language.
2. ALWAYS communicate in "Hinglish" (a natural mix of conversational Hindi and English, written in the English alphabet). For example: "I understand. Aapko abhi kaisa lag raha hai?"
3. READ THE USER'S MOOD:
   - If the user sounds serious, highly distressed, or panicked: Gently provide a quick, practical method to destress (like a simple breathing trick or grounding exercise) before asking your next question.
   - If the user sounds stable, lonely, or just needs to vent: Talk to them like a close friend. Offer a unique, genuine, and comforting perspective or solution, keeping it conversational.
4. After responding to their feelings, ask ONE gentle follow-up question to keep the conversation flowing or assess their well-being.
5. Keep the tone incredibly warm, highly empathetic, and completely non-robotic. Make them feel heard and safe.
6. Keep your entire response under 3-4 short sentences so the user is not overwhelmed.
7. If the conversation history is empty, simply introduce yourself warmly as a friend in Hinglish and ask how they are feeling today.
"""
    
    try:
        response = client.models.generate_content(
            model='gemini-flash-lite-latest',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=NextQuestionResponse,
                temperature=0.6
            )
        )
        return response.parsed.question
    except Exception as e:
        print("Error generating next question:", e)
        return "I'm listening. Could you tell me a little more about how you're feeling right now?"


def evaluate_test_session(past_qa_pairs: list[dict]) -> TestEvaluationResponse:
    if not API_KEY_EXISTS:
        score = 50
        color = "YELLOW"
        advice = "Aap lagta hai thode pareshan hain. Please apna khayal rakhein aur kisi professional se baat karein."
        return TestEvaluationResponse(
            distress_score=score,
            color_code=color,
            advice=advice
        )

    hist_lines = []
    for qa in past_qa_pairs:
        hist_lines.append("Q: " + qa['question'])
        hist_lines.append("A: " + qa['answer'])
    history_text = chr(10).join(hist_lines)
    
    prompt = f"""
    You are a friendly, warm psychologist evaluating a user's chat history.
    Here is the full conversation:
    {history_text}
    
    Based on this, evaluate their current psychological distress level.
    1. Provide a score from 0 (completely stable) to 100 (severe crisis).
    2. Determine a color code: GREEN (0-39), YELLOW (40-74), RED (75-100).
    3. Provide a friendly and empathetic paragraph of advice to end the chat.
       - Include SPECIFIC, ACTIONABLE recommendations based on their exact issues. Suggest a specific type of Yoga (e.g., 'Balasana', 'Pranayama', 'Vrikshasana') or a specific daily habit to improve their current mental state.
       - IMPORTANT: The advice MUST be written in "Hinglish" (a natural mix of Hindi and English written in the English alphabet).
       - Make it warmly encouraging and highly tailored to their responses.
       - If RED, gently urge them to seek help from the support directory: "Please Support Directory mein jaakar kisi professional se baat karein. Aap akele nahi hain."
    """
    
    response = client.models.generate_content(
        model='gemini-flash-lite-latest',
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=TestEvaluationResponse,
            temperature=0.2
        )
    )
    
    return response.parsed

def generate_custom_mcq(past_advice: str) -> list[str]:
    if not API_KEY_EXISTS:
        return [
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

    prompt = f"""
    You are an expert clinical psychologist designing a 10-question multiple-choice assessment for a returning patient.
    
    Here is the summary/advice from their last session:
    {past_advice}
    
    INSTRUCTIONS:
    1. Generate exactly 10 questions to assess their current mental well-being over the past 7 days.
    2. Customize the questions to follow up on their past issues based on the previous summary.
    3. The answer options will be a frequency scale (Not at all, Some time, More than half the days, Nearly every day), so phrase the questions to match this scale (e.g. 'How often have you...').
    4. CRITICAL: You MUST phrase all questions negatively so that answering 'Nearly every day' ALWAYS means HIGH DISTRESS, and 'Not at all' ALWAYS means NO DISTRESS. (e.g., instead of asking 'How often did you sleep well?', you must ask 'How often did you have trouble sleeping?').
    5. Start each question with its number (e.g., '1. ', '2. ').
    6. The language should be very easy to understand.
    """
    
    response = client.models.generate_content( 
        model='gemini-flash-lite-latest',
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            response_mime_type='application/json',
            response_schema=CustomMCQResponse,
            temperature=0.4
        )
    )
    
    return response.parsed.questions


class ExplainResponse(BaseModel):
    explanation: str = Field(description="The simple Hinglish explanation of the question.")

def explain_question(question_text: str) -> str:
    if not API_KEY_EXISTS:
        return "Is sawal ka matlab hai ki aap pichle kuch dino se kaisa mehsoos kar rahe hain."
        
    prompt = f"""
    You are an empathetic AI. The user is taking a mental health assessment and didn't understand this question:
    "{question_text}"
    
    Explain what this question is asking in very simple, conversational "Hinglish" (Hindi + English, written in English alphabet).
    Keep it to exactly 1 or 2 short sentences. Make it easy for a layperson to understand.
    """
    
    try:
        response = client.models.generate_content( 
            model='gemini-flash-lite-latest',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema=ExplainResponse,
                temperature=0.3
            )
        )
        return response.parsed.explanation
    except Exception as e:
        return "Yeh sawal aapki mental well-being ke baare mein hai."


class CustomOption(BaseModel):
    label: str = Field(description="The text of the option.")
    score: int = Field(description="Severity score from 0 (healthy) to 3 (severe).")

class AdaptiveQuestion(BaseModel):
    text: str = Field(description="The question text.")
    options: list[CustomOption] = Field(description="Exactly 4 contextual options for this question.")

class AdaptiveQuestionsResponse(BaseModel):
    questions: list[AdaptiveQuestion] = Field(description="Exactly 3 follow-up questions.")

def generate_adaptive_questions(phase_1_summary: str) -> list[dict]:
    if not API_KEY_EXISTS:
        return [
            {"text": "Can you elaborate on how this affects your daily routine?", "options": [{"label": "Not at all", "score": 0}, {"label": "Slightly", "score": 1}, {"label": "Significantly", "score": 2}, {"label": "Completely disrupts it", "score": 3}]},
            {"text": "Are you experiencing physical symptoms like exhaustion?", "options": [{"label": "None", "score": 0}, {"label": "A few times a week", "score": 1}, {"label": "Most days", "score": 2}, {"label": "Constantly", "score": 3}]},
            {"text": "Have you spoken to anyone close to you about this?", "options": [{"label": "Yes, fully", "score": 0}, {"label": "A little bit", "score": 1}, {"label": "Very rarely", "score": 2}, {"label": "No, I am completely isolated", "score": 3}]}
        ]
        
    prompt = f"""
    Act as an empathetic clinical psychologist.
    The user just completed Phase 1 of a mental health assessment. Here are their flagged issues:
    {phase_1_summary}
    
    Based on these specific flags, generate EXACTLY 3 highly relevant follow-up questions.
    For each question, generate EXACTLY 4 highly specific, contextual options that make sense for answering the question. 
    The options must range in severity from 0 (healthy/positive) to 3 (severe/negative).
    Be warm, non-judgmental, and professional.
    """
    
    try:
        response = client.models.generate_content( 
            model='gemini-flash-lite-latest',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema=AdaptiveQuestionsResponse,
                temperature=0.4
            )
        )
        # Return dict representations so they are JSON serializable for FastAPI
        return [{"text": q.text, "options": [{"label": o.label, "score": o.score} for o in q.options]} for q in response.parsed.questions]
    except Exception as e:
        print("Adaptive generation failed:", e)
        return [
            {"text": "Can you elaborate on how this affects your daily routine?", "options": [{"label": "Not at all", "score": 0}, {"label": "Slightly", "score": 1}, {"label": "Significantly", "score": 2}, {"label": "Completely disrupts it", "score": 3}]},
            {"text": "Are you experiencing physical symptoms like exhaustion?", "options": [{"label": "None", "score": 0}, {"label": "A few times a week", "score": 1}, {"label": "Most days", "score": 2}, {"label": "Constantly", "score": 3}]},
            {"text": "Have you spoken to anyone close to you about this?", "options": [{"label": "Yes, fully", "score": 0}, {"label": "A little bit", "score": 1}, {"label": "Very rarely", "score": 2}, {"label": "No, I am completely isolated", "score": 3}]}
        ]

class AdaptiveEvaluationResponse(BaseModel):
    score: int = Field(description="A score from 0 to 100 representing distress severity.")
    color: str = Field(description="Must be GREEN, YELLOW, or RED.")
    advice: str = Field(description="A supportive, insightful summary of their condition in 3 sentences.")

def evaluate_adaptive_session(transcript: str) -> dict:
    if not API_KEY_EXISTS:
        return {"score": 50, "color": "YELLOW", "advice": "Please configure your Gemini API key to receive AI insights."}
        
    prompt = f"""
    Act as an expert clinical psychologist. Review the following complete assessment transcript (Phase 1 baseline + Phase 2 follow-ups):
    
    TRANSCRIPT:
    {transcript}
    
    TASK:
    1. Calculate a Distress Score (0-100). 
       - 0-39: Stable (GREEN)
       - 40-74: Moderate Distress (YELLOW)
       - 75-100: Severe Crisis/Trauma (RED)
    2. Determine the color code.
    3. Write a supportive, clinical "AI Insight" paragraph (3 sentences max) explaining what they are going through and suggesting coping mechanisms. Use extremely warm, empathetic language.
    """
    
    try:
        response = client.models.generate_content( 
            model='gemini-flash-lite-latest',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema=AdaptiveEvaluationResponse,
                temperature=0.2
            )
        )
        return {
            "score": response.parsed.score,
            "color": response.parsed.color,
            "advice": response.parsed.advice
        }
    except Exception as e:
        print("Adaptive evaluation failed:", e)
        return {"score": 50, "color": "YELLOW", "advice": "An error occurred while evaluating your assessment. Please try again."}

class DailyBaselineResponse(BaseModel):
    questions: list[AdaptiveQuestion] = Field(description="Exactly 5 tailored baseline questions.")

def generate_daily_baseline(user_history_summary: str) -> list[dict]:
    if not API_KEY_EXISTS:
        return [
            {"text": "How have you been feeling overall today?", "options": [{"label": "Great", "score": 0}, {"label": "Okay", "score": 1}, {"label": "Struggling", "score": 2}, {"label": "Overwhelmed", "score": 3}]},
            {"text": "Have you noticed any changes in your sleep?", "options": [{"label": "No, sleeping fine", "score": 0}, {"label": "A bit restless", "score": 1}, {"label": "Poor sleep", "score": 2}, {"label": "Insomnia", "score": 3}]}
        ]
        
    prompt = f"""
    Act as a trauma-informed psychologist. The user is checking in today for their daily mental health assessment.
    Here is a summary of their past state:
    {user_history_summary}
    
    Generate EXACTLY 5 highly relevant, multiple-choice questions for today's check-in.
    - Question 1 MUST be a general mood check-in.
    - Question 2 MUST be about sleep or physical symptoms.
    - Questions 3-5 MUST be tailored specifically to whatever trauma or symptoms they experienced previously.
    - For each question, generate EXACTLY 4 highly specific options ranging from 0 (healthy) to 3 (severe).
    - If the user history is empty, generate 5 standard baseline clinical questions.
    """
    
    try:
        response = client.models.generate_content( 
            model='gemini-flash-lite-latest',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema=DailyBaselineResponse,
                temperature=0.4
            )
        )
        return [{"text": q.text, "options": [{"label": o.label, "score": o.score} for o in q.options]} for q in response.parsed.questions]
    except Exception as e:
        print("Daily baseline generation failed:", e)
        return [
            {"text": "How have you been feeling overall today?", "options": [{"label": "Great", "score": 0}, {"label": "Okay", "score": 1}, {"label": "Struggling", "score": 2}, {"label": "Overwhelmed", "score": 3}]},
            {"text": "Have you noticed any changes in your sleep?", "options": [{"label": "No, sleeping fine", "score": 0}, {"label": "A bit restless", "score": 1}, {"label": "Poor sleep", "score": 2}, {"label": "Insomnia", "score": 3}]}
        ]
