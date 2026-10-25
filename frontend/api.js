// API connection file. Change this URL when you deploy your backend.
// Local backend: http://localhost:8000
const SAKHICARE_API_URL = "https://sakhi-care.onrender.com";

async function getAISummary(payload) {
  const response = await fetch(`${SAKHICARE_API_URL}/api/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return await response.json();
}


async function sendChatMessage(message, history = []) {
  const response = await fetch(`${SAKHICARE_API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history })
  });
  if (!response.ok) {
    let detail = "Ask Sakhi is temporarily unavailable. Please try again.";
    try {
      const data = await response.json();
      if (data.detail) detail = data.detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return await response.json();
}
