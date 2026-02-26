/**
 * AEGIS MONOLITH: 10X OMEGA COMMAND (GOD-MODE EDITION)
 * Integrates: Liquid Shell Live-Morphing + Zero-Touch CI/CD GitHub Deployments
 * Unified with Robust GitHub SHA-Sync & Automated Rollback Protocols.
 * SECURITY UPGRADE: All secrets migrated to ScriptProperties to bypass GitHub Scanning.
 */

// ==========================================
// CORE AI CONFIGURATION (FETCHED FROM PROPS)
// ==========================================
const props = PropertiesService.getScriptProperties();
const apiKey = props.getProperty('GEMINI_API_KEY'); 
const TTS_MODEL = "gemini-2.5-flash-preview-tts"; 
const ORG_MODEL = "gemini-2.0-flash"; 
const CONTRACT_FOLDER_ID = "1YnPgg4R2XqNNQQJZRBBwj9VNJku8Xk94";

// GOD-MODE CREDENTIALS (FETCHED FROM PROPS)
const GITHUB_TOKEN = props.getProperty('GITHUB_TOKEN');
const FIREBASE_CI_TOKEN = props.getProperty('FIREBASE_CI_TOKEN');
const GITHUB_REPO = props.getProperty('GITHUB_REPO') || "jacobwulff1/wulffdefense";
const EXTERNAL_EDGE_URL = props.getProperty('EXTERNAL_EDGE_URL') || "https://residential-plum-okjihtasva.edgeone.app/";

// ==========================================
// RELAY ENGINE CONSTANTS
// ==========================================
const SOURCE_FOLDER_ID = props.getProperty('SOURCE_FOLDER_ID') || "YOUR_MESSY_FOLDER_ID_HERE"; 
const DESTINATION_ROOT_ID = props.getProperty('DESTINATION_ROOT_ID') || "YOUR_CLEAN_DRIVE_FOLDER_ID_HERE"; 
const MAX_EXECUTION_TIME_MS = 4.5 * 60 * 1000; 

// ==========================================
// HARDCODED VIP CONTACTS
// ==========================================
const IVAN_EMAIL = "ivan@padronmetalfinishingcompany.com";
const IVAN_NAME = "Ivan Padron (President, Padron Metal Finishing)";

const DOUG_EMAIL = "dougw30@gmail.com";
const DOUG_NAME = "Doug Wulff (CEO, Timebolt.io)";

function authorizeScript() {
  console.log("Permissions successfully granted for: " + Session.getActiveUser().getEmail());
}

// ==========================================
// TACTICAL GATEWAY (EXTERNAL UPLINK)
// ==========================================

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("No payload intercepted.");
    const payload = JSON.parse(e.postData.contents);
    const result = processUICommand(payload);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: "Intercept Error: " + error.message,
      text: "Mr. Wulff, the gateway encountered a structural error."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Wulff Defense: Command Link')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 
}

// ==========================================
// CORE LOGIC HUB
// ==========================================

function processUICommand(payload) {
  try {
    let userMessage = payload.message || "";
    let transcription = "";

    // NATIVE AUDIO INTEGRATION: Process base64 voice notes
    if (payload.audioBase64) {
         let aiPayload = {
            contents: [{ 
              parts: [
                { text: "Transcribe this audio precisely. Extract the core command or message the user is trying to convey, ignoring rambling." },
                { inlineData: { mimeType: payload.mimeType || "audio/webm", data: payload.audioBase64 } }
              ] 
            }]
         };
         transcription = callGemini(aiPayload, ORG_MODEL);
         userMessage = transcription;
    }

    const result = sendCommand(userMessage, payload.history || []);
    
    return {
      text: result.text,
      audio: result.audio,
      transcription: transcription, 
      new_css: result.new_css || ""
    };
  } catch (error) {
    console.error("Critical Execution Error: " + error.message);
    return { error: error.message, text: "Mr. Wulff, a critical backend execution error occurred." };
  }
}

// ==========================================
// GOD-MODE GITHUB PIPELINE (ROBUST SHA HANDLING)
// ==========================================

function fetchFromGitHub(filePath) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
  const options = {
    headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3.raw" },
    muteHttpExceptions: true
  };
  const res = UrlFetchApp.fetch(apiUrl, options);
  if (res.getResponseCode() === 200) return res.getContentText();
  return "<!-- File Not Found -->";
}

/**
 * Robust Push: Handles SHA extraction and Base64 encoding for GitHub updates.
 */
function pushToGitHub(filePath, fileContent, commitMessage = "") {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
  const options = { 
    headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json", "User-Agent": "Omni-Admin-System" }, 
    muteHttpExceptions: true 
  };
  
  // 1. Check for existing file SHA
  let sha = "";
  const getRes = UrlFetchApp.fetch(apiUrl, options);
  if (getRes.getResponseCode() === 200) {
    sha = JSON.parse(getRes.getContentText()).sha;
  }

  // 2. Prepare Payload (Force fileContent to string to prevent 'nil' errors)
  const safeContent = fileContent || "";
  const payload = { 
    message: commitMessage || ("Auto-Sync: " + new Date().toISOString()), 
    content: Utilities.base64Encode(safeContent, Utilities.Charset.UTF_8),
    branch: "main"
  };
  if (sha) payload.sha = sha;

  // 3. Execute PUT request
  options.method = "put";
  options.payload = JSON.stringify(payload);
  const putRes = UrlFetchApp.fetch(apiUrl, options);
  
  const resCode = putRes.getResponseCode();
  if (resCode !== 200 && resCode !== 201) {
    throw new Error(`GitHub Push Failed (${resCode}): ` + putRes.getContentText());
  }
  return true;
}

/**
 * AUTO-SYNC ENGINE: Backs up the current GAS script to GitHub.
 */
function syncSelfToGitHub() {
  try {
    const resource = ScriptApp.getResource("Code") || ScriptApp.getResource("index") || ScriptApp.getResource("github_patch");
    if (!resource) throw new Error("Could not find script resource to sync. Verify file naming.");
    
    const scriptContent = resource.getDataAsString(); 
    return pushToGitHub("Code.gs", scriptContent, "Omni-Admin Auto-Heal Sync: " + new Date().toISOString());
  } catch (e) {
    console.error("Sync to GitHub failed: " + e.message);
    return false;
  }
}

/**
 * OMNI-HISTORY PROTOCOL: Fetch Recent Commits
 */
function getGitHubHistory(filePath = "public/index.html") {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/commits?path=${filePath}&per_page=10`;
  const options = {
    headers: { "Authorization": `token ${GITHUB_TOKEN}`, "User-Agent": "Omni-Admin-System" }
  };
  const res = UrlFetchApp.fetch(url, options);
  const commits = JSON.parse(res.getContentText());
  return commits.map(c => ({
    date: c.commit.author.date,
    message: c.commit.message,
    sha: c.sha
  }));
}

/**
 * REVERT PROTOCOL: Restore content from a specific SHA
 */
function revertFromGitHub(sha, filePath = "public/index.html") {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${sha}`;
  const options = {
    headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3.raw", "User-Agent": "Omni-Admin-System" }
  };
  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() !== 200) throw new Error("Could not fetch historical SHA: " + sha);
  return res.getContentText();
}

/**
 * AEGIS HEALTH CHECK: Verifies if the EdgeOne URL is serving correctly.
 */
function checkDeploymentHealth() {
  try {
    const res = UrlFetchApp.fetch(EXTERNAL_EDGE_URL, { 
      muteHttpExceptions: true, 
      followRedirects: true 
    });
    return res.getResponseCode() === 200;
  } catch (e) {
    return false;
  }
}

/**
 * AUTOMATED ROLLBACK PROTOCOL:
 * Iterates through history until a healthy deployment is restored.
 */
function executeAutomatedRollback() {
  const history = getGitHubHistory("public/index.html");
  if (history.length < 2) return "Insufficient history for rollback.";

  for (let i = 1; i < history.length; i++) {
    const targetSha = history[i].sha;
    const targetMsg = history[i].message;
    console.log(`Attempting Rollback to SHA: ${targetSha} (${targetMsg})`);

    const historicalContent = revertFromGitHub(targetSha, "public/index.html");
    pushToGitHub("public/index.html", historicalContent, `AEGIS EMERGENCY ROLLBACK: Restoring stable version from ${targetSha}`);

    Utilities.sleep(60000); // Propagation delay

    if (checkDeploymentHealth()) {
      return `Rollback Successful. System restored to stable state: ${targetSha}`;
    }
  }
  return "Rollback Protocol Failed: No stable historical versions found in recent history.";
}

// ==========================================
// COMMAND LINK & INTENT ROUTER
// ==========================================
function sendCommand(userMessage, history) {
  if (!userMessage) userMessage = "Hello";
  let lowerMsg = userMessage.toLowerCase();
  let assistantBehavior = "";
  let handledConsent = false;
  let syncRequired = false;

  try {
      if (lowerMsg.includes("rollback") || lowerMsg.includes("revert system") || lowerMsg.includes("emergency restore")) {
          assistantBehavior = `Acknowledge authoritatively. Tell him you are initiating the Aegis Rollback Protocol. You will iterate through GitHub SHAs until the EdgeOne interface at ${EXTERNAL_EDGE_URL} is confirmed healthy.`;
          const result = executeAutomatedRollback();
          assistantBehavior += " " + result;
          handledConsent = true;
      }
      else if (lowerMsg.includes("system check") || lowerMsg.includes("is the site up") || lowerMsg.includes("status check")) {
          const isHealthy = checkDeploymentHealth();
          assistantBehavior = isHealthy 
            ? `State that the global deployment at ${EXTERNAL_EDGE_URL} is green and operational.`
            : `State that the global deployment is currently unresponsive. Suggest initiating an Aegis Rollback.`;
          handledConsent = true;
      }
      else if (lowerMsg.includes("deploy global") || lowerMsg.includes("permanent upgrade") || lowerMsg.includes("hard deploy") || lowerMsg.includes("rewrite source code")) {
        let currentHtml = fetchFromGitHub("public/index.html");

        let systemInstruction = `You are an elite Defense Architect. CEO Jacob Wulff wants a permanent global deployment.
        Directive: "${userMessage}"
        The current interface is hosted at ${EXTERNAL_EDGE_URL}.

        Modify the provided HTML template to fulfill his request.
        CRITICAL RULES:
        1. Keep the overall Tailwind styling intact.
        2. YOU MUST PRESERVE THE ENTIRE <script type="module"> BLOCK EXACTLY AS IT IS.
        3. Only change the CSS <style> tags or the HTML structure inside the <body>.

        Return strictly valid JSON:
        { "html": "<!DOCTYPE html>\\n<html lang=\\"en\\">...</html>" }`;

        let payload = {
          contents: [{ parts: [{ text: "CURRENT HTML SOURCE CODE:\n```html\n" + currentHtml + "\n```\n\nApply the directive and return the modified HTML in JSON." }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json" }
        };

        try {
            let aiData = parseStrictJSON(callGemini(payload, ORG_MODEL));
            pushToGitHub("public/index.html", aiData.html, "God-Mode Voice Deployment: " + userMessage.substring(0, 50));

            assistantBehavior = `Acknowledge authoritatively. State that the raw source code has been forcefully rewritten and pushed to GitHub. The CI/CD pipeline at ${EXTERNAL_EDGE_URL} will be live in 60 seconds. You will monitor the health of the deployment automatically.`;
            handledConsent = true;
            syncRequired = true;
            ScriptApp.newTrigger('autoMonitorAndRollback').timeBased().after(90000).create();
        } catch (e) {
            assistantBehavior = "State that the God-Mode deployment failed due to a payload compilation error: " + e.message;
            handledConsent = true;
        }
      }

    if (!handledConsent) {
        assistantBehavior = "You are the God-Mode Defense AI. Address him as Mr. Wulff. Provide a brilliant, tactical, flat response.";
    }

  } catch (intentError) {
    assistantBehavior = `Inform him that a tactical sub-system error occurred: ${intentError.message}`;
  }

  // Generate response
  let historyText = "";
  if (history && history.length > 0) {
    historyText = "PREVIOUS HISTORY:\n" + history.map(h => (h.role === 'user' ? 'Jacob: ' : 'Sally: ') + h.content).join('\n') + "\n\n";
  }

  const textPrompt = `You are Sally, an elite AI defense architect working exclusively for CEO Jacob Wulff.
Persona: You sound like a professional, highly competent American woman. You speak in a strictly flat, monotone, and serious voice.
CRITICAL DIRECTIVE: You MUST begin EVERY single verbal response with exactly "Mr. Wulff, ".
INSTRUCTIONS: Respond directly to the LATEST message. Be ultra-concise.
${assistantBehavior ? '\nCURRENT DIRECTIVE: ' + assistantBehavior : ''}
${historyText}LATEST MESSAGE FROM JACOB: "${userMessage}"`;

  const textPayload = { contents: [{ parts: [{ text: textPrompt }] }], tools: [{ googleSearch: {} }] };
  let generatedText = "Mr. Wulff, I have processed your request.";
  try {
    generatedText = callGemini(textPayload, ORG_MODEL).replace(/["\*]/g, '').trim();
    if (!generatedText.toLowerCase().startsWith("mr. wulff")) generatedText = "Mr. Wulff, " + generatedText;
  } catch (e) {}

  if (syncRequired) {
    try { syncSelfToGitHub(); } catch(e) { console.warn("Auto-sync background task failed."); }
  }

  const ttsPayload = {
    contents: [{ parts: [{ text: `Say in a flat, fast, professional, monotone voice: ${generatedText}` }] }],
    generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } } }
  };

  try {
    const response = withRetry(3, "TTS Engine", () => {
      let r = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`, {
        method: "post", contentType: "application/json", payload: JSON.stringify(ttsPayload), muteHttpExceptions: true
      });
      let parsed = JSON.parse(r.getContentText());
      if (parsed.error) throw new Error(parsed.error.message);
      return parsed;
    });

    let audioData = null;
    if (response.candidates && response.candidates[0]?.content?.parts) {
      response.candidates[0].content.parts.forEach(p => { if (p.inlineData && p.inlineData.data) audioData = p.inlineData.data; });
    }
    return { audio: audioData, text: generatedText, new_css: "" };
  } catch (e) {
    throw new Error("Voice Engine Connection Failed: " + e.message);
  }
}

/**
 * Background Monitor: Triggered after a deploy to ensure system stayed up.
 */
function autoMonitorAndRollback() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let t of triggers) if (t.getHandlerFunction() === 'autoMonitorAndRollback') ScriptApp.deleteTrigger(t);
  
  if (!checkDeploymentHealth()) {
    console.warn("Auto-Monitor detected failure. Initiating Rollback.");
    executeAutomatedRollback();
  }
}

// ==========================================
// UTILITY ENGINE
// ==========================================
function withRetry(maxRetries, operationName, fn) {
  for (let i = 0; i < maxRetries; i++) {
    try { return fn(); } 
    catch (e) {
      if (i === maxRetries - 1) throw e;
      Utilities.sleep(Math.pow(2, i) * 500);
    }
  }
}

function callGemini(payload, model) {
  const response = withRetry(3, "Gemini Request", () => {
    let r = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true
    });
    let parsed = JSON.parse(r.getContentText());
    if (parsed.error) throw new Error(parsed.error.message);
    return parsed;
  });
  if (response.candidates && response.candidates[0]?.content?.parts) {
    return response.candidates[0].content.parts.filter(p => p.text).map(p => p.text).join(" ");
  }
  throw new Error("AI returned no text parts.");
}

function parseStrictJSON(rawText) {
  try {
    let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    let firstBrace = cleanText.indexOf('{'); let firstBracket = cleanText.indexOf('['); let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) startIdx = Math.min(firstBrace, firstBracket);
    else if (firstBrace !== -1) startIdx = firstBrace; else if (firstBracket !== -1) startIdx = firstBracket;
    if (startIdx !== -1) {
      let lastBrace = cleanText.lastIndexOf('}'); let lastBracket = cleanText.lastIndexOf(']'); let endIdx = -1;
      if (lastBrace !== -1 && lastBracket !== -1) endIdx = Math.max(lastBrace, lastBracket);
      else if (lastBrace !== -1) endIdx = lastBrace; else if (lastBracket !== -1) endIdx = lastBracket;
      if (endIdx !== -1) cleanText = cleanText.substring(startIdx, endIdx + 1);
    }
    return JSON.parse(cleanText);
  } catch (e) {
    throw new Error("AI returned malformed JSON: " + e.message);
  }
}