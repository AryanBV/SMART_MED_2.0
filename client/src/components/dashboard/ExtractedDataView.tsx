// File: client/src/components/dashboard/ExtractedDataView.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, AlertCircle, Heart, Pill } from 'lucide-react';

interface ExtractedDataViewerProps {
  data: {
    patientInfo?: {
      name: string;
      age: string;
      gender: string;
      bloodGroup: string;
      weight: string;
    };
    vitals?: {
      bloodPressure: string;
      bloodGlucose: string;
      hba1c: string;
    };
    medicines?: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration?: string;
      instructions?: string;
      refills?: number;
    }>;
    nextAppointment?: string;
  };
  onDataUpdate?: () => void;
}

export const ExtractedDataViewer: React.FC<ExtractedDataViewerProps> = ({
  data,
  onDataUpdate
}) => {
  return (
    <div className="space-y-4">
      {/* Vitals Section */}
      {data.vitals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.vitals.bloodPressure && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Blood Pressure</p>
                    <p className="font-medium">{data.vitals.bloodPressure}</p>
                  </div>
                </div>
              )}
              {data.vitals.bloodGlucose && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Blood Glucose</p>
                    <p className="font-medium">{data.vitals.bloodGlucose} mg/dL</p>
                  </div>
                </div>
              )}
              {data.vitals.hba1c && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">HbA1c</p>
                    <p className="font-medium">{data.vitals.hba1c}%</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medications Section */}
      {data.medicines && data.medicines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-500" />
              Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-4">
                {data.medicines.map((medicine, index) => (
                  <Card key={index} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{medicine.medicine_name}</h4>
                        {medicine.refills !== undefined && (
                          <Badge variant="outline">
                            Refills: {medicine.refills}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        {medicine.dosage && (
                          <p>Dosage: {medicine.dosage}</p>
                        )}
                        {medicine.frequency && (
                          <p>Frequency: {medicine.frequency}</p>
                        )}
                        {medicine.duration && (
                          <p>Duration: {medicine.duration}</p>
                        )}
                        {medicine.instructions && (
                          <div className="mt-2 p-2 bg-white rounded-md">
                            <p className="text-xs text-gray-500">Instructions:</p>
                            <p>{medicine.instructions}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Next Appointment */}
      {data.nextAppointment && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-gray-500">Next Appointment</p>
                <p className="font-medium">{data.nextAppointment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExtractedDataViewer;