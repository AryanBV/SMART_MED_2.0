// client/src/interfaces/index.ts
export * from './auth';
export * from './dashboard';
// Use named exports and rename the conflicting types from documentTypes
export type {
  ExtractedDocumentData as DocumentTypesExtractedDocumentData,
  ProcessingStatus as DocumentTypesProcessingStatus
  // Add other exports from documentTypes here
} from './documentTypes';
export * from './family';
export * from './profile';