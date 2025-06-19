'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, 
  Plus, 
  Trash2, 
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

const GROUP_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

// Helper function to get group color badge
const GroupColorBadge = ({ color }: { color: string }) => (
  <div 
    className="w-4 h-4 rounded"
    style={{ backgroundColor: color }}
  />
);

export function CircuitSimulator() {
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
  
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedPanel: string | null;
    startPos: { x: number; y: number };
    offset: { x: number; y: number };
  }>({
    isDragging: false,
    draggedPanel: null,
    startPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [connectionMode, setConnectionMode] = useState<{
    active: boolean;
    startPanel: string | null;
    connectionType: 'series' | 'parallel';
  }>({
    active: false,
    startPanel: null,
    connectionType: 'series'
  });

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
    
    // Panel background with gradient for better visual appeal
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, selected ? '#dbeafe' : '#f1f5f9');
    gradient.addColorStop(1, selected ? '#bfdbfe' : '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // Panel border with selection highlight
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
    
    // Solar cells grid with better visual representation
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
    
    // Panel specifications text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${preset.power}W`, x + width / 2, y + height - 12);
    ctx.font = '8px sans-serif';
    ctx.fillText(`${preset.voltage}V`, x + width / 2, y + height - 4);
    
    // Connection points with labels
    // Negative terminal (red)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x + 8, y + height / 2, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('-', x + 8, y + height / 2 + 2);
    
    // Positive terminal (green)
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
    
    // Connection line style
    ctx.strokeStyle = connection.type === 'series' ? '#dc2626' : '#3b82f6';
    ctx.lineWidth = 4;
    ctx.setLineDash(connection.type === 'parallel' ? [8, 4] : []);
    
    // Draw the connection line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    
    // Add some curve for better visual appeal
    const midX = (fromX + toX) / 2;    const midY = (fromY + toY) / 2;
    const controlX = midX;
    const controlY = Math.min(fromY, toY) - 20;
    
    ctx.quadraticCurveTo(controlX, controlY, toX, toY);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Connection type indicator with background
    ctx.fillStyle = connection.type === 'series' ? '#dc2626' : '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    const labelX = midX;
    const labelY = controlY;
    
    // Background circle
    ctx.beginPath();
    ctx.arc(labelX, labelY, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(connection.type === 'series' ? 'S' : 'P', labelX, labelY + 3);
  }, [simulation.panels]);
  const drawConnectionPreview = useCallback((_ctx: CanvasRenderingContext2D) => {
    if (!connectionMode.active || !connectionMode.startPanel) return;
    
    const startPanel = simulation.panels.find(p => p.id === connectionMode.startPanel);
    if (!startPanel) return;
    
    // Preview functionality would be implemented here
  }, [connectionMode, simulation.panels]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    drawGrid(ctx);
    
    // Draw connections
    simulation.connections.forEach(connection => {
      drawConnection(ctx, connection);
    });
    
    // Draw panels
    simulation.panels.forEach(panel => {
      drawPanel(ctx, panel);
    });
    
    // Draw connection preview
    drawConnectionPreview(ctx);
  }, [simulation, drawGrid, drawPanel, drawConnection, drawConnectionPreview]);

  // Event handlers
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

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    const clickedPanel = findPanelAt(coords.x, coords.y);
    
    switch (tool) {
      case 'add':
        if (!clickedPanel && selectedPreset) {
          addPanel(coords.x, coords.y);
        }
        break;
        
      case 'select':
        if (clickedPanel) {
          if (e.ctrlKey || e.metaKey) {
            togglePanelSelection(clickedPanel.id);
          } else {
            setSelectedPanels([clickedPanel.id]);
            startDragging(clickedPanel.id, coords);
          }
        } else {
          setSelectedPanels([]);
        }
        break;
        
      case 'connect':
        if (clickedPanel) {
          handleConnectionClick(clickedPanel.id);
        }
        break;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragState.isDragging && dragState.draggedPanel) {
      const coords = getCanvasCoordinates(e);
      updatePanelPosition(dragState.draggedPanel, coords);
    }
  };

  const handleCanvasMouseUp = () => {
    setDragState({
      isDragging: false,
      draggedPanel: null,
      startPos: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    });
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

  const startDragging = (panelId: string, coords: { x: number; y: number }) => {
    const panel = simulation.panels.find(p => p.id === panelId);
    if (!panel) return;
    
    setDragState({
      isDragging: true,
      draggedPanel: panelId,
      startPos: coords,
      offset: { x: coords.x - panel.x, y: coords.y - panel.y }
    });
  };

  const updatePanelPosition = (panelId: string, coords: { x: number; y: number }) => {
    setSimulation(prev => ({
      ...prev,
      panels: prev.panels.map(panel => 
        panel.id === panelId
          ? {
              ...panel,
              x: snapToGrid(coords.x - dragState.offset.x),
              y: snapToGrid(coords.y - dragState.offset.y)
            }
          : panel
      )
    }));
  };

  const togglePanelSelection = (panelId: string) => {
    setSelectedPanels(prev => 
      prev.includes(panelId) 
        ? prev.filter(id => id !== panelId)
        : [...prev, panelId]
    );
  };

  const handleConnectionClick = (panelId: string) => {
    if (!connectionMode.active) {
      setConnectionMode({
        active: true,
        startPanel: panelId,
        connectionType: connectionMode.connectionType
      });
    } else if (connectionMode.startPanel && connectionMode.startPanel !== panelId) {
      createConnection(connectionMode.startPanel, panelId, connectionMode.connectionType);
      setConnectionMode({
        active: false,
        startPanel: null,
        connectionType: connectionMode.connectionType
      });
    }
  };

  const createConnection = (fromId: string, toId: string, type: 'series' | 'parallel') => {
    const newConnection: Connection = {
      id: `connection-${Date.now()}`,
      type,
      fromPanelId: fromId,
      toPanelId: toId,
      path: []
    };
    
    setSimulation(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));
  };

  const deleteSelectedPanels = () => {
    setSimulation(prev => ({
      ...prev,
      panels: prev.panels.filter(panel => !selectedPanels.includes(panel.id)),
      connections: prev.connections.filter(conn => 
        !selectedPanels.includes(conn.fromPanelId) && 
        !selectedPanels.includes(conn.toPanelId)
      )
    }));
    setSelectedPanels([]);
  };

  const groupSelectedPanels = (type: 'series' | 'parallel') => {
    if (selectedPanels.length < 2) return;
    
    const newGroup: PanelGroup = {
      id: `group-${Date.now()}`,
      panelIds: [...selectedPanels],
      type,
      color: GROUP_COLORS[simulation.groups.length % GROUP_COLORS.length]
    };
    
    setSimulation(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup],
      panels: prev.panels.map(panel => 
        selectedPanels.includes(panel.id)
          ? { ...panel, groupId: newGroup.id }
          : panel
      )
    }));
    
    // Auto-connect panels in the group
    for (let i = 0; i < selectedPanels.length - 1; i++) {
      createConnection(selectedPanels[i], selectedPanels[i + 1], type);
    }
    
    setSelectedPanels([]);
  };

  const calculateCircuitResults = (): CalculationResults => {
    let totalVoltage = 0;
    let totalCurrent = 0;
    let totalPower = 0;
    
    // Calculate for each group
    simulation.groups.forEach(group => {
      const groupPanels = simulation.panels.filter(p => p.groupId === group.id);
      if (groupPanels.length === 0) return;
      
      const samplePanel = groupPanels[0].preset;
      
      if (group.type === 'series') {
        totalVoltage += samplePanel.voltage * groupPanels.length;
        totalCurrent = Math.max(totalCurrent, samplePanel.current);
      } else {
        totalVoltage = Math.max(totalVoltage, samplePanel.voltage);
        totalCurrent += samplePanel.current * groupPanels.length;
      }
      
      totalPower += samplePanel.power * groupPanels.length;
    });
    
    // Add individual panels (not in groups)
    const individualPanels = simulation.panels.filter(p => !p.groupId);
    individualPanels.forEach(panel => {
      totalVoltage = Math.max(totalVoltage, panel.preset.voltage);
      totalCurrent += panel.preset.current;
      totalPower += panel.preset.power;
    });
    
    return {
      voltage: totalVoltage,
      current: totalCurrent,
      power: totalPower
    };
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
    setConnectionMode({
      active: false,
      startPanel: null,
      connectionType: 'series'
    });
  };

  const runSimulation = () => {
    const results = calculateCircuitResults();
    setSimulation(prev => ({
      ...prev,
      isSimulating: true,
      currentResults: results
    }));
  };

  // Save/Load functions
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
    setSelectedPanels([]);
    setLoadDialogOpen(false);
  };

  const deleteConfiguration = (configName: string) => {
    const updatedConfigs = savedConfigurations.filter(c => c.name !== configName);
    setSavedConfigurations(updatedConfigs);
    localStorage.setItem('circuitConfigurations', JSON.stringify(updatedConfigs));
  };

  // Effect to redraw canvas
  useEffect(() => {
    redrawCanvas();
  }, [simulation, selectedPanels, redrawCanvas]);

  // Effect to update panel selection display
  useEffect(() => {
    setSimulation(prev => ({
      ...prev,
      panels: prev.panels.map(panel => ({
        ...panel,
        selected: selectedPanels.includes(panel.id)
      }))
    }));
  }, [selectedPanels]);

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
                >
                  <Move className="h-4 w-4" />
                </Button>
                <Button
                  variant={tool === 'add' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('add')}
                  disabled={!selectedPreset}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant={tool === 'connect' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('connect')}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Connection Type */}
            <div className="space-y-2">
              <Label>Connection Type</Label>
              <Select 
                value={connectionMode.connectionType} 
                onValueChange={(value: 'series' | 'parallel') => 
                  setConnectionMode(prev => ({ ...prev, connectionType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="series">Series</SelectItem>
                  <SelectItem value="parallel">Parallel</SelectItem>
                </SelectContent>
              </Select>
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
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Selected Panels Actions */}
          {selectedPanels.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedPanels.length} panel(s) selected
                </span>
                <div className="flex gap-2">
                  {selectedPanels.length > 1 && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => groupSelectedPanels('series')}
                      >
                        Group in Series
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => groupSelectedPanels('parallel')}
                      >
                        Group in Parallel
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={deleteSelectedPanels}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Canvas */}
      <Card>
        <CardContent className="p-0">          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border rounded-lg cursor-crosshair w-full max-w-full h-auto"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
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
            
            {/* Groups Info */}
            {simulation.groups.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Panel Groups:</h4>
                <div className="space-y-2">
                  {simulation.groups.map(group => (                    <div key={group.id} className="flex items-center gap-2">
                      <GroupColorBadge color={group.color} />
                      <Badge variant="outline">
                        {group.type} - {group.panelIds.length} panels
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Help */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Instructions:</strong></p>            <ul className="list-disc list-inside space-y-1">
              <li>Select a panel type and click &quot;+&quot; tool, then click on canvas to add panels</li>
              <li>Use &quot;Move&quot; tool to select and drag panels (Ctrl+click for multi-select)</li>
              <li>Use &quot;Connect&quot; tool to link panels in series (red) or parallel (blue)</li>
              <li>Group selected panels to auto-connect them</li>
              <li>Click &quot;Run&quot; to simulate the circuit and see results</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Save/Load Dialogs */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4" /> Save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Configuration</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter configuration name..."
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
          />
          <Textarea
            placeholder="Enter description..."
            value={configDescription}
            onChange={(e) => setConfigDescription(e.target.value)}
          />
          <Button onClick={saveConfiguration}>Save</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" /> Load
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Configuration</DialogTitle>
          </DialogHeader>
          <Select onValueChange={(value) => {
            const configuration = savedConfigurations.find(c => c.name === value);
            if (configuration) {
              loadConfiguration(configuration);
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select configuration..." />
            </SelectTrigger>
            <SelectContent>
              {savedConfigurations.map(configuration => (
                <SelectItem key={configuration.name} value={configuration.name}>
                  {configuration.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>
    </div>
  );
}
