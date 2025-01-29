// /server/controllers/familyController.js

const db = require('../config/database');
const Relationship = require('../models/Relationship');

exports.getFamilyTree = async (req, res) => {
    try {
        console.log('Getting family tree for user:', req.user.id);
        
        // First get all profiles for the current user
        const [profiles] = await db.execute(
            'SELECT id, full_name, DATE_FORMAT(date_of_birth, "%Y-%m-%d") as date_of_birth, gender, is_parent FROM profiles WHERE user_id = ?',
            [req.user.id]
        );

        // Debug log for raw profiles
        console.log('Raw profiles from database:', JSON.stringify(profiles, null, 2));

        const relations = await Relationship.getFullFamilyTree();
        
        const nodes = profiles.map(profile => {
            // Ensure date is properly formatted
            const formattedProfile = {
                ...profile,
                date_of_birth: profile.date_of_birth ? profile.date_of_birth : null
            };
            
            console.log('Processing profile with date:', formattedProfile.date_of_birth);
            
            return {
                id: profile.id.toString(),
                type: 'familyMember',
                data: {
                    profile: {
                        id: profile.id,
                        full_name: profile.full_name,
                        gender: profile.gender,
                        date_of_birth: formattedProfile.date_of_birth,
                        is_parent: Boolean(profile.is_parent)
                    }
                },
                position: { x: Math.random() * 500, y: Math.random() * 500 }
            };
        });

        // Debug log for final nodes structure
        console.log('Final nodes structure:', JSON.stringify(nodes, null, 2));

        const edges = relations.map(relation => ({
            id: `e${relation.id}`,
            source: relation.parent_profile_id.toString(),
            target: relation.child_profile_id.toString(),
            type: 'smoothstep',
            data: { relationship: relation.relation_type }
        }));

        // Log the complete response
        console.log('Sending response:', JSON.stringify({ 
            nodeCount: nodes.length,
            sampleNode: nodes[0],
            edgeCount: edges.length 
        }, null, 2));

        res.json({ nodes, edges });
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
        const [members] = await db.execute(
            'SELECT * FROM profiles WHERE user_id = ?',
            [req.user.id]
        );
        res.json(members);
    } catch (error) {
        console.error('Error in getFamilyMembers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createFamilyMember = async (req, res) => {
    try {
        const { full_name, date_of_birth, gender, is_parent } = req.body;
        
        // Insert the new member
        const [result] = await db.execute(
            'INSERT INTO profiles (user_id, full_name, date_of_birth, gender, is_parent) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, full_name, date_of_birth, gender, is_parent || false]
        );

        // Fetch the created member to return complete data
        const [newMember] = await db.execute(
            'SELECT id, full_name, DATE_FORMAT(date_of_birth, "%Y-%m-%d") as date_of_birth, gender, is_parent FROM profiles WHERE id = ?',
            [result.insertId]
        );

        console.log('Created member:', newMember[0]); // Debug log
        
        res.status(201).json(newMember[0]);
    } catch (error) {
        console.error('Error in createFamilyMember:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.removeFamilyMember = async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM profiles WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Family member removed successfully' });
    } catch (error) {
        console.error('Error in removeFamilyMember:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addFamilyRelation = async (req, res) => {
    try {
        const { parent_id, child_id, relationship_type } = req.body;
        
        // Add debug logging
        console.log('Received relation request:', { parent_id, child_id, relationship_type });
        
        // Validate input
        if (!parent_id || !child_id || !relationship_type) {
            console.log('Missing required fields');
            return res.status(400).json({ 
                message: 'Invalid request', 
                error: 'Parent ID, Child ID, and Relationship Type are required' 
            });
        }

        // Convert IDs to numbers and validate
        const parentId = Number(parent_id);
        const childId = Number(child_id);

        if (isNaN(parentId) || isNaN(childId)) {
            console.log('Invalid ID format');
            return res.status(400).json({ 
                message: 'Invalid request', 
                error: 'IDs must be valid numbers' 
            });
        }

        // Create the relation
        const [result] = await db.execute(
            'INSERT INTO family_relations (parent_profile_id, child_profile_id, relation_type, relationship_type) VALUES (?, ?, ?, ?)',
            [parentId, childId, 'biological', relationship_type] // Default to 'biological' for relation_type
        );

        console.log('Created relation:', { 
            id: result.insertId, 
            parent_id: parentId, 
            child_id: childId,
            relationship_type 
        });

        res.status(201).json({ 
            id: result.insertId,
            parent_id: parentId,
            child_id: childId,
            relationship_type,
            message: 'Relation created successfully' 
        });
    } catch (error) {
        console.error('Error in addFamilyRelation:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

        const relationId = await Relationship.createSpouseRelation(
            spouse1_id,
            spouse2_id,
            relationship_type
        );

        console.log('Created spouse relation with ID:', relationId);

        res.status(201).json({
            id: relationId,
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

exports.removeFamilyRelation = async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM family_relations WHERE id = ?',
            [req.params.id]
        );
        res.json({ message: 'Relation removed successfully' });
    } catch (error) {
        console.error('Error in removeFamilyRelation:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};