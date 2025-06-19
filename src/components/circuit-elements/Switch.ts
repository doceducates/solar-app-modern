import { BaseCircuitElement } from './BaseCircuitElement';
import { Position, Dimensions, Terminal, ElectricalProperties, CircuitElement } from './types';

export interface SwitchProperties extends ElectricalProperties {
  isOpen: boolean;
  maxVoltage: number;
  maxCurrent: number;
  switchType: 'manual' | 'automatic' | 'breaker' | 'relay';
}

export class Switch extends BaseCircuitElement {
  public type = 'switch';
  declare public properties: SwitchProperties;

  constructor(
    id: string,
    position: Position,
    switchType: SwitchProperties['switchType'] = 'manual',
    isOpen: boolean = false
  ) {
    const dimensions: Dimensions = { width: 60, height: 30 };
    
    const terminals: Terminal[] = [
      {
        id: 'input',
        type: 'input',
        position: { x: 8, y: dimensions.height / 2 },
        color: '#6b7280',
        label: 'IN'
      },
      {
        id: 'output',
        type: 'output',
        position: { x: dimensions.width - 8, y: dimensions.height / 2 },
        color: '#6b7280',
        label: 'OUT'
      }
    ];

    const properties: SwitchProperties = {
      isOpen,
      maxVoltage: 1000,
      maxCurrent: 50,
      switchType,
      resistance: isOpen ? Infinity : 0.001 // Very low resistance when closed
    };

    super(id, position, dimensions, terminals, properties);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.position;
    const { width, height } = this.dimensions;

    ctx.save();
    
    // Apply rotation if needed
    if (this.rotation !== 0) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Switch body
    ctx.fillStyle = this.selected ? '#f3f4f6' : '#e5e7eb';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = this.selected ? '#3b82f6' : '#6b7280';
    ctx.lineWidth = this.selected ? 3 : 2;
    ctx.strokeRect(x, y, width, height);

    // Switch contacts
    const contactY = y + height / 2;
    const leftContactX = x + 15;
    const rightContactX = x + width - 15;

    // Left contact (fixed)
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(leftContactX, contactY, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Right contact (fixed)
    ctx.beginPath();
    ctx.arc(rightContactX, contactY, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Switch blade
    ctx.strokeStyle = this.properties.isOpen ? '#ef4444' : '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftContactX, contactY);
    
    if (this.properties.isOpen) {
      // Open position - angled up
      ctx.lineTo(rightContactX - 8, contactY - 8);
    } else {
      // Closed position - straight across
      ctx.lineTo(rightContactX, contactY);
    }
    ctx.stroke();

    // Switch type indicator
    ctx.fillStyle = '#374151';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    
    let typeSymbol = '';
    switch (this.properties.switchType) {
      case 'manual':
        typeSymbol = 'M';
        break;
      case 'automatic':
        typeSymbol = 'A';
        break;
      case 'breaker':
        typeSymbol = 'B';
        break;
      case 'relay':
        typeSymbol = 'R';
        break;
    }
    
    ctx.fillText(typeSymbol, x + width / 2, y + height - 4);

    // Status indicator
    ctx.fillStyle = this.properties.isOpen ? '#ef4444' : '#22c55e';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText(this.properties.isOpen ? 'OPEN' : 'CLOSED', x + width / 2, y + 10);

    // Current indicator if carrying current
    if (this.properties.current && this.properties.current > 0 && !this.properties.isOpen) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '7px sans-serif';
      ctx.fillText(`${this.properties.current.toFixed(1)}A`, x + width / 2, y + height + 10);
    }

    // Draw terminals
    this.drawTerminals(ctx);

    // Draw selection highlight
    this.drawSelectionHighlight(ctx);

    ctx.restore();
  }

  toggle(): void {
    this.properties.isOpen = !this.properties.isOpen;
    this.properties.resistance = this.properties.isOpen ? Infinity : 0.001;
  }

  open(): void {
    this.properties.isOpen = true;
    this.properties.resistance = Infinity;
  }

  close(): void {
    this.properties.isOpen = false;
    this.properties.resistance = 0.001;
  }

  canCarryCurrent(voltage: number, current: number): boolean {
    return !this.properties.isOpen && 
           voltage <= this.properties.maxVoltage && 
           current <= this.properties.maxCurrent;
  }

  clone(): CircuitElement {
    const cloned = new Switch(
      `${this.id}-copy`,
      { ...this.position },
      this.properties.switchType,
      this.properties.isOpen
    );
    cloned.rotation = this.rotation;
    return cloned;
  }

  getInfo(): string {
    return `Switch: ${this.properties.switchType}\n` +
           `State: ${this.properties.isOpen ? 'OPEN' : 'CLOSED'}\n` +
           `Max Voltage: ${this.properties.maxVoltage}V\n` +
           `Max Current: ${this.properties.maxCurrent}A\n` +
           `Resistance: ${this.properties.isOpen ? '∞' : this.properties.resistance}Ω`;
  }
}
