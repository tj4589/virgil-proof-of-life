const fetch = require('node-fetch');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function scoreWorker(workerData) {
  try {
    const res = await fetch(`${AI_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workerData)
    });
    
    if (!res.ok) {
        throw new Error(`AI service returned ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("AI Service Error:", error);
    return { label: 'ERROR', confidence: 0, reasons: [error.message] };
  }
}

module.exports = { scoreWorker };
