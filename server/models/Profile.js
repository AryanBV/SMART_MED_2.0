// server/models/Profile.js
const { supabase, supabaseAdmin } = require('../config/database');

class Profile {
    static async findByUserId(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, user_id, full_name, date_of_birth, gender, blood_group, is_parent, profile_type, profile_status, emergency_contact, notes, created_at, updated_at')
                .eq('user_id', userId);
            
            if (error) {
                throw error;
            }
            
            // Return first result or null if no results
            const result = data && data.length > 0 ? data[0] : null;
            return result;
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    static async create(profileData) {
        try {
            // Set default values for required fields
            const data = {
                user_id: profileData.user_id,
                full_name: profileData.full_name,
                date_of_birth: profileData.date_of_birth,
                gender: profileData.gender,
                blood_group: profileData.blood_group || null,
                is_parent: profileData.is_parent || false,
                profile_type: profileData.profile_type || 'family_member',
                profile_status: profileData.profile_status || 'active',
                emergency_contact: profileData.emergency_contact || null,
                notes: profileData.notes || null
            };

            const { data: newProfile, error } = await supabase
                .from('profiles')
                .insert(data)
                .select('id, user_id, full_name, date_of_birth, gender, blood_group, is_parent, profile_type, profile_status, emergency_contact, notes, created_at, updated_at')
                .single();

            if (error) {
                throw error;
            }

            return newProfile;

        } catch (error) {
            console.error('Error in create profile:', error);
            throw error;
        }
    }

    static async update(profileId, profileData) {
        try {
            const updateData = {
                full_name: profileData.full_name,
                date_of_birth: profileData.date_of_birth,
                gender: profileData.gender,
                blood_group: profileData.blood_group || null,
                is_parent: profileData.is_parent || false,
                profile_type: profileData.profile_type || 'primary',
                profile_status: profileData.profile_status || 'active',
                emergency_contact: profileData.emergency_contact || null,
                notes: profileData.notes || null
            };

            const { data: updatedProfile, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', profileId)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new Error('Profile not found');
                }
                throw error;
            }

            return updatedProfile;
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    static async findFamilyMembers(profileId) {
        try {
            // Get family relations first
            const { data: relations, error: relationsError } = await supabase
                .from('family_relations')
                .select('*')
                .or(`parent_profile_id.eq.${profileId},child_profile_id.eq.${profileId}`);

            if (relationsError) {
                throw relationsError;
            }

            // Get all related profile IDs
            const relatedProfileIds = new Set([profileId]);
            relations.forEach(relation => {
                relatedProfileIds.add(relation.parent_profile_id);
                relatedProfileIds.add(relation.child_profile_id);
            });

            // Get all profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', Array.from(relatedProfileIds));

            if (profilesError) {
                throw profilesError;
            }

            // Get documents for these profiles
            const { data: documents, error: documentsError } = await supabase
                .from('medical_documents')
                .select('profile_id, id, document_type, processed_status, last_processed_at, created_at')
                .in('profile_id', Array.from(relatedProfileIds))
                .order('created_at', { ascending: false });

            if (documentsError) {
                throw documentsError;
            }

            // Build the result map
            const membersMap = new Map();
            
            profiles.forEach(profile => {
                // Find relationship for this profile
                const relation = relations.find(r => 
                    (r.parent_profile_id === profileId && r.child_profile_id === profile.id) ||
                    (r.child_profile_id === profileId && r.parent_profile_id === profile.id)
                );

                membersMap.set(profile.id, {
                    id: profile.id,
                    name: profile.full_name,
                    dateOfBirth: profile.date_of_birth,
                    gender: profile.gender,
                    bloodGroup: profile.blood_group,
                    relationshipType: relation?.relationship_type || null,
                    relationType: relation?.relation_type || null,
                    documents: [],
                    profileType: profile.profile_type,
                    profileStatus: profile.profile_status,
                    emergencyContact: profile.emergency_contact,
                });
            });

            // Add documents to members
            documents.forEach(doc => {
                const member = membersMap.get(doc.profile_id);
                if (member) {
                    member.documents.push({
                        id: doc.id,
                        type: doc.document_type,
                        status: doc.processed_status,
                        lastProcessed: doc.last_processed_at,
                        createdAt: doc.created_at
                    });
                }
            });

            return Array.from(membersMap.values());
        } catch (error) {
            console.error('Error in findFamilyMembers:', error);
            throw error;
        }
    }

    static async hasAccessPermission(requesterId, targetId, requiredLevel = 'read') {
        try {
            if (requesterId === targetId) return true;
    
            const { data: relations, error } = await supabase
                .from('family_relations')
                .select('relationship_type')
                .or(`parent_profile_id.eq.${requesterId},child_profile_id.eq.${requesterId}`)
                .or(`parent_profile_id.eq.${targetId},child_profile_id.eq.${targetId}`);
    
            if (error) {
                throw error;
            }
    
            if (!relations.length) return false;
    
            const relationTypes = {
                'father': ['read', 'write'],
                'mother': ['read', 'write'],
                'son': ['read'],
                'daughter': ['read'],
                'husband': ['read', 'write'],
                'wife': ['read', 'write']
            };
    
            const relationship = relations[0].relationship_type;
            return relationTypes[relationship]?.includes(requiredLevel) || false;
        } catch (error) {
            console.error('Error in hasAccessPermission:', error);
            throw error;
        }
    }
}

module.exports = Profile;