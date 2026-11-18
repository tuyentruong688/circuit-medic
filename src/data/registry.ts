import { DESKTOP_MOTHERBOARDS } from './boards/desktopMotherboards';
import { EMBEDDED_AND_GPU_BOARDS } from './boards/embeddedAndGpuBoards';
import { PSU_BOARDS } from './boards/psuBoards';
import { EMBEDDED_AND_GPU_FAULTS } from './faults/embeddedAndGpuFaults';
import { MOTHERBOARD_FAULTS } from './faults/motherboardFaults';
import { PSU_FAULTS } from './faults/psuFaults';
import { POWER_SEQUENCES } from './powerSequences';
import { FaultCase, HardwareBoard, PowerSequenceSpec } from '../types/circuit';

export const ALL_BOARDS: HardwareBoard[] = [
  ...EMBEDDED_AND_GPU_BOARDS,
  ...DESKTOP_MOTHERBOARDS,
  ...PSU_BOARDS,
];

export const ALL_FAULTS: FaultCase[] = [
  ...EMBEDDED_AND_GPU_FAULTS,
  ...MOTHERBOARD_FAULTS,
  ...PSU_FAULTS,
];

export { POWER_SEQUENCES };

export function getBoardById(boardId: string): HardwareBoard | undefined {
  return ALL_BOARDS.find((b) => b.id === boardId);
}

export function isFaultForBoard(fault: FaultCase, board: HardwareBoard): boolean {
  return (
    fault.boardId === board.id ||
    (board.category === 'motherboard' && fault.boardId === 'all_motherboards') ||
    (board.category === 'psu' && fault.boardId === 'all_psu') ||
    (board.category === 'gpu' && fault.boardId === 'all_gpu') ||
    (board.category === 'sbc_mcu' && fault.boardId === 'all_sbc_mcu')
  );
}

export function getFaultsForBoard(board: HardwareBoard): FaultCase[] {
  return ALL_FAULTS.filter((f) => isFaultForBoard(f, board));
}

export function getPowerSequenceForBoard(board: HardwareBoard): PowerSequenceSpec | undefined {
  if (!board.powerSequenceId) return undefined;
  return POWER_SEQUENCES.find((seq) => seq.id === board.powerSequenceId);
}
