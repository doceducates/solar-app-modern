import { CircuitElement, Position, Dimensions, Terminal, ElectricalProperties } from './types';

export abstract class BaseCircuitElement implements CircuitElement {
  public id: string;
  public abstract type: string;
  public position: Position;
  public dimensions: Dimensions;
  public terminals: Terminal[];
  public selected: boolean;
  public rotation: number;
  public properties: ElectricalProperties;

  constructor(
    id: string,
    position: Position,
    dimensions: Dimensions,
    terminals: Terminal[] = [],
    properties: ElectricalProperties = {}
  ) {
    this.id = id;
    this.position = position;
    this.dimensions = dimensions;
    this.terminals = terminals;
    this.selected = false;
    this.rotation = 0;
    this.properties = properties;
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract clone(): CircuitElement;

  getTerminalPosition(terminalId: string): Position {
    const terminal = this.terminals.find(t => t.id === terminalId);
    if (!terminal) {
      throw new Error(`Terminal ${terminalId} not found`);
    }

    // Calculate absolute position considering rotation
    const cos = Math.cos((this.rotation * Math.PI) / 180);
    const sin = Math.sin((this.rotation * Math.PI) / 180);
    
    const relativeX = terminal.position.x;
    const relativeY = terminal.position.y;
    
    return {
      x: this.position.x + (relativeX * cos - relativeY * sin),
      y: this.position.y + (relativeX * sin + relativeY * cos)
    };
  }

  isPointInside(point: Position): boolean {
    return (
      point.x >= this.position.x &&
      point.x <= this.position.x + this.dimensions.width &&
      point.y >= this.position.y &&
      point.y <= this.position.y + this.dimensions.height
    );
  }

  drawTerminals(ctx: CanvasRenderingContext2D): void {
    this.terminals.forEach(terminal => {
      const terminalPos = this.getTerminalPosition(terminal.id);
      
      // Draw terminal circle
      ctx.fillStyle = terminal.color;
      ctx.beginPath();
      ctx.arc(terminalPos.x, terminalPos.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw terminal border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw label if exists
      if (terminal.label) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(terminal.label, terminalPos.x, terminalPos.y + 2);
      }
    });
  }

  drawSelectionHighlight(ctx: CanvasRenderingContext2D): void {
    if (this.selected) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        this.position.x - 5,
        this.position.y - 5,
        this.dimensions.width + 10,
        this.dimensions.height + 10
      );
      ctx.setLineDash([]);
    }
  }
}
