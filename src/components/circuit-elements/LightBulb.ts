import { BaseCircuitElement } from './BaseCircuitElement';
import { Position, Dimensions, Terminal, ElectricalProperties, CircuitElement } from './types';

export interface LightBulbProperties extends ElectricalProperties {
  ratedVoltage: number;
  ratedPower: number;
  actualBrightness: number; // 0-1 (percentage of rated brightness)
  loadType: 'resistive' | 'led' | 'fluorescent';
  isOn: boolean;
}

export class LightBulb extends BaseCircuitElement {
  public type = 'light-bulb';
  declare public properties: LightBulbProperties;

  constructor(
    id: string,
    position: Position,
    ratedPower: number = 60,
    ratedVoltage: number = 230,
    loadType: LightBulbProperties['loadType'] = 'resistive'
  ) {
    const dimensions: Dimensions = { width: 50, height: 60 };
    
    const terminals: Terminal[] = [
      {
        id: 'positive',
        type: 'positive',
        position: { x: dimensions.width / 2 - 8, y: dimensions.height - 8 },
        color: '#dc2626',
        label: '+'
      },
      {
        id: 'negative',
        type: 'negative',
        position: { x: dimensions.width / 2 + 8, y: dimensions.height - 8 },
        color: '#000000',
        label: '-'
      }
    ];

    const resistance = (ratedVoltage * ratedVoltage) / ratedPower; // Ohm's law: R = V²/P

    const properties: LightBulbProperties = {
      ratedVoltage,
      ratedPower,
      resistance,
      actualBrightness: 0,
      loadType,
      isOn: false,
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

    const bulbCenterX = x + width / 2;
    const bulbCenterY = y + 20;
    const bulbRadius = 15;

    // Bulb glow effect when on
    if (this.properties.isOn && this.properties.actualBrightness > 0.1) {
      const glowIntensity = this.properties.actualBrightness;
      const glowGradient = ctx.createRadialGradient(
        bulbCenterX, bulbCenterY, 0,
        bulbCenterX, bulbCenterY, bulbRadius + 10
      );
      glowGradient.addColorStop(0, `rgba(255, 255, 150, ${glowIntensity * 0.8})`);
      glowGradient.addColorStop(1, 'rgba(255, 255, 150, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(bulbCenterX, bulbCenterY, bulbRadius + 10, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Bulb body
    const bulbGradient = ctx.createRadialGradient(
      bulbCenterX - 5, bulbCenterY - 5, 0,
      bulbCenterX, bulbCenterY, bulbRadius
    );
    
    if (this.properties.isOn && this.properties.actualBrightness > 0.1) {
      const brightness = this.properties.actualBrightness;
      bulbGradient.addColorStop(0, `rgb(${255}, ${255}, ${200 + brightness * 55})`);
      bulbGradient.addColorStop(1, `rgb(${200 + brightness * 55}, ${200 + brightness * 55}, ${150 + brightness * 105})`);
    } else {
      bulbGradient.addColorStop(0, '#f3f4f6');
      bulbGradient.addColorStop(1, '#d1d5db');
    }
    
    ctx.fillStyle = bulbGradient;
    ctx.beginPath();
    ctx.arc(bulbCenterX, bulbCenterY, bulbRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Bulb outline
    ctx.strokeStyle = this.selected ? '#3b82f6' : '#6b7280';
    ctx.lineWidth = this.selected ? 3 : 2;
    ctx.stroke();

    // Filament or LED indicator
    if (this.properties.loadType === 'led') {
      // LED chips
      ctx.fillStyle = this.properties.isOn ? '#fbbf24' : '#9ca3af';
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const chipX = bulbCenterX + Math.cos(angle) * 6;
        const chipY = bulbCenterY + Math.sin(angle) * 6;
        ctx.fillRect(chipX - 2, chipY - 2, 4, 4);
      }
    } else {
      // Traditional filament
      ctx.strokeStyle = this.properties.isOn && this.properties.actualBrightness > 0.1 ? '#f59e0b' : '#6b7280';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Draw zigzag filament
      ctx.moveTo(bulbCenterX - 8, bulbCenterY - 4);
      ctx.lineTo(bulbCenterX - 4, bulbCenterY + 4);
      ctx.lineTo(bulbCenterX, bulbCenterY - 4);
      ctx.lineTo(bulbCenterX + 4, bulbCenterY + 4);
      ctx.lineTo(bulbCenterX + 8, bulbCenterY - 4);
      ctx.stroke();
    }

    // Screw base
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(x + width / 2 - 8, y + 35, 16, 20);
    
    // Screw threads
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const threadY = y + 37 + i * 4;
      ctx.beginPath();
      ctx.moveTo(x + width / 2 - 8, threadY);
      ctx.lineTo(x + width / 2 + 8, threadY);
      ctx.stroke();
    }

    // Power rating
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.properties.ratedPower}W`, bulbCenterX, y + height - 15);

    // Brightness indicator
    if (this.properties.isOn) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '7px sans-serif';
      ctx.fillText(`${(this.properties.actualBrightness * 100).toFixed(0)}%`, bulbCenterX, y + height - 8);
    }

    // Load type indicator
    ctx.fillStyle = '#6b7280';
    ctx.font = '6px sans-serif';
    let typeText = '';
    switch (this.properties.loadType) {
      case 'resistive':
        typeText = 'INCAND';
        break;
      case 'led':
        typeText = 'LED';
        break;
      case 'fluorescent':
        typeText = 'FLUOR';
        break;
    }
    ctx.fillText(typeText, bulbCenterX, y + 5);

    // Draw terminals
    this.drawTerminals(ctx);

    // Draw selection highlight
    this.drawSelectionHighlight(ctx);

    ctx.restore();
  }

  updatePower(voltage: number, current: number): void {
    this.properties.voltage = voltage;
    this.properties.current = current;
    this.properties.power = voltage * current;
    
    // Calculate brightness based on power
    const powerRatio = this.properties.power / this.properties.ratedPower;
    
    // Different load types have different brightness curves
    switch (this.properties.loadType) {
      case 'resistive':
        // Incandescent bulbs: brightness roughly proportional to power
        this.properties.actualBrightness = Math.min(powerRatio, 1);
        break;
      case 'led':
        // LEDs: more efficient, stay bright even at lower power
        this.properties.actualBrightness = Math.min(powerRatio * 1.2, 1);
        break;
      case 'fluorescent':
        // Fluorescent: threshold effect, needs minimum power to turn on
        this.properties.actualBrightness = powerRatio > 0.3 ? Math.min(powerRatio, 1) : 0;
        break;
    }
    
    this.properties.isOn = this.properties.actualBrightness > 0.05;
  }

  getActualResistance(): number {
    // For incandescent bulbs, resistance varies with temperature
    if (this.properties.loadType === 'resistive' && this.properties.isOn) {
      // Hot filament has higher resistance
      return this.properties.resistance || 0 * (1 + this.properties.actualBrightness * 0.5);
    }
    return this.properties.resistance || 0;
  }

  clone(): CircuitElement {
    const cloned = new LightBulb(
      `${this.id}-copy`,
      { ...this.position },
      this.properties.ratedPower,
      this.properties.ratedVoltage,
      this.properties.loadType
    );
    cloned.rotation = this.rotation;
    return cloned;
  }

  getInfo(): string {
    return `Light Bulb: ${this.properties.loadType}\n` +
           `Rated: ${this.properties.ratedPower}W @ ${this.properties.ratedVoltage}V\n` +
           `Current: ${this.properties.power?.toFixed(1) || 0}W\n` +
           `Brightness: ${(this.properties.actualBrightness * 100).toFixed(0)}%\n` +
           `Status: ${this.properties.isOn ? 'ON' : 'OFF'}\n` +
           `Resistance: ${this.properties.resistance?.toFixed(1)}Ω`;
  }
}
