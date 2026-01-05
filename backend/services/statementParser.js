const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();
// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Parse bank statement PDF/Image using Gemini AI
 * NOW EXTRACTS: Multiple income sources with type, stability, volatility, etc.
 */
async function parseStatementWithGemini(filePath) {
    try {
        // Read the file as base64
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString("base64");

        // Detect file type
        const ext = filePath.toLowerCase();
        let mimeType = "application/pdf";
        if (ext.endsWith(".png")) mimeType = "image/png";
        if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) mimeType = "image/jpeg";

        // Use Gemini Pro for MUCH better document OCR (superior to Flash for reading text)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",  // Pro model has far superior OCR capabilities
            generationConfig: {
                temperature: 0,  // Make output deterministic
                topP: 1,
                topK: 1,
            }
        });

        const prompt = `Analyze this bank statement image carefully and extract information in STRICT JSON format. 

CRITICAL: All numeric fields MUST be actual numbers, NOT strings like "NA" or "N/A". If you cannot determine a value, use reasonable defaults.

Return this EXACT JSON structure:
{
  "accountHolder": {
    "name": "PERSON'S FULL NAME (NOT household name)",
    "accountNumber": "Last 4 digits only"
  },
  "suggestedHouseholdName": "Family name based on last name (e.g., 'Sharma Family')",
  "detectedIncomeSources": [
    {
      "type": "job",
      "stability": 0.9,
      "volatility": 0.2,
      "is_primary": true,
      "amount_band": "high",
      "description": "Brief description",
      "monthlyAverage": 85000
    }
  ],
  "identifiedMembers": [
    {
      "name": "PERSON'S FULL NAME (same as accountHolder.name)",
      "suggestedRole": "earner",
      "relationship": "Self"
    }
  ]
}

CRITICAL INSTRUCTION FOR NAME EXTRACTION:
Look for the "Account Holder Name" or "Customer Name" field in the STATEMENT HEADER.

CORRECT EXTRACTION EXAMPLES:
- Bank Statement shows "Account Holder: RAJESH KUMAR SHARMA" → Extract "Rajesh Kumar Sharma"
- Bank Statement shows "Name: PRIYA MEHTA" → Extract "Priya Mehta"  
- Bank Statement shows "Customer: ANAND SINGH RATHORE" → Extract "Anand Singh Rathore"

WRONG - DO NOT DO THIS:
- ❌ DO NOT extract "Sharma Family" as the account holder name (that's for suggestedHouseholdName)
- ❌ DO NOT extract "Sharma Household" as the account holder name
- ❌ DO NOT use generic names like "Household" or "Family"
- ❌ DO NOT extract only the last name (e.g., just "Sharma")

RULES:
- Extract the COMPLETE FULL NAME from the account holder field in the statement header
- This should be a PERSON'S NAME (First + Middle + Last), NOT a household name
- Use proper capitalization (Title Case, not ALL CAPS)
- The accountHolder.name and the first member's name should be IDENTICAL

INCOME SOURCE DETECTION RULES:
Extract EVERY distinct income stream as a separate object.

1. **SALARY (type: "job")**
   - Keywords: "SAL/", "SALARY", company names in CREDIT transactions
   - stability: 0.90-0.95 (appears monthly = stable)
   - volatility: 0.10-0.20 (same amount each time = low volatility)
   - amount_band: Compare to total income (>60% = "high", 30-60% = "medium", <30% = "low")
   - is_primary: true for the LARGEST/most regular income
   - monthlyAverage: Actual credit amount in numbers

2. **FREELANCE (type: "freelance")**
   - Keywords: "FREELANCE", "UPI/", "UPWORK", "FIVERR", service descriptions
   - stability: 0.50-0.70 (irregular = less stable)
   - volatility: 0.60-0.80 (varying amounts = high volatility)
   - amount_band: Usually "low" or "medium"
   - is_primary: false (unless only income)
   - monthlyAverage: Average of freelance credits

3. **RENTAL (type: "rental")**
   - Keywords: "RENT RECEIVED", property/tenant names
   - stability: 0.85-0.95 (monthly = stable)
   - volatility: 0.20-0.30 (mostly same amount)
   - amount_band: Based on amount
   - is_primary: false usually
   - monthlyAverage: Rental amount

4. **BUSINESS (type: "business")**
   - Keywords: "BUSINESS", "PARTNERSHIP", "PROFIT"
   - stability: 0.70-0.85
   - volatility: 0.30-0.50
   - amount_band: Based on amount
   - is_primary: false usually
   - monthlyAverage: Business income amount

5. **PENSION (type: "pension")**
   - Keywords: "PENSION", "EPFO", "PF"
   - stability: 0.95-0.99 (most stable)
   - volatility: 0.05-0.10 (minimal variation)
   - amount_band: Usually "low"
   - is_primary: false usually
   - monthlyAverage: Pension amount

MEMBER IDENTIFICATION RULES - BE EXTREMELY STRICT:
You MUST follow these rules EXACTLY. Do NOT infer or guess members.

**RULE 1: Account Holder (MANDATORY - ALWAYS include)**:
   - Extract EXACTLY the name from the statement header "Account Holder" field
   - relationship: "Self"
   - suggestedRole: "earner" (if any income credits exist)
   - This is the ONLY member you MUST include
   
**RULE 2: Joint Account Holder (ONLY if explicitly stated)**:
   - Include ONLY if statement explicitly says "Joint Account" or "Joint Holder" with a second name
   - Use the EXACT name shown after "Joint with" or similar
   - relationship: "Spouse" (assume spouse unless stated otherwise)
   - suggestedRole: "earner"
   - DO NOT add if joint account is not explicitly mentioned

**RULE 3: DO NOT ADD MEMBERS FROM TRANSACTIONS**:
   - DO NOT extract members from UPI/NEFT recipient names
   - DO NOT extract members from transaction descriptions
   - DO NOT infer family members from payment descriptions
   - DO NOT add members based on pension transactions
   - DO NOT add children, parents, or other relatives unless they are explicitly named as joint account holders

**RULE 4: If uncertain, include ONLY the account holder**:
   - When in doubt, it is better to have fewer members than to hallucinate
   - The account holder is sufficient for analysis

CRITICAL RULES:
- stability and volatility MUST be decimal numbers between 0.0 and 1.0
- NEVER use "NA", "N/A", "null", or empty strings for numeric fields
- If uncertain about stability, use 0.7 as default
- If uncertain about volatility, use 0.5 as default
- monthlyAverage must be a positive number
- amount_band must be EXACTLY one of: "low", "medium", "high"
- type must be EXACTLY one of: "job", "freelance", "rental", "business", "pension"
- At least ONE source must have is_primary: true

Return ONLY valid JSON. No markdown, no explanations, no code blocks.`;

        // Retry logic for handling API overload
        let result;
        let retries = 3;
        let delay = 2000; // Start with 2 seconds

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`🔄 Gemini API call attempt ${attempt}/${retries}...`);
                result = await model.generateContent([
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data,
                        },
                    },
                    prompt,
                ]);
                console.log("✅ Gemini API call successful");
                break; // Success, exit retry loop
            } catch (apiError) {
                if (apiError.message && apiError.message.includes("503") || apiError.message.includes("overloaded")) {
                    if (attempt < retries) {
                        console.log(`⚠️ Gemini overloaded (503). Retrying in ${delay / 1000}s... (Attempt ${attempt}/${retries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2; // Exponential backoff
                    } else {
                        console.error("❌ Gemini API failed after all retries");
                        throw new Error("Gemini AI service is currently overloaded. Please try again in a few moments.");
                    }
                } else {
                    // Different error, don't retry
                    throw apiError;
                }
            }
        }

        const response = await result.response;
        const text = response.text();

        console.log("📄 Raw Gemini response:");
        console.log(text);

        // Parse JSON (remove markdown if present)
        let jsonText = text;
        if (text.includes("```json")) {
            jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        } else if (text.includes("```")) {
            jsonText = text.replace(/```\n?/g, "");
        }

        const parsedData = JSON.parse(jsonText.trim());

        console.log("\n✅ Parsed bank statement data:");
        console.log("  Account Holder:", parsedData.accountHolder?.name);
        console.log("  Income Sources:", parsedData.detectedIncomeSources?.length || 0);
        console.log("  Members:", parsedData.identifiedMembers?.map(m => m.name).join(", "));

        // VALIDATION: Fix any NA values or invalid data
        if (parsedData.detectedIncomeSources && Array.isArray(parsedData.detectedIncomeSources)) {
            parsedData.detectedIncomeSources = parsedData.detectedIncomeSources.map(source => {
                // Fix stability
                if (typeof source.stability !== 'number' || isNaN(source.stability) || source.stability < 0 || source.stability > 1) {
                    source.stability = 0.7; // Default to moderate stability
                }
                // Fix volatility
                if (typeof source.volatility !== 'number' || isNaN(source.volatility) || source.volatility < 0 || source.volatility > 1) {
                    source.volatility = 0.5; // Default to moderate volatility
                }
                // Ensure amount_band is valid
                if (!['low', 'medium', 'high'].includes(source.amount_band)) {
                    source.amount_band = 'medium';
                }
                // Ensure type is valid
                if (!['job', 'freelance', 'rental', 'business', 'pension'].includes(source.type)) {
                    source.type = 'job';
                }
                // Ensure is_primary is boolean
                source.is_primary = source.is_primary === true;

                return source;
            });

            // Ensure at least one is_primary
            const hasPrimary = parsedData.detectedIncomeSources.some(s => s.is_primary);
            if (!hasPrimary && parsedData.detectedIncomeSources.length > 0) {
                parsedData.detectedIncomeSources[0].is_primary = true;
            }
        }

        // Deduplicate and validate members
        if (parsedData.identifiedMembers && Array.isArray(parsedData.identifiedMembers)) {
            // Remove duplicates based on name (case-insensitive)
            const uniqueMembers = [];
            const seenNames = new Set();

            parsedData.identifiedMembers.forEach(member => {
                const normalizedName = member.name.toLowerCase().trim();
                if (!seenNames.has(normalizedName)) {
                    seenNames.add(normalizedName);
                    uniqueMembers.push(member);
                }
            });

            parsedData.identifiedMembers = uniqueMembers;

            // Ensure account holder is in members list
            const hasAccountHolder = parsedData.identifiedMembers.some(
                (m) => m.relationship === "Self"
            );
            if (!hasAccountHolder && parsedData.accountHolder) {
                parsedData.identifiedMembers.unshift({
                    name: parsedData.accountHolder.name,
                    suggestedRole: "earner",
                    relationship: "Self",
                });
            }
        }

        // VALIDATION: Check if extracted name seems unclear/invalid
        const accountHolderName = parsedData.accountHolder?.name || "";
        const invalidNamePatterns = ["unknown", "household", "family", "sharma family", "unclear", "n/a", "na"];
        const seemsInvalid = invalidNamePatterns.some(pattern =>
            accountHolderName.toLowerCase().includes(pattern)
        );

        // Check if name is too short (likely only last name)
        const nameWords = accountHolderName.trim().split(/\s+/);
        const tooShort = nameWords.length < 2;

        if (seemsInvalid || tooShort) {
            console.warn("⚠️ Gemini extracted unclear name:", accountHolderName);
            console.warn("   This usually means the image text is not clear enough for OCR.");
            console.warn("   Recommendation: Use a real bank statement PDF for accurate extraction.");

            // Return error with helpful message
            return {
                success: false,
                error: `Unable to clearly read the account holder name from this image. Gemini extracted: "${accountHolderName}". 

This usually happens when:
• The image is AI-generated (which has unclear text)
• The image quality is too low
• The text in the image is blurry or distorted

📝 Recommended Solutions:
1. Upload a REAL bank statement PDF (best option)
2. Upload a high-quality scan or photo of a real statement
3. Manually create a household without bank statement upload

If you have a real PDF bank statement, please use that instead.`
            };
        }

        return {
            success: true,
            data: parsedData,
        };
    } catch (error) {
        console.error("Error parsing statement with Gemini:", error);
        return {
            success: false,
            error: error.message || "Failed to parse bank statement",
        };
    }
}

module.exports = {
    parseStatementWithGemini,
};
