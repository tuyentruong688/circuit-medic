import * as THREE from 'three';

/**
 * Tracks all GPU resources allocated for a 3D board scene so switching boards
 * or unmounting releases WebGL memory cleanly with zero leaks.
 */
export class ResourceTracker {
  private geometries = new Set<THREE.BufferGeometry>();
  private materials = new Set<THREE.Material>();
  private textures = new Set<THREE.Texture>();

  trackGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
    this.geometries.add(geometry);
    return geometry;
  }

  trackMaterial<T extends THREE.Material>(material: T): T {
    this.materials.add(material);
    return material;
  }

  trackTexture<T extends THREE.Texture>(texture: T): T {
    this.textures.add(texture);
    return texture;
  }

  disposeAll(): void {
    this.textures.forEach((tex) => tex.dispose());
    this.materials.forEach((mat) => mat.dispose());
    this.geometries.forEach((geo) => geo.dispose());
    this.textures.clear();
    this.materials.clear();
    this.geometries.clear();
  }
}
