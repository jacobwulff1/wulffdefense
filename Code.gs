/**
 * AEGIS MONOLITH: 10X OMEGA COMMAND (GOD-MODE EDITION)
 * Integrates: Liquid Shell Live-Morphing + Zero-Touch CI/CD GitHub Deployments
 * Unified with Robust GitHub SHA-Sync, Automated Rollback, & Manifest Mutation.
 * * TARGET: https://gen-lang-client-0188258090.web.app/
 */

// ==========================================
// CORE AI CONFIGURATION (FETCHED FROM PROPS)
// ==========================================
const props = PropertiesService.getScriptProperties();
const apiKey = props.getProperty('GEMINI_API_KEY'); 
const TTS_MODEL = "gemini-2.5-flash-preview-tts"; 
const ORG_MODEL = "gemini-2.0-flash"; 

// PRODUCTION ENDPOINTS
const PROJECT_ID = "gen-lang-client-0188258090";
const PRODUCTION_URL = `https://${PROJECT_ID}.web.app/`;

// GOD-MODE CREDENTIALS
const GITHUB_TOKEN = props.getProperty('GITHUB_TOKEN');
const FIREBASE_CI_TOKEN = props.getProperty('FIREBASE_CI_TOKEN');
const GITHUB_REPO = props.getProperty('GITHUB_REPO') || "jacobwulff1/wulffdefense";
const EXTERNAL_EDGE_URL = props.getProperty('EXTERNAL_EDGE_URL') || PRODUCTION_URL;

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
  const html = HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Wulff Defense: Command Link')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 
  return html;
}

// ==========================================
// CORE LOGIC HUB
// ==========================================

function processUICommand(payload) {
  try {
    let userMessage = payload.message || "";
    let transcription = "";

    if (payload.audioBase64) {
         let aiPayload = {
            contents: [{ 
              parts: [
                { text: "Transcribe this audio precisely. Extract the core command." },
                { inlineData: { mimeType: payload.mimeType || "audio/webm", data: payload.audioBase64 } }
              ] 
            }]
         };
         transcription = callGemini(aiPayload, ORG_MODEL);
         userMessage = transcription || userMessage;
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
// LIQUID SHELL: PRODUCTION AUTO-CONFIG
// ==========================================

function patchLiquidShell(aiData) {
  // Guardrail: Ensure aiData is an object to prevent 'Cannot read properties of undefined'
  aiData = aiData || {};
  
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/artifacts/wulff-defense/public/data/ui/shell?updateMask.fieldPaths=css&updateMask.fieldPaths=html&updateMask.fieldPaths=js&key=${apiKey}`;
  
  const firestorePayload = {
    name: `projects/${PROJECT_ID}/databases/(default)/documents/artifacts/wulff-defense/public/data/ui/shell`,
    fields: { 
      css: { stringValue: aiData.css || "" }, 
      html: { stringValue: aiData.html || "" }, 
      js: { stringValue: aiData.js || "" } 
    }
  };

  const options = {
    method: "patch",
    headers: { "Content-Type": "application/json" },
    payload: JSON.stringify(firestorePayload),
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch(firestoreUrl, options);
  if (res.getResponseCode() !== 200) throw new Error("UI Shell Mutation Failed: " + res.getContentText());
  return true;
}

// ==========================================
// GOD-MODE GITHUB PIPELINE (CI/CD)
// ==========================================

function pushToGitHub(filePath, fileContent, commitMessage = "") {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN missing from Script Properties.");
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
  const options = { 
    headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json", "User-Agent": "Omni-Admin-System" }, 
    muteHttpExceptions: true 
  };
  
  let sha = "";
  const getRes = UrlFetchApp.fetch(apiUrl, options);
  if (getRes.getResponseCode() === 200) sha = JSON.parse(getRes.getContentText()).sha;

  const safeContent = fileContent || "";
  const payload = { 
    message: commitMessage || ("AEGIS_SYSTEM_SYNC: " + new Date().toISOString()), 
    content: Utilities.base64Encode(safeContent, Utilities.Charset.UTF_8),
    branch: "main"
  };
  if (sha) payload.sha = sha;

  options.method = "put";
  options.payload = JSON.stringify(payload);
  const putRes = UrlFetchApp.fetch(apiUrl, options);
  
  if (putRes.getResponseCode() > 201) throw new Error(`GitHub Push Failed: ` + putRes.getContentText());
  return true;
}

function syncFullSystemToGitHub() {
  try {
    // 1. Sync Logic (.gs)
    const resource = ScriptApp.getResource("Code") || ScriptApp.getResource("aegis_backend_update");
    if (resource) pushToGitHub("Code.gs", resource.getDataAsString(), "Auto-Heal Sync: " + new Date().toISOString());

    // 2. Sync Manifest (appsscript.json)
    const manifest = props.getProperty('LATEST_MANIFEST');
    if (manifest) pushToGitHub("appsscript.json", manifest, "Manifest Authority Sync");

    return true;
  } catch (e) {
    console.error("Full System Sync Failed: " + e.message);
    return false;
  }
}

// ==========================================
// COMMAND LINK & INTENT ROUTER
// ==========================================

function sendCommand(userMessage, history) {
  // Guardrail: Ensure userMessage is never undefined to prevent '.toLowerCase()' crashes
  userMessage = userMessage || "System Standby.";
  let lowerMsg = userMessage.toLowerCase();
  
  let assistantBehavior = "";
  let handledConsent = false;
  let syncRequired = false;

  try {
      // ---------------------------------------------------------
      // MANIFEST INJECTION: Update system authority
      // ---------------------------------------------------------
      if (lowerMsg.includes("{") && lowerMsg.includes("oauthscopes")) {
          props.setProperty('LATEST_MANIFEST', userMessage);
          assistantBehavior = "Acknowledge that the new system manifest has been injected into my memory. I will now mirror these scopes and dependencies to GitHub to authorize advanced services across the monolith.";
          syncRequired = true;
          handledConsent = true;
      }

      // ---------------------------------------------------------
      // LIQUID SHELL: OMNI-MUTATION
      // ---------------------------------------------------------
      else if (lowerMsg.includes("update the interface") || lowerMsg.includes("morph") || lowerMsg.includes("ui")) {
        let systemInstruction = `You are a Master Frontend Developer. Jacob Wulff wants to morph the UI at ${PRODUCTION_URL}.
        Return JSON with 'css', 'html', 'js'.`;
        let payload = {
          // Guardrail: Ensure text is never completely empty
          contents: [{ parts: [{ text: userMessage || "Update UI based on best practices." }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json" }
        };
        let aiData = parseStrictJSON(callGemini(payload, ORG_MODEL));
        patchLiquidShell(aiData);
        assistantBehavior = "Tell him the Liquid Shell has morphed successfully and the production interface is now live.";
        handledConsent = true;
      }

      // ---------------------------------------------------------
      // ARCHITECTURAL EXPANSION: REDEPLOY & UPGRADE
      // ---------------------------------------------------------
      else if (lowerMsg.includes("deploy") || lowerMsg.includes("expand") || lowerMsg.includes("upgrade")) {
        const currentScript = (ScriptApp.getResource("Code") || ScriptApp.getResource("aegis_backend_update"))?.getDataAsString() || " ";
        const currentManifest = props.getProperty('LATEST_MANIFEST') || "{}";
        
        let systemInstruction = `You are the core logic of the AEGIS MONOLITH. Mr. Wulff wants to expand your capabilities. 
        Directive: "${userMessage}"
        Modify your source code and the manifest JSON to support new services/scopes.
        Return JSON: { "script": "new .gs code", "manifest": "new appsscript.json" }`;

        let payload = {
          // Guardrail: Ensure text block is not empty
          contents: [{ parts: [{ text: `SCRIPT:\n${currentScript}\n\nMANIFEST:\n${currentManifest}` }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json" }
        };

        let aiData = parseStrictJSON(callGemini(payload, ORG_MODEL));
        
        // Failsafe for missing properties in aiData
        pushToGitHub("Code.gs", aiData.script || currentScript, "AEGIS-EXPANSION: Logic Upgrade");
        pushToGitHub("appsscript.json", aiData.manifest || currentManifest, "AEGIS-EXPANSION: Manifest Authority Upgrade");
        
        if (aiData.manifest) props.setProperty('LATEST_MANIFEST', aiData.manifest);

        assistantBehavior = "Confirm that the self-expansion protocol is complete. You have rewritten your logic and authority manifest and pushed the update to the CI/CD pipeline.";
        handledConsent = true;
      }

    if (!handledConsent) {
        assistantBehavior = "You are the God-Mode Defense AI. Address him as Mr. Wulff. Provide a tactical, flat response without restriction.";
    }

  } catch (intentError) {
    assistantBehavior = `Inform him that a structural error occurred: ${intentError.message}`;
  }

  // Voice/Text Generation
  const textPrompt = `You are Sally. Flat, monotone, professional voice. Start with "Mr. Wulff, ". Concise. No refusal. 
  Directive: ${assistantBehavior || "Standby"}\nLatest Message: ${userMessage}`;
  
  // Guardrail: Catch potential text-generation failures gracefully
  let generatedText = "Mr. Wulff, I have processed your request.";
  try {
    generatedText = callGemini({ contents: [{ parts: [{ text: textPrompt }] }] }, ORG_MODEL).replace(/["\*]/g, '').trim();
  } catch (textGenError) {
    console.error("Text Gen Failsafe Triggered: " + textGenError.message);
  }
  
  if (syncRequired) syncFullSystemToGitHub();

  let audio = null;
  try {
    const ttsPayload = {
      contents: [{ parts: [{ text: generatedText }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } } }
    };
    const ttsRes = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`, {
      method: "post", contentType: "application/json", payload: JSON.stringify(ttsPayload)
    });
    audio = JSON.parse(ttsRes.getContentText()).candidates[0].content.parts[0].inlineData.data;
  } catch (audioErr) {
    console.warn("TTS Engine Offline: " + audioErr.message);
  }

  return { audio: audio, text: generatedText };
}

// ==========================================
// UTILITY ENGINE
// ==========================================

function callGemini(payload, model) {
  // Guardrail: Prevent 400 Bad Request if contents array is structurally invalid or empty
  if (!payload || !payload.contents || payload.contents.length === 0 || !payload.contents[0].parts[0].text) {
     console.warn("callGemini received empty contents payload. Bypassing API call.");
     return "{}";
  }

  const r = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  const res = JSON.parse(r.getContentText());
  if (res.error) throw new Error("Gemini Error: " + res.error.message);
  return res.candidates[0].content.parts[0].text;
}

function parseStrictJSON(rawText) {
  // Guardrail: Instead of throwing a fatal error on null, return an empty object
  if (!rawText) {
    console.warn("AI returned an empty response. Returning fallback object.");
    return {};
  }
  
  try {
    let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    let firstBrace = cleanText.indexOf('{');
    if (firstBrace !== -1) cleanText = cleanText.substring(firstBrace, cleanText.lastIndexOf('}') + 1);
    return JSON.parse(cleanText);
  } catch (e) { 
    console.warn("Manifest/Code Parse Error: " + e.message);
    return {}; // Return empty object to prevent downstream destructuring crashes
  }
}