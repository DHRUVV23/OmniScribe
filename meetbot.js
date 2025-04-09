// const puppeteer = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// const { startRecording, stopRecording, saveRecording } = require("./audioRecorder");
// const { transcribeAudio } = require("./transcription");

// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";
// import { startRecording, stopRecording, saveRecording } from "./audioRecorder.js";
// import {transcribeAndSummarize } from "./transcription.js";
// import dotenv from "dotenv";

// puppeteer.use(StealthPlugin());


// (async () => {
//   let browser;
//   try {
//     browser = await puppeteer.launch({
//       headless: false,
//       args: [
//         "--disable-notifications",
//         "--mute-audio",
//         "--no-sandbox",
//         "--disable-setuid-sandbox"
//       ],
//       ignoreDefaultArgs: false,
//     });

//     const page = await browser.newPage();
//     await page.setDefaultNavigationTimeout(120000);

//     // Set permissions for Google Meet
//     const context = browser.defaultBrowserContext();
//     await context.overridePermissions("https://meet.google.com/", [
//       "microphone",
//       "camera",
//       "notifications",
//     ]);

//     // Login sequence
//     await page.goto("https://accounts.google.com/", { waitUntil: "networkidle2" });
//     await page.type('input[type="email"]', "ife2022009@iiita.ac.in");
//     await page.click("#identifierNext");
    
//     await page.waitForSelector('input[type="password"]', { visible: true });
//     await page.type('input[type="password"]', "Dhruv233@ag");
//     await page.keyboard.press("Enter");
//     await page.waitForNavigation({ waitUntil: "networkidle2" });

//     // Go directly to the meeting URL
//     await page.goto("https://meet.google.com/dux-ggdw-nzi", { 
//       waitUntil: "networkidle2",
//       timeout: 120000 
//     });

//     // Wait for meeting page to load (using meeting code selector)
//     await page.waitForSelector('div[data-meeting-code="dux-ggdw-nzi"]', { timeout: 30000 });
//     console.log("Meeting page loaded.");

//     // Disable media - using updated selectors
//     async function disableMedia() {
//       try {
//         // Disable Camera
//         await page.waitForSelector('div[data-is-muted="false"][aria-label*="camera"]', { timeout: 10000 });
//         await page.click('div[data-is-muted="false"][aria-label*="camera"]');
//         console.log("Camera disabled");
        
//         // Disable Microphone
//         await page.waitForSelector('div[data-is-muted="false"][aria-label*="microphone"]', { timeout: 10000 });
//         await page.click('div[data-is-muted="false"][aria-label*="microphone"]');
//         console.log("Microphone disabled");
        
//         // Wait for media states to update
//         await new Promise(resolve => setTimeout(resolve, 2000));
//       } catch (error) {
//         console.log("Media already disabled or selector changed:", error.message);
//       }
//     }

//     await disableMedia();

//     // Function to click all buttons on the page using their index
//     async function clickAllButtons() {
//       // Select all buttons
//       const allButtons = await page.$$('button');
//       console.log(`Found ${allButtons.length} buttons on the page.`);
      
//       // Log the innerText of each button to help with debugging
//       for (let i = 0; i < allButtons.length; i++) {
//         const btnText = await page.evaluate(el => el.innerText, allButtons[i]);
//         console.log(`Button ${i}: "${btnText}"`);
//       }
      
//       // Iterate through all buttons and click them one by one
//       for (let i = 0; i < allButtons.length; i++) {
//         try {
//           // Use evaluate to click the button by index in the page context
//           await page.evaluate((index) => {
//             const btns = document.querySelectorAll('button');
//             if (btns[index]) {
//               btns[index].click();
//             }
//           }, i);
//           console.log(`Clicked button at index ${i}`);
//           // Wait a bit between clicks (adjust delay as needed)
//           await new Promise(resolve => setTimeout(resolve, 1000));
//         } catch (error) {
//           console.error(`Error clicking button at index ${i}: ${error}`);
//         }
//       }
//     }

//     // After disabling media, click all buttons
//     console.log("Now clicking all buttons on the page...");
//     await clickAllButtons();

//     // Optionally, you can also wait for a selector that indicates you have joined (if applicable)
//     try {
//       await page.waitForSelector('[aria-label="Leave call"]', { timeout: 30000 });
//       console.log("Successfully joined meeting (detected 'Leave call' button)!");
//     } catch (err) {
//       console.log("Could not verify meeting join; 'Leave call' button not found.");
//     }

//     console.log("Starting audio recording...");
//     await startRecording(page);

    
//     console.log("Recording audio for 60 seconds...");
//     await new Promise(resolve => setTimeout(resolve, 40000));

//     // Stop recording and retrieve the audio data
//     const audioData = await stopRecording(page);
//     const filePath = await saveRecording(audioData);
//     console.log("Audio saved to:", filePath);
    

//     // Transcribe the audio using OpenAI Whisper API
//     // const transcript = await transcribeAudio(filePath);
//     const { transcript, summary } = await transcribeAndSummarize(filePath);
// console.log("Full Transcript:", transcript);
// console.log("\nSummary:", summary);


//     await new Promise(resolve => setTimeout(resolve, 60000));

//   } catch (error) {
//     console.error("Error during execution:", error);
//   } finally {
//     if (browser) await browser.close();
//   }
// })();





import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { startRecording, stopRecording, saveRecording } from "./audioRecorder.js";
import { transcribeAndSummarize } from "./transcription.js";
import dotenv from "dotenv";

puppeteer.use(StealthPlugin());

// Export this function to be used by server.js
export async function runMeetBot(email, password, meetId) {
  let browser;
  try {
    console.log(`Starting MeetBot with email: ${email.substring(0, 3)}... and meetId: ${meetId}`);
    
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--disable-notifications",
        "--mute-audio",
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ],
      ignoreDefaultArgs: false,
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(120000);
    
    // Set up logging for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('error', err => console.error('PAGE ERROR:', err));
    page.on('pageerror', err => console.error('PAGE ERROR:', err));

    // Set permissions for Google Meet
    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://meet.google.com/", [
      "microphone",
      "camera",
      "notifications",
    ]);

    console.log("Going to Google login page...");
    
    // Login sequence
    await page.goto("https://accounts.google.com/", { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', email);
    console.log("Entered email address");
    
    await page.click("#identifierNext");
    
    await page.waitForSelector('input[type="password"]', { visible: true, timeout: 60000 });
    await page.type('input[type="password"]', password);
    console.log("Entered password");
    
    await page.keyboard.press("Enter");
    
    try {
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 });
      console.log("Logged in successfully");
    } catch (error) {
      console.error("Navigation error after login:", error);
      throw new Error("Failed to login. Please check your credentials.");
    }

    // Go directly to the meeting URL with the provided meetId
    const meetUrl = `https://meet.google.com/${meetId}`;
    console.log(`Navigating to meeting URL: ${meetUrl}`);
    
    await page.goto(meetUrl, { 
      waitUntil: "networkidle2",
      timeout: 120000 
    });

    // Check if the meeting page loaded successfully
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    if (title.includes("Meet") || title.includes("Google Meet")) {
      console.log("Meeting page loaded successfully");
    } else {
      console.error("Unexpected page title, might not be on the meeting page");
      await page.screenshot({ path: "error-screenshot.png" });
      throw new Error("Failed to load meeting page. Please check the meeting ID.");
    }

    // Try to disable media first
    console.log("Attempting to disable media...");
    try {
      // Disable Camera
      const cameraSelector = 'div[data-is-muted="false"][aria-label*="camera"], button[aria-label*="camera"]';
      await page.waitForSelector(cameraSelector, { timeout: 10000 });
      await page.click(cameraSelector);
      console.log("Camera disabled");
      
      // Short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Disable Microphone
      const micSelector = 'div[data-is-muted="false"][aria-label*="microphone"], button[aria-label*="microphone"]';
      await page.waitForSelector(micSelector, { timeout: 10000 });
      await page.click(micSelector);
      console.log("Microphone disabled");
      
      // Wait for media states to update
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("Media controls not found or already disabled:", error.message);
    }

    // Join the meeting
    console.log("Attempting to join the meeting...");
    try {
      const joinButton = await page.$('button[jsname="Qx7uuf"]');
      if (joinButton) {
        await joinButton.click();
        console.log("Clicked join button");
      } else {
        console.log("Join button not found, trying to look for another button");
        
        // Try to find any button that might be the join button
        const allButtons = await page.$$('button');
        for (const button of allButtons) {
          const text = await page.evaluate(el => el.innerText, button);
          if (text.includes("Join") || text.includes("Ask to join")) {
            await button.click();
            console.log(`Clicked button with text: ${text}`);
            break;
          }
        }
      }
      
      // Wait a bit to ensure we've joined the meeting
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error("Error joining the meeting:", error);
      throw new Error("Failed to join the meeting. Please check the meeting ID and try again.");
    }

    // Check if we're in the meeting
    try {
      await page.waitForSelector('[aria-label="Leave call"]', { timeout: 30000 });
      console.log("Successfully joined meeting (detected 'Leave call' button)!");
    } catch (err) {
      console.log("Could not verify meeting join; 'Leave call' button not found.");
    }

    console.log("Starting audio recording...");
    await startRecording(page);

    console.log("Recording audio for 60 seconds...");
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Stop recording and retrieve the audio data
    console.log("Stopping recording...");
    const audioData = await stopRecording(page);
    if (!audioData || audioData.length < 1000) {
      throw new Error("Failed to capture audio. Recording may have failed.");
    }
    
    console.log("Saving audio data...");
    const filePath = await saveRecording(audioData);
    console.log("Audio saved to:", filePath);

    // Transcribe the audio
    console.log("Transcribing audio...");
    const { transcript, summary } = await transcribeAndSummarize(filePath);
    console.log("Transcription complete.");

    // Leave the meeting
    try {
      const leaveButton = await page.$('[aria-label="Leave call"]');
      if (leaveButton) {
        await leaveButton.click();
        console.log("Left the meeting");
      }
    } catch (error) {
      console.log("Error leaving the meeting:", error.message);
    }

    // Return the results
    return {
      transcript,
      summary,
      filePath
    };

  } catch (error) {
    console.error("Error during MeetBot execution:", error);
    throw error; // Re-throw to be handled by the server
  } finally {
    if (browser) {
      console.log("Closing browser");
      await browser.close();
    }
  }
}

// If you want to be able to run the script directly (not just through the API)
if (import.meta.url === import.meta.main) {
  // This only runs if the file is executed directly (not imported)
  dotenv.config();
  
  // You could add fallback values here or read from environment variables
  const email = process.env.GOOGLE_EMAIL;
  const password = process.env.GOOGLE_PASSWORD;
  const meetId = process.env.MEET_ID;
  
  if (!email || !password || !meetId) {
    console.error("Please set GOOGLE_EMAIL, GOOGLE_PASSWORD, and MEET_ID environment variables");
    process.exit(1);
  }
  
  runMeetBot(email, password, meetId)
    .then(result => {
      console.log("MeetBot completed successfully!");
      console.log("Transcript:", result.transcript);
      console.log("Summary:", result.summary);
    })
    .catch(error => {
      console.error("Error running MeetBot:", error);
    });
}