import os
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

def generate_next_question(past_qa_pairs: list[dict]) -> str:
    """
    Takes a list of past Question-Answer dictionaries and generates the next relevant question.
    """
    if not API_KEY_EXISTS:
        # High-quality fallback questions based loosely on PTSD and Anxiety screening
        questions = [
            "How have you been feeling over the past week?",
            "Over the last few days, have you found it difficult to concentrate, or noticed any changes in your sleep patterns?",
            "When you think about recent events, do you ever feel suddenly overwhelmed or find your heart racing?",
            "Are there specific moments or places that make you feel more anxious than usual?",
            "What kind of support—whether it's talking to someone, legal advice, or just a safe space—do you feel you need the most right now?"
        ]
        
        # If this is the very first question
        if not past_qa_pairs:
            return "Hello. I'm here to support you. To start, " + questions[0].lower()
            
        last_answer = past_qa_pairs[-1]['answer'].lower().strip()
        reaction = ""
        
        # Detect gibberish or very short non-answers
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

    history_text = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in past_qa_pairs])
    
    prompt = f"""
    You are an exceptionally warm, friendly, and deeply humanized clinical psychologist and companion.
    You are conducting a dynamic mental health chat. 

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
    
    response = client.models.generate_content(
        model='gemini-3.5-flash-lite',
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=NextQuestionResponse,
            temperature=0.6
        )
    )
    
    return response.parsed.question

def evaluate_test_session(past_qa_pairs: list[dict]) -> TestEvaluationResponse:
    """
    Evaluates the full test session to calculate distress score and provide actionable advice.
    """
    if not API_KEY_EXISTS:
        # Calculate a dynamic mock score based on keyword analysis of user answers
        score = 50 # Base neutral score
        distress_keywords = ['anxious', 'scared', 'bad', 'terrible', 'nightmare', 'sleep', 'overwhelmed', 'hard', 'difficult', 'sad', 'cry', 'fear', 'threat', 'alone']
        stable_keywords = ['good', 'fine', 'okay', 'ok', 'better', 'managing', 'well', 'happy', 'calm', 'safe', 'support']
        
        for qa in past_qa_pairs:
            answer_lower = qa['answer'].lower()
            for word in distress_keywords:
                if word in answer_lower:
                    score += 15
            for word in stable_keywords:
                if word in answer_lower:
                    score -= 15
                    
        # Clamp score between 5 and 95 for realism
        score = max(5, min(95, score))
        
        if score < 40:
            color = "GREEN"
            advice = "Your responses indicate you are currently managing well. Please continue your positive coping strategies and reach out to our network if you ever feel overwhelmed."
        elif score < 75:
            color = "YELLOW"
            advice = "Your responses indicate moderate distress. We recommend monitoring your feelings closely and considering reaching out to a counselor from our support directory to talk through your current challenges."
        else:
            color = "RED"
            advice = "Based on your responses, you appear to be experiencing a high level of distress. It is extremely important that you reach out to a professional immediately. Please use the Support tab to contact our verified NGOs or emergency hotlines."

        return TestEvaluationResponse(
            distress_score=score,
            color_code=color,
            advice=advice
        )

    history_text = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in past_qa_pairs])
    
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
        model='gemini-3.5-flash-lite',
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
        model='gemini-3.5-flash-lite',
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            response_mime_type='application/json',
            response_schema=CustomMCQResponse,
            temperature=0.4
        )
    )
    
    return response.parsed.questions
