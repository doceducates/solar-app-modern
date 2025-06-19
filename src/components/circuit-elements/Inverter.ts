import { BaseCircuitElement } from './BaseCircuitElement';
import { Position, Dimensions, Terminal, ElectricalProperties, CircuitElement } from './types';

export interface InverterProperties extends ElectricalProperties {
  maxInputVoltage: number;
  minInputVoltage: number;
  maxInputCurrent: number;
  outputVoltage: number; // AC voltage (RMS)
  outputFrequency: number; // Hz
  efficiency: number; // 0-1
  maxPower: number;
  type: 'string' | 'central' | 'micro' | 'power-optimizer';
}

export class Inverter extends BaseCircuitElement {
  public type = 'inverter';
  declare public properties: InverterProperties;

  constructor(
    id: string,
    position: Position,
    inverterType: InverterProperties['type'] = 'string',
    maxPower: number = 5000
  ) {
    const dimensions: Dimensions = { width: 100, height: 60 };
    
    const terminals: Terminal[] = [
      {
        id: 'dc-positive',
        type: 'positive',
        position: { x: 10, y: dimensions.height / 2 - 8 },
        color: '#dc2626',
        label: 'DC+'
      },
      {
        id: 'dc-negative',
        type: 'negative',
        position: { x: 10, y: dimensions.height / 2 + 8 },
        color: '#000000',
        label: 'DC-'
      },
      {
        id: 'ac-output',
        type: 'output',
        position: { x: dimensions.width - 10, y: dimensions.height / 2 },
        color: '#2563eb',
        label: 'AC'
      }
    ];

    const properties: InverterProperties = {
      maxInputVoltage: 600,
      minInputVoltage: 80,
      maxInputCurrent: 15,
      outputVoltage: 230,
      outputFrequency: 50,
      efficiency: 0.96,
      maxPower,
      type: inverterType,
      power: 0,
      voltage: 0,
      current: 0
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

    // Inverter body
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, this.selected ? '#e0f2fe' : '#0891b2');
    gradient.addColorStop(1, this.selected ? '#bae6fd' : '#0e7490');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = this.selected ? '#0284c7' : '#164e63';
    ctx.lineWidth = this.selected ? 3 : 2;
    ctx.strokeRect(x, y, width, height);

    // Inverter symbol - sine wave
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const waveStartX = x + 20;
    const waveEndX = x + width - 20;
    const waveY = y + height / 2;
    const amplitude = 8;
    const frequency = 2;
    
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      const waveX = waveStartX + t * (waveEndX - waveStartX);
      const waveYPos = waveY + amplitude * Math.sin(frequency * Math.PI * t);
      
      if (i === 0) {
        ctx.moveTo(waveX, waveYPos);
      } else {
        ctx.lineTo(waveX, waveYPos);
      }
    }
    ctx.stroke();

    // Power rating
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.properties.maxPower}W`, x + width / 2, y + height - 8);

    // Efficiency indicator
    ctx.font = '8px sans-serif';
    ctx.fillText(`η=${(this.properties.efficiency * 100).toFixed(0)}%`, x + width / 2, y + 12);

    // Status indicator
    const isOperating = (this.properties.power || 0) > 0;
    ctx.fillStyle = isOperating ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(x + width - 8, y + 8, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Current power output
    if (this.properties.power && this.properties.power > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.properties.power.toFixed(0)}W`, x + width / 2, y + height - 18);
    }

    // Draw terminals
    this.drawTerminals(ctx);

    // Draw selection highlight
    this.drawSelectionHighlight(ctx);

    ctx.restore();
  }

  processInput(dcVoltage: number, dcCurrent: number): { acPower: number; efficiency: number } {
    const dcPower = dcVoltage * dcCurrent;
    
    // Check operating limits
    if (dcVoltage < this.properties.minInputVoltage || 
        dcVoltage > this.properties.maxInputVoltage ||
        dcCurrent > this.properties.maxInputCurrent ||
        dcPower > this.properties.maxPower) {
      return { acPower: 0, efficiency: 0 };
    }

    // Calculate efficiency curve (simplified)
    let efficiency = this.properties.efficiency;
    const loadRatio = dcPower / this.properties.maxPower;
    
    // Efficiency is typically lower at very low loads
    if (loadRatio < 0.1) {
      efficiency *= 0.8;
    } else if (loadRatio < 0.2) {
      efficiency *= 0.9;
    }

    const acPower = dcPower * efficiency;
    
    // Update properties
    this.properties.power = acPower;
    this.properties.voltage = dcVoltage;
    this.properties.current = dcCurrent;

    return { acPower, efficiency };
  }

  clone(): CircuitElement {
    const cloned = new Inverter(
      `${this.id}-copy`,
      { ...this.position },
      this.properties.type,
      this.properties.maxPower
    );
    cloned.rotation = this.rotation;
    return cloned;
  }

  getInfo(): string {
    return `Inverter: ${this.properties.type}\n` +
           `Max Power: ${this.properties.maxPower}W\n` +
           `Current Output: ${this.properties.power?.toFixed(1) || 0}W\n` +
           `Efficiency: ${(this.properties.efficiency * 100).toFixed(1)}%\n` +
           `Input Range: ${this.properties.minInputVoltage}-${this.properties.maxInputVoltage}V\n` +
           `Output: ${this.properties.outputVoltage}V AC @ ${this.properties.outputFrequency}Hz`;
  }
}
