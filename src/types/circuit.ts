export type DeviceCategory = 'motherboard' | 'psu' | 'gpu' | 'sbc_mcu';
export type ViewMode = 'dashboard' | 'scanner' | 'schematic' | 'viewer3d' | 'boardview' | 'workbench' | 'diagnostics' | 'library';
export type UiTheme = 'slate' | 'light';

export type SchematicStatus =
  | 'official_full'
  | 'official_partial'
  | 'public_reference'
  | 'block_reference'
  | 'unavailable';

export interface BoardRealPhoto {
  imageUrl: string;
  sourceLabel: string;
  sourceUrl: string;
  license: string;
  author?: string;
  viewNote: string;
}

export interface BoardDocumentationMeta {
  schematicStatus: SchematicStatus;
  schematicSourceLabel: string;
  schematicSourceUrl?: string;
  missingDataNote?: string;
}

export type ComponentKind =
  | 'cpu_socket' | 'chipset' | 'mosfet' | 'drmos' | 'pwm_ic' | 'inductor'
  | 'capacitor_solid' | 'capacitor_elec' | 'resistor' | 'diode' | 'fuse'
  | 'bios_chip' | 'super_io' | 'ram_slot' | 'pcie_slot' | 'atx_24pin' | 'eps_8pin'
  | 'transformer' | 'optocoupler' | 'tl431' | 'bridge_rectifier' | 'heatsink' | 'connector' | 'ic';

export interface PinMeasurement {
  pin: string;
  name: string;
  net: string;
  expectedVoltage: string;
  expectedDiodeDrop: string;
  expectedResistance?: string;
  waveformHint?: string;
}

export interface BoardComponent {
  id: string;
  label: string;
  kind: ComponentKind;
  zone: string;
  description: string;
  partNumber?: string;
  specs?: string;
  pos3d: { x: number; y: number; z: number; w: number; d: number; h: number; rotationY?: number; color?: string };
  pos2d: { x: number; y: number; w: number; h: number };
  photoPos?: { x: number; y: number; w: number; h: number };
  photoNote?: string;
  schematicPos: { x: number; y: number };
  pins: PinMeasurement[];
  commonFailureModes: string[];
  replacementTips?: string;
  normalTempC?: number;
  faultTempC?: number;
}

export interface PowerRailNet {
  id: string;
  name: string;
  nominalVoltage: string;
  category: 'standby' | 'main_power' | 'core_power' | 'control_signal' | 'ground' | 'high_voltage';
  color: string;
  description: string;
  connectedComponents: string[];
}

export interface SchematicWire {
  id: string;
  netId: string;
  fromComponentId: string;
  fromPin?: string;
  toComponentId: string;
  toPin?: string;
  waypoints?: Array<{ x: number; y: number }>;
}

export interface BoardZone {
  id: string;
  name: string;
  description: string;
  color: string;
  bounds2d: { x: number; y: number; w: number; h: number };
  photoBounds?: { x: number; y: number; w: number; h: number };
}

export interface HardwareBoard {
  id: string;
  name: string;
  brand: string;
  category: DeviceCategory;
  generation: string;
  formFactor: string;
  pcbColor: string;
  pcbSize: { width: number; depth: number; thickness: number };
  summary: string;
  safetyWarning?: string;
  realPhoto?: BoardRealPhoto;
  docsMeta?: BoardDocumentationMeta;
  supports3DSimulation?: boolean;
  zones: BoardZone[];
  rails: PowerRailNet[];
  components: BoardComponent[];
  wires: SchematicWire[];
  powerSequenceId?: string;
}

export interface DiagnosticStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  targetComponentId?: string;
  targetNetId?: string;
  measureMode: 'voltage' | 'diode' | 'resistance' | 'visual' | 'oscilloscope';
  expectedValue: string;
  passNextStepId?: string | 'resolved';
  failDiagnosis: string;
  failSuspectComponents: string[];
  repairAction: string;
}

export interface FaultCase {
  id: string;
  boardId: string | 'all_motherboards' | 'all_psu' | 'all_gpu' | 'all_sbc_mcu';
  category: DeviceCategory;
  brandTag: string;
  title: string;
  symptom: string;
  postCode?: string;
  severity: 'low' | 'medium' | 'high' | 'critical_hv';
  affectedZones: string[];
  suspectComponentIds: string[];
  affectedRails: string[];
  rootCauses: string[];
  quickFixSummary: string;
  steps: DiagnosticStep[];
}

export interface PowerSequenceStage {
  order: number;
  signalName: string;
  source: string;
  destination: string;
  voltage: string;
  delayMs: string;
  description: string;
  failureSymptom: string;
}

export interface PowerSequenceSpec {
  id: string;
  title: string;
  category: DeviceCategory;
  platform: string;
  stages: PowerSequenceStage[];
}

export interface ModuleSharedProps {
  boards: HardwareBoard[];
  selectedBoard: HardwareBoard;
  onSelectBoard: (boardId: string) => void;
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string | null) => void;
  selectedNetId: string | null;
  onSelectNet: (netId: string | null) => void;
  activeFault: FaultCase | null;
  onSelectFault: (fault: FaultCase | null) => void;
  thermalMode: boolean;
  onToggleThermalMode: () => void;
  onNavigateMode: (mode: ViewMode) => void;
  faults: FaultCase[];
  powerSequences: PowerSequenceSpec[];
  uiTheme?: UiTheme;
  onToggleUiTheme?: () => void;
  embedded?: boolean;
}
