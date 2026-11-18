import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ALL_BOARDS, ALL_FAULTS, POWER_SEQUENCES } from './data/registry';
import { FaultCase, ModuleSharedProps, ViewMode } from './types/circuit';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardHome } from './components/DashboardHome';
import { WorkbenchView } from './components/WorkbenchView';
import { InspectorDrawer } from './components/InspectorDrawer';
import { MultimeterBar } from './components/MultimeterBar';
import { ComponentQuickSearchModal } from './components/ComponentQuickSearchModal';
import { Board3DViewer } from './modules/viewer3d/Board3DViewer';
import { SchematicViewer } from './modules/schematic/SchematicViewer';
import { PhotoBoardViewer } from './modules/boardview/PhotoBoardViewer';
import { BoardScannerModule } from './modules/scanner/BoardScannerModule';
import { DiagnosticsModule } from './modules/diagnostics/DiagnosticsModule';
import { HardwareLibraryModule } from './modules/library/HardwareLibraryModule';

const SHORTCUT_TO_MODE: Record<string, ViewMode> = {
  '1': 'dashboard',
  '2': 'workbench',
  '3': 'scanner',
  '4': 'schematic',
  '5': 'viewer3d',
  '6': 'boardview',
  '7': 'diagnostics',
  '8': 'library',
};

export function App() {
  const [activeMode, setActiveMode] = useState<ViewMode>('dashboard');
  const [selectedBoardId, setSelectedBoardId] = useState<string>(() => ALL_BOARDS[0]?.id ?? '');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedNetId, setSelectedNetId] = useState<string | null>(null);
  const [activeFault, setActiveFault] = useState<FaultCase | null>(null);
  const [thermalMode, setThermalMode] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  const selectedBoard = useMemo(
    () => ALL_BOARDS.find((b) => b.id === selectedBoardId) ?? ALL_BOARDS[0],
    [selectedBoardId]
  );

  const selectedComponent = useMemo(() => {
    if (!selectedBoard || !selectedComponentId) return null;
    return selectedBoard.components.find((c) => c.id === selectedComponentId) ?? null;
  }, [selectedBoard, selectedComponentId]);

  const selectedNet = useMemo(() => {
    if (!selectedBoard || !selectedNetId) return null;
    return selectedBoard.rails.find((r) => r.id === selectedNetId) ?? null;
  }, [selectedBoard, selectedNetId]);

  const handleSelectBoard = useCallback(
    (boardId: string) => {
      const nextBoard = ALL_BOARDS.find((b) => b.id === boardId);
      if (!nextBoard) return;
      setSelectedBoardId(boardId);
      setSelectedComponentId(null);
      setSelectedNetId(null);
      setActiveFault((prev) => {
        if (!prev) return null;
        if (prev.boardId === boardId) return prev;
        if (nextBoard.category === 'motherboard' && prev.boardId === 'all_motherboards') return prev;
        if (nextBoard.category === 'psu' && prev.boardId === 'all_psu') return prev;
        return null;
      });
    },
    []
  );

  const handleSelectComponent = useCallback((componentId: string | null) => {
    setSelectedComponentId(componentId);
  }, []);

  const handleSelectNet = useCallback((netId: string | null) => {
    setSelectedNetId(netId);
  }, []);

  const handleSelectFault = useCallback((fault: FaultCase | null) => {
    setActiveFault(fault);
  }, []);

  const handleToggleThermalMode = useCallback(() => {
    setThermalMode((prev) => !prev);
  }, []);

  const handleNavigateMode = useCallback((mode: ViewMode) => {
    setActiveMode(mode);
  }, []);

  const handleResetSelection = useCallback(() => {
    setSelectedComponentId(null);
    setSelectedNetId(null);
    setActiveFault(null);
    setThermalMode(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
          return;
        }
      }

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const mappedMode = SHORTCUT_TO_MODE[e.key];
        if (mappedMode) {
          setActiveMode(mappedMode);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen]);

  if (!selectedBoard) {
    return (
      <div className="lab-grid-bg flex h-screen items-center justify-center p-6 text-center">
        <div className="lab-panel max-w-md rounded-2xl p-6 space-y-2">
          <h1 className="text-lg font-bold text-rose-300">Chưa có dữ liệu bo mạch</h1>
          <p className="text-xs text-slate-400">
            Vui lòng kiểm tra registry dữ liệu trong src/data/registry.ts.
          </p>
        </div>
      </div>
    );
  }

  const sharedProps: ModuleSharedProps = {
    boards: ALL_BOARDS,
    selectedBoard,
    onSelectBoard: handleSelectBoard,
    selectedComponentId,
    onSelectComponent: handleSelectComponent,
    selectedNetId,
    onSelectNet: handleSelectNet,
    activeFault,
    onSelectFault: handleSelectFault,
    thermalMode,
    onToggleThermalMode: handleToggleThermalMode,
    onNavigateMode: handleNavigateMode,
    faults: ALL_FAULTS,
    powerSequences: POWER_SEQUENCES,
  };

  const showInspector = Boolean(selectedComponent || selectedNet);

  return (
    <div className="lab-grid-bg flex h-screen w-screen overflow-hidden text-slate-100">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeMode={activeMode}
        onSelectMode={handleNavigateMode}
        selectedBoard={selectedBoard}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onResetSelection={handleResetSelection}
        hasSelection={Boolean(selectedComponentId || selectedNetId || activeFault || thermalMode)}
      />

      {/* Main Studio Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          boards={ALL_BOARDS}
          selectedBoard={selectedBoard}
          onSelectBoard={handleSelectBoard}
          selectedNetId={selectedNetId}
          onSelectNet={handleSelectNet}
          thermalMode={thermalMode}
          onToggleThermalMode={handleToggleThermalMode}
          activeFault={activeFault}
          onSelectFault={handleSelectFault}
          activeMode={activeMode}
          onNavigateMode={handleNavigateMode}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Workspace + Slide-out Cross-Probe Inspector */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="relative min-w-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="h-full w-full overflow-hidden"
              >
                {activeMode === 'dashboard' && (
                  <DashboardHome {...sharedProps} onOpenSearch={() => setSearchOpen(true)} />
                )}
                {activeMode === 'workbench' && <WorkbenchView {...sharedProps} />}
                {activeMode === 'scanner' && <BoardScannerModule {...sharedProps} />}
                {activeMode === 'schematic' && <SchematicViewer {...sharedProps} />}
                {activeMode === 'viewer3d' && <Board3DViewer {...sharedProps} />}
                {activeMode === 'boardview' && <PhotoBoardViewer {...sharedProps} />}
                {activeMode === 'diagnostics' && <DiagnosticsModule {...sharedProps} />}
                {activeMode === 'library' && <HardwareLibraryModule {...sharedProps} />}
              </motion.div>
            </AnimatePresence>
          </main>

          {showInspector && (
            <InspectorDrawer
              selectedBoard={selectedBoard}
              selectedComponent={selectedComponent}
              selectedNet={selectedNet}
              activeFault={activeFault}
              faults={ALL_FAULTS}
              thermalMode={thermalMode}
              onSelectComponent={handleSelectComponent}
              onSelectNet={handleSelectNet}
              onSelectFault={handleSelectFault}
              onNavigateMode={handleNavigateMode}
            />
          )}
        </div>

        {/* Bottom Multimeter Quick Bar */}
        <MultimeterBar
          selectedBoard={selectedBoard}
          selectedComponent={selectedComponent}
          selectedNet={selectedNet}
          activeFault={activeFault}
          thermalMode={thermalMode}
          onSelectComponent={handleSelectComponent}
        />
      </div>

      {/* Quick Search Palette */}
      <ComponentQuickSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        selectedBoard={selectedBoard}
        faults={ALL_FAULTS}
        onSelectComponent={(compId) => {
          handleSelectComponent(compId);
          if (activeMode === 'dashboard') {
            handleNavigateMode('workbench');
          }
        }}
        onSelectNet={(netId) => {
          handleSelectNet(netId);
          if (activeMode === 'dashboard') {
            handleNavigateMode('schematic');
          }
        }}
        onSelectFault={(fault) => {
          handleSelectFault(fault);
          handleNavigateMode('diagnostics');
        }}
      />
    </div>
  );
}

export default App;
