import * as THREE from 'three';
import { BoardComponent, ComponentKind, FaultCase } from '../../types/circuit';

const FLIR_STOPS: Array<{ t: number; color: THREE.Color }> = [
  { t: 0.0, color: new THREE.Color('#0a0b3c') },
  { t: 0.22, color: new THREE.Color('#420a7e') },
  { t: 0.44, color: new THREE.Color('#a61b66') },
  { t: 0.66, color: new THREE.Color('#ef5612') },
  { t: 0.85, color: new THREE.Color('#ffbe1f') },
  { t: 1.0, color: new THREE.Color('#fffee6') },
];

const DEFAULT_NORMAL_TEMP_BY_KIND: Record<ComponentKind, number> = {
  cpu_socket: 44,
  chipset: 48,
  mosfet: 52,
  drmos: 54,
  pwm_ic: 45,
  inductor: 47,
  capacitor_solid: 36,
  capacitor_elec: 38,
  resistor: 35,
  diode: 46,
  fuse: 30,
  bios_chip: 33,
  super_io: 38,
  ram_slot: 35,
  pcie_slot: 34,
  atx_24pin: 33,
  eps_8pin: 36,
  transformer: 50,
  optocoupler: 36,
  tl431: 35,
  bridge_rectifier: 56,
  heatsink: 49,
  connector: 32,
  ic: 40,
};

/**
 * Computes the simulated operating temperature (°C) for a component,
 * factoring in whether an active fault targets this component or its power rails.
 */
export function getComponentTemperature(
  comp: BoardComponent,
  activeFault: FaultCase | null,
  railIdToName?: Map<string, string>
): { tempC: number; isHotspot: boolean } {
  const baseNormal = comp.normalTempC ?? DEFAULT_NORMAL_TEMP_BY_KIND[comp.kind] ?? 38;
  if (!activeFault) {
    return { tempC: baseNormal, isHotspot: false };
  }

  const isDirectSuspect = activeFault.suspectComponentIds.includes(comp.id);
  if (isDirectSuspect) {
    const faultTemp = comp.faultTempC ?? Math.max(baseNormal + 48, 96);
    return { tempC: faultTemp, isHotspot: true };
  }

  const sharesFaultRail = comp.pins.some((pin) => {
    const railName = railIdToName?.get(pin.net);
    return (
      activeFault.affectedRails.includes(pin.net) ||
      (railName !== undefined && activeFault.affectedRails.includes(railName))
    );
  });
  if (sharesFaultRail) {
    const elevated = comp.faultTempC
      ? baseNormal + (comp.faultTempC - baseNormal) * 0.45
      : baseNormal + 18;
    return { tempC: Math.round(elevated), isHotspot: elevated >= 72 };
  }

  return { tempC: baseNormal, isHotspot: false };
}

/**
 * Maps a temperature in °C (24..115+) to a FLIR Ironbow infrared color.
 */
export function tempToFlirColor(
  tempC: number,
  outColor: THREE.Color = new THREE.Color(),
  minTemp = 24,
  maxTemp = 115
): THREE.Color {
  const t = THREE.MathUtils.clamp((tempC - minTemp) / (maxTemp - minTemp), 0, 1);
  for (let i = 0; i < FLIR_STOPS.length - 1; i++) {
    const a = FLIR_STOPS[i];
    const b = FLIR_STOPS[i + 1];
    if (t >= a.t && t <= b.t) {
      const localT = (t - a.t) / (b.t - a.t);
      outColor.copy(a.color).lerp(b.color, localT);
      return outColor;
    }
  }
  return outColor.copy(FLIR_STOPS[FLIR_STOPS.length - 1].color);
}

/**
 * Returns a CSS hex string for HUD temperature badges.
 */
export function tempToCssColor(tempC: number): string {
  const c = tempToFlirColor(tempC);
  return `#${c.getHexString()}`;
}
