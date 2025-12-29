// /server/controllers/familyController.js

const db = require('../config/database');
const Relationship = require('../models/Relationship');

exports.getFamilyTree = async (req, res) => {
    try {
        console.log('Getting family tree for user:', req.user.id);
        
        // First get all profiles
        const [profiles] = await db.execute(
            'SELECT id, full_name, DATE_FORMAT(date_of_birth, "%Y-%m-%d") as date_of_birth, gender, is_parent FROM profiles WHERE user_id = ?',
            [req.user.id]
        );

        console.log('Fetched profiles:', profiles);

        // Get all relationships
        const [relations] = await db.execute(`
            SELECT 
                fr.id,
                fr.parent_profile_id,
                fr.child_profile_id,
                fr.relation_type,
                fr.relationship_type,
                fr.is_spouse
            FROM family_relations fr
            JOIN profiles p1 ON fr.parent_profile_id = p1.id
            JOIN profiles p2 ON fr.child_profile_id = p2.id
            WHERE p1.user_id = ? OR p2.user_id = ?
        `, [req.user.id, req.user.id]);

        console.log('Fetched relations:', relations);

        // Create nodes
        const nodes = profiles.map(profile => ({
            id: profile.id.toString(),
            type: 'familyMember',
            data: { profile },
            position: { x: 0, y: 0 }
        }));

        // Create edges
        const edges = relations.map(relation => ({
            id: `e${relation.id}`,
            source: relation.parent_profile_id.toString(),
            target: relation.child_profile_id.toString(),
            type: relation.is_spouse ? 'straight' : 'smoothstep',
            data: { 
                relationship: relation.relationship_type,
                isSpouse: relation.is_spouse
            }
        }));

        console.log('Sending tree data:', { nodes, edges });

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
        console.log('Adding family relation:', { parent_id, child_id, relationship_type });

        if (!parent_id || !child_id || !relationship_type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const isSpouseRelation = relationship_type === 'wife' || relationship_type === 'husband';
        let result;

        if (isSpouseRelation) {
            result = await Relationship.createSpouseRelation(parent_id, child_id, relationship_type);
        } else {
            result = await Relationship.createParentChildRelation(parent_id, child_id, relationship_type);
        }

        res.status(201).json({
            success: true,
            message: `${isSpouseRelation ? 'Spouse' : 'Parent-child'} relation created successfully`
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

exports.updateFamilyMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, date_of_birth, gender } = req.body;

        // First check if this member belongs to the current user
        const [member] = await db.execute(
            'SELECT * FROM profiles WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (!member.length) {
            return res.status(404).json({ message: 'Family member not found' });
        }

        // Update the member
        await db.execute(
            `UPDATE profiles 
             SET full_name = ?, date_of_birth = ?, gender = ?
             WHERE id = ? AND user_id = ?`,
            [full_name, date_of_birth, gender, id, req.user.id]
        );

        // Fetch and return the updated member
        const [updatedMember] = await db.execute(
            'SELECT id, full_name, DATE_FORMAT(date_of_birth, "%Y-%m-%d") as date_of_birth, gender, is_parent FROM profiles WHERE id = ?',
            [id]
        );

        res.json(updatedMember[0]);
    } catch (error) {
        console.error('Error updating family member:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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