# NutriGo AI

AI-driven Smart Grocery & Nutrition Assistant.

## Branch Strategy
- `main`: Production-ready code.
- `dev`: Active development branch.
- `feature/<feature-name>`: Feature branches for PRs.

## Setup
1. `python -m venv venv`
2. `.\venv\Scripts\activate`
3. `pip install -r requirements.txt`
4. `uvicorn app.main:app --reload`