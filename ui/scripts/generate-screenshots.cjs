const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const DELAY_BETWEEN_SCREENSHOTS = 1000;

// Define pages and their screenshots
const screenshots = [
  {
    name: 'home-page',
    path: '/',
    title: 'Home Page',
    description: 'Main dashboard showing quick actions and system status',
    actions: async (page) => {
      await page.waitForSelector('h1');
    }
  },
  {
    name: 'transcribe-page',
    path: '/transcribe',
    title: 'Transcribe Page',
    description: 'Main transcription interface for single files',
    actions: async (page) => {
      await page.waitForSelector('h1');
      // Show file selection area
      await page.hover('[data-testid="file-drop-zone"]').catch(() => {});
    }
  },
  {
    name: 'batch-processing',
    path: '/batch',
    title: 'Batch Processing',
    description: 'Process multiple files at once',
    actions: async (page) => {
      await page.waitForSelector('h1');
    }
  },
  {
    name: 'realtime-mode',
    path: '/realtime',
    title: 'Real-time Transcription',
    description: 'Live microphone transcription interface',
    actions: async (page) => {
      await page.waitForSelector('h1');
    }
  },
  {
    name: 'models-page',
    path: '/models',
    title: 'Model Management',
    description: 'Download and manage Whisper models',
    actions: async (page) => {
      await page.waitForSelector('h1');
    }
  },
  {
    name: 'config-page',
    path: '/config',
    title: 'Settings',
    description: 'Application configuration and preferences',
    actions: async (page) => {
      await page.waitForSelector('h1');
    }
  }
];

// Additional interaction screenshots
const interactionScreenshots = [
  {
    name: 'transcribe-with-options',
    path: '/transcribe',
    title: 'Transcription Options',
    description: 'Showing expanded transcription options',
    actions: async (page) => {
      await page.waitForSelector('h1');
      // Click on options if available
      const optionsButton = await page.$('[data-testid="show-options"]');
      if (optionsButton) {
        await optionsButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  },
  {
    name: 'batch-with-files',
    path: '/batch',
    title: 'Batch Processing with Files',
    description: 'Batch processing with files loaded',
    actions: async (page) => {
      await page.waitForSelector('h1');
      // Try to show the summary options
      const summaryCheckbox = await page.$('input[type="checkbox"]');
      if (summaryCheckbox) {
        await summaryCheckbox.click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
];

async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function generateScreenshot(browser, config) {
  const page = await browser.newPage();
  
  try {
    // Set viewport for consistent screenshots
    await page.setViewport({
      width: 1440,
      height: 900,
      deviceScaleFactor: 2 // High DPI screenshots
    });

    // Navigate to the page
    console.log(`Navigating to ${config.path}...`);
    await page.goto(`${BASE_URL}${config.path}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for any custom actions
    if (config.actions) {
      await config.actions(page);
    }

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, `${config.name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: false // Set to true if you want full page screenshots
    });

    console.log(`✓ Screenshot saved: ${config.name}.png`);

    // Also save a smaller thumbnail version
    const thumbnailPath = path.join(SCREENSHOT_DIR, `${config.name}-thumb.png`);
    await page.setViewport({
      width: 480,
      height: 300,
      deviceScaleFactor: 1
    });
    await page.screenshot({
      path: thumbnailPath,
      fullPage: false
    });

    return {
      name: config.name,
      title: config.title,
      description: config.description,
      filename: `${config.name}.png`,
      thumbnail: `${config.name}-thumb.png`
    };
  } catch (error) {
    console.error(`✗ Failed to generate screenshot for ${config.name}:`, error.message);
    return null;
  } finally {
    await page.close();
  }
}

async function generateMarkdownGallery(screenshotData) {
  const validScreenshots = screenshotData.filter(s => s !== null);
  
  let markdown = `# Concise Note Taker - Visual Guide

Generated on ${new Date().toLocaleDateString()}

## Application Screenshots

`;

  for (const screenshot of validScreenshots) {
    markdown += `### ${screenshot.title}

${screenshot.description}

![${screenshot.title}](screenshots/${screenshot.filename})

---

`;
  }

  // Create a gallery view as well
  markdown += `## Screenshot Gallery

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
`;

  for (const screenshot of validScreenshots) {
    markdown += `
<div style="text-align: center;">
  <img src="screenshots/${screenshot.thumbnail}" alt="${screenshot.title}" style="width: 100%; border: 1px solid #ddd; border-radius: 8px;">
  <p>${screenshot.title}</p>
</div>
`;
  }

  markdown += `</div>`;

  const guidePath = path.join(__dirname, '..', 'docs', 'VISUAL_GUIDE.md');
  await fs.writeFile(guidePath, markdown);
  console.log('✓ Visual guide generated: docs/VISUAL_GUIDE.md');
}

async function main() {
  console.log('Starting screenshot generation...');
  console.log(`Make sure the app is running at ${BASE_URL}`);
  console.log('');

  // Ensure screenshot directory exists
  await ensureDirectoryExists(SCREENSHOT_DIR);

  // Check if the app is running
  try {
    const testBrowser = await puppeteer.launch({ headless: true });
    const testPage = await testBrowser.newPage();
    await testPage.goto(BASE_URL, { timeout: 5000 });
    await testPage.close();
    await testBrowser.close();
  } catch (error) {
    console.error(`Error: Cannot connect to ${BASE_URL}`);
    console.error('Please make sure the app is running with: npm run dev');
    process.exit(1);
  }

  // Launch browser for screenshots
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  try {
    // Generate basic page screenshots
    console.log('Generating page screenshots...');
    for (const config of screenshots) {
      const result = await generateScreenshot(browser, config);
      if (result) results.push(result);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_SCREENSHOTS));
    }

    // Generate interaction screenshots
    console.log('\nGenerating interaction screenshots...');
    for (const config of interactionScreenshots) {
      const result = await generateScreenshot(browser, config);
      if (result) results.push(result);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_SCREENSHOTS));
    }

    // Generate markdown gallery
    await generateMarkdownGallery(results);

    console.log(`\n✓ Successfully generated ${results.length} screenshots`);
    console.log('Screenshots saved to: docs/screenshots/');
    console.log('Visual guide saved to: docs/VISUAL_GUIDE.md');
  } catch (error) {
    console.error('Error during screenshot generation:', error);
  } finally {
    await browser.close();
  }
}

// Run the script
main().catch(console.error);