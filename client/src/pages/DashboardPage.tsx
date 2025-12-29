// Path: C:\Project\SMART_MED_2.0\client\src\pages\DashboardPage.tsx

import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { FamilyHealthOverview } from '@/components/dashboard/FamilyHealthOverview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ExtractedData from '@/components/medical/ExtractedData';
import type { FamilyMemberHealth } from '@/interfaces/dashboard';

const DashboardPage = () => {
  const { 
    dashboardData, 
    isLoading, 
    error, 
    refetch,
    processDocument 
  } = useDashboardData();

  const [selectedMember, setSelectedMember] = React.useState<FamilyMemberHealth | null>(null);

  const handleRetryProcessing = async (documentId: number) => {
    try {
      await processDocument(documentId);
      refetch();
    } catch (error) {
      console.error('Failed to retry processing:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data.
            <Button 
              variant="link" 
              className="ml-2 h-auto p-0" 
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No dashboard data available.
            <Button 
              variant="link" 
              className="ml-2 h-auto p-0" 
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Family Members</div>
            <div className="text-2xl font-bold">
              {dashboardData.statistics.totalFamilyMembers || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Documents</div>
            <div className="text-2xl font-bold">
              {dashboardData.statistics.totalDocuments || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Appointments</div>
            <div className="text-2xl font-bold">
              {dashboardData.statistics.pendingAppointments || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-500">Active Alerts</div>
            <div className="text-2xl font-bold">
              {dashboardData.statistics.activeAlerts || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Health Overview */}
      <FamilyHealthOverview 
        members={dashboardData.familyMembers || []}
        onMemberSelect={setSelectedMember}
      />

      {/* Member Details Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedMember?.name}'s Health Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-6">
              {/* Health Metrics Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Health Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(selectedMember.metrics).map(([key, value]) => (
                    value && value !== 'N/A' && (
                      <Card key={key}>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="font-medium">{value}</div>
                        </CardContent>
                      </Card>
                    )
                  ))}
                </div>
              </div>

              {/* Extracted Medical Data */}
              {selectedMember.lastDocument && (
                <ExtractedData
                  medicines={selectedMember.medications || []}
                  rawText={selectedMember.lastDocument?.extractedText}
                  showRawText={false}
                  processingStatus={selectedMember.lastDocument?.processed_status === 'completed' ? 'completed' : 'processing'}
                />
              )}

              {/* Processing Status */}
              {selectedMember.lastDocument?.processed_status === 'failed' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center">
                    Failed to process the latest document. Some information might be missing.
                    <Button 
                      variant="link" 
                      className="ml-2 h-auto p-0" 
                      onClick={() => selectedMember.lastDocument?.id && 
                        handleRetryProcessing(selectedMember.lastDocument.id)}
                    >
                      Retry Processing
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* No Documents Message */}
              {!selectedMember.lastDocument && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No medical documents found for this family member.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;