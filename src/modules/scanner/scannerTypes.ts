import type { DeviceCategory, FaultCase, HardwareBoard } from '../../types/circuit';

export type ScanInputMode = 'upload' | 'camera' | 'preset';
export type ScanEngineMode = 'local' | 'gemini';

export interface BoxRect {
  /** Percentage 0..100 from left */
  x: number;
  /** Percentage 0..100 from top */
  y: number;
  /** Percentage 0..100 width */
  w: number;
  /** Percentage 0..100 height */
  h: number;
}

export interface DetectedZoneBox {
  id: string;
  name: string;
  description: string;
  color: string;
  confidence: number;
  box: BoxRect;
  mappedZoneId?: string;
}

export interface DetectedAnomaly {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
  description: string;
  recommendedCheck: string;
  componentHint?: string;
  box: BoxRect;
}

export interface HistogramProfile {
  width: number;
  height: number;
  aspectRatio: number;
  dominantPcbColor: 'green' | 'matte_black' | 'blue' | 'brown' | 'unknown';
  dominantPcbLabel: string;
  pcbHexEstimate: string;
  greenRatio: number;
  blackRatio: number;
  blueRatio: number;
  brownRatio: number;
  copperGoldRatio: number;
  metallicRatio: number;
  yellowTransformerRatio: number;
  charredSootRatio: number;
  corrosionRatio: number;
  edgeDensity: number;
}

export interface BoardMatchCandidate {
  board: HardwareBoard;
  score: number;
  reason: string;
}

export interface ScanAnalysisResult {
  engineUsed: ScanEngineMode;
  fallbackNotice?: string;
  timestamp: string;
  detectedCategory: DeviceCategory;
  categoryLabel: string;
  confidence: number;
  brandGuess: string;
  modelGuess: string;
  safetyWarning?: string;
  summaryVi: string;
  histogram: HistogramProfile;
  matchedBoards: BoardMatchCandidate[];
  primaryBoard: HardwareBoard;
  detectedZones: DetectedZoneBox[];
  anomalies: DetectedAnomaly[];
  visibleComponents: string[];
  recommendedTestPoints: string[];
  suggestedFaults: FaultCase[];
}

export interface ScanPreset {
  id: string;
  title: string;
  subtitle: string;
  category: DeviceCategory;
  targetBoardId: string;
  targetFaultHint: string;
  defectTag: string;
  severityBadge: 'critical' | 'warning' | 'info';
  defaultHintText: string;
  /** Lazily generated realistic canvas data URL */
  generateImage: () => string;
}

export interface GeminiVisionJsonResponse {
  boardCategory?: 'motherboard' | 'psu';
  brandGuess?: string;
  modelGuess?: string;
  confidence?: number;
  pcbColor?: string;
  safetyWarning?: string;
  summaryVi?: string;
  visibleComponents?: string[];
  detectedZones?: Array<{
    name: string;
    description: string;
    confidence?: number;
    box?: { x: number; y: number; w: number; h: number };
  }>;
  suspectedAnomalies?: Array<{
    title: string;
    severity?: 'info' | 'warning' | 'critical';
    confidence?: number;
    description: string;
    recommendedCheck?: string;
    componentHint?: string;
    box?: { x: number; y: number; w: number; h: number };
  }>;
  recommendedTestPoints?: string[];
}
