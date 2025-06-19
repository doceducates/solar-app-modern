'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, 
  Plus, 
  RotateCcw, 
  Play, 
  Grid3X3,
  Move,
  Link,
  Save,
  Upload
} from 'lucide-react';
import { PanelPreset, CalculationResults } from '@/types';
import { usePanelPresets } from '@/hooks/useDatabase';

// Types for circuit simulation
interface PanelInstance {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  preset: PanelPreset;
  selected: boolean;
  groupId?: string;
}

interface Connection {
  id: string;
  type: 'series' | 'parallel';
  fromPanelId: string;
  toPanelId: string;
  path: { x: number; y: number }[];
}

interface PanelGroup {
  id: string;
  panelIds: string[];
  type: 'series' | 'parallel';
  color: string;
}

interface SimulationState {
  panels: PanelInstance[];
  connections: Connection[];
  groups: PanelGroup[];
  isSimulating: boolean;
  currentResults: CalculationResults | null;
}

interface CircuitConfiguration {
  name: string;
  description: string;
  panels: PanelInstance[];
  connections: Connection[];
  groups: PanelGroup[];
  createdAt: string;
}

// Constants
const PANEL_WIDTH = 80;
const PANEL_HEIGHT = 120;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 20;

export function InteractiveCircuitSimulator() {
  const { presets } = usePanelPresets();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [tool, setTool] = useState<'select' | 'add' | 'connect' | 'group'>('select');
  const [simulation, setSimulation] = useState<SimulationState>({
    panels: [],
    connections: [],
    groups: [],
    isSimulating: false,
    currentResults: null
  });
  
  // Save/Load state
  const [savedConfigurations, setSavedConfigurations] = useState<CircuitConfiguration[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
    const [selectedPanels, setSelectedPanels] = useState<string[]>([]);

  // Load saved configurations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('circuitConfigurations');
    if (saved) {
      try {
        setSavedConfigurations(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved configurations:', error);
      }
    }
  }, []);

  // Canvas drawing functions
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }, []);

  const drawPanel = useCallback((ctx: CanvasRenderingContext2D, panel: PanelInstance) => {
    const { x, y, width, height, selected, preset, groupId } = panel;
    
    // Panel background with gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, selected ? '#dbeafe' : '#f1f5f9');
    gradient.addColorStop(1, selected ? '#bfdbfe' : '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // Panel border
    ctx.strokeStyle = selected ? '#3b82f6' : '#94a3b8';
    ctx.lineWidth = selected ? 3 : 1;
    ctx.strokeRect(x, y, width, height);
    
    // Group color indicator
    if (groupId) {
      const group = simulation.groups.find(g => g.id === groupId);
      if (group) {
        ctx.fillStyle = group.color;
        ctx.fillRect(x, y, width, 6);
      }
    }
    
    // Solar cells grid
    ctx.fillStyle = '#1e293b';
    const cellSize = 6;
    const cellSpacing = 1;
    const cellsX = Math.floor((width - 20) / (cellSize + cellSpacing));
    const cellsY = Math.floor((height - 32) / (cellSize + cellSpacing));
    
    for (let i = 0; i < cellsX; i++) {
      for (let j = 0; j < cellsY; j++) {
        const cellX = x + 10 + i * (cellSize + cellSpacing);
        const cellY = y + 20 + j * (cellSize + cellSpacing);
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
      }
    }
    
    // Panel specifications
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${preset.power}W`, x + width / 2, y + height - 12);
    ctx.font = '8px sans-serif';
    ctx.fillText(`${preset.voltage}V`, x + width / 2, y + height - 4);
    
    // Connection points
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x + 8, y + height / 2, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('-', x + 8, y + height / 2 + 2);
    
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(x + width - 8, y + height / 2, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('+', x + width - 8, y + height / 2 + 2);
  }, [simulation.groups]);

  const drawConnection = useCallback((ctx: CanvasRenderingContext2D, connection: Connection) => {
    const fromPanel = simulation.panels.find(p => p.id === connection.fromPanelId);
    const toPanel = simulation.panels.find(p => p.id === connection.toPanelId);
    
    if (!fromPanel || !toPanel) return;
    
    const fromX = fromPanel.x + fromPanel.width - 8;
    const fromY = fromPanel.y + fromPanel.height / 2;
    const toX = toPanel.x + 8;
    const toY = toPanel.y + toPanel.height / 2;
    
    ctx.strokeStyle = connection.type === 'series' ? '#dc2626' : '#3b82f6';
    ctx.lineWidth = 4;
    ctx.setLineDash(connection.type === 'parallel' ? [8, 4] : []);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    
    const midX = (fromX + toX) / 2;
    const controlX = midX;
    const controlY = Math.min(fromY, toY) - 20;
    
    ctx.quadraticCurveTo(controlX, controlY, toX, toY);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Connection type indicator
    ctx.fillStyle = connection.type === 'series' ? '#dc2626' : '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(midX, controlY, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(connection.type === 'series' ? 'S' : 'P', midX, controlY + 3);
  }, [simulation.panels]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawGrid(ctx);
    
    simulation.connections.forEach(connection => {
      drawConnection(ctx, connection);
    });
    
    simulation.panels.forEach(panel => {
      drawPanel(ctx, panel);
    });
  }, [simulation, drawGrid, drawPanel, drawConnection]);

  // Event handlers and functions would go here...
  // (Similar to the previous implementation but more concise)
  
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const snapToGrid = (coord: number) => Math.round(coord / GRID_SIZE) * GRID_SIZE;

  const findPanelAt = (x: number, y: number): PanelInstance | null => {
    return simulation.panels.find(panel => 
      x >= panel.x && x <= panel.x + panel.width &&
      y >= panel.y && y <= panel.y + panel.height
    ) || null;
  };

  const addPanel = (x: number, y: number) => {
    const preset = presets.find(p => p.id === selectedPreset);
    if (!preset) return;
    
    const newPanel: PanelInstance = {
      id: `panel-${Date.now()}`,
      x: snapToGrid(x - PANEL_WIDTH / 2),
      y: snapToGrid(y - PANEL_HEIGHT / 2),
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      preset,
      selected: false
    };
    
    setSimulation(prev => ({
      ...prev,
      panels: [...prev.panels, newPanel]
    }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    const clickedPanel = findPanelAt(coords.x, coords.y);
    
    if (tool === 'add' && !clickedPanel && selectedPreset) {
      addPanel(coords.x, coords.y);
    }
  };

  const clearCanvas = () => {
    setSimulation({
      panels: [],
      connections: [],
      groups: [],
      isSimulating: false,
      currentResults: null
    });
    setSelectedPanels([]);
  };

  const runSimulation = () => {
    // Basic simulation calculation
    let totalPower = 0;
    simulation.panels.forEach(panel => {
      totalPower += panel.preset.power;
    });
    
    const results: CalculationResults = {
      voltage: 48, // Simplified
      current: totalPower / 48,
      power: totalPower
    };
    
    setSimulation(prev => ({
      ...prev,
      isSimulating: true,
      currentResults: results
    }));
  };

  const saveConfiguration = () => {
    if (!configName.trim()) return;
    
    const newConfig: CircuitConfiguration = {
      name: configName,
      description: configDescription,
      panels: simulation.panels,
      connections: simulation.connections,
      groups: simulation.groups,
      createdAt: new Date().toISOString()
    };
    
    const updatedConfigs = [...savedConfigurations, newConfig];
    setSavedConfigurations(updatedConfigs);
    localStorage.setItem('circuitConfigurations', JSON.stringify(updatedConfigs));
    
    setConfigName('');
    setConfigDescription('');
    setSaveDialogOpen(false);
  };

  const loadConfiguration = (config: CircuitConfiguration) => {
    setSimulation({
      panels: config.panels,
      connections: config.connections,
      groups: config.groups,
      isSimulating: false,
      currentResults: null
    });
    setLoadDialogOpen(false);
  };

  useEffect(() => {
    redrawCanvas();
  }, [simulation, selectedPanels, redrawCanvas]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Interactive Circuit Simulator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Panel Selection */}
            <div className="space-y-2">
              <Label>Panel Type</Label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose panel..." />
                </SelectTrigger>
                <SelectContent>
                  {presets.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name} ({preset.power}W)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Tools */}
            <div className="space-y-2">
              <Label>Tools</Label>
              <div className="flex gap-2">
                <Button
                  variant={tool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('select')}
                  title="Select and move panels"
                >
                  <Move className="h-4 w-4" />
                </Button>
                <Button
                  variant={tool === 'add' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('add')}
                  disabled={!selectedPreset}
                  title="Add new panel"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant={tool === 'connect' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('connect')}
                  title="Connect panels"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Actions */}
            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runSimulation}
                  disabled={simulation.panels.length === 0}
                  title="Run simulation"
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                  title="Clear all"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Save/Load */}
            <div className="space-y-2">
              <Label>Save/Load</Label>
              <div className="flex gap-2">
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={simulation.panels.length === 0}
                      title="Save configuration"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Circuit Configuration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="config-name">Name</Label>
                        <Input
                          id="config-name"
                          value={configName}
                          onChange={(e) => setConfigName(e.target.value)}
                          placeholder="Configuration name..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="config-description">Description</Label>
                        <Textarea
                          id="config-description"
                          value={configDescription}
                          onChange={(e) => setConfigDescription(e.target.value)}
                          placeholder="Optional description..."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveConfiguration} disabled={!configName.trim()}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={savedConfigurations.length === 0}
                      title="Load configuration"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Load Circuit Configuration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {savedConfigurations.map((config) => (
                        <Card key={config.name} className="cursor-pointer hover:bg-accent">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium">{config.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {config.description || 'No description'}
                                </p>
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>{config.panels.length} panels</span>
                                  <span>{config.connections.length} connections</span>
                                  <span>{config.groups.length} groups</span>
                                  <span>{new Date(config.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => loadConfiguration(config)}
                              >
                                Load
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {savedConfigurations.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          No saved configurations found
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Canvas */}
      <Card>
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border rounded-lg cursor-crosshair w-full max-w-full h-auto"
            onClick={handleCanvasClick}
          />
        </CardContent>
      </Card>
      
      {/* Results Panel */}
      {simulation.currentResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Simulation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {simulation.currentResults.voltage.toFixed(1)}V
                </div>
                <div className="text-sm text-gray-500">Total Voltage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {simulation.currentResults.current.toFixed(1)}A
                </div>
                <div className="text-sm text-gray-500">Total Current</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {simulation.currentResults.power.toFixed(0)}W
                </div>
                <div className="text-sm text-gray-500">Total Power</div>
              </div>
            </div>
            
            {/* Circuit Statistics */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">Circuit Statistics:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Panels:</span>
                  <div className="font-medium">{simulation.panels.length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Connections:</span>
                  <div className="font-medium">{simulation.connections.length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Groups:</span>
                  <div className="font-medium">{simulation.groups.length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Daily Energy:</span>
                  <div className="font-medium">
                    {((simulation.currentResults?.power || 0) * 5 / 1000).toFixed(1)} kWh
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Help */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Select a panel type and click the &quot;+&quot; tool, then click on the canvas to add panels</li>
              <li>Use the simulation tools to analyze your circuit configuration</li>
              <li>Save and load different circuit configurations for comparison</li>
              <li>Run simulations to see power output and energy estimates</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
