import React from 'react';

interface UtilizationBarProps {
  percentage: number;
  label: string;
  value: string;
  maxPercentage?: number;
}

const UtilizationBar: React.FC<UtilizationBarProps> = ({ 
  percentage, 
  label, 
  value, 
  maxPercentage = 100 
}) => {
  const clampedPercentage = Math.min(percentage, maxPercentage);
  
  const getColorClass = () => {
    if (percentage > 130) return 'bg-orange-500';
    if (percentage > 100) return 'bg-yellow-500';
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 80) return 'bg-yellow-500';
    if (percentage > 80) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-gray-600">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${(clampedPercentage / maxPercentage) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default UtilizationBar;
