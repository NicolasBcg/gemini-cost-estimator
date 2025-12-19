import React, { useState, useRef } from 'react';
import { 
  Calculator, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Zap, 
  Coins, 
  X, 
  Loader2,
  KeyRound,
  Calendar
} from 'lucide-react';

// --- Pricing Constants (Cost per 1 Million Tokens) ---
// Prices based on approximate public pricing for prompts <= 128k context window.
const PRICING = [
  {
    id: 'flash-lite-2.0',
    name: 'Gemini 2.0 Flash-Lite',
    inputCost: 0.1, // $0.01 per 1M input
    outputCost: 0.40, // $0.30 per 1M output
    description: 'Lowest latency & cost',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgGradient: 'from-cyan-500/10 to-blue-500/5'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    inputCost: 0.3, 
    outputCost: 2.5, 
    description: 'Standard fast model',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgGradient: 'from-blue-500/10 to-indigo-500/5'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    inputCost: 2.5, 
    outputCost: 15, 
    description: 'Standard model for complex task',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgGradient: 'from-blue-500/10 to-indigo-500/5'
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro preview',
    inputCost: 4, 
    outputCost: 18, 
    description: 'Newest reasoning',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgGradient: 'from-purple-500/10 to-fuchsia-500/5'
  }
];

// --- Types ---
interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

interface EstimationResult {
  answer: string;
  usage: TokenUsage;
}

interface FileData {
  file: File;
  base64: string;
  mimeType: string;
}

// --- Main Component ---
export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [monthlyRequests, setMonthlyRequests] = useState<number>(10000);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (Client-side limit for Base64 usually around 20MB is safe for browser memory)
    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large for browser estimation (Max 20MB).");
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove Data URL prefix (e.g., "data:image/png;base64,")
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setFileData({
        file,
        base64,
        mimeType: file.type,
      });
      setError(null);
    } catch (err) {
      setError("Failed to process file.");
    }
  };

  const clearFile = () => {
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const calculateCost = (tokens: number, ratePerMillion: number) => {
    return (tokens / 1_000_000) * ratePerMillion;
  };

  const runEstimation = async () => {
    if (!apiKey) {
      setError("Please enter your Gemini API Key.");
      return;
    }
    if (!prompt && !fileData) {
      setError("Please provide a text prompt or upload a file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // UPDATED: Using Gemini 2.0 Flash-Lite Preview
      const MODEL_NAME = "gemini-2.5-flash";
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

      const contentsPart = [];
      
      if (prompt) {
        contentsPart.push({ text: prompt });
      }

      if (fileData) {
        contentsPart.push({
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.base64
          }
        });
      }

      const payload = {
        contents: [{ parts: contentsPart }]
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch from Gemini API");
      }

      // Extract Data
      const usageMetadata = data.usageMetadata;
      const answerText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No text response generated.";

      setResult({
        answer: answerText,
        usage: {
          promptTokens: usageMetadata?.promptTokenCount || 0,
          candidatesTokens: usageMetadata?.candidatesTokenCount || 0,
          totalTokens: usageMetadata?.totalTokenCount || 0
        }
      });

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 flex flex-col">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full px-6 py-6 flex-1 flex flex-col">
        
        {/* Header */}
        <header className="mb-8 flex items-center justify-between border-b border-slate-800/50 pb-6">
          <div>
            <div className="inline-flex items-center gap-3 mb-2 bg-slate-900/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-800 shadow-lg">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-300">Gemini Token Estimator</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Measure cost before you scale.
            </h1>
          </div>
          <p className="text-slate-500 text-sm hidden md:block max-w-md text-right">
             Simulating on <span className="text-cyan-400 font-semibold">Gemini 2.0 Flash-Lite</span> for accurate token usage & projections.
          </p>
        </header>

        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
          
          {/* COLUMN 1: Prompt Only - 25% */}
          <div className="lg:col-span-1 flex flex-col gap-6">
             <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4 flex-1">
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    System / User Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Analyze this invoice and extract the total amount..."
                    className="w-full flex-1 min-h-[250px] bg-slate-950/50 border border-slate-700/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder:text-slate-600 resize-none"
                  />
                </div>
             </div>
          </div>

          {/* COLUMN 2: Config, Doc & Run - 25% */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Config & Inputs Card */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
               {/* API Key */}
               <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    Google API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste Key..."
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
                    />
                    <button 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-3 text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-wider font-semibold"
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                  </div>
               </div>

               {/* Monthly Requests */}
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Monthly Requests
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={monthlyRequests}
                    onChange={(e) => setMonthlyRequests(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-slate-600 font-mono"
                  />
               </div>

               {/* Document Upload (Moved Here) */}
               <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-purple-400" />
                    Document (Optional)
                  </label>
                  {!fileData ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group cursor-pointer border-2 border-dashed border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/30 rounded-lg p-6 flex flex-col items-center justify-center transition-all"
                    >
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 mb-2" />
                      <p className="text-xs text-slate-400 text-center">Upload PDF/Image</p>
                    </div>
                  ) : (
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-cyan-900/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{fileData.file.name}</p>
                          <p className="text-[10px] text-slate-500">{(fileData.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button 
                        onClick={clearFile}
                        className="p-1.5 rounded-full hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
            </div>

            {/* Run Button Card */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <button
                onClick={runEstimation}
                disabled={loading}
                className={`w-full py-4 rounded-lg font-semibold text-white shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all
                  ${loading 
                    ? 'bg-slate-700 cursor-not-allowed opacity-75' 
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/20 active:scale-[0.98]'
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Estimating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-white/20" />
                    Run Estimation
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: Results - 50% */}
          <div className="lg:col-span-2 space-y-6">
            
            {result ? (
              <>
                {/* 1. Token Stats Card */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Input Tokens</span>
                    <span className="text-2xl font-bold text-slate-200">{result.usage.promptTokens.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Output Tokens</span>
                    <span className="text-2xl font-bold text-cyan-400">{result.usage.candidatesTokens.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-2 relative z-10">Total Tokens</span>
                    <span className="text-2xl font-bold text-white relative z-10">{result.usage.totalTokens.toLocaleString()}</span>
                  </div>
                </div>

                {/* 2. Cost Comparison Table */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <h3 className="font-semibold text-slate-200 flex items-center gap-2 text-sm">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      Cost Analysis
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {PRICING.map((model) => {
                      const inputCost = calculateCost(result.usage.promptTokens, model.inputCost);
                      const outputCost = calculateCost(result.usage.candidatesTokens, model.outputCost);
                      const total = inputCost + outputCost;
                      const monthlyTotal = total * monthlyRequests;

                      return (
                        <div key={model.id} className={`p-4 flex items-center justify-between bg-gradient-to-r ${model.bgGradient}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full border ${model.borderColor} flex items-center justify-center bg-slate-950/30`}>
                              <Cpu className={`w-4 h-4 ${model.color}`} />
                            </div>
                            <div>
                              <div className="font-medium text-slate-200 text-sm">{model.name}</div>
                              <div className="text-[10px] text-slate-500">{model.description}</div>
                            </div>
                          </div>
                          
                          <div className="text-right flex items-center gap-6">
                            <div className="flex flex-col items-end">
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Per Req</div>
                              <div className="text-sm font-bold text-slate-200 font-mono">${total.toFixed(5)}</div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                I: ${inputCost.toFixed(5)} O: ${outputCost.toFixed(5)}
                              </div>
                            </div>
                            <div className="pl-6 border-l border-slate-700/50 flex flex-col items-end min-w-[100px]">
                              <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-0.5">Monthly</div>
                              <div className="text-sm font-bold text-emerald-400 font-mono">${monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Model Response */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex-1">
                   <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-green-400" />
                     Gemini Response
                   </h3>
                   <div className="bg-slate-950/50 rounded-lg p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono border border-slate-800/50 h-[300px] overflow-y-auto custom-scrollbar">
                     {result.answer}
                   </div>
                </div>
              </>
            ) : (
              // Empty State / Placeholder
              <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-3xl opacity-50 min-h-[500px]">
                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                  <Calculator className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-400 mb-2">Ready to Estimate</h3>
                <p className="text-slate-600 text-center max-w-sm">
                  Enter your inputs in Column 1, Configure settings in Column 2, and see your detailed cost breakdown here.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.5); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.8); 
        }
      `}</style>
    </div>
  );
}