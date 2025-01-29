// client/src/components/medical/ExtractedData.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Clock, Calendar, XCircle, AlertTriangle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { ExtractedMedicine } from '@/services/documents';

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

  const getConfidenceBadgeVariant = (score: number) => {
    if (score > 0.9) return "success";
    if (score > 0.7) return "default";
    return "warning";
  };

  return (
    <div className="space-y-4">
      {processingStatus !== 'completed' && (
        <Alert variant={processingStatus === 'failed' ? 'destructive' : 'warning'}>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            {processingStatus === 'failed' 
              ? 'Document processing failed. Some information might be missing or incorrect.'
              : 'Document was partially processed. Some information might be incomplete.'}
            {onRetry && (
              <Button
                variant="link"
                className="ml-2 p-0 h-auto"
                onClick={onRetry}
              >
                Retry processing
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Extracted Medicines</CardTitle>
            <CardDescription>
              {medicines.length} medicines found in the document
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {medicines.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-500">
                  No medicines were found in the document
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {medicines.map((medicine, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Pill className="w-5 h-5" />
                        {medicine.medicine_name}
                      </h3>
                      {medicine.confidence_score !== undefined && (
                        <Badge variant={getConfidenceBadgeVariant(medicine.confidence_score)}>
                          {Math.round(medicine.confidence_score * 100)}% confidence
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      {medicine.dosage && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">Dosage</Badge>
                          {medicine.dosage}
                        </div>
                      )}
                      {medicine.frequency && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          {medicine.frequency}
                        </div>
                      )}
                      {medicine.duration && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          {medicine.duration}
                        </div>
                      )}
                    </div>

                    {medicine.instructions && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {medicine.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {showRawText && rawText && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Raw Extracted Text</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyText}
              className="flex items-center gap-2"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
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