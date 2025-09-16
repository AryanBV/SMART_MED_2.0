// Path: server/controllers/dashboardController.js

const Profile = require('../models/Profile');
const { supabase, supabaseAdmin } = require('../config/database');
const { DocumentProcessingError } = require('../middleware/errorHandler');

class DashboardController {
    // In dashboardController.js, update the getDashboardData method:

async getDashboardData(req, res, next) {
    try {
        const userId = req.user.userId;
        console.log('Getting dashboard data for user:', userId);
        
        // Get all profiles for this user
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId);

        if (profilesError) throw profilesError;

        if (!profiles || profiles.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No profiles found for user' 
            });
        }

        // Get all documents for these profiles with their extracted data
        const profileIds = profiles.map(p => p.id);
        const { data: documents, error: docsError } = await supabase
            .from('medical_documents')
            .select('*')
            .in('profile_id', profileIds)
            .eq('is_archived', false);

        if (docsError) throw docsError;

        // Group documents by profile
        const documentsByProfile = {};
        const allMedicines = [];
        let recentActivity = [];

        documents?.forEach(doc => {
            if (!documentsByProfile[doc.profile_id]) {
                documentsByProfile[doc.profile_id] = [];
            }
            documentsByProfile[doc.profile_id].push(doc);

            // Parse metadata for extracted data
            if (doc.metadata) {
                try {
                    const metadata = JSON.parse(doc.metadata);
                    if (metadata.medicines && Array.isArray(metadata.medicines)) {
                        // Handle both string and object medicine formats
                        metadata.medicines.forEach(med => {
                            const medicineData = typeof med === 'string' ? {
                                name: med,
                                medicine_name: med
                            } : {
                                name: med.medicine_name || med.name,
                                medicine_name: med.medicine_name || med.name,
                                ...med
                            };
                            
                            allMedicines.push({
                                ...medicineData,
                                profileId: doc.profile_id,
                                documentId: doc.id
                            });
                        });
                    }
                } catch (e) {
                    console.error('Error parsing metadata for doc:', doc.id);
                }
            }

            // Add to recent activity
            if (doc.processed_status === 'completed' && doc.last_processed_at) {
                const profile = profiles.find(p => p.id === doc.profile_id);
                recentActivity.push({
                    memberName: profile?.full_name || 'Unknown',
                    action: `Document processed: ${doc.file_name}`,
                    timestamp: doc.last_processed_at,
                    type: 'document_processed'
                });
            }
        });

        // Sort recent activity by timestamp
        recentActivity = recentActivity
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        // Transform profiles to family members with health data
        const familyMembers = profiles.map(profile => {
            const profileDocs = documentsByProfile[profile.id] || [];
            const completedDocs = profileDocs.filter(doc => doc.processed_status === 'completed');
            const latestDoc = completedDocs.sort((a, b) => new Date(b.last_processed_at) - new Date(a.last_processed_at))[0];
            
            // Extract health metrics from latest document
            let metrics = {
                bloodPressure: 'N/A',
                bloodGlucose: 'N/A', 
                hbA1c: 'N/A'
            };

            if (latestDoc?.metadata) {
                try {
                    const metadata = JSON.parse(latestDoc.metadata);
                    if (metadata.vitals) {
                        metrics = {
                            bloodPressure: metadata.vitals.blood_pressure || 'N/A',
                            bloodGlucose: metadata.vitals.blood_glucose || 'N/A',
                            hbA1c: metadata.vitals.hba1c || 'N/A'
                        };
                    }
                } catch (e) {
                    console.error('Error parsing vitals for profile:', profile.id);
                }
            }

            // Get medications for this profile
            const medications = allMedicines.filter(med => med.profileId === profile.id);

            return {
                id: profile.id,
                name: profile.full_name,
                age: profile.date_of_birth ? this.calculateAge(profile.date_of_birth) : 'N/A',
                gender: profile.gender || 'N/A',
                bloodGroup: profile.blood_group || 'Not specified',
                patientId: `AND${String(profile.id).slice(-3).padStart(3, '0')}`,
                relationship: profile.is_parent ? 'parent' : 'child',
                metrics,
                medications,
                documents: profileDocs,
                documentCount: profileDocs.length,
                lastUpdate: latestDoc?.last_processed_at || profile.updated_at,
                status: completedDocs.length > 0 ? 'Active' : 'Pending',
                lastDocument: latestDoc ? {
                    id: latestDoc.id,
                    fileName: latestDoc.file_name,
                    processed_status: latestDoc.processed_status,
                    extractedText: latestDoc.ocr_text
                } : null
            };
        });

        // Calculate statistics
        const statistics = {
            totalFamilyMembers: profiles.length,
            totalDocuments: documents?.length || 0,
            recentPrescriptions: documents?.filter(d => d.document_type === 'prescription').length || 0,
            activeMedications: allMedicines.length,
            pendingAppointments: 0 // Could be enhanced later
        };

        const dashboardData = {
            familyMembers,
            recentActivity,
            upcomingAppointments: [], // Could be enhanced later
            alerts: [], // Could be enhanced later
            statistics
        };

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Error in getDashboardData:', error);
        next(error);
    }
}

    // Helper method to calculate age
    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    async getFamilyMemberHealth(req, res, next) {
        try {
            const { memberId } = req.params;
            const userId = req.user.userId;

            // Get user's profile first
            const userProfile = await Profile.findByUserId(userId);
            if (!userProfile) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User profile not found' 
                });
            }

            // Check access permission
            const hasAccess = await Profile.hasAccessPermission(userProfile.id, memberId);
            if (!hasAccess) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }

            // Get the specific profile data
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', memberId)
                .single();

            if (error || !profile) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Profile not found' 
                });
            }

            // Get relationship info
            const { data: relation } = await supabase
                .from('family_relations')
                .select('relationship_type, relation_type')
                .or(`parent_profile_id.eq.${userProfile.id},child_profile_id.eq.${userProfile.id}`)
                .or(`parent_profile_id.eq.${memberId},child_profile_id.eq.${memberId}`)
                .single();

            res.json({
                id: profile.id,
                name: profile.full_name,
                age: this.calculateAge(profile.date_of_birth),
                gender: profile.gender,
                bloodGroup: profile.blood_group || 'Not specified',
                patientId: `AND${String(profile.id).slice(-3).padStart(3, '0')}`,
                relationship: relation?.relationship_type || 'self',
                relationType: relation?.relation_type,
                medications: [], // Add logic for medications if needed
                medicationSchedules: [], // Add logic for schedules if needed
                lastUpdate: profile.updated_at,
                metrics: {
                    bloodPressure: 'N/A',
                    bloodGlucose: 'N/A',
                    hbA1c: 'N/A'
                },
                status: 'Active'
            });

        } catch (error) {
            console.error('Error in getFamilyMemberHealth:', error);
            next(error);
        }
    }

    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }
}

module.exports = new DashboardController();