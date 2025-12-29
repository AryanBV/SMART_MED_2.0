// Path: C:\Project\SMART_MED_2.0\client\src\components\medical\DocumentFilters.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Filter, User, ListFilter, Calendar as CalendarIcon } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useFamilyProfiles } from '@/hooks/useFamilyProfiles';
import { useAuth } from '@/contexts/AuthContext';
import type { DocumentType, ProcessingStatus } from '@/interfaces/documentTypes';
import type { Profile } from '@/interfaces/profile';
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface DocumentFiltersProps {
  documentType: string;
  onDocumentTypeChange: (type: string) => void;
  processingStatus?: string;
  onProcessingStatusChange?: (status: string) => void;
  selectedProfileId?: string | null;
  onProfileSelect?: (profileId: string) => void;
  dateRange?: { startDate?: Date; endDate?: Date };
  onDateRangeChange?: (range: { startDate?: Date; endDate?: Date }) => void;
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  documentType,
  onDocumentTypeChange,
  processingStatus,
  onProcessingStatusChange,
  selectedProfileId,
  onProfileSelect,
  dateRange,
  onDateRangeChange
}) => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { data: familyProfiles, isLoading: familyLoading } = useFamilyProfiles();

  const allProfiles = React.useMemo(() => {
    const profiles = new Map<string, Profile>();
    
    if (profile) {
      profiles.set(profile.id!, {
        ...profile,
        full_name: profile.full_name || 'My Profile'
      });
    }
    
    familyProfiles?.forEach(familyProfile => {
      if (familyProfile.id && !profiles.has(familyProfile.id)) {
        profiles.set(familyProfile.id, familyProfile);
      }
    });
    
    return Array.from(profiles.values());
  }, [profile, familyProfiles]);

  const isLoading = profileLoading || familyLoading;

  const getProfileBadgeInfo = (profile: Profile) => {
    if (profile.medical_info?.diabetes_type && profile.medical_info.diabetes_type !== 'none') {
      return `Type ${profile.medical_info.diabetes_type}`;
    }
    return profile.gender || 'Unknown';
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Profile Selector */}
        {onProfileSelect && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Family Member
            </label>
            <Select
              value={selectedProfileId || ''}
              onValueChange={(val) => {
                // Optionally convert the string id to number before passing, as required by your filters.
                onProfileSelect(val);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select family member"} />
              </SelectTrigger>
              <SelectContent>
                {allProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id!}>
                    <div className="flex items-center justify-between w-full">
                      <span>{profile.full_name}</span>
                      <div className="flex gap-2">
                        {profile.medical_info?.blood_group && (
                          <Badge variant="secondary">{profile.medical_info.blood_group}</Badge>
                        )}
                        <Badge variant="outline">
                          {getProfileBadgeInfo(profile)}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Document Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <ListFilter className="w-4 h-4" />
            Document Type
          </label>
          <Select
            value={documentType || "all"} // use "all" as default
            onValueChange={onDocumentTypeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <span>All Documents</span>
                  <Badge variant="outline">All</Badge>
                </div>
              </SelectItem>
              <SelectItem value="prescription">
                <div className="flex items-center gap-2">
                  <span>Prescriptions</span>
                  <Badge variant="prescription">Rx</Badge>
                </div>
              </SelectItem>
              <SelectItem value="lab_report">
                <div className="flex items-center gap-2">
                  <span>Lab Reports</span>
                  <Badge variant="lab_report">Lab</Badge>
                </div>
              </SelectItem>
              <SelectItem value="discharge_summary">
                <div className="flex items-center gap-2">
                  <span>Discharge Summaries</span>
                  <Badge variant="discharge_summary">DC</Badge>
                </div>
              </SelectItem>
              <SelectItem value="other">
                <div className="flex items-center gap-2">
                  <span>Other Documents</span>
                  <Badge variant="outline">Other</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Processing Status Filter */}
        {onProcessingStatusChange && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Processing Status
            </label>
            <Select
              value={processingStatus || "all"} // default to "all"
              onValueChange={onProcessingStatusChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span>All Status</span>
                    <Badge variant="outline">All</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <span>Pending</span>
                    <Badge variant="pending">Pending</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="processing">
                  <div className="flex items-center gap-2">
                    <span>Processing</span>
                    <Badge variant="processing">Processing</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <span>Completed</span>
                    <Badge variant="completed">Complete</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="failed">
                  <div className="flex items-center gap-2">
                    <span>Failed</span>
                    <Badge variant="failed">Failed</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range Filter */}
        {onDateRangeChange && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                placeholder="Start date"
                value={dateRange?.startDate}
                onChange={(date: Date | null) => 
                  onDateRangeChange({ 
                    ...dateRange, 
                    startDate: date || undefined
                  })
                }
              />
              <DatePicker
                placeholder="End date"
                value={dateRange?.endDate}
                onChange={(date: Date | null) => 
                  onDateRangeChange({ 
                    ...dateRange, 
                    endDate: date || undefined
                  })
                }
                minDate={dateRange?.startDate}
              />
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedProfileId && allProfiles && (
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {allProfiles.find(p => p.id === selectedProfileId)?.full_name}
            </Badge>
          )}
          {documentType !== 'all' && (
            <Badge 
              variant={documentType as any}
              className="flex items-center gap-1"
            >
              <ListFilter className="w-3 h-3" />
              {documentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          )}
          {processingStatus && processingStatus !== 'all' && (
            <Badge 
              variant={processingStatus as any}
              className="flex items-center gap-1"
            >
              <Filter className="w-3 h-3" />
              {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
            </Badge>
          )}
          {dateRange?.startDate && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {format(dateRange.startDate, 'MMM d, yyyy')}
              {dateRange?.endDate && ` - ${format(dateRange.endDate, 'MMM d, yyyy')}`}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentFilters;