import React, { useState } from "react";
import * as XLSX from 'xlsx';

const API_URL = "https://wzsegw9yqj.execute-api.us-west-2.amazonaws.com/data/";
//https://qbvcassk2g.execute-api.us-west-2.amazonaws.com/dat
//https://wzsegw9yqj.execute-api.us-west-2.amazonaws.com/data/

export default function VendorChatbot() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Ask me about SWaM vendors for Cal Poly SLO." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [businessNames, setBusinessNames] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingBusinesses(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Try to get the "SLO DATA" sheet
        const sheetName = workbook.SheetNames.includes('SLO DATA')
          ? 'SLO DATA'
          : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let names = [];

        // Attempt to get 'Supplier Name' column
        if (jsonData.length > 0 && jsonData[0].hasOwnProperty('Supplier Name')) {
          names = jsonData
            .map(row => row['Supplier Name'])
            .filter(name => name && name.toString().trim() !== '')
            .map(name => name.toString().trim());
        } else {
          // Fallback: guess column with mostly unique, string values
          const firstRow = jsonData[0];
          const columns = Object.keys(firstRow);
          for (const col of columns) {
            const values = jsonData
              .map(row => row[col])
              .filter(val => val && val.toString().trim() !== '')
              .map(val => val.toString().trim());

            if (values.length > 0 && new Set(values).size > values.length * 0.7 && values[0].length > 3) {
              names = values;
              console.log(`Fallback to column: ${col}`);
              break;
            }
          }
        }

        console.log(`Loaded ${names.length} business names`);
        setBusinessNames(names);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setBusinessNames(['Error: ' + error.message]);
      } finally {
        setLoadingBusinesses(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

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
    <div style={{ 
      maxWidth: 1200, 
      margin: "auto", 
      fontFamily: "Arial, sans-serif",
      display: "flex",
      gap: "20px",
      padding: "20px"
    }}>
      {/* Main Chat Area */}
      <div style={{ flex: 1 }}>
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

      {/* Side Panel */}
      <div style={{ 
        width: 300, 
        border: "1px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "#f8f9fa"
      }}>
        {/* Tab Headers */}
        <div style={{ 
          display: "flex", 
          borderBottom: "1px solid #ccc",
          backgroundColor: "#e9ecef"
        }}>
          <button
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              backgroundColor: activeTab === "chat" ? "#007bff" : "transparent",
              color: activeTab === "chat" ? "white" : "#495057",
              cursor: "pointer",
              borderTopLeftRadius: "8px"
            }}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </button>
          <button
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              backgroundColor: activeTab === "businesses" ? "#007bff" : "transparent",
              color: activeTab === "businesses" ? "white" : "#495057",
              cursor: "pointer",
              borderTopRightRadius: "8px"
            }}
            onClick={() => setActiveTab("businesses")}
          >
            Businesses
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: "16px", height: "400px", overflowY: "auto" }}>
          {activeTab === "businesses" ? (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#495057" }}>
                SLO Data Supplier Names
              </h3>
              
              {/* File Upload Section */}
              <div style={{ marginBottom: "16px" }}>
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleFileUpload}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                />
                {loadingBusinesses && (
                  <div style={{ textAlign: "center", color: "#6c757d", marginTop: "8px" }}>
                    Loading supplier names...
                  </div>
                )}
              </div>

              {/* Business Names List */}
              {businessNames.length > 0 && !loadingBusinesses && (
                <div>
                  <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "12px" }}>
                    Total: {businessNames.length} suppliers
                  </p>
                  <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                    {businessNames.map((name, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #dee2e6",
                          fontSize: "14px",
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#e9ecef";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                        }}
                        onClick={() => {
                          setInput(`Tell me about ${name}`);
                          setActiveTab("chat");
                        }}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions when no file uploaded */}
              {businessNames.length === 0 && !loadingBusinesses && (
                <div style={{ fontSize: "14px", color: "#6c757d", textAlign: "center", marginTop: "20px" }}>
                  <p>Upload your SLO CFS Excel file to see supplier names.</p>
                  <p>Make sure the file contains a "SLO DATA" sheet with "Supplier Name" column.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#495057" }}>
                Quick Actions
              </h3>
              <div style={{ fontSize: "14px", color: "#6c757d" }}>
                <p>Switch to the "Businesses" tab to upload your Excel file and see all available suppliers.</p>
                <p>Click on any supplier name to ask the chatbot about that specific vendor.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
