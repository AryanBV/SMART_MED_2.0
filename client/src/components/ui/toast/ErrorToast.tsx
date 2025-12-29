// import React from 'react';
// import { toast } from '@/components/ui/use-toast';
// import { XCircle } from 'lucide-react';

// export const showErrorToast = (message: string) => {
//   toast({
//     variant: "destructive",
//     title: (
//       <div className="flex items-center gap-2">
//         <XCircle className="h-5 w-5" />
//         <span>Error</span>
//       </div>
//     ),
//     description: message,
//   });
// };

// export const handleApiError = (error: any) => {
//   const message = error.response?.data?.message || 'Something went wrong. Please try again.';
//   showErrorToast(message);
// };