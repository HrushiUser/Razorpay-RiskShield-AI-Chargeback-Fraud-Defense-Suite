'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  ScanLine,
  Copy,
  Check,
  Code2,
  Mail,
  ListChecks,
  Eye,
  Zap,
  Loader2,
  Download,
  AlertCircle,
  XCircle,
  CheckCircle2,
  FileSearch,
} from 'lucide-react';
import { ConfidenceGauge } from '@/components/confidence-gauge';
import { sampleDocuments } from '@/lib/mock-data';
import { analyzeFileContent, type AnalysisResult } from '@/lib/file-analyzer';
import { cn } from '@/lib/utils';

type TabKey = 'letter' | 'payload' | 'validation';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ExtractionView() {
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('letter');
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.apiPayload.body, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setProcessing(true);

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds 10MB limit. Please upload a smaller file.');
      setProcessing(false);
      return;
    }

    try {
      let text = '';

      if (file.type === 'text/plain' || file.type === 'text/csv' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        // Read text files directly
        text = await file.text();
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDFs, attempt to read as text (extracts embedded text if available)
        // In a real app, this would use pdf.js or call the backend OCR endpoint
        try {
          text = await file.text();
          if (!text || text.length < 20) {
            text = `[PDF Binary Content - ${file.name}]\nSize: ${file.size} bytes\nNote: PDF binary parsing requires the backend OCR service. Upload a .txt version for full inline analysis, or use the sample documents below.`;
          }
        } catch {
          text = `[PDF Binary Content - ${file.name}]\nSize: ${file.size} bytes\nNote: PDF binary parsing requires the backend OCR service. Upload a .txt version for full inline analysis.`;
        }
      } else if (file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
        // For images, we can't do real OCR in the browser without a library
        text = `[Image File - ${file.name}]\nSize: ${file.size} bytes\nFormat: ${file.type}\nNote: Image OCR extraction requires the backend Tesseract/Google Vision service. Upload a .txt version for full inline analysis, or use the sample documents below for testing.`;
      } else {
        // Try reading as text fallback
        text = await file.text();
      }

      if (!text || text.trim().length < 10) {
        text = `[Unrecognized Content - ${file.name}]\nSize: ${file.size} bytes\nNo readable text content detected. The file may be a binary format. Please upload a text-based document or use the sample documents.`;
      }

      // Simulate processing delay for visual effect
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const analysis = analyzeFileContent(file.name, file.size, text);
      setResult(analysis);
    } catch (err) {
      setError('Failed to read file. Please try a different file format.');
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSampleSelect = async (sampleIndex: number) => {
    const sample = sampleDocuments[sampleIndex];
    setShowSampleMenu(false);

    // Create a File object from the sample content
    const blob = new Blob([sample.content], { type: 'text/plain' });
    const file = new File([blob], sample.name, { type: 'text/plain' });
    processFile(file);
  };

  const handleDownloadSample = (sampleIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const sample = sampleDocuments[sampleIndex];
    const link = document.createElement('a');
    link.href = `/samples/${sample.name}`;
    link.download = sample.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Document Extraction Suite</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your own dispute documents (PDF, PNG, JPG, TXT) for OCR extraction, AI guardrail analysis, and automated evidence generation
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-5">
          {/* Upload zone - shows when no result and not processing */}
          {!result && !processing && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300',
                dragOver ? 'border-primary bg-primary/5 glow-primary' : 'border-border bg-card/50'
              )}
            >
              <motion.div
                animate={{ y: dragOver ? -4 : 0 }}
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
              >
                <UploadCloud className="h-8 w-8 text-primary" />
              </motion.div>
              <p className="text-sm font-semibold text-foreground">Drop documents here</p>
              <p className="mt-1 text-[11px] text-muted-foreground">PDF, PNG, JPG, TXT up to 10MB</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 glow-primary"
              >
                Select Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="mt-4 flex gap-2">
                <span className="rounded-md bg-secondary/40 px-2 py-1 text-[9px] font-medium text-muted-foreground">PDF</span>
                <span className="rounded-md bg-secondary/40 px-2 py-1 text-[9px] font-medium text-muted-foreground">PNG</span>
                <span className="rounded-md bg-secondary/40 px-2 py-1 text-[9px] font-medium text-muted-foreground">JPG</span>
                <span className="rounded-md bg-secondary/40 px-2 py-1 text-[9px] font-medium text-muted-foreground">TXT</span>
              </div>
            </motion.div>
          )}

          {/* Sample documents button */}
          {!result && !processing && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card/50 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileSearch className="h-4 w-4 text-primary" />
                  <h3 className="text-[13px] font-semibold text-foreground">Sample Documents</h3>
                </div>
                <button
                  onClick={() => setShowSampleMenu(!showSampleMenu)}
                  className="text-[11px] font-medium text-primary hover:text-primary/80"
                >
                  {showSampleMenu ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Test with pre-built documents — successful and unsuccessful cases included. Click any file to analyze it, or download to upload manually.
              </p>
              <div className="mb-3 flex gap-2">
                <a
                  href="/samples/successful_payment_receipt.txt"
                  download
                  className="text-[10px] font-medium text-primary hover:text-primary/80 underline"
                >
                  Download all samples
                </a>
              </div>
              <AnimatePresence>
                {showSampleMenu && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {sampleDocuments.map((doc, i) => (
                      <div
                        key={i}
                        onClick={() => handleSampleSelect(i)}
                        className="group cursor-pointer rounded-lg border border-border/50 bg-secondary/20 p-3 transition-all hover:border-primary/40 hover:bg-secondary/40"
                      >
                        <div className="flex items-start gap-2">
                          {doc.outcome === 'success' && <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />}
                          {doc.outcome === 'flagged' && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />}
                          {doc.outcome === 'failed' && <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] font-mono font-medium text-foreground truncate">{doc.name}</p>
                              <span className={cn(
                                'shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase',
                                doc.outcome === 'success' ? 'bg-success/10 text-success' :
                                doc.outcome === 'flagged' ? 'bg-warning/10 text-warning' :
                                'bg-destructive/10 text-destructive'
                              )}>
                                {doc.outcome === 'success' ? 'Valid' : doc.outcome === 'flagged' ? 'Partial' : 'Invalid'}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{doc.description}</p>
                          </div>
                          <a
                            href={`/samples/${doc.name}`}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                            title="Download file"
                          >
                            <Download className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-4"
            >
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-destructive">Upload Error</p>
                  <p className="text-[11px] text-destructive/80 mt-0.5">{error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-2 text-[11px] font-medium text-destructive underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Processing state */}
          {processing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-xl border border-border bg-card/50 p-8 text-center"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-sm font-semibold text-foreground">Processing document...</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Analyzing uploaded file content</p>
              <div className="mt-3 w-full max-w-xs space-y-2 text-left">
                <ProcessingStep label="OCR text extraction" delay={0} />
                <ProcessingStep label="Field classification (Pydantic)" delay={0.4} />
                <ProcessingStep label="Guardrail evaluation" delay={0.8} />
                <ProcessingStep label="Confidence scoring" delay={1.2} />
              </div>
            </motion.div>
          )}

          {/* Uploaded file summary */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card/50 p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  result.outcome === 'success' ? 'bg-success/10' :
                  result.outcome === 'flagged' ? 'bg-warning/10' :
                  'bg-destructive/10'
                )}>
                  {result.outcome === 'success' && <CheckCircle2 className="h-5 w-5 text-success" />}
                  {result.outcome === 'flagged' && <AlertCircle className="h-5 w-5 text-warning" />}
                  {result.outcome === 'failed' && <XCircle className="h-5 w-5 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate">{result.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(result.fileSize / 1024).toFixed(1)} KB ·{' '}
                    <span className={cn(
                      result.outcome === 'success' ? 'text-success' :
                      result.outcome === 'flagged' ? 'text-warning' :
                      'text-destructive'
                    )}>
                      {result.outcome === 'success' ? 'Analysis Complete' :
                       result.outcome === 'flagged' ? 'Flagged for Review' :
                       'Failed - High Risk'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="w-full rounded-lg border border-border bg-secondary/30 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary/50"
              >
                Upload Another Document
              </button>
            </motion.div>
          )}

          {/* Confidence gauge */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border bg-card/50 p-5"
            >
              <h3 className="mb-3 text-sm font-semibold text-foreground">Confidence Meter</h3>
              <ConfidenceGauge value={result.confidence.overall} size={180} />
              <div className="mt-5 space-y-2.5">
                <ConfidenceBar label="Transaction Match" value={result.confidence.transactionMatch} />
                <ConfidenceBar label="Evidence Strength" value={result.confidence.evidenceStrength} />
                <ConfidenceBar label="Customer History" value={result.confidence.customerHistory} />
                <ConfidenceBar label="Fraud Signals" value={result.confidence.fraudSignals} />
                <ConfidenceBar label="Document Quality" value={result.confidence.documentQuality} />
              </div>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          {/* OCR Extraction Panel */}
          {result && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-border bg-card/50 p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">OCR Extraction Panel</h3>
                  <span className="ml-auto rounded-md bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {result.extracted.boundingBoxes.length} fields detected
                  </span>
                </div>
                <div className="relative rounded-lg border border-border bg-secondary/10 p-4 min-h-[200px]">
                  <div className="absolute inset-0 bg-grid opacity-30 rounded-lg" />
                  <div className="relative space-y-1.5">
                    {result.extracted.boundingBoxes.length > 0 ? (
                      result.extracted.boundingBoxes.map((bb, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.06 }}
                          className="group relative flex items-center gap-3 rounded border border-primary/30 bg-primary/5 px-3 py-1.5"
                          style={{ marginLeft: `${bb.x}%`, maxWidth: `${bb.width + 20}%` }}
                        >
                          <span className="text-[11px] font-mono text-foreground/90">{bb.text}</span>
                          <span className="ml-auto rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                            {bb.field} · {(bb.confidence * 100).toFixed(0)}%
                          </span>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted-foreground py-8 text-center">
                        No structured fields detected in this document
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Raw Extracted Text</p>
                  <pre className="max-h-32 overflow-y-auto rounded-lg bg-secondary/20 p-3 text-[10px] font-mono leading-relaxed text-muted-foreground scrollbar-thin whitespace-pre-wrap">
{result.extracted.rawText}
                  </pre>
                </div>
                {result.guardrailFlags.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Guardrail Flags</p>
                    <div className="flex flex-wrap gap-2">
                      {result.guardrailFlags.map((flag, i) => (
                        <span key={i} className="rounded-md bg-warning/10 px-2.5 py-1 text-[10px] font-medium text-warning">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Evidence Inspector */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-border bg-card/50 p-5"
              >
                <div className="mb-4 flex items-center gap-1 border-b border-border">
                  <TabButton active={activeTab === 'letter'} onClick={() => setActiveTab('letter')} icon={Mail} label="Defense Letter" />
                  <TabButton active={activeTab === 'payload'} onClick={() => setActiveTab('payload')} icon={Code2} label="API Payload" />
                  <TabButton active={activeTab === 'validation'} onClick={() => setActiveTab('validation')} icon={ListChecks} label="Validation Trace" />
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'letter' && (
                    <motion.div
                      key="letter"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="rounded-lg bg-secondary/20 p-4">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To</p>
                        <p className="text-[13px] font-medium text-foreground">{result.defenseLetter.recipient}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">Subject</p>
                        <p className="text-[13px] font-medium text-foreground">{result.defenseLetter.subject}</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Key Points</p>
                        <div className="space-y-1.5">
                          {result.defenseLetter.keyPoints.map((point, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-start gap-2"
                            >
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                              <span className="text-[12px] text-foreground/90">{point}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <pre className="max-h-64 overflow-y-auto rounded-lg bg-secondary/20 p-4 text-[12px] leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans scrollbar-thin">
{result.defenseLetter.body}
                      </pre>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Evidence References</p>
                        <div className="flex flex-wrap gap-2">
                          {result.defenseLetter.evidenceReferences.map((ref, i) => (
                            <span key={i} className="rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
                              {ref}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'payload' && (
                    <motion.div
                      key="payload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between rounded-lg bg-secondary/20 px-4 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{result.apiPayload.method}</span>
                          <span className="text-[11px] font-mono text-foreground/80 truncate">{result.apiPayload.endpoint}</span>
                        </div>
                        <button
                          onClick={handleCopy}
                          className="flex shrink-0 items-center gap-1.5 rounded-md bg-secondary/40 px-2.5 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-secondary/60"
                        >
                          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="rounded-lg bg-secondary/20 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Headers</p>
                        <div className="space-y-1">
                          {Object.entries(result.apiPayload.headers).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[10px] font-mono">
                              <span className="text-muted-foreground">{k}:</span>
                              <span className="text-foreground/80">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Request Body</p>
                        <pre className="max-h-72 overflow-y-auto rounded-lg bg-[#0B1426] p-4 text-[11px] font-mono leading-relaxed text-foreground/80 scrollbar-thin">
{JSON.stringify(result.apiPayload.body, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'validation' && (
                    <motion.div
                      key="validation"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2"
                    >
                      <p className="text-[11px] text-muted-foreground mb-3">
                        Pydantic schema validation audit trace — every field validated against strict type constraints
                      </p>
                      {result.validationTrace.map((trace, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-secondary text-muted-foreground">
                            {trace.step}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-medium text-foreground">{trace.field}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{trace.validator}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{trace.detail}</p>
                            <p className="text-[10px] font-mono text-foreground/60 mt-0.5">value: {trace.value}</p>
                          </div>
                          <span className={cn(
                            'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
                            trace.status === 'passed' ? 'bg-success/10 text-success' :
                            trace.status === 'warning' ? 'bg-warning/10 text-warning' :
                            'bg-destructive/10 text-destructive'
                          )}>
                            {trace.status}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}

          {/* Empty state */}
          {!result && !processing && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 p-8 text-center"
            >
              <Eye className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">Evidence Inspector</p>
              <p className="mt-1 text-[12px] text-muted-foreground/70 max-w-xs">
                Upload a document to generate defense letters, API payloads, and validation traces. Use the sample documents to test different outcomes.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProcessingStep({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-2"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1, delay }}
      >
        <Zap className="h-3 w-3 text-primary" />
      </motion.div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Mail; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-semibold tabular-nums text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            value >= 80 ? 'bg-success' : value >= 60 ? 'bg-warning' : 'bg-destructive'
          )}
        />
      </div>
    </div>
  );
}
