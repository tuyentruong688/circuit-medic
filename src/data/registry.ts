import { DESKTOP_MOTHERBOARDS } from './boards/desktopMotherboards';
import { PSU_BOARDS } from './boards/psuBoards';
import { MOTHERBOARD_FAULTS } from './faults/motherboardFaults';
import { PSU_FAULTS } from './faults/psuFaults';
import { POWER_SEQUENCES } from './powerSequences';
import { FaultCase, HardwareBoard, PowerSequenceSpec } from '../types/circuit';

export const ALL_BOARDS: HardwareBoard[] = [
  ...DESKTOP_MOTHERBOARDS,
  ...PSU_BOARDS,
];

export const ALL_FAULTS: FaultCase[] = [
  ...MOTHERBOARD_FAULTS,
  ...PSU_FAULTS,
];

export { POWER_SEQUENCES };

export function getBoardById(boardId: string): HardwareBoard | undefined {
  return ALL_BOARDS.find((b) => b.id === boardId);
}

export function getFaultsForBoard(board: HardwareBoard): FaultCase[] {
  return ALL_FAULTS.filter(
    (f) =>
      f.boardId === board.id ||
      (board.category === 'motherboard' && f.boardId === 'all_motherboards') ||
      (board.category === 'psu' && f.boardId === 'all_psu')
  );
}

export function getPowerSequenceForBoard(board: HardwareBoard): PowerSequenceSpec | undefined {
  if (!board.powerSequenceId) return undefined;
  return POWER_SEQUENCES.find((seq) => seq.id === board.powerSequenceId);
}
