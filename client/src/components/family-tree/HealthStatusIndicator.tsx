import { Profile } from '@/interfaces/types';

interface HealthStatusIndicatorProps {
  profile: Profile;
}

export default function HealthStatusIndicator({ profile }: HealthStatusIndicatorProps) {
  const getHealthStatus = () => {
    const conditions = profile.medical_conditions?.length || 0;
    const medications = profile.medications?.length || 0;
    
    if (conditions > 2 || medications > 3) {
      return { status: 'critical', color: 'bg-red-500', label: 'Needs Attention' };
    } else if (conditions > 0 || medications > 0) {
      return { status: 'moderate', color: 'bg-yellow-500', label: 'Monitoring' };
    }
    return { status: 'good', color: 'bg-green-500', label: 'Good' };
  };

  const health = getHealthStatus();

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${health.color}`} />
      <span className="text-xs text-gray-600">{health.label}</span>
    </div>
  );
}