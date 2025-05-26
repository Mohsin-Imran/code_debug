"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  FileCode,
  Shield,
  Zap,
  CheckCircle,
  Palette,
  BarChart3,
  Copy,
  Download,
  Wand2,
  Info,
  X,
  Check,
  File,
  Sparkles,
  Code,
  AlertTriangle,
} from "lucide-react"

interface Issue {
  id: string
  title: string
  severity: "critical" | "high" | "medium" | "low"
  category: "security" | "performance" | "quality" | "style"
  line: number
  description: string
  suggestion: string
  recommendedFix: string
  canApplyFix: boolean
}

interface AnalysisResult {
  issues: Issue[]
  correctedCode: string
  summary: {
    critical: number
    high: number
    medium: number
    low: number
  }
  categoryCounts: {
    security: number
    performance: number
    quality: number
    style: number
  }
}

export default function CodeAnalysisPage() {
  const [code, setCode] = useState("")
  const [fileName, setFileName] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedTab, setSelectedTab] = useState("all")
  const [showCorrectedCode, setShowCorrectedCode] = useState(false)
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedLanguages = [
    { id: "javascript", name: "JavaScript", color: "bg-yellow-500", extensions: ["js", "jsx"] },
    { id: "typescript", name: "TypeScript", color: "bg-blue-600", extensions: ["ts", "tsx"] },
    { id: "python", name: "Python", color: "bg-blue-500", extensions: ["py", "pyw"] },
    { id: "java", name: "Java", color: "bg-red-500", extensions: ["java"] },
    { id: "cpp", name: "C++", color: "bg-green-500", extensions: ["cpp", "cc", "cxx", "c++"] },
    { id: "c", name: "C", color: "bg-gray-600", extensions: ["c", "h"] },
    { id: "csharp", name: "C#", color: "bg-purple-600", extensions: ["cs"] },
    { id: "php", name: "PHP", color: "bg-purple-500", extensions: ["php"] },
    { id: "ruby", name: "Ruby", color: "bg-red-600", extensions: ["rb"] },
    { id: "go", name: "Go", color: "bg-cyan-500", extensions: ["go"] },
    { id: "rust", name: "Rust", color: "bg-orange-600", extensions: ["rs"] },
    { id: "swift", name: "Swift", color: "bg-orange-500", extensions: ["swift"] },
    { id: "kotlin", name: "Kotlin", color: "bg-purple-700", extensions: ["kt", "kts"] },
    { id: "scala", name: "Scala", color: "bg-red-700", extensions: ["scala"] },
    { id: "dart", name: "Dart", color: "bg-blue-400", extensions: ["dart"] },
    { id: "r", name: "R", color: "bg-blue-700", extensions: ["r", "R"] },
    { id: "matlab", name: "MATLAB", color: "bg-orange-400", extensions: ["m"] },
    { id: "perl", name: "Perl", color: "bg-blue-800", extensions: ["pl", "pm"] },
    { id: "lua", name: "Lua", color: "bg-blue-300", extensions: ["lua"] },
    { id: "shell", name: "Shell", color: "bg-gray-700", extensions: ["sh", "bash"] },
    { id: "powershell", name: "PowerShell", color: "bg-blue-900", extensions: ["ps1"] },
    { id: "sql", name: "SQL", color: "bg-indigo-500", extensions: ["sql"] },
    { id: "html", name: "HTML", color: "bg-orange-300", extensions: ["html", "htm"] },
    { id: "css", name: "CSS", color: "bg-blue-400", extensions: ["css"] },
    { id: "json", name: "JSON", color: "bg-yellow-600", extensions: ["json"] },
    { id: "xml", name: "XML", color: "bg-green-600", extensions: ["xml"] },
    { id: "yaml", name: "YAML", color: "bg-red-400", extensions: ["yml", "yaml"] },
  ]

  const exampleCodes = {
    javascript: `// Buggy JavaScript code with multiple issues
function calculateFactorial(n) {
    if (n = 1) {  // Assignment instead of comparison
        return 1;
    }
    return n * calculateFactorial(n - 1);  // No input validation
}

var result = calculateFactorial(-5);  // Using var, negative input
console.log(result);`,

    python: `# Buggy Python code with performance and security issues
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)  # Exponential time complexity

user_input = input("Enter a number: ")
result = fibonacci(user_input)  # No input validation
print("Result: " + result)  # Type error`,

    java: `// Buggy Java code with multiple issues
public class Calculator {
    public static void main(String[] args) {
        int result = divide(10, 0);  // Division by zero
        System.out.println(result);
    }
    
    public static int divide(int a, int b) {
        return a / b;  // No error handling
    }
}`,
  }

  const detectLanguageFromExtension = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase()
    if (!extension) return "javascript"

    for (const lang of supportedLanguages) {
      if (lang.extensions.includes(extension)) {
        return lang.id
      }
    }
    return "javascript"
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }, [])

  const handleFileUpload = (files: FileList) => {
    const file = files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCode(content)
      setFileName(file.name)

      // Auto-detect language
      const detectedLang = detectLanguageFromExtension(file.name)
      setLanguage(detectedLang)
    }
    reader.readAsText(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
    }
  }

  const loadExampleCode = (lang: string) => {
    const example = exampleCodes[lang as keyof typeof exampleCodes]
    if (example) {
      setCode(example)
      setLanguage(lang)
      setFileName(`example.${supportedLanguages.find((l) => l.id === lang)?.extensions[0] || "txt"}`)
    }
  }

  const analyzeCode = async () => {
    if (!code.trim()) {
      alert("Please enter some code to analyze")
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const result = await response.json()
      setAnalysis(result)
    } catch (error) {
      console.error("Analysis error:", error)
      alert(`Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-gradient-to-r from-red-500 to-red-600"
      case "high":
        return "bg-gradient-to-r from-orange-500 to-orange-600"
      case "medium":
        return "bg-gradient-to-r from-blue-500 to-blue-600"
      case "low":
        return "bg-gradient-to-r from-gray-500 to-gray-600"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "security":
        return <Shield className="h-4 w-4" />
      case "performance":
        return <Zap className="h-4 w-4" />
      case "quality":
        return <CheckCircle className="h-4 w-4" />
      case "style":
        return <Palette className="h-4 w-4" />
      default:
        return <FileCode className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "security":
        return "border-red-500 bg-red-50"
      case "performance":
        return "border-orange-500 bg-orange-50"
      case "quality":
        return "border-blue-500 bg-blue-50"
      case "style":
        return "border-purple-500 bg-purple-50"
      default:
        return "border-gray-500 bg-gray-50"
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStates((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: false }))
    }, 2000)
  }

  const filteredIssues =
    analysis?.issues.filter((issue) => {
      if (selectedTab === "all") return true
      return issue.category === selectedTab
    }) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="h-10 w-10 text-indigo-600" />
              Code Analysis Assistant
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-gray-600 font-medium">Supported Languages:</span>
              {supportedLanguages.slice(0, 6).map((lang) => (
                <Badge
                  key={lang.id}
                  variant="outline"
                  className="text-xs border-2 hover:scale-105 transition-transform"
                >
                  <div className={`w-2 h-2 rounded-full ${lang.color} mr-1`} />
                  {lang.name}
                </Badge>
              ))}
              <Badge
                variant="outline"
                className="text-xs border-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent"
              >
                +{supportedLanguages.length - 6} more
              </Badge>
            </div>
          </div>
          {analysis && (
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="border-2 hover:bg-indigo-50">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCorrectedCode(!showCorrectedCode)}
                className={`border-2 transition-all ${
                  showCorrectedCode
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                }`}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {showCorrectedCode ? "Hide" : "Show"} Auto-Fixed Code
              </Button>
            </div>
          )}
        </div>

        {!analysis ? (
          /* Input Section */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drag & Drop Area */}
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 cursor-pointer ${
                    isDragOver
                      ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 scale-105"
                      : "border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop your code files here</h3>
                  <p className="text-gray-600 mb-4">or click to browse files</p>
                  <p className="text-sm text-gray-500">
                    Supports 25+ languages: .py, .js, .java, .cpp, .cs, .go, .rs, .swift and more
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileInputChange}
                    accept=".py,.js,.jsx,.ts,.tsx,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.dart,.r,.m,.pl,.lua,.sh,.ps1,.sql,.html,.css,.json,.xml,.yml,.yaml"
                  />
                </div>
                {fileName && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Uploaded: {fileName}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Code Input */}
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="text-indigo-800">Or paste code snippet</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadExampleCode("javascript")}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    JS Example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadExampleCode("python")}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    Python Example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadExampleCode("java")}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Java Example
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-3 border-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code here or use example buttons above..."
                    className="w-full h-64 p-3 border-2 rounded-lg font-mono text-sm resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                    Lines: {code.split("\n").length} | Chars: {code.length}
                  </div>
                </div>
                <Button
                  onClick={analyzeCode}
                  disabled={!code.trim() || isAnalyzing}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            {/* Results Header */}
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <CardTitle className="text-green-800">Analysis Complete</CardTitle>
                    {fileName && (
                      <Badge variant="outline" className="ml-2 border-green-300 text-green-700">
                        <File className="h-3 w-3 mr-1" />
                        {fileName}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAnalysis(null)}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    New Analysis
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Original Code with Error Highlighting */}
            <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Code className="h-5 w-5" />📝 Original Code (with errors highlighted)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto border-2 border-gray-700">
                    <div className="font-mono text-sm">
                      {code.split("\n").map((line, index) => {
                        const lineNumber = index + 1
                        const hasError = analysis.issues.some((issue) => issue.line === lineNumber)
                        const lineErrors = analysis.issues.filter((issue) => issue.line === lineNumber)

                        return (
                          <div key={index} className="relative group">
                            <div
                              className={`flex ${
                                hasError
                                  ? "bg-red-900/40 border-l-4 border-red-400 animate-pulse"
                                  : "hover:bg-gray-800/50"
                              }`}
                            >
                              <span className="text-gray-500 select-none w-8 text-right mr-4 flex-shrink-0">
                                {lineNumber}
                              </span>
                              <span className={`flex-1 ${hasError ? "text-red-200 font-medium" : ""}`}>
                                {line || " "}
                              </span>
                              {hasError && (
                                <AlertTriangle className="h-4 w-4 text-red-400 ml-2 flex-shrink-0 animate-bounce" />
                              )}
                            </div>
                            {hasError && (
                              <div className="absolute left-12 top-full z-10 bg-red-800 text-white p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 max-w-md border border-red-600">
                                {lineErrors.map((error, errorIndex) => (
                                  <div key={errorIndex} className="text-xs mb-1">
                                    <span className="font-semibold capitalize text-red-200">{error.severity}:</span>{" "}
                                    {error.title}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auto-Fixed Code Display */}
            {showCorrectedCode && analysis.correctedCode && (
              <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Wand2 className="h-5 w-5" />✨ AI Auto-Fixed Code
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(analysis.correctedCode, "corrected-code")}
                      className={`border-2 transition-all duration-300 ${
                        copiedStates["corrected-code"]
                          ? "bg-green-500 text-white border-green-500"
                          : "border-green-300 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {copiedStates["corrected-code"] ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Fixed Code
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto border-2 border-green-400">
                    <pre className="text-sm">
                      <code>
                        {analysis.correctedCode.split("\n").map((line, index) => (
                          <div key={index} className="flex hover:bg-green-900/20">
                            <span className="text-green-400 select-none w-8 text-right mr-4 flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="flex-1">{line || " "}</span>
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Analysis */}
              <div className="lg:col-span-3 space-y-6">
                {/* Category Tabs */}
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-indigo-100 to-purple-100 p-1 rounded-lg border-2">
                    <TabsTrigger
                      value="all"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                    >
                      All Issues
                      <Badge variant="secondary" className="ml-1 bg-indigo-500 text-white">
                        {analysis.issues.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                    >
                      <Shield className="h-4 w-4" />
                      Security
                      <Badge variant="secondary" className="ml-1 bg-red-500 text-white">
                        {analysis.categoryCounts.security}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="performance"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                    >
                      <Zap className="h-4 w-4" />
                      Performance
                      <Badge variant="secondary" className="ml-1 bg-orange-500 text-white">
                        {analysis.categoryCounts.performance}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="quality"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Quality
                      <Badge variant="secondary" className="ml-1 bg-blue-500 text-white">
                        {analysis.categoryCounts.quality}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="style"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                    >
                      <Palette className="h-4 w-4" />
                      Style
                      <Badge variant="secondary" className="ml-1 bg-purple-500 text-white">
                        {analysis.categoryCounts.style}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={selectedTab} className="space-y-4">
                    {filteredIssues.length === 0 ? (
                      <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
                        <CardContent className="p-6 text-center">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-green-800 mb-2">
                            No {selectedTab === "all" ? "" : selectedTab} issues found! 🎉
                          </h3>
                          <p className="text-green-600">Your code looks excellent in this category.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredIssues.map((issue) => (
                        <Card
                          key={issue.id}
                          className={`border-l-4 ${getCategoryColor(
                            issue.category,
                          )} border-2 hover:shadow-lg transition-all duration-300`}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {getCategoryIcon(issue.category)}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-800">{issue.title}</h3>
                                    <Badge className={`${getSeverityColor(issue.severity)} text-white border-0`}>
                                      {issue.severity}
                                    </Badge>
                                    <Badge variant="outline" className="capitalize border-2">
                                      {issue.category}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1 font-medium">Line {issue.line}</p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-gray-700 leading-relaxed">{issue.description}</p>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Info className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900">💡 AI Suggestion</span>
                              </div>
                              <p className="text-blue-800 text-sm leading-relaxed">{issue.suggestion}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-green-700">🔧 Recommended Fix:</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(issue.recommendedFix, issue.id)}
                                  className={`border-2 transition-all duration-300 ${
                                    copiedStates[issue.id]
                                      ? "bg-green-500 text-white border-green-500"
                                      : "border-green-300 text-green-700 hover:bg-green-100"
                                  }`}
                                >
                                  {copiedStates[issue.id] ? (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-1" />
                                      Copy Code
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto border-2 border-gray-600">
                                <pre className="text-sm">
                                  <code className="text-green-300">{issue.recommendedFix}</code>
                                </pre>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Apply Fix
                              </Button>
                              <Button variant="outline" size="sm" className="border-2 hover:bg-gray-50">
                                <X className="h-4 w-4 mr-1" />
                                Dismiss
                              </Button>
                              <Button variant="outline" size="sm" className="border-2 hover:bg-blue-50">
                                <Info className="h-4 w-4 mr-1" />
                                Learn More
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Analysis Summary Sidebar */}
              <div className="space-y-6">
                <Card className="border-2 bg-gradient-to-br from-indigo-50 to-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-800">
                      <BarChart3 className="h-5 w-5" />📊 Analysis Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm font-medium">Critical Issues</span>
                      </div>
                      <Badge className="bg-red-500 text-white">{analysis.summary.critical}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-sm font-medium">High Priority</span>
                      </div>
                      <Badge className="bg-orange-500 text-white">{analysis.summary.high}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">Medium Priority</span>
                      </div>
                      <Badge className="bg-blue-500 text-white">{analysis.summary.medium}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500" />
                        <span className="text-sm font-medium">Low Priority</span>
                      </div>
                      <Badge className="bg-gray-500 text-white">{analysis.summary.low}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Language Info */}
                <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="text-sm text-green-800">📁 File Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm p-2 rounded bg-white border">
                      <span className="font-medium">Language:</span>
                      <Badge variant="outline" className="border-2">
                        {supportedLanguages.find((l) => l.id === language)?.name}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm p-2 rounded bg-white border">
                      <span className="font-medium">Lines:</span>
                      <span className="font-mono">{code.split("\n").length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm p-2 rounded bg-white border">
                      <span className="font-medium">Characters:</span>
                      <span className="font-mono">{code.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
