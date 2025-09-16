// Path: /server/models/Document.js

const { supabase } = require('../config/database');

class Document {
    static async findByProfileId(profileId) {
        const { data: documents, error } = await supabase
            .from('medical_documents')
            .select(`
                *,
                profiles!medical_documents_profile_id_fkey(full_name)
            `)
            .or(`profile_id.eq.${profileId}`)
            .eq('is_archived', false)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        // Format the response to include access_level and owner_name
        return documents.map(doc => ({
            ...doc,
            owner_name: doc.profiles?.full_name,
            access_level: doc.profile_id === profileId ? 'admin' : 'read'
        }));
    }


    static async create(documentData) {
        const { data: document, error } = await supabase
            .from('medical_documents')
            .insert({
                profile_id: documentData.profileId,
                owner_profile_id: documentData.ownerProfileId,
                original_owner_id: documentData.ownerProfileId,
                file_name: documentData.fileName,
                file_path: documentData.filePath,
                file_type: documentData.fileType,
                file_size: documentData.fileSize,
                mime_type: documentData.mimeType,
                document_type: documentData.documentType,
                access_level: 'family',
                uploaded_by: documentData.ownerProfileId
            })
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        return document.id;
    }

    static async findById(id, profileId) {
        const { data: document, error } = await supabase
            .from('medical_documents')
            .select(`
                *,
                profiles!medical_documents_profile_id_fkey(full_name)
            `)
            .eq('id', id)
            .or(`profile_id.eq.${profileId},owner_profile_id.eq.${profileId}`)
            .single();
        
        if (error) {
            throw error;
        }
        
        // Format the response
        return {
            ...document,
            owner_name: document.profiles?.full_name,
            access_level: document.profile_id === profileId ? 'admin' : 'read'
        };
    }

    static async updateProcessingStatus(id, status, lastProcessedAt = null) {
        const { error } = await supabase
            .from('medical_documents')
            .update({
                processed_status: status,
                last_processed_at: lastProcessedAt || new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) {
            throw error;
        }
    }

    static async softDelete(id, profileId) {
        const { data, error } = await supabase
            .from('medical_documents')
            .update({ is_archived: true })
            .eq('id', id)
            .eq('profile_id', profileId)
            .select();
        
        if (error) {
            throw error;
        }
        
        return data && data.length > 0;
    }

    static async hasAccessPermission(targetProfileId, requestingProfileId) {
        // Check if requesting profile has access to target profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', targetProfileId)
            .single();
        
        if (profileError || !profile) {
            return false;
        }
        
        // Check if there's a family relationship
        const { data: relations, error: relationError } = await supabase
            .from('family_relations')
            .select('id')
            .or(`and(parent_profile_id.eq.${requestingProfileId},child_profile_id.eq.${targetProfileId}),and(child_profile_id.eq.${requestingProfileId},parent_profile_id.eq.${targetProfileId})`)
            .limit(1);
        
        if (relationError) {
            return false;
        }
        
        return requestingProfileId === targetProfileId || (relations && relations.length > 0);
    }
}

module.exports = Document;