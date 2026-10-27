"""
Interactive Complaint Portal AI Demo
Uses the classifier and worker allocation functions from main.py.

Install:
    pip install streamlit requests pandas scikit-learn fastapi uvicorn

Run the FastAPI backend in terminal 1:
    uvicorn main:app --reload

Run this UI in terminal 2:
    streamlit run streamlit_app.py
"""

import streamlit as st
import requests

API_URL = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="Smart Complaint Portal",
    page_icon="🛠️",
    layout="centered",
)

st.title("🛠️ Smart Complaint Portal")
st.caption("AI-assisted complaint classification and worker allocation")
st.write(
    "Describe the issue in your own words. The AI will suggest a category, "
    "then the system will look for an available worker with the right skills."
)

with st.expander("How does this work?"):
    st.markdown(
        """
        1. **You describe the problem** — for example, a fan that is not working.
        2. **AI classifies the text** — TF-IDF converts words into numerical features,
           and a Linear SVM predicts the complaint category.
        3. **The allocation system finds a worker** — it checks skills and availability,
           then prefers the eligible worker with fewer pending tasks.
        4. **The result is shown to you** — an administrator can review the assignment.
        """
    )

examples = {
    "Electrical": "The fan in Room 204 is not working",
    "Plumbing": "Water is leaking from the washroom pipe",
    "IT Support": "The campus Wi-Fi is not connecting",
    "Housekeeping": "The classroom has not been cleaned",
    "Equipment Maintenance": "The projector in the lecture hall is broken",
}

st.subheader("Raise a complaint")
example_choice = st.selectbox(
    "Choose an example (optional)",
    ["Write my own complaint"] + list(examples.keys()),
)

default_text = "" if example_choice == "Write my own complaint" else examples[example_choice]

with st.form("complaint_form"):
    complaint_text = st.text_area(
        "What is the problem?",
        value=default_text,
        placeholder="Example: The lights in the second-floor corridor are not working.",
        height=120,
        max_chars=2000,
        help="Include the location and describe the problem clearly.",
    )
    location = st.text_input(
        "Location (optional)",
        placeholder="Example: Block A, Room 204",
    )
    submitted = st.form_submit_button("🔎 Classify & Assign", use_container_width=True)

if submitted:
    if len(complaint_text.strip()) < 5:
        st.warning("Please describe the complaint in at least 5 characters.")
    else:
        try:
            response = requests.post(
                f"{API_URL}/classify-and-assign",
                json={
                    "complaint_text": complaint_text.strip(),
                    "location": location.strip() or None,
                },
                timeout=10,
            )
            response.raise_for_status()
            result = response.json()

            st.divider()
            st.subheader("AI result")

            st.success(f"Predicted category: **{result['predicted_category']}**")
            st.write("**Your complaint:**", result["complaint_text"])

            if location.strip():
                st.write("**Location provided:**", location.strip())

            if result.get("assigned_worker_id") is not None:
                st.markdown("### Suggested worker")
                col1, col2 = st.columns(2)
                col1.metric("Worker", result.get("assigned_worker_name") or "Not available")
                col2.metric("Worker ID", result["assigned_worker_id"])
                st.info(result["explanation"])
                st.caption(
                    "This is a suggested assignment in the demo. "
                    "The real portal should save the assignment in MySQL and notify the worker."
                )
            else:
                st.warning("No suitable available worker was found.")
                st.write(result["explanation"])
                st.write(
                    "Next step: send this complaint to an administrator for manual assignment "
                    "or wait until a qualified worker becomes available."
                )

            st.markdown("### What happens next?")
            st.write(
                "In a complete portal, the backend stores the complaint, category, "
                "assigned worker and status in MySQL. The student can then track its progress."
            )
            st.caption(
                "Prototype note: predictions depend on the small sample training dataset. "
                "Please verify the category and assignment before acting on them."
            )

        except requests.exceptions.ConnectionError:
            st.error(
                "Cannot connect to the AI backend. Start it in another terminal with: "
                "`uvicorn main:app --reload`"
            )
        except requests.exceptions.Timeout:
            st.error("The AI service took too long to respond. Please try again.")
        except requests.exceptions.HTTPError as exc:
            st.error(f"The AI service returned an error: {exc}")
        except requests.exceptions.RequestException as exc:
            st.error(f"Could not process the request: {exc}")

st.divider()
st.subheader("Example categories")
st.write(
    "⚡ Electrical  ·  🚰 Plumbing  ·  💻 IT Support  ·  🧹 Housekeeping  ·  "
    "🔧 Equipment Maintenance"
)
st.caption(
    "Academic prototype only. The sample worker list and training data in main.py "
    "must be replaced with verified project data before deployment."
)
