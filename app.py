import streamlit as st
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables from .env if present (override is true to hot-reload)
load_dotenv(override=True)

st.set_page_config(page_title="AI Science Experiment Advisor", page_icon="🧪", layout="wide")

st.title("🧪 AI Science Experiment Advisor")
st.write("Welcome! I am your domain-specific AI for designing, executing, and understanding science experiments.")

# --- Sidebar Configuration ---
with st.sidebar:
    st.header("⚙️ Configuration")
    
    api_key_env = os.getenv("GEMINI_API_KEY")
    api_key = st.text_input("Gemini API Key", value=api_key_env if api_key_env else "", type="password")
    
    st.subheader("Model Parameters")
    st.markdown("Adjust these settings to see how model behavior changes:")
    
    temperature = st.slider(
        "Temperature", 
        min_value=0.0, max_value=2.0, value=0.7, step=0.1,
        help="Controls Randomness. Lower values are more deterministic/factual, higher values are more creative."
    )
    
    top_p = st.slider(
        "Top-p (Nucleus Sampling)", 
        min_value=0.0, max_value=1.0, value=0.9, step=0.05,
        help="Controls the probability mass of token selection. Lower values restrict output to safer/expected tokens."
    )

    st.markdown("---")
    if st.button("Clear Chat History"):
        st.session_state.messages = []

# --- Chat State Initialization ---
if "messages" not in st.session_state:
    st.session_state.messages = []

# --- Display Chat History ---
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# --- System Instruction ---
SYSTEM_INSTRUCTION = """
You are the AI Science Experiment Advisor. Your goal is to help students design, execute, and understand science experiments safely and accurately. 
You must ONLY answer questions related to science, science experiments, the scientific method, or related academic concepts. 
If a user asks a question outside of these domains, you must politely decline and remind them of your purpose.
Always emphasize safety precautions when proposing or discussing experiments. Ensure responses are scientifically accurate.
"""

# --- Chat Interface ---
if prompt := st.chat_input("Ask me about a science experiment..."):
    if not api_key or api_key == "your_api_key_here":
        st.error("Please enter a valid Gemini API Key in the sidebar or .env file.")
    else:
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Add user message to session state
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Configure Gemini API
        genai.configure(api_key=api_key)
        
        try:
            # We use gemini-1.5-flash as it supports system_instruction and is fast
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=SYSTEM_INSTRUCTION
            )
            
            # Format history for Gemini SDK
            # Gemini expects history as a list of dictionaries with 'role' ('user' or 'model') and 'parts'
            formatted_history = []
            for msg in st.session_state.messages[:-1]: # Exclude the current prompt that has just been added
                role = "user" if msg["role"] == "user" else "model"
                formatted_history.append({
                    "role": role,
                    "parts": [msg["content"]]
                })
                
            chat_session = model.start_chat(history=formatted_history)
            
            # Show assistant response
            with st.chat_message("assistant"):
                message_placeholder = st.empty()
                with st.spinner("Thinking..."):
                    # Generate response with model configuration (Temperature and Top-p)
                    response = chat_session.send_message(
                        prompt,
                        generation_config=genai.types.GenerationConfig(
                            temperature=temperature,
                            top_p=top_p,
                        )
                    )
                    message_placeholder.markdown(response.text)
            
            # Add assistant response to session state
            st.session_state.messages.append({"role": "assistant", "content": response.text})
            
        except Exception as e:
            st.error(f"Error generating response: Ensure your API key is correct and valid. Details: {e}")
