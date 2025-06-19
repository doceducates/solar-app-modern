import { BaseCircuitElement } from './BaseCircuitElement';
import { Position, Dimensions, Terminal, ElectricalProperties, CircuitElement } from './types';
import { PanelPreset } from '@/types';

export interface PVModuleProperties extends ElectricalProperties {
  preset: PanelPreset;
  irradiance: number; // W/m²
  temperature: number; // °C
  shadingFactor: number; // 0-1
}

export class PVModule extends BaseCircuitElement {
  public type = 'pv-module';
  declare public properties: PVModuleProperties;

  constructor(
    id: string,
    position: Position,
    preset: PanelPreset,
    irradiance: number = 1000,
    temperature: number = 25
  ) {
    const dimensions: Dimensions = { width: 80, height: 120 };
    
    const terminals: Terminal[] = [
      {
        id: 'positive',
        type: 'positive',
        position: { x: dimensions.width - 8, y: dimensions.height / 2 },
        color: '#16a34a',
        label: '+'
      },
      {
        id: 'negative',
        type: 'negative',
        position: { x: 8, y: dimensions.height / 2 },
        color: '#dc2626',
        label: '-'
      }
    ];

    const properties: PVModuleProperties = {
      preset,
      voltage: preset.voltage,
      current: preset.current,
      power: preset.power,
      irradiance,
      temperature,
      shadingFactor: 1.0
    };

    super(id, position, dimensions, terminals, properties);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.position;
    const { width, height } = this.dimensions;

    // Save context for rotation
    ctx.save();
    
    // Apply rotation if needed
    if (this.rotation !== 0) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, this.selected ? '#dbeafe' : '#1e40af');
    gradient.addColorStop(1, this.selected ? '#bfdbfe' : '#1e3a8a');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    // Panel border
    ctx.strokeStyle = this.selected ? '#3b82f6' : '#1e293b';
    ctx.lineWidth = this.selected ? 3 : 2;
    ctx.strokeRect(x, y, width, height);

    // Solar cells grid
    ctx.fillStyle = '#0f172a';
    const cellSize = 6;
    const cellSpacing = 1;
    const cellsX = Math.floor((width - 20) / (cellSize + cellSpacing));
    const cellsY = Math.floor((height - 40) / (cellSize + cellSpacing));

    for (let i = 0; i < cellsX; i++) {
      for (let j = 0; j < cellsY; j++) {
        const cellX = x + 10 + i * (cellSize + cellSpacing);
        const cellY = y + 20 + j * (cellSize + cellSpacing);
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
      }
    }

    // Power rating text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.properties.preset.power}W`, x + width / 2, y + height - 20);
    
    // Voltage text
    ctx.font = '8px sans-serif';
    ctx.fillText(`${this.properties.preset.voltage}V`, x + width / 2, y + height - 10);

    // Current power indicator based on conditions
    const currentPower = this.calculateCurrentPower();
    if (currentPower !== this.properties.preset.power) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '8px sans-serif';
      ctx.fillText(`${currentPower.toFixed(0)}W`, x + width / 2, y + height - 2);
    }

    // Draw terminals
    this.drawTerminals(ctx);

    // Draw selection highlight
    this.drawSelectionHighlight(ctx);

    // PV symbol in corner
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    const symbolX = x + 5;
    const symbolY = y + 5;
    
    // Draw sun rays
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const startX = symbolX + Math.cos(angle) * 8;
      const startY = symbolY + Math.sin(angle) * 8;
      const endX = symbolX + Math.cos(angle) * 12;
      const endY = symbolY + Math.sin(angle) * 12;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw sun circle
    ctx.beginPath();
    ctx.arc(symbolX, symbolY, 6, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  calculateCurrentPower(): number {
    const { preset, irradiance, temperature, shadingFactor } = this.properties;
    
    // Simplified power calculation considering environmental factors
    const irradianceRatio = irradiance / 1000; // Standard test conditions
    const tempCoeff = preset.temperatureCoefficient || -0.4; // %/°C
    const tempFactor = 1 + (tempCoeff / 100) * (temperature - 25);
    
    return preset.power * irradianceRatio * tempFactor * shadingFactor;
  }

  updateEnvironmentalConditions(irradiance: number, temperature: number, shadingFactor: number = 1.0): void {
    this.properties.irradiance = irradiance;
    this.properties.temperature = temperature;
    this.properties.shadingFactor = shadingFactor;
    
    // Update electrical properties
    const currentPower = this.calculateCurrentPower();
    this.properties.power = currentPower;
    this.properties.voltage = this.properties.preset.voltage * Math.sqrt(currentPower / this.properties.preset.power);
    this.properties.current = currentPower / this.properties.voltage;
  }

  clone(): CircuitElement {
    const cloned = new PVModule(
      `${this.id}-copy`,
      { ...this.position },
      this.properties.preset,
      this.properties.irradiance,
      this.properties.temperature
    );
    cloned.rotation = this.rotation;
    cloned.properties.shadingFactor = this.properties.shadingFactor;
    return cloned;
  }

  getInfo(): string {
    const currentPower = this.calculateCurrentPower();
    return `PV Module: ${this.properties.preset.name}\n` +
           `Power: ${currentPower.toFixed(1)}W (${this.properties.preset.power}W rated)\n` +
           `Voltage: ${this.properties.voltage?.toFixed(1)}V\n` +
           `Current: ${this.properties.current?.toFixed(2)}A\n` +
           `Irradiance: ${this.properties.irradiance}W/m²\n` +
           `Temperature: ${this.properties.temperature}°C`;
  }
}
