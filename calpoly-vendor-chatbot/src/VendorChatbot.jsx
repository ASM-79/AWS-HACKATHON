import React, { useState } from "react";

const API_URL = "https://wzsegw9yqj.execute-api.us-west-2.amazonaws.com/data/";``

export default function VendorChatbot() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Ask me about SWaM vendors for Cal Poly SLO." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { from: "user", text: input }]);
    setLoading(true);

    try {
      // Wrap your payload inside a 'body' string to mimic API Gateway proxy event
      const requestBody = JSON.stringify({
        body: JSON.stringify({ description: input }),
      });

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      const data = await response.json();
      console.log("Raw API response:", data);

      // Your Lambda returns JSON inside data.body as a string, parse it
      let parsedBody = {};
      if (typeof data.body === "string") {
        parsedBody = JSON.parse(data.body);
      } else {
        parsedBody = data;
      }

      const botReply =
        parsedBody.matches && parsedBody.matches.trim()
          ? parsedBody.matches
          : "No matches found.";

      setMessages((msgs) => [...msgs, { from: "bot", text: botReply }]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { from: "bot", text: `Network error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Cal Poly SLO SWaM Vendor Chatbot</h2>
      <div
        style={{
          border: "1px solid #ccc",
          padding: 16,
          height: 400,
          overflowY: "auto",
          marginBottom: 12,
          backgroundColor: "#fafafa",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              textAlign: m.from === "user" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 16,
                backgroundColor: m.from === "user" ? "#007bff" : "#e5e5ea",
                color: m.from === "user" ? "white" : "black",
                whiteSpace: "pre-wrap",
                maxWidth: "80%",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div>Loading...</div>}
      </div>

      <div style={{ display: "flex" }}>
        <input
          style={{ flexGrow: 1, padding: 8, fontSize: 16 }}
          type="text"
          placeholder="Ask about vendors (e.g., gardening near Cal Poly SLO)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          disabled={loading}
        />
        <button
          style={{
            padding: "8px 16px",
            fontSize: 16,
            marginLeft: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
