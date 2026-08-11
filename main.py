import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

# 1. Setup & Load Environment
load_dotenv()
app = FastAPI(title="AI Policy Simulator API")

# Allow React frontend to talk to this API later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load the RAG Database we just built
print("Loading ChromaDB...")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 2}) # Get top 2 facts

# 3. Initialize the LLM (Gemini 1.5 Flash is perfect for fast multi-agent chains)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
llm_json = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2) # Lower temp for strict JSON

# 4. Define Agent Prompts
citizen_prompt = PromptTemplate.from_template("""
You are an everyday citizen. You are reacting to a proposed policy.
Historical Context on this topic: {context}

The Policy: {policy}

React to this policy in 3-4 sentences. Focus on your daily life, cost of living, and emotional reaction. Be opinionated!
""")

gov_prompt = PromptTemplate.from_template("""
You are a government policymaker. You are justifying a proposed policy.
Historical Context on this topic: {context}

The Policy: {policy}

Justify this policy in 3-4 sentences. Focus on the economy, long-term national benefits, and infrastructure. Sound authoritative.
""")

analyst_prompt = PromptTemplate.from_template("""
You are a neutral AI Policy Analyst.
Review the citizen's concern and the government's justification for the policy: '{policy}'.

Citizen View: {citizen_text}
Government View: {gov_text}

Analyze the friction and output ONLY a valid JSON object. You MUST provide a 1-sentence logical reason for every score you assign based strictly on the Citizen and Government views. Use this exact schema:
{{
  "economy_score": (int 0-100),
  "economy_reason": "Brief reason...",
  "environment_score": (int 0-100),
  "environment_reason": "Brief reason...",
  "social_score": (int 0-100),
  "social_reason": "Brief reason...",
  "verdict": "1 sentence summary of the overall impact"
}}
""")

# 5. Define API Input Schema
class PolicyRequest(BaseModel):
    policy_name: str

# 6. The Multi-Agent API Endpoint
@app.post("/simulate")
async def simulate_policy(request: PolicyRequest):
    try:
        policy = request.policy_name
        
        # Step A: Retrieve RAG Context
        docs = retriever.invoke(policy)
        context = " ".join([doc.page_content for doc in docs])
        
        # Step B: Run Citizen and Government Agents
        # (In a production app we'd use asyncio.gather to run these simultaneously, 
        # but sequential is safer for the hackathon MVP)
        citizen_chain = citizen_prompt | llm
        gov_chain = gov_prompt | llm
        
        citizen_response = citizen_chain.invoke({"context": context, "policy": policy})
        gov_response = gov_chain.invoke({"context": context, "policy": policy})
        
        # Step C: Run Analyst Agent (Strict JSON output)
        analyst_chain = analyst_prompt | llm_json
        analyst_response = analyst_chain.invoke({
            "policy": policy,
            "citizen_text": citizen_response.content,
            "gov_text": gov_response.content
        })
        
        # Clean the JSON output (sometimes LLMs add ```json ... ```)
        clean_json = analyst_response.content.replace("```json", "").replace("```", "").strip()
        import json
        analyst_data = json.loads(clean_json)
        
        # Return the final payload to the frontend
        return {
            "policy": policy,
            "rag_context_used": context,
            "citizen_agent": citizen_response.content,
            "government_agent": gov_response.content,
            "analyst_agent": analyst_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))