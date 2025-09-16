// /server/controllers/familyController.js

const { supabase, supabaseAdmin } = require('../config/database');
const Profile = require('../models/Profile');

// Family tree layout constants
const NODE_WIDTH = 300;
const NODE_HEIGHT = 100;
const HORIZONTAL_SPACING = 400;
const VERTICAL_SPACING = 250;
const SPOUSE_GAP = 450;

// Calculate proper family tree layout
const calculateFamilyTreeLayout = (nodes, edges) => {
    const nodeMap = new Map();
    nodes.forEach(node => nodeMap.set(node.id, { ...node }));
    
    // Build relationship maps
    const spouseMap = new Map();
    const parentChildMap = new Map();
    const childParentMap = new Map();
    
    edges.forEach(edge => {
        if (edge.data?.relationship === 'wife' || edge.data?.relationship === 'husband') {
            spouseMap.set(edge.source, edge.target);
            spouseMap.set(edge.target, edge.source);
        } else if (edge.data?.relationship === 'son' || edge.data?.relationship === 'daughter') {
            // Parent -> Child relationship
            if (!parentChildMap.has(edge.source)) {
                parentChildMap.set(edge.source, []);
            }
            parentChildMap.get(edge.source).push(edge.target);
            childParentMap.set(edge.target, edge.source);
        }
    });
    
    // Find root generation (people without parents)
    const rootNodes = [];
    nodes.forEach(node => {
        if (!childParentMap.has(node.id)) {
            rootNodes.push(node.id);
        }
    });
    
    // Position nodes by generation
    const positioned = new Set();
    let currentX = 0;
    
    // Position root generation (parents)
    rootNodes.forEach(nodeId => {
        const node = nodeMap.get(nodeId);
        const spouseId = spouseMap.get(nodeId);
        
        if (!positioned.has(nodeId) && node) {
            if (spouseId && nodeMap.has(spouseId)) {
                // Position spouse pair
                const spouse = nodeMap.get(spouseId);
                
                // Determine who should be on the left (husband/male on left, wife/female on right)
                let leftNode, rightNode;
                if (node.data.profile.gender === 'male') {
                    leftNode = node;
                    rightNode = spouse;
                } else {
                    leftNode = spouse;
                    rightNode = node;
                }
                
                // Position the couple (husband on left, wife on right)
                leftNode.position = { x: currentX, y: 0 };
                rightNode.position = { x: currentX + SPOUSE_GAP, y: 0 };
                
                positioned.add(nodeId);
                positioned.add(spouseId);
                
                // Position their children
                const allChildren = new Set();
                if (parentChildMap.has(nodeId)) {
                    parentChildMap.get(nodeId).forEach(childId => allChildren.add(childId));
                }
                if (parentChildMap.has(spouseId)) {
                    parentChildMap.get(spouseId).forEach(childId => allChildren.add(childId));
                }
                
                if (allChildren.size > 0) {
                    const childrenArray = Array.from(allChildren);
                    const coupleCenter = currentX + (SPOUSE_GAP / 2);
                    const totalChildrenWidth = (childrenArray.length - 1) * HORIZONTAL_SPACING;
                    const childrenStartX = coupleCenter - (totalChildrenWidth / 2);
                    
                    childrenArray.forEach((childId, index) => {
                        const childNode = nodeMap.get(childId);
                        if (childNode) {
                            childNode.position = {
                                x: childrenStartX + (index * HORIZONTAL_SPACING),
                                y: VERTICAL_SPACING
                            };
                            positioned.add(childId);
                        }
                    });
                }
                
                currentX += SPOUSE_GAP + HORIZONTAL_SPACING;
            } else {
                // Single parent
                node.position = { x: currentX, y: 0 };
                positioned.add(nodeId);
                
                // Position their children
                if (parentChildMap.has(nodeId)) {
                    const children = parentChildMap.get(nodeId);
                    children.forEach((childId, index) => {
                        const childNode = nodeMap.get(childId);
                        if (childNode) {
                            childNode.position = {
                                x: currentX + (index * HORIZONTAL_SPACING),
                                y: VERTICAL_SPACING
                            };
                            positioned.add(childId);
                        }
                    });
                }
                
                currentX += HORIZONTAL_SPACING;
            }
        }
    });
    
    // Position any remaining unpositioned nodes
    nodes.forEach((node, index) => {
        if (!positioned.has(node.id)) {
            const nodeInMap = nodeMap.get(node.id);
            if (nodeInMap) {
                nodeInMap.position = {
                    x: currentX + ((index % 3) * HORIZONTAL_SPACING),
                    y: Math.floor(index / 3) * VERTICAL_SPACING
                };
            }
        }
    });
    
    return Array.from(nodeMap.values());
};

exports.getFamilyTree = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log('Getting family tree for user:', userId);
        
        // Get all profiles for this user (including unconnected ones)
        const { data: allProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, date_of_birth, gender, is_parent, profile_type')
            .eq('user_id', userId);

        if (profilesError) {
            throw profilesError;
        }

        console.log('Fetched all profiles for user:', allProfiles);

        // Create nodes from all profiles
        const nodes = allProfiles.map(profile => ({
            id: profile.id.toString(),
            type: 'familyMember',
            data: { 
                profile: {
                    id: profile.id,
                    full_name: profile.full_name,
                    date_of_birth: profile.date_of_birth,
                    gender: profile.gender,
                    is_parent: profile.is_parent
                }
            },
            position: { x: 0, y: 0 }
        }));

        // Get relationships between profiles
        let edges = [];
        
        if (allProfiles.length > 1) {
            const { data: relations, error: relationsError } = await supabase
                .from('family_relations')
                .select('*')
                .or(`parent_profile_id.in.(${allProfiles.map(p => p.id).join(',')}),child_profile_id.in.(${allProfiles.map(p => p.id).join(',')})`);

            console.log('Relations query result:', { relations, relationsError });

            if (relationsError) {
                console.log('Relations table might not exist, creating edges without relationships');
            } else if (relations && relations.length > 0) {
                console.log('Raw relations from database:', relations);
                
                // Clean up conflicting relationships
                const cleanedRelations = [];
                const processedPairs = new Set();
                
                // First pass: Add spouse relationships
                relations.forEach(relation => {
                    if (relation.relationship_type === 'wife' || relation.relationship_type === 'husband') {
                        const pairKey = [relation.parent_profile_id, relation.child_profile_id].sort().join('-');
                        if (!processedPairs.has(pairKey)) {
                            processedPairs.add(pairKey);
                            cleanedRelations.push(relation);
                        }
                    }
                });
                
                // Second pass: Add parent-child relationships (avoid spouse pairs)
                relations.forEach(relation => {
                    if (relation.relationship_type !== 'wife' && relation.relationship_type !== 'husband') {
                        const pairKey = [relation.parent_profile_id, relation.child_profile_id].sort().join('-');
                        if (!processedPairs.has(pairKey)) {
                            processedPairs.add(pairKey);
                            cleanedRelations.push(relation);
                        }
                    }
                });
                
                console.log('Cleaned relations:', cleanedRelations);
                
                // Create edges for cleaned relationships
                const addedEdgeIds = new Set();
                edges = cleanedRelations
                    .map(relation => {
                        const edgeId = `e${relation.parent_profile_id}-${relation.child_profile_id}-${relation.relationship_type}`;
                        
                        // Skip if this exact edge has been added already
                        if (addedEdgeIds.has(edgeId)) {
                            return null;
                        }
                        
                        addedEdgeIds.add(edgeId);
                        
                        return {
                            id: edgeId,
                            source: relation.parent_profile_id.toString(),
                            target: relation.child_profile_id.toString(),
                            type: 'smoothstep',
                            data: { relationship: relation.relationship_type }
                        };
                    })
                    .filter(edge => edge !== null);

                // Don't generate sibling relationships - we only want parent-child and spouse relationships
            }
        }
        
        // Apply proper family tree layout
        const layoutedNodes = calculateFamilyTreeLayout(nodes, edges);
        
        console.log('Sending tree data:', { nodes: layoutedNodes, edges });

        res.json({ nodes: layoutedNodes, edges });
    } catch (error) {
        console.error('Error in getFamilyTree:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        });
    }
};

exports.getFamilyMembers = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get user's profile first
        const userProfile = await Profile.findByUserId(userId);
        if (!userProfile) {
            return res.status(404).json({ 
                success: false, 
                message: 'User profile not found' 
            });
        }

        const familyMembers = await Profile.findFamilyMembers(userProfile.id);
        res.json(familyMembers);
    } catch (error) {
        console.error('Error in getFamilyMembers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createFamilyMember = async (req, res) => {
    try {
        const { full_name, date_of_birth, gender, is_parent } = req.body;
        const userId = req.user.userId;
        
        console.log('Creating family member:', { full_name, date_of_birth, gender, is_parent, userId });
        
        // Use the Profile model to create the member
        const profileData = {
            user_id: userId,
            full_name,
            date_of_birth,
            gender,
            is_parent: is_parent || false,
            profile_type: 'family_member',
            profile_status: 'active'
        };

        const newProfile = await Profile.create(profileData);
        
        console.log('Created member:', newProfile);
        
        // Format the response to match expected structure
        const response = {
            id: newProfile.id,
            full_name: newProfile.full_name,
            date_of_birth: newProfile.date_of_birth,
            gender: newProfile.gender,
            is_parent: newProfile.is_parent
        };
        
        res.status(201).json(response);
    } catch (error) {
        console.error('Error in createFamilyMember:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.removeFamilyMember = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (error) {
            throw error;
        }

        res.json({ message: 'Family member removed successfully' });
    } catch (error) {
        console.error('Error in removeFamilyMember:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addFamilyRelation = async (req, res) => {
    try {
        const { parent_id, child_id, relationship_type } = req.body;
        console.log('Adding family relation:', { parent_id, child_id, relationship_type });

        if (!parent_id || !child_id || !relationship_type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const isSpouseRelation = relationship_type === 'wife' || relationship_type === 'husband';
        
        // Create the relationship in Supabase
        console.log('Attempting to create family relation:', {
            parent_profile_id: parent_id,
            child_profile_id: child_id,
            relationship_type: relationship_type,
            relation_type: isSpouseRelation ? 'spouse' : 'parent_child'
        });

        const { data, error } = await supabase
            .from('family_relations')
            .insert({
                parent_profile_id: parent_id,
                child_profile_id: child_id,
                relationship_type: relationship_type,
                relation_type: isSpouseRelation ? 'spouse' : 'parent_child'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log('Created family relation:', data);

        res.status(201).json({
            success: true,
            message: `${isSpouseRelation ? 'Spouse' : 'Parent-child'} relation created successfully`,
            data: data
        });
    } catch (error) {
        console.error('Error in addFamilyRelation:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addSpouseRelation = async (req, res) => {
    try {
        const { spouse1_id, spouse2_id, relationship_type } = req.body;
        
        console.log('Received spouse relation request:', { spouse1_id, spouse2_id, relationship_type });
        
        if (!spouse1_id || !spouse2_id || !relationship_type) {
            console.log('Missing required fields:', { spouse1_id, spouse2_id, relationship_type });
            return res.status(400).json({
                message: 'Missing required fields',
                error: 'All fields are required'
            });
        }

        if (!['wife', 'husband'].includes(relationship_type)) {
            return res.status(400).json({
                message: 'Invalid relationship type',
                error: 'Relationship type must be either wife or husband'
            });
        }

        // Create the spouse relationship in Supabase
        const { data, error } = await supabase
            .from('family_relations')
            .insert({
                parent_profile_id: spouse1_id,
                child_profile_id: spouse2_id,
                relationship_type: relationship_type,
                relation_type: 'spouse'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log('Created spouse relation:', data);

        res.status(201).json({
            id: data.id,
            spouse1_id,
            spouse2_id,
            relationship_type,
            message: 'Spouse relation created successfully'
        });
    } catch (error) {
        console.error('Error in addSpouseRelation:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

exports.updateFamilyMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, date_of_birth, gender } = req.body;

        // First check if this member belongs to the current user
        const { data: member, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .single();

        if (checkError || !member) {
            return res.status(404).json({ message: 'Family member not found' });
        }

        // Update the member using Profile model
        const updatedProfile = await Profile.update(id, {
            full_name,
            date_of_birth,
            gender
        });

        // Format response
        const response = {
            id: updatedProfile.id,
            full_name: updatedProfile.full_name,
            date_of_birth: updatedProfile.date_of_birth,
            gender: updatedProfile.gender,
            is_parent: updatedProfile.is_parent
        };

        res.json(response);
    } catch (error) {
        console.error('Error updating family member:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.removeFamilyRelation = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('family_relations')
            .delete()
            .eq('id', req.params.id);

        if (error) {
            throw error;
        }

        res.json({ message: 'Relation removed successfully' });
    } catch (error) {
        console.error('Error in removeFamilyRelation:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};