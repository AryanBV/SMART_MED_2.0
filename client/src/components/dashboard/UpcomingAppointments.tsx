// File: client/src/components/dashboard/UpcomingAppointments.tsx

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardAppointment } from '@/interfaces/dashboard';
import { Calendar } from 'lucide-react';

interface UpcomingAppointmentsProps {
  appointments: DashboardAppointment[];
}

export const UpcomingAppointments = ({ appointments }: UpcomingAppointmentsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">{appointment.memberName}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.time}
                    </p>
                  </div>
                  <p className="text-sm">
                    Dr. {appointment.doctorName}
                    {appointment.doctorSpecialty && (
                      <span className="text-muted-foreground">
                        {' '}• {appointment.doctorSpecialty}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(appointment.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};