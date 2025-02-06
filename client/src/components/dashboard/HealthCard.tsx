// Path: C:\Project\SMART_MED_2.0\client\src\components\dashboard\HealthCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Activity, Clock, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FamilyMemberHealth } from '@/interfaces/dashboard';

interface HealthCardProps {
  member: FamilyMemberHealth;
  onClick?: (member: FamilyMemberHealth) => void;
}

export const HealthCard = ({ member, onClick }: HealthCardProps) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow"
      onClick={() => onClick?.(member)}
      role={onClick ? 'button' : 'article'}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {member.name}
            <span className="text-sm font-normal text-gray-500 ml-2">
              {member.age} years | {member.bloodGroup}
            </span>
          </CardTitle>
          {member.documentCount && (
            <Badge variant="outline">
              {member.documentCount} documents
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Vital Signs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {member.metrics.bloodPressure && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Blood Pressure</p>
                  <p className="font-medium">{member.metrics.bloodPressure}</p>
                </div>
              </div>
            )}
            {member.metrics.bloodGlucose && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Blood Glucose</p>
                  <p className="font-medium">{member.metrics.bloodGlucose} mg/dL</p>
                </div>
              </div>
            )}
            {member.metrics.hbA1c && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">HbA1c</p>
                  <p className="font-medium">{member.metrics.hbA1c}%</p>
                </div>
              </div>
            )}
          </div>

          {/* Medications */}
          {member.medications && member.medications.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-500" />
                <h4 className="font-medium text-sm">Current Medications</h4>
              </div>
              <ScrollArea className="h-[100px] w-full">
                <div className="space-y-2">
                  {member.medications.map((med, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-2 rounded-md"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{med.name}</p>
                        {med.refills !== undefined && (
                          <Badge variant={med.refills > 0 ? "outline" : "secondary"}>
                            {med.refills} refills
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>{med.dosage}</span>
                        {med.frequency && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{med.frequency}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Next Appointment */}
          {member.nextAppointment && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-gray-500">Next Appointment</p>
                <p className="font-medium">
                  {new Date(member.nextAppointment).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Last Update */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>
              Last updated: {new Date(member.lastUpdate).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};