'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Upload,
  Sun,
  Settings,
  Lightbulb,
  ToggleLeft
} from 'lucide-react';
import { usePanelPresets } from '@/hooks/useDatabase';
import { 
  CircuitElement, 
  Connection, 
  Position,
  createCircuitElement,
  ElementCreationOptions,
  ELEMENT_TYPES
} from '@/components/circuit-elements';

// Enhanced types for the new modular system
interface SimulationState {
  elements: CircuitElement[];
  connections: Connection[];
  isSimulating: boolean;
  environmentalConditions: {
    irradiance: number;
    temperature: number;
    windSpeed: number;
  };
}

interface CircuitConfiguration {
  name: string;
  description: string;
  elements: CircuitElement[];
  connections: Connection[];
  environmentalConditions: SimulationState['environmentalConditions'];
  createdAt: string;
}

// Constants
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 20;

export function EnhancedCircuitSimulator() {
  const { presets } = usePanelPresets();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Tool and element selection state
  const [tool, setTool] = useState<'select' | 'add' | 'connect'>('select');
  const [selectedElementType, setSelectedElementType] = useState<string>('pv-module');
  const [selectedElementOptions, setSelectedElementOptions] = useState<ElementCreationOptions>({});
  
  // Simulation state
  const [simulation, setSimulation] = useState<SimulationState>({
    elements: [],
    connections: [],
    isSimulating: false,
    environmentalConditions: {
      irradiance: 1000,
      temperature: 25,
      windSpeed: 5
    }
  });
  
  // UI state
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [connectionMode, setConnectionMode] = useState<{
    active: boolean;
    startElement: string | null;
    startTerminal: string | null;
  }>({
    active: false,
    startElement: null,
    startTerminal: null
  });
  
  // Drag state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedElement: string | null;
    offset: Position;
  }>({
    isDragging: false,
    draggedElement: null,
    offset: { x: 0, y: 0 }
  });
  // Save/Load state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  // Canvas drawing
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

  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    simulation.connections.forEach(connection => {
      const fromElement = simulation.elements.find(e => e.id === connection.fromElementId);
      const toElement = simulation.elements.find(e => e.id === connection.toElementId);
      
      if (!fromElement || !toElement) return;
      
      try {
        const fromPos = fromElement.getTerminalPosition(connection.fromTerminalId);
        const toPos = toElement.getTerminalPosition(connection.toTerminalId);
        
        // Draw wire
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
        
        // Draw current flow indicator if simulating
        if (simulation.isSimulating) {
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(midX, midY, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      } catch (error) {
        console.warn('Error drawing connection:', error);
      }
    });
  }, [simulation.connections, simulation.elements, simulation.isSimulating]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    drawGrid(ctx);
    
    // Draw connections first (so they appear behind elements)
    drawConnections(ctx);
    
    // Draw all elements
    simulation.elements.forEach(element => {
      element.selected = selectedElements.includes(element.id);
      element.draw(ctx);
    });
  }, [simulation.elements, selectedElements, drawGrid, drawConnections]);

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

  const findElementAt = (point: Position): CircuitElement | null => {
    return simulation.elements.find(element => element.isPointInside(point)) || null;
  };

  const findTerminalAt = (point: Position): { element: CircuitElement; terminalId: string } | null => {
    for (const element of simulation.elements) {
      for (const terminal of element.terminals) {
        const terminalPos = element.getTerminalPosition(terminal.id);
        const distance = Math.sqrt(
          Math.pow(point.x - terminalPos.x, 2) + Math.pow(point.y - terminalPos.y, 2)
        );
        if (distance <= 8) { // 8 pixel radius for terminal click detection
          return { element, terminalId: terminal.id };
        }
      }
    }
    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    
    switch (tool) {
      case 'add':
        addElement(coords);
        break;
        
      case 'select':
        const clickedElement = findElementAt(coords);
        if (clickedElement) {
          if (e.ctrlKey || e.metaKey) {
            toggleElementSelection(clickedElement.id);
          } else {
            setSelectedElements([clickedElement.id]);
            startDragging(clickedElement.id, coords);
          }
        } else {
          setSelectedElements([]);
        }
        break;
        
      case 'connect':
        const terminalInfo = findTerminalAt(coords);
        if (terminalInfo) {
          handleTerminalClick(terminalInfo.element.id, terminalInfo.terminalId);
        }
        break;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragState.isDragging && dragState.draggedElement) {
      const coords = getCanvasCoordinates(e);
      updateElementPosition(dragState.draggedElement, coords);
    }
  };

  const handleCanvasMouseUp = () => {
    setDragState({
      isDragging: false,
      draggedElement: null,
      offset: { x: 0, y: 0 }
    });
  };

  const addElement = (position: Position) => {
    if (!selectedElementType) return;
    
    const snappedPosition = {
      x: snapToGrid(position.x),
      y: snapToGrid(position.y)
    };
    
    const newElement = createCircuitElement(
      selectedElementType,
      `${selectedElementType}-${Date.now()}`,
      snappedPosition,
      selectedElementOptions
    );
    
    if (newElement) {
      setSimulation(prev => ({
        ...prev,
        elements: [...prev.elements, newElement]
      }));
    }
  };

  const startDragging = (elementId: string, coords: Position) => {
    const element = simulation.elements.find(e => e.id === elementId);
    if (!element) return;
    
    setDragState({
      isDragging: true,
      draggedElement: elementId,
      offset: {
        x: coords.x - element.position.x,
        y: coords.y - element.position.y
      }
    });
  };
  const updateElementPosition = (elementId: string, coords: Position) => {
    setSimulation(prev => ({
      ...prev,
      elements: prev.elements.map(element => {
        if (element.id === elementId) {
          element.position = {
            x: snapToGrid(coords.x - dragState.offset.x),
            y: snapToGrid(coords.y - dragState.offset.y)
          };
        }
        return element;
      })
    }));
  };

  const toggleElementSelection = (elementId: string) => {
    setSelectedElements(prev =>
      prev.includes(elementId)
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    );
  };

  const handleTerminalClick = (elementId: string, terminalId: string) => {
    if (!connectionMode.active) {
      setConnectionMode({
        active: true,
        startElement: elementId,
        startTerminal: terminalId
      });
    } else if (connectionMode.startElement && connectionMode.startTerminal) {
      if (connectionMode.startElement !== elementId) {
        createConnection(
          connectionMode.startElement,
          connectionMode.startTerminal,
          elementId,
          terminalId
        );
      }
      setConnectionMode({
        active: false,
        startElement: null,
        startTerminal: null
      });
    }
  };

  const createConnection = (
    fromElementId: string,
    fromTerminalId: string,
    toElementId: string,
    toTerminalId: string
  ) => {
    const newConnection: Connection = {
      id: `connection-${Date.now()}`,
      fromElementId,
      fromTerminalId,
      toElementId,
      toTerminalId,
      type: 'wire'
    };
    
    setSimulation(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));
  };

  const deleteSelectedElements = () => {
    setSimulation(prev => ({
      ...prev,
      elements: prev.elements.filter(element => !selectedElements.includes(element.id)),
      connections: prev.connections.filter(conn =>
        !selectedElements.includes(conn.fromElementId) &&
        !selectedElements.includes(conn.toElementId)
      )
    }));
    setSelectedElements([]);
  };

  const clearCanvas = () => {
    setSimulation(prev => ({
      ...prev,
      elements: [],
      connections: []
    }));
    setSelectedElements([]);
    setConnectionMode({
      active: false,
      startElement: null,
      startTerminal: null
    });
  };

  const runSimulation = () => {
    // Simple simulation logic - in a real implementation, this would be much more sophisticated
    setSimulation(prev => ({ ...prev, isSimulating: !prev.isSimulating }));
  };

  // Effect to redraw canvas
  useEffect(() => {
    redrawCanvas();
  }, [simulation, selectedElements, redrawCanvas]);
  // Load saved configurations on mount
  useEffect(() => {
    // Configuration loading would be implemented here
  }, []);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Enhanced Circuit Simulator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tool} onValueChange={(value) => setTool(value as typeof tool)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="select">
                <Move className="h-4 w-4 mr-2" />
                Select
              </TabsTrigger>
              <TabsTrigger value="add">
                <Plus className="h-4 w-4 mr-2" />
                Add Elements
              </TabsTrigger>
              <TabsTrigger value="connect">
                <Link className="h-4 w-4 mr-2" />
                Connect
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="add" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ELEMENT_TYPES.map(elementType => {
                  const IconComponent = elementType.id === 'pv-module' ? Sun :
                                      elementType.id === 'inverter' ? Zap :
                                      elementType.id === 'switch' ? ToggleLeft :
                                      elementType.id === 'light-bulb' ? Lightbulb : Settings;
                  
                  return (
                    <Button
                      key={elementType.id}
                      variant={selectedElementType === elementType.id ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => setSelectedElementType(elementType.id)}
                    >
                      <IconComponent className="h-6 w-6" />
                      <span className="text-xs">{elementType.name}</span>
                    </Button>
                  );
                })}
              </div>
              
              {/* Element-specific options */}
              {selectedElementType === 'pv-module' && (
                <div className="space-y-2">
                  <Label>Panel Type</Label>
                  <Select 
                    value={selectedElementOptions.pvModule?.preset?.id || ''} 
                    onValueChange={(value) => {
                      const preset = presets.find(p => p.id === value);
                      if (preset) {
                        setSelectedElementOptions({
                          ...selectedElementOptions,
                          pvModule: { ...selectedElementOptions.pvModule, preset }
                        });
                      }
                    }}
                  >
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
              )}
            </TabsContent>
          </Tabs>
          
          {/* Actions */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <Button
                variant={simulation.isSimulating ? 'default' : 'outline'}
                size="sm"
                onClick={runSimulation}
                disabled={simulation.elements.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                {simulation.isSimulating ? 'Stop' : 'Run'} Simulation
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Configuration</DialogTitle>
                  </DialogHeader>
                  {/* Save dialog content would go here */}
                </DialogContent>
              </Dialog>
              
              <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Load
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Load Configuration</DialogTitle>
                  </DialogHeader>
                  {/* Load dialog content would go here */}
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Selected Elements Actions */}
          {selectedElements.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedElements.length} element(s) selected
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={deleteSelectedElements}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Connection Mode Indicator */}
          {connectionMode.active && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Connection mode active - click on a terminal to complete the connection
              </div>
            </div>
          )}
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
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />
        </CardContent>
      </Card>
      
      {/* Element Information Panel */}
      {selectedElements.length === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Element Information</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const element = simulation.elements.find(e => e.id === selectedElements[0]);
              if (!element) return null;
              
              const info = (element as { getInfo?: () => string }).getInfo?.() || 'No information available';
              return (
                <pre className="text-sm whitespace-pre-wrap">{info}</pre>
              );
            })()}
          </CardContent>
        </Card>
      )}
      
      {/* Environmental Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Environmental Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold">
                {simulation.environmentalConditions.irradiance}W/m²
              </div>
              <div className="text-sm text-gray-500">Solar Irradiance</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {simulation.environmentalConditions.temperature}°C
              </div>
              <div className="text-sm text-gray-500">Temperature</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {simulation.environmentalConditions.windSpeed}m/s
              </div>
              <div className="text-sm text-gray-500">Wind Speed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
