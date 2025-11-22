const mysql = require('mysql2/promise');
const fs = require('fs');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

async function addSampleData() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  console.log('Adding sample research data for researcher ID 12...\n');

  const sampleResearch = [
    {
      title: 'Impact of Malaria Prevention in Rural Liberia',
      content: 'This comprehensive study examines the effectiveness of malaria prevention programs in rural communities across Liberia...',
      summary: 'A detailed analysis of malaria prevention strategies and their impact on community health.',
      category: 'Public Health',
      views: 245,
      likes: 32
    },
    {
      title: 'Healthcare Access in Post-Ebola Liberia',
      content: 'An in-depth look at how healthcare infrastructure has evolved following the Ebola crisis...',
      summary: 'Examining healthcare system recovery and improvements after the Ebola outbreak.',
      category: 'Healthcare Systems',
      views: 189,
      likes: 28
    },
    {
      title: 'Maternal Health Outcomes: A 5-Year Study',
      content: 'This longitudinal study tracks maternal health outcomes across multiple healthcare facilities...',
      summary: 'Five-year analysis of maternal health improvements and challenges.',
      category: 'Maternal Health',
      views: 312,
      likes: 45
    }
  ];

  for (const research of sampleResearch) {
    try {
      await connection.execute(
        `INSERT INTO research_posts 
         (title, content, summary, author_id, category, status, published_at, views, likes, created_at) 
         VALUES (?, ?, ?, 12, ?, 'published', NOW(), ?, ?, NOW())`,
        [research.title, research.content, research.summary, research.category, research.views, research.likes]
      );
      console.log(`✅ Added: ${research.title}`);
    } catch (error) {
      console.error(`❌ Error adding research:`, error.message);
    }
  }

  // Check total stats
  const [stats] = await connection.execute(
    `SELECT 
      COUNT(*) as research_count,
      SUM(views) as total_views,
      SUM(likes) as total_likes
     FROM research_posts 
     WHERE author_id = 12 AND status = 'published'`
  );

  console.log('\n📊 Researcher Stats:');
  console.log(`   Research Papers: ${stats[0].research_count}`);
  console.log(`   Total Views: ${stats[0].total_views}`);
  console.log(`   Total Likes: ${stats[0].total_likes}`);

  await connection.end();
}

addSampleData().catch(console.error);
