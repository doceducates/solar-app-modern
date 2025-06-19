// Base types for circuit elements

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Terminal {
  id: string;
  type: 'positive' | 'negative' | 'input' | 'output' | 'neutral';
  position: Position; // Relative to element position
  color: string;
  label?: string;
}

export interface CircuitElementProps {
  id: string;
  position: Position;
  dimensions: Dimensions;
  selected: boolean;
  rotation: number; // In degrees
  terminals: Terminal[];
  onTerminalClick?: (terminalId: string, elementId: string) => void;
  onElementClick?: (elementId: string) => void;
  onElementDrag?: (elementId: string, newPosition: Position) => void;
}

export interface ElectricalProperties {
  voltage?: number;
  current?: number;
  power?: number;
  resistance?: number;
  efficiency?: number;
}

export abstract class CircuitElement {
  abstract id: string;
  abstract type: string;
  abstract position: Position;
  abstract dimensions: Dimensions;
  abstract terminals: Terminal[];
  abstract selected: boolean;
  abstract rotation: number;
  abstract properties: ElectricalProperties;

  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract getTerminalPosition(terminalId: string): Position;
  abstract isPointInside(point: Position): boolean;
  abstract clone(): CircuitElement;
}

export interface Connection {
  id: string;
  fromElementId: string;
  fromTerminalId: string;
  toElementId: string;
  toTerminalId: string;
  type: 'wire';
  path?: Position[];
}

export interface CircuitElementData {
  id: string;
  type: string;
  position: Position;
  rotation: number;
  properties: ElectricalProperties;
  customData?: Record<string, unknown>;
}
