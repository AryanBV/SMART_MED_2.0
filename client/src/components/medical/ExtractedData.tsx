// client/src/components/medical/ExtractedData.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Clock, Calendar, XCircle, AlertTriangle, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
// Removed problematic import and defined the ExtractedMedicine type locally
interface ExtractedMedicine {
  medicine_name: string;
  confidence_score?: number;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

interface ExtractedDataProps {
  medicines: ExtractedMedicine[];
  rawText?: string;
  showRawText?: boolean;
  onClose?: () => void;
  onRetry?: () => void;
  processingStatus?: 'completed' | 'failed' | 'partial';
}

const ExtractedData: React.FC<ExtractedDataProps> = ({ 
  medicines, 
  rawText, 
  showRawText = false,
  onClose,
  onRetry,
  processingStatus = 'completed'
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopyText = async () => {
    if (!rawText) return;
    
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      toast({
        title: "Success",
        description: "Text copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    switch (processingStatus) {
      case 'completed':
        return <Badge variant="completed">Processing Complete</Badge>;
      case 'failed':
        return <Badge variant="failed">Processing Failed</Badge>;
      case 'partial':
        return <Badge variant="warning">Partially Processed</Badge>;
      default:
        return null;
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score > 0.9) return <Badge variant="success">{Math.round(score * 100)}% Match</Badge>;
    if (score > 0.7) return <Badge variant="info">{Math.round(score * 100)}% Match</Badge>;
    return <Badge variant="warning">{Math.round(score * 100)}% Match</Badge>;
  };

  return (
    <div className="space-y-4">
      {processingStatus !== 'completed' && (
        <Alert variant={processingStatus === 'failed' ? 'destructive' : 'default'}>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="flex items-center gap-2">
            {processingStatus === 'failed' 
              ? 'Document processing failed. Some information might be missing or incorrect.'
              : 'Document was partially processed. Some information might be incomplete.'}
            {onRetry && (
              <Button variant="outline" size="sm" className="ml-2" onClick={onRetry}>
                Retry Processing
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="space-y-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CardTitle>Extracted Medicines</CardTitle>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge()}
              <span className="text-sm text-muted-foreground">
                <Badge variant="secondary">{medicines.length} medicines found</Badge>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-20rem)]">
            {medicines.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-500">
                  No medicines were detected in this document
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {medicines.map((medicine, index) => (
                  <Card key={index} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Pill className="w-5 h-5 text-blue-500" />
                          <span className="text-lg font-semibold">{medicine.medicine_name}</span>
                        </div>
                        {medicine.confidence_score !== undefined && 
                          getConfidenceBadge(medicine.confidence_score)
                        }
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {medicine.dosage && (
                          <div className="flex items-center gap-2">
                            <Badge variant="prescription">Dosage</Badge>
                            <span className="text-sm">{medicine.dosage}</span>
                          </div>
                        )}
                        {medicine.frequency && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">{medicine.frequency}</span>
                          </div>
                        )}
                        {medicine.duration && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">{medicine.duration}</span>
                          </div>
                        )}
                      </div>

                      {medicine.instructions && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <Badge variant="info" className="mb-2">Instructions</Badge>
                          <p className="text-sm text-gray-600">{medicine.instructions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {showRawText && rawText && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Extracted Text</CardTitle>
            <Button variant="outline" size="sm" onClick={handleCopyText} className="flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <Badge variant="success">Copied!</Badge>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Text
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border">
                {rawText}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExtractedData;