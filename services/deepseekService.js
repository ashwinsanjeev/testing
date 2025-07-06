// deepSeekService.js
const axios = require('axios');
require('dotenv').config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

exports.extractSkills = async (text) => {
  try {
    const prompt = `
You are an AI assistant. Extract a list of technical and soft skills from this resume text:

"${text}"

Respond in JSON format like:
{
  "technical": ["JavaScript", "Node.js", "SQL"],
  "soft": ["Leadership", "Communication"]
}
`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-0528:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000 // 20 seconds max wait
      }
    );

    const content = response.data.choices[0].message.content;
    // Extract JSON substring safely
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const jsonString = content.substring(jsonStart, jsonEnd);

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse DeepSeek JSON:', e.message);
      return [];
    }
    const allSkills = [
      ...parsed.technical.map(skill => ({ skill, type: 'technical', confidence: 'high' })),
      ...parsed.soft.map(skill => ({ skill, type: 'soft', confidence: 'medium' }))
    ];

    return allSkills;

  } catch (error) {
    console.error('DeepSeek Error:', error.message);
    return [];
  }
};

exports.extractExperience = async (text) => {
  // Placeholder stub to avoid runtime error
  return [];
};
