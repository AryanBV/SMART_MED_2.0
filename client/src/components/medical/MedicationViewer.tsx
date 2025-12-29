// Path: C:\Project\SMART_MED_2.0\client\src\components\medical\MedicationViewer.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Clock, CalendarDays } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Medication } from '@/interfaces/dashboard';

interface MedicationViewerProps {
  medications: Medication[];
  className?: string;
}

const MedicationViewer: React.FC<MedicationViewerProps> = ({ 
  medications,
  className = ''
}) => {
  if (!medications.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No medications found
      </div>
    );
  }

  return (
    <ScrollArea className={`h-[300px] ${className}`}>
      <div className="space-y-3">
        {medications.map((medication, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Pill className="w-4 h-4 mt-1 text-blue-500" />
                  <div>
                    <h4 className="font-medium">{medication.name}</h4>
                    <p className="text-sm text-gray-600">
                      {medication.dosage}
                      {medication.frequency && (
                        <span className="ml-2">• {medication.frequency}</span>
                      )}
                    </p>
                    {medication.instructions && (
                      <p className="text-sm text-gray-500 mt-1">
                        {medication.instructions}
                      </p>
                    )}
                  </div>
                </div>
                {medication.refills !== undefined && (
                  <Badge variant={medication.refills > 0 ? "outline" : "secondary"}>
                    {medication.refills} refills
                  </Badge>
                )}
              </div>
              {(medication.startDate || medication.endDate) && (
                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  {medication.startDate && (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      <span>Start: {new Date(medication.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {medication.endDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>End: {new Date(medication.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default MedicationViewer;