'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus,
  X,
  Search,
  Play,
  RotateCcw,
  Trash2,
  Sun,
  Zap,
  Lightbulb,
  ToggleLeft,
  Settings,
  Battery,
  Gauge,
  Cable,
  ArrowLeft
} from 'lucide-react';
import { usePanelPresets } from '@/hooks/useDatabase';
import { 
  CircuitElement, 
  Connection, 
  Position,
  createCircuitElement,
  ElementCreationOptions
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

// Constants
const CANVAS_WIDTH = 2400;  // Larger canvas for scrolling
const CANVAS_HEIGHT = 1600;
const GRID_SIZE = 20;

// Element types with icons and categories
const ELEMENT_CATEGORIES = {
  'Power Sources': [
    { id: 'pv-module', name: 'Solar Panel', icon: Sun, description: 'Photovoltaic module for solar energy generation' },
    { id: 'battery', name: 'Battery', icon: Battery, description: 'Energy storage device' },
  ],
  'Power Electronics': [
    { id: 'inverter', name: 'Inverter', icon: Zap, description: 'DC to AC power converter' },
    { id: 'charge-controller', name: 'Charge Controller', icon: Settings, description: 'Battery charging regulator' },
  ],
  'Loads': [
    { id: 'light-bulb', name: 'Light Bulb', icon: Lightbulb, description: 'Resistive lighting load' },
    { id: 'motor', name: 'Motor', icon: Settings, description: 'Electric motor load' },
  ],
  'Control & Switching': [
    { id: 'switch', name: 'Switch', icon: ToggleLeft, description: 'On/off switching device' },
    { id: 'breaker', name: 'Circuit Breaker', icon: Settings, description: 'Safety switching device' },
  ],
  'Measurement': [
    { id: 'voltmeter', name: 'Voltmeter', icon: Gauge, description: 'Voltage measuring device' },
    { id: 'ammeter', name: 'Ammeter', icon: Gauge, description: 'Current measuring device' },
  ],
  'Connections': [
    { id: 'wire', name: 'Wire', icon: Cable, description: 'Electrical connection' },
    { id: 'junction', name: 'Junction', icon: Settings, description: 'Wire junction point' },
  ]
};

export function FullScreenCircuitSimulator() {
  const { presets } = usePanelPresets();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'add' | 'connect'>('select');
  const [selectedElementType, setSelectedElementType] = useState<string>('');
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
  
  // Selection and interaction state
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
  // Canvas scroll state - removed unused variables
  // Filter elements based on search and category
  const filteredElements = Object.entries(ELEMENT_CATEGORIES).reduce((acc, [categoryName, elements]) => {
    if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== categoryName) return acc;
    
    const filtered = elements.filter(element => 
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filtered.length > 0) {
      acc[categoryName] = filtered;
    }
    
    return acc;
  }, {} as Record<string, typeof ELEMENT_CATEGORIES[keyof typeof ELEMENT_CATEGORIES]>);
  // Canvas drawing functions
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    // Use darker grey colors for the grid
    ctx.strokeStyle = '#6b7280'; // Darker grey for minor grid lines
    ctx.lineWidth = 0.5;
    
    // Draw grid lines
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
    
    // Draw major grid lines every 100px with slightly lighter grey
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE * 5) {
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
        
        // Draw wire with better styling
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
        
        // Draw current flow indicator if simulating
        if (simulation.isSimulating) {
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          
          // Animated current flow dot
          const time = Date.now() / 1000;
          const offset = (Math.sin(time * 2) + 1) * 10;
          
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(midX + offset - 10, midY, 4, 0, 2 * Math.PI);
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
    
    // Draw terminal highlights for connection mode
    if (connectionMode.active || tool === 'connect') {
      simulation.elements.forEach(element => {
        element.terminals.forEach(terminal => {
          const terminalPos = element.getTerminalPosition(terminal.id);
          
          // Highlight the start terminal in green
          if (connectionMode.startElement === element.id && connectionMode.startTerminal === terminal.id) {
            ctx.fillStyle = '#22c55e'; // Green for start terminal
            ctx.beginPath();
            ctx.arc(terminalPos.x, terminalPos.y, 8, 0, 2 * Math.PI);
            ctx.fill();
          } 
          // Highlight other terminals in yellow when in connection mode
          else if (connectionMode.active) {
            ctx.fillStyle = '#fbbf24'; // Yellow for potential connection terminals
            ctx.beginPath();
            ctx.arc(terminalPos.x, terminalPos.y, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add white border for visibility
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });
    }
    
    // Draw selection indicators for connection mode
    if (connectionMode.active && connectionMode.startElement) {
      const startElement = simulation.elements.find(e => e.id === connectionMode.startElement);
      if (startElement) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);        ctx.strokeRect(
          startElement.position.x - 5,
          startElement.position.y - 5,
          80 + 10, // Default element width + padding
          60 + 10  // Default element height + padding
        );
        ctx.setLineDash([]);
      }
    }
  }, [simulation, selectedElements, drawGrid, drawConnections, connectionMode, tool]);

  // Event handlers
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
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
        if (distance <= 12) { // 12 pixel radius for terminal click detection
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
        if (selectedElementType) {
          addElement(coords);
        }
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
      // Handle dragging
    if (dragState.isDragging && dragState.draggedElement) {
      const newX = Math.round((x - dragState.offset.x) / GRID_SIZE) * GRID_SIZE;
      const newY = Math.round((y - dragState.offset.y) / GRID_SIZE) * GRID_SIZE;
      
      setSimulation(prev => ({
        ...prev,
        elements: prev.elements.map(element => {
          if (element.id === dragState.draggedElement) {
            // Mutate the element's position directly (since it's a class instance)
            element.position.x = newX;
            element.position.y = newY;
          }
          return element;
        })
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setDragState({
      isDragging: false,
      draggedElement: null,
      offset: { x: 0, y: 0 }
    });
  };

  // Element manipulation functions
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
      
      // Switch back to select tool after adding element
      setTool('select');
      setSidebarOpen(false);
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
    });  };

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

  const selectElementType = (elementType: string) => {
    setSelectedElementType(elementType);
    setTool('add');
    
    // Set default options for PV module
    if (elementType === 'pv-module' && presets.length > 0) {
      setSelectedElementOptions({
        pvModule: { preset: presets[0] }
      });
    }
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
    setSimulation(prev => ({ ...prev, isSimulating: !prev.isSimulating }));
  };

  // Effect to redraw canvas
  useEffect(() => {
    redrawCanvas();
  }, [simulation, selectedElements, redrawCanvas]);

  // Animation loop for simulation
  useEffect(() => {
    if (simulation.isSimulating) {
      const interval = setInterval(() => {
        redrawCanvas();
      }, 100);
      return () => clearInterval(interval);
    }
  }, [simulation.isSimulating, redrawCanvas]);
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">      {/* Header */}
      <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-md">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Circuit Simulator</h1>
              <p className="text-sm text-muted-foreground">Interactive solar panel circuit design</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {simulation.elements.length} elements • {simulation.connections.length} connections
          </span>
          {simulation.isSimulating && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              <span className="text-sm">Simulation active</span>
            </div>
          )}
        </div>
      </header>      {/* Floating Action Button */}
      <Button
        className="fixed top-24 right-6 z-50 rounded-full h-14 w-14 shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Floating Toolbar */}
      <div className="fixed top-24 left-6 z-40 flex flex-col gap-2">
        <Button
          variant={tool === 'select' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('select')}
          className="rounded-full h-10 w-10"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant={tool === 'connect' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('connect')}
          className="rounded-full h-10 w-10"
        >
          <Cable className="h-4 w-4" />
        </Button>
        <Button
          variant={simulation.isSimulating ? 'default' : 'outline'}
          size="sm"
          onClick={runSimulation}
          className="rounded-full h-10 w-10"
        >
          <Play className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="rounded-full h-10 w-10"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        {selectedElements.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={deleteSelectedElements}
            className="rounded-full h-10 w-10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>      {/* Left Sidebar */}
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-border z-30 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } w-80 overflow-hidden flex flex-col`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Circuit Elements</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search elements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
            {/* Category Filter */}
          <Select value={selectedCategory || 'all'} onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.keys(ELEMENT_CATEGORIES).map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Elements List */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(filteredElements).map(([categoryName, elements]) => (
            <div key={categoryName} className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                {categoryName}
              </h3>
              <div className="space-y-2">
                {elements.map(element => {
                  const IconComponent = element.icon;
                  return (
                    <button
                      key={element.id}
                      onClick={() => selectElementType(element.id)}
                      className="w-full p-3 rounded-lg border border-border hover:bg-accent text-left transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{element.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {element.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          {Object.keys(filteredElements).length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No elements found</p>
            </div>
          )}
        </div>
      </div>      {/* Main Canvas Area */}
      <div 
        ref={canvasContainerRef}
        className={`flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-all duration-300 ${
          sidebarOpen ? 'pl-80' : 'pl-0'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block cursor-crosshair min-w-full min-h-full"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        />
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-background border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{simulation.elements.length} elements</span>
          <span>{simulation.connections.length} connections</span>
          {connectionMode.active && (
            <span className="text-blue-600">Connection mode active</span>
          )}
          {selectedElements.length > 0 && (
            <span>{selectedElements.length} selected</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Grid: {GRID_SIZE}px</span>
          <span>Canvas: {CANVAS_WIDTH}×{CANVAS_HEIGHT}</span>
          {simulation.isSimulating && (
            <span className="text-green-600">● Simulation running</span>
          )}
        </div>
      </div>
    </div>
  );
}
