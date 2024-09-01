const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Imgur client ID from environment variables
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;

app.post('/generate-image', async (req, res) => {
  const { tweet_text } = req.body;

  if (!tweet_text) {
    return res.status(400).send('Missing tweet_text parameter.');
  }

  try {
    // Launch Puppeteer to generate an image
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.setContent(`
      <html>
        <body>
          <div style="font-size: 24px; font-family: Arial, sans-serif;">${tweet_text}</div>
        </body>
      </html>
    `);
    
    const imagePath = path.join(__dirname, 'tweet-image.png');
    await page.screenshot({ path: imagePath });
    await browser.close();

    // Upload to Imgur
    const image = fs.createReadStream(imagePath);
    const response = await axios.post('https://api.imgur.com/3/image', image, {
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    const imgurUrl = response.data.data.link;
    res.json({ imgurUrl });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send('Error generating image');
  }
});

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
