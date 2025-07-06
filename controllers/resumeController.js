const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const nlpService = require('../services/deepseekService');
const jSearchService = require('../services/jSearchService');

// Rate limiter remains the same
const MAX_REQUESTS_PER_MINUTE = 10;
let requestCount = 0;
let lastResetTime = Date.now();

exports.analyzeResume = async (req, res) => {
  try {
    if (!req.files?.resume) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_FILE",
          message: "No resume file uploaded",
          solution: "Please select a PDF, DOCX, or TXT file"
        }
      });
    }

    const text = await extractTextFromFile(req.files.resume);
    if (!text || text.length < 10) {
      return res.status(400).json({
        success: false,
        error: {
          code: "TEXT_EXTRACTION_FAILED",
          message: "Could not extract text from file",
          solution: "Try a different file format or check if the file contains text"
        }
      });
    }

    const skills = await nlpService.extractSkills(text);

    let mainSkills = skills
  .map(s => typeof s === 'string' ? s : s.skill)
  .filter(s => s && s.trim() !== ''); // remove empty strings

// Fallback if mainSkills is still empty
if (mainSkills.length === 0) {
  mainSkills = ['developer'];
}

console.log("🎯 Extracted mainSkills:", mainSkills);

    const [experience, jobs] = await Promise.all([
      //nlpService.extractSkills(text),
      nlpService.extractExperience(text),
      jSearchService.searchJobs(mainSkills) // Pass top 3 skills
    ]);

    // Optimized successful response
    res.json({
      success: true,
      data: {
        skills,
        experience,
        jobs,
        meta: {
          characters: text.length,
          skillsFound: skills.length,
          jobsFound: jobs.length
        }
      }
    });

  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PROCESSING_ERROR",
        message: "Error analyzing resume",
        details: error.message,
        solution: "Try again later or contact support"
      }
    });
  }
};

// Helper functions
function deduplicateArray(arr) {
  return [...new Set(arr.map(item => item.toLowerCase()))]
    .map(item => item.charAt(0).toUpperCase() + item.slice(1));
}

function normalizeExperience(expArray) {
  return expArray.map(exp => ({
    company: exp.company || "Not specified",
    title: exp.title 
      ? exp.title.charAt(0).toUpperCase() + exp.title.slice(1)
      : "Professional role",
    duration: exp.duration || ""
  }));
}
// Keep existing getJobRecommendations and extractTextFromFile functions

exports.getJobRecommendations = async (req, res) => {
  try {
    const { skills } = req.query;
    
    if (!skills) {
      return res.status(400).json({ error: 'Skills parameter is required' });
    }

const jobSkills = skills.split(',');
const jobs = await jSearchService.searchJobs(jobSkills);
    res.json({
      success: true,
      data: jobs
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching job recommendations' });
  }
};

// Local fallback implementation
function extractSkillsLocal(text) {
  const commonSkills = [
    'Java', 'JavaScript', 'Python', 'HTML', 'CSS', 
    'React', 'Node.js', 'SQL', 'Git', 'AWS'
  ];
  
  return commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

async function extractTextFromFile(file) {
  try {
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (fileExt === 'pdf') {
      const dataBuffer = fs.readFileSync(file.tempFilePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } else if (fileExt === 'docx') {
      const result = await mammoth.extractRawText({ path: file.tempFilePath });
      return result.value;
    } else if (fileExt === 'txt') {
      return fs.readFileSync(file.tempFilePath, 'utf8');
    }
    
    throw new Error('Unsupported file type');
  } catch (error) {
    console.error('File extraction error:', error);
    throw new Error('Could not extract text from file');
  }
}