'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, X, Zap, Settings, Info, Award } from 'lucide-react';
import { PanelPreset } from '@/types';

interface CustomPresetModalProps {
  onSave: (preset: PanelPreset) => Promise<void>;
  trigger?: React.ReactNode;
  initialData?: Partial<PanelPreset>;
}

export default function CustomPresetModal({ onSave, trigger, initialData }: CustomPresetModalProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('electrical');
  
  const [formData, setFormData] = useState<Partial<PanelPreset>>({
    // Basic info
    name: '',
    description: '',
    manufacturer: '',
    model: '',
    category: 'residential',
    
    // Core electrical (required)
    voltage: 0,
    current: 0,
    power: 0,
    voc: 0,
    isc: 0,
    maxSeriesFuse: 0,
    maxSystemVoltage: 1000,
    
    // Optional electrical
    temperatureCoefficient: -0.35,
    efficiency: 20,
    
    // Physical
    length: 2000,
    width: 1000,
    thickness: 35,
    weight: 25,
    
    // Advanced
    powerTolerancePositive: 5,
    powerToleranceNegative: 0,
    bifacial: false,
    bifacialFactor: 0,
    cellType: 'Monocrystalline',
    glassType: 'Single Glass',
    frameColor: 'Silver',
    
    // Mechanical
    mechanicalLoadPositive: 5400,
    mechanicalLoadNegative: 2400,
    
    // Warranty
    warrantyYears: 25,
    degradationFirstYear: 2.5,
    degradationAnnual: 0.55,
    
    ...initialData
  });

  const updateField = (field: keyof PanelPreset, value: string | number | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate power when voltage or current changes
      if (field === 'voltage' || field === 'current') {
        updated.power = (updated.voltage || 0) * (updated.current || 0);
      }
      
      // Auto-calculate default safety values
      if (field === 'voltage' && updated.voltage && !updated.voc) {
        updated.voc = updated.voltage * 1.2;
      }
      if (field === 'current' && updated.current && !updated.isc) {
        updated.isc = updated.current * 1.25;
      }
      if (field === 'current' && updated.current && !updated.maxSeriesFuse) {
        updated.maxSeriesFuse = Math.ceil(updated.current * 1.56);
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.voltage || !formData.current) {
      alert('Please fill in all required fields (Name, Voltage, Current)');
      return;
    }
    
    setSaving(true);
    try {
      const newPreset: PanelPreset = {
        id: `custom-${Date.now()}`,
        name: formData.name!,
        description: formData.description || `Custom preset: ${formData.name}`,
        manufacturer: formData.manufacturer,
        model: formData.model,
        category: formData.category as 'residential' | 'commercial' | 'utility' | 'small',
        
        // Core electrical
        voltage: formData.voltage!,
        current: formData.current!,
        power: formData.power || formData.voltage! * formData.current!,
        voc: formData.voc || formData.voltage! * 1.2,
        isc: formData.isc || formData.current! * 1.25,
        maxSeriesFuse: formData.maxSeriesFuse || Math.ceil(formData.current! * 1.56),
        maxSystemVoltage: formData.maxSystemVoltage || 1000,
        
        // Optional fields
        temperatureCoefficient: formData.temperatureCoefficient,
        efficiency: formData.efficiency,
        length: formData.length,
        width: formData.width,
        thickness: formData.thickness,
        weight: formData.weight,
        powerTolerancePositive: formData.powerTolerancePositive,
        powerToleranceNegative: formData.powerToleranceNegative,
        bifacial: formData.bifacial,
        bifacialFactor: formData.bifacialFactor,
        cellType: formData.cellType,
        glassType: formData.glassType,
        frameColor: formData.frameColor,
        mechanicalLoadPositive: formData.mechanicalLoadPositive,
        mechanicalLoadNegative: formData.mechanicalLoadNegative,
        warrantyYears: formData.warrantyYears,
        degradationFirstYear: formData.degradationFirstYear,
        degradationAnnual: formData.degradationAnnual
      };
      
      await onSave(newPreset);
      setOpen(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        voltage: 0,
        current: 0,
        power: 0,
        category: 'residential'
      });
    } catch (error) {
      console.error('Failed to save preset:', error);
      alert('Failed to save preset. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Preset
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Custom Solar Panel Preset
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="electrical" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Electrical
            </TabsTrigger>
            <TabsTrigger value="physical" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Physical
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="warranty" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Warranty
            </TabsTrigger>
          </TabsList>
          
          {/* Basic & Electrical Tab */}
          <TabsContent value="electrical" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-1">
                      Panel Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="e.g., 600W Custom Panel"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="utility">Utility</SelectItem>
                        <SelectItem value="small">Small Scale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => updateField('manufacturer', e.target.value)}
                      placeholder="e.g., Trina Solar"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model Number</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => updateField('model', e.target.value)}
                      placeholder="e.g., TSM-NEG19RC.20"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('description', e.target.value)}
                    placeholder="Brief description of the panel specifications and features"
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Core Electrical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Core Electrical Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="voltage" className="flex items-center gap-1">
                      Max Power Voltage (Vmp) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="voltage"
                      type="number"
                      step="0.1"
                      value={formData.voltage}
                      onChange={(e) => updateField('voltage', Number(e.target.value))}
                      placeholder="e.g., 40.3"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Volts (V)</p>
                  </div>
                  <div>
                    <Label htmlFor="current" className="flex items-center gap-1">
                      Max Power Current (Imp) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="current"
                      type="number"
                      step="0.1"
                      value={formData.current}
                      onChange={(e) => updateField('current', Number(e.target.value))}
                      placeholder="e.g., 14.91"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Amps (A)</p>
                  </div>
                  <div>
                    <Label htmlFor="power">Max Power (Pmp)</Label>
                    <Input
                      id="power"
                      type="number"
                      value={formData.power}
                      onChange={(e) => updateField('power', Number(e.target.value))}
                      placeholder="Auto-calculated"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Watts (W) - Auto calculated</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="voc">Open Circuit Voltage (Voc)</Label>
                    <Input
                      id="voc"
                      type="number"
                      step="0.1"
                      value={formData.voc}
                      onChange={(e) => updateField('voc', Number(e.target.value))}
                      placeholder="e.g., 48.4"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Volts (V)</p>
                  </div>
                  <div>
                    <Label htmlFor="isc">Short Circuit Current (Isc)</Label>
                    <Input
                      id="isc"
                      type="number"
                      step="0.1"
                      value={formData.isc}
                      onChange={(e) => updateField('isc', Number(e.target.value))}
                      placeholder="e.g., 15.80"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Amps (A)</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxSeriesFuse">Max Series Fuse</Label>
                    <Input
                      id="maxSeriesFuse"
                      type="number"
                      value={formData.maxSeriesFuse}
                      onChange={(e) => updateField('maxSeriesFuse', Number(e.target.value))}
                      placeholder="e.g., 35"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Amps (A)</p>
                  </div>
                  <div>
                    <Label htmlFor="maxSystemVoltage">Max System Voltage</Label>
                    <Input
                      id="maxSystemVoltage"
                      type="number"
                      value={formData.maxSystemVoltage}
                      onChange={(e) => updateField('maxSystemVoltage', Number(e.target.value))}
                      placeholder="e.g., 1500"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Volts (V)</p>
                  </div>
                  <div>
                    <Label htmlFor="efficiency">Efficiency</Label>
                    <Input
                      id="efficiency"
                      type="number"
                      step="0.1"
                      value={formData.efficiency}
                      onChange={(e) => updateField('efficiency', Number(e.target.value))}
                      placeholder="e.g., 22.4"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Percentage (%)</p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="temperatureCoefficient">Temperature Coefficient (Power)</Label>
                  <Input
                    id="temperatureCoefficient"
                    type="number"
                    step="0.01"
                    value={formData.temperatureCoefficient}
                    onChange={(e) => updateField('temperatureCoefficient', Number(e.target.value))}
                    placeholder="e.g., -0.30"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">%/°C (e.g., -0.30 means 0.30% power loss per °C above 25°C)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Physical Tab */}
          <TabsContent value="physical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Physical Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="length">Length</Label>
                    <Input
                      id="length"
                      type="number"
                      value={formData.length}
                      onChange={(e) => updateField('length', Number(e.target.value))}
                      placeholder="e.g., 2384"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Millimeters (mm)</p>
                  </div>
                  <div>
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      value={formData.width}
                      onChange={(e) => updateField('width', Number(e.target.value))}
                      placeholder="e.g., 1134"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Millimeters (mm)</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="thickness">Thickness</Label>
                    <Input
                      id="thickness"
                      type="number"
                      value={formData.thickness}
                      onChange={(e) => updateField('thickness', Number(e.target.value))}
                      placeholder="e.g., 35"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Millimeters (mm)</p>
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => updateField('weight', Number(e.target.value))}
                      placeholder="e.g., 32.5"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Kilograms (kg)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Mechanical Load Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mechanicalLoadPositive">Positive Load (Snow)</Label>
                    <Input
                      id="mechanicalLoadPositive"
                      type="number"
                      value={formData.mechanicalLoadPositive}
                      onChange={(e) => updateField('mechanicalLoadPositive', Number(e.target.value))}
                      placeholder="e.g., 5400"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Pascal (Pa)</p>
                  </div>
                  <div>
                    <Label htmlFor="mechanicalLoadNegative">Negative Load (Wind)</Label>
                    <Input
                      id="mechanicalLoadNegative"
                      type="number"
                      value={formData.mechanicalLoadNegative}
                      onChange={(e) => updateField('mechanicalLoadNegative', Number(e.target.value))}
                      placeholder="e.g., 2400"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Pascal (Pa)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Power Tolerance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="powerTolerancePositive">Positive Tolerance</Label>
                    <Input
                      id="powerTolerancePositive"
                      type="number"
                      value={formData.powerTolerancePositive}
                      onChange={(e) => updateField('powerTolerancePositive', Number(e.target.value))}
                      placeholder="e.g., 5"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Watts (+W)</p>
                  </div>
                  <div>
                    <Label htmlFor="powerToleranceNegative">Negative Tolerance</Label>
                    <Input
                      id="powerToleranceNegative"
                      type="number"
                      value={formData.powerToleranceNegative}
                      onChange={(e) => updateField('powerToleranceNegative', Number(e.target.value))}
                      placeholder="e.g., 0"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Watts (-W)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Construction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cellType">Cell Type</Label>
                    <Select value={formData.cellType} onValueChange={(value) => updateField('cellType', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monocrystalline">Monocrystalline</SelectItem>
                        <SelectItem value="Polycrystalline">Polycrystalline</SelectItem>
                        <SelectItem value="TOPCon">TOPCon</SelectItem>
                        <SelectItem value="HJT">Heterojunction (HJT)</SelectItem>
                        <SelectItem value="PERC">PERC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="glassType">Glass Type</Label>
                    <Select value={formData.glassType} onValueChange={(value) => updateField('glassType', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Glass">Single Glass</SelectItem>
                        <SelectItem value="Dual Glass">Dual Glass</SelectItem>
                        <SelectItem value="Glass-Backsheet">Glass-Backsheet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="frameColor">Frame Color</Label>
                    <Select value={formData.frameColor} onValueChange={(value) => updateField('frameColor', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Silver">Silver</SelectItem>
                        <SelectItem value="Black">Black</SelectItem>
                        <SelectItem value="White">White</SelectItem>
                        <SelectItem value="Anodized">Anodized</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bifacial"
                    checked={formData.bifacial}
                    onCheckedChange={(checked: boolean) => updateField('bifacial', checked)}
                  />
                  <Label htmlFor="bifacial">Bifacial Panel</Label>
                </div>
                
                {formData.bifacial && (
                  <div>
                    <Label htmlFor="bifacialFactor">Bifacial Factor</Label>
                    <Input
                      id="bifacialFactor"
                      type="number"
                      step="0.1"
                      value={formData.bifacialFactor}
                      onChange={(e) => updateField('bifacialFactor', Number(e.target.value))}
                      placeholder="e.g., 30"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Percentage (%) - Additional power from back side</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Warranty Tab */}
          <TabsContent value="warranty" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Warranty Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="warrantyYears">Warranty Period</Label>
                  <Input
                    id="warrantyYears"
                    type="number"
                    value={formData.warrantyYears}
                    onChange={(e) => updateField('warrantyYears', Number(e.target.value))}
                    placeholder="e.g., 25"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Years</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="degradationFirstYear">First Year Degradation</Label>
                    <Input
                      id="degradationFirstYear"
                      type="number"
                      step="0.1"
                      value={formData.degradationFirstYear}
                      onChange={(e) => updateField('degradationFirstYear', Number(e.target.value))}
                      placeholder="e.g., 2.5"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Percentage (%)</p>
                  </div>
                  <div>
                    <Label htmlFor="degradationAnnual">Annual Degradation</Label>
                    <Input
                      id="degradationAnnual"
                      type="number"
                      step="0.01"
                      value={formData.degradationAnnual}
                      onChange={(e) => updateField('degradationAnnual', Number(e.target.value))}
                      placeholder="e.g., 0.55"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Percentage (%) per year</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.name || !formData.voltage || !formData.current}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preset'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
