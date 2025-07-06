require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

exports.searchJobs = async (skills = []) => {
  try {
    let query = skills.find(s => s.toLowerCase().includes('developer') || s.toLowerCase().includes('engineer'));

    if (!query) {
      // Fallback to first few technical skills
      query = skills.filter(s => !s.toLowerCase().includes('management'))
                    .slice(0, 2).join(' ') + ' Developer';
    }

    if (!RAPIDAPI_KEY) throw new Error("Missing RAPIDAPI_KEY");
    if (!query) throw new Error("Empty query string");

    console.log("🔍 Searching JSearch for:", query);

    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: query,
        num_pages: 1,
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });

    console.log("📥 JSearch raw response:", response.data);
    if (!response.data.data || response.data.data.length === 0) {
  console.warn("⚠️ No job results returned from JSearch.");
}

    const jobs = response.data.data.map(job => ({
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city || job.job_country || "Remote",
      url: job.job_apply_link,
      match: Math.floor(Math.random() * 21) + 80,
    }));

    return jobs;

  } catch (error) {
    console.error("❌ JSearch API error:", error.message);
    return [];
  }
};





// const axios = require('axios');
// const cheerio = require('cheerio');

// exports.searchJobs = async (skills = []) => {
//   try {
//     // Encode skills for URL
//     const query = encodeURIComponent(skills.join(' '));
    
//     // Direct LinkedIn job search URL
//     const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${query}`;
    
//     // Scrape job listings (Note: LinkedIn may block this in production)
//     const { data } = await axios.get(searchUrl, {
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
//       }
//     });

//     const $ = cheerio.load(data);
//     const jobs = [];

//     $('.base-card').each((i, element) => {
//       if (i >= 5) return; // Limit to 5 jobs
      
//       const title = $(element).find('.base-search-card__title').text().trim();
//       const company = $(element).find('.base-search-card__subtitle').text().trim();
//       const location = $(element).find('.job-search-card__location').text().trim();
//       const url = $(element).find('a.base-card__full-link').attr('href')?.split('?')[0];

//       if (title && company && url) {
//         jobs.push({
//           title,
//           company,
//           location,
//           url: url.startsWith('http') ? url : `https://www.linkedin.com${url}`,
//           match: calculateMatch(skills, title + company)
//         });
//       }
//     });

//     return jobs.length > 0 ? jobs : generateMockJobs(skills);

//   } catch (error) {
//     console.error('LinkedIn Error:', error.message);
//     return generateMockJobs(skills);
//   }
// };

// // Helper to create valid LinkedIn URLs for mock data
// function generateMockJobs(skills) {
//   return [
//     {
//       title: `${skills[0]} Developer`,
//       company: 'Tech Innovations Inc.',
//       location: 'Remote',
//       url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(skills[0])}`,
//       match: 85
//     },
//     {
//       title: `Senior ${skills[0]} Engineer`,
//       company: 'Digital Solutions',
//       location: 'New York, NY',
//       url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('senior ' + skills[0])}`,
//       match: 80
//     }
//   ];
// }