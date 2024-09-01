const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8081;

// Middleware to parse JSON bodies
app.use(express.json());

app.post('/generate-image', async (req, res) => {
  const tweetText = req.body.tweetText || "Default tweet text";
  
  // Start Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Load HTML template
  const template = fs.readFileSync(path.join(__dirname, 'templates', 'tweet.html'), 'utf8');
  
  // Inject tweet text
  const htmlContent = template.replace('{{tweetText}}', tweetText);
  await page.setContent(htmlContent);
  
  // Generate screenshot
  const screenshotBuffer = await page.screenshot({ fullPage: true });
  await browser.close();
  
  // Upload to Imgur
  const imgurResponse = await axios.post('https://api.imgur.com/3/image', screenshotBuffer, {
    headers: {
      Authorization: 'Client-ID e272492b3b91c8c' // Replace with your Imgur Client ID
    }
  });

  if (imgurResponse.data.success) {
    res.json({ imageUrl: imgurResponse.data.data.link });
  } else {
    res.status(500).json({ error: 'Failed to upload image to Imgur' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
