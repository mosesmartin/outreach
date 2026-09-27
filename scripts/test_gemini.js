const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=(.*)/);
const key = match ? match[1].trim().replace(/^["']|["']$/g, '') : '';

const genAI = new GoogleGenerativeAI(key);

async function test() {
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0'
  ];
  for (const m of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent('Say hello in 3 words');
      console.log('✅ SUCCESS with model:', m, 'Response:', res.response.text().trim());
    } catch(e) {
      console.log('❌ FAILED model:', m, '->', e.message);
    }
  }
}
test();
