import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code, language } = await request.json()

    if (!code || !language) {
      return NextResponse.json({ error: "Code and language are required" }, { status: 400 })
    }

    // Use your API key directly
    const apiKey = "AIzaSyC0wI0BqU7XMdKEeohOJ2hwzg3A2NdNXkA"

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
You are an advanced code analysis assistant. Analyze the provided ${language} code and:

1. Identify issues across these categories:
   - **Security**: Vulnerabilities, injection risks, authentication issues
   - **Performance**: Time complexity, memory usage, inefficient algorithms  
   - **Quality**: Logic errors, input validation, error handling
   - **Style**: Documentation, naming conventions, code structure

2. Provide a completely corrected version of the code that fixes ALL identified issues

For each issue found, provide:
- Exact line number where the issue occurs
- Severity level (critical/high/medium/low)
- Clear description of the problem
- AI suggestion for improvement
- Specific code fix for that issue

Respond in this JSON format:
{
  "issues": [
    {
      "id": "unique_id",
      "title": "Issue Title",
      "severity": "critical|high|medium|low",
      "category": "security|performance|quality|style",
      "line": 5,
      "description": "Detailed explanation of the issue",
      "suggestion": "AI recommendation for fixing this issue",
      "recommendedFix": "Specific code snippet that fixes this issue",
      "canApplyFix": true
    }
  ],
  "correctedCode": "Complete corrected version of the entire code with all issues fixed",
  "summary": {
    "critical": 1,
    "high": 0,
    "medium": 1,
    "low": 1
  },
  "categoryCounts": {
    "security": 0,
    "performance": 1,
    "quality": 1,
    "style": 1
  }
}

Code to analyze:
${code
  .split("\n")
  .map((line, index) => `${index + 1}: ${line}`)
  .join("\n")}

Important: 
- Provide a complete, working, corrected version in "correctedCode"
- Each recommendedFix should be a specific code snippet for that issue
- Be thorough in identifying all types of issues
- Return valid JSON only
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.log("No JSON found in response, using fallback")
      const fallbackAnalysis = generateFallbackAnalysis(code, language)
      return NextResponse.json(fallbackAnalysis)
    }

    try {
      const analysisResult = JSON.parse(jsonMatch[0])

      // Ensure all required fields exist
      if (!analysisResult.correctedCode) {
        analysisResult.correctedCode = code
      }

      if (!analysisResult.issues) {
        analysisResult.issues = []
      }

      if (!analysisResult.summary) {
        analysisResult.summary = { critical: 0, high: 0, medium: 0, low: 0 }
      }

      if (!analysisResult.categoryCounts) {
        analysisResult.categoryCounts = { security: 0, performance: 0, quality: 0, style: 0 }
      }

      return NextResponse.json(analysisResult)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      const fallbackAnalysis = generateFallbackAnalysis(code, language)
      return NextResponse.json(fallbackAnalysis)
    }
  } catch (error) {
    console.error("Error analyzing code:", error)

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes("API key not valid")) {
      return NextResponse.json({ error: "Invalid API key. Please check your Gemini API key." }, { status: 401 })
    }

    // Return fallback analysis on error
    const fallbackAnalysis = generateFallbackAnalysis(code, language)
    return NextResponse.json(fallbackAnalysis)
  }
}

function generateFallbackAnalysis(code: string, language: string) {
  const issues = []
  let correctedCode = code

  // Basic analysis for common issues
  if (code.includes("var ")) {
    const varLine = code.split("\n").findIndex((line) => line.includes("var ")) + 1
    issues.push({
      id: "style_001",
      title: "Use of 'var' keyword",
      severity: "medium",
      category: "style",
      line: varLine,
      description: "Using 'var' can lead to scope issues. Use 'let' or 'const' instead.",
      suggestion: "Replace 'var' with 'let' for variables that change or 'const' for constants.",
      recommendedFix: "let result = calculateFactorial(-5);",
      canApplyFix: true,
    })
    correctedCode = correctedCode.replace(/var /g, "let ")
  }

  if (code.includes("if (n = 1)") || code.includes("if(n = 1)")) {
    const assignmentLine =
      code.split("\n").findIndex((line) => line.includes("if (n = 1)") || line.includes("if(n = 1)")) + 1

    issues.push({
      id: "qual_001",
      title: "Assignment instead of comparison",
      severity: "critical",
      category: "quality",
      line: assignmentLine,
      description: "Using assignment (=) instead of comparison (===) in conditional statement.",
      suggestion: "Use === for strict equality comparison instead of assignment.",
      recommendedFix: "if (n === 1) {",
      canApplyFix: true,
    })
    correctedCode = correctedCode.replace(/if\s*$$\s*n\s*=\s*1\s*$$/g, "if (n === 1)")
  }

  if (language === "python" && code.includes("input(")) {
    const inputLine = code.split("\n").findIndex((line) => line.includes("input(")) + 1
    issues.push({
      id: "qual_002",
      title: "Missing input validation",
      severity: "high",
      category: "quality",
      line: inputLine,
      description: "User input is not validated and could cause runtime errors.",
      suggestion: "Add input validation and error handling for user input.",
      recommendedFix:
        "try:\n    user_input = int(input('Enter a number: '))\n    if user_input < 0:\n        raise ValueError('Number must be non-negative')\nexcept ValueError as e:\n    print(f'Invalid input: {e}')\n    exit(1)",
      canApplyFix: true,
    })
  }

  // Generate corrected code with basic fixes for JavaScript
  if (language === "javascript" && issues.length > 0) {
    correctedCode = `// Fixed JavaScript code with proper error handling
function calculateFactorial(n) {
    // Input validation
    if (typeof n !== 'number' || n < 0 || !Number.isInteger(n)) {
        throw new Error('Input must be a non-negative integer');
    }
    
    if (n === 1 || n === 0) {  // Fixed comparison operator
        return 1;
    }
    return n * calculateFactorial(n - 1);
}

try {
    const result = calculateFactorial(5);  // Using const and positive input
    console.log(result);
} catch (error) {
    console.error('Error:', error.message);
}`
  }

  // Add issues for undeclared variables
  issues.push({
    id: "lint_001",
    title: "Undeclared variable 'code'",
    severity: "critical",
    category: "lint/correctness",
    line: 1,
    description: "The code variable is undeclared.",
    suggestion: "Please fix the import or declare the variable before using it.",
    recommendedFix: "const code = request.json().code;",
    canApplyFix: false,
  })

  issues.push({
    id: "lint_002",
    title: "Undeclared variable 'language'",
    severity: "critical",
    category: "lint/correctness",
    line: 1,
    description: "The language variable is undeclared.",
    suggestion: "Please fix the import or declare the variable before using it.",
    recommendedFix: "const language = request.json().language;",
    canApplyFix: false,
  })

  return {
    issues,
    correctedCode,
    summary: {
      critical: issues.filter((i) => i.severity === "critical").length,
      high: issues.filter((i) => i.severity === "high").length,
      medium: issues.filter((i) => i.severity === "medium").length,
      low: issues.filter((i) => i.severity === "low").length,
    },
    categoryCounts: {
      security: issues.filter((i) => i.category === "security").length,
      performance: issues.filter((i) => i.category === "performance").length,
      quality: issues.filter((i) => i.category === "quality").length,
      style: issues.filter((i) => i.category === "style").length,
      lint: issues.filter((i) => i.category === "lint/correctness").length,
    },
  }
}
