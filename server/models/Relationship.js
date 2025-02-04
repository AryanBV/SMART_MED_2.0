const db = require('../config/database');

class Relationship {
  static RELATIONSHIP_TYPES = ['child', 'parent', 'spouse', 'wife', 'husband'];

  static async createSpouseRelation(spouse1Id, spouse2Id, relationshipType) {
    let connection;
    try {
      // Get a dedicated connection from the pool
      connection = await db.getConnection();
      await connection.beginTransaction();

      console.log('Creating spouse relation:', { spouse1Id, spouse2Id, relationshipType });
      
      // Add first direction
      const [result1] = await connection.execute(
        `INSERT INTO family_relations 
         (parent_profile_id, child_profile_id, relation_type, relationship_type, is_spouse) 
         VALUES (?, ?, 'spouse', ?, TRUE)`,
        [spouse1Id, spouse2Id, relationshipType]
      );
      console.log('First spouse relation created:', result1);

      // Add reverse direction (swap relationship type)
      const [result2] = await connection.execute(
        `INSERT INTO family_relations 
         (parent_profile_id, child_profile_id, relation_type, relationship_type, is_spouse) 
         VALUES (?, ?, 'spouse', ?, TRUE)`,
        [spouse2Id, spouse1Id, relationshipType === 'wife' ? 'husband' : 'wife']
      );
      console.log('Second spouse relation created:', result2);

      await connection.commit();
      return true;
    } catch (error) {
      console.error('Error in createSpouseRelation:', error);
      if (connection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

    
    static async createParentChildRelation(parentId, childId, relationshipType) {
        try {
            console.log('Creating parent-child relation:', { parentId, childId, relationshipType });
            
            const [result] = await db.execute(
                `INSERT INTO family_relations 
                 (parent_profile_id, child_profile_id, relation_type, relationship_type, is_spouse) 
                 VALUES (?, ?, 'biological', ?, FALSE)`,
                [parentId, childId, relationshipType]
            );
            console.log('Parent-child relation created:', result);
            
            return true;
        } catch (error) {
            console.error('Error in createParentChildRelation:', error);
            throw error;
        }
    }

    static async findByMemberId(memberId) {
        const [parentRelations] = await db.execute(
            'SELECT id, parent_profile_id FROM family_relations WHERE child_profile_id = ?',
            [memberId]
        );
        
        const [childRelations] = await db.execute(
            'SELECT id, child_profile_id FROM family_relations WHERE parent_profile_id = ?',
            [memberId]
        );

        return {
            parentIds: parentRelations.map(rel => rel.parent_profile_id),
            childrenIds: childRelations.map(rel => rel.child_profile_id),
            relations: [...parentRelations, ...childRelations]
        };
    }

    static async getFullFamilyTree() {
        const [relations] = await db.execute(`
            SELECT fr.id, fr.parent_profile_id, fr.child_profile_id, 
                   fr.relation_type, fr.relationship_type, fr.is_spouse,
                   p1.id as parent_profile_id, p1.full_name as parent_name, 
                   p1.gender as parent_gender,
                   p2.id as child_profile_id, p2.full_name as child_name, 
                   p2.gender as child_gender
            FROM family_relations fr
            JOIN profiles p1 ON fr.parent_profile_id = p1.id
            JOIN profiles p2 ON fr.child_profile_id = p2.id
        `);
        return relations;
    }

    static async delete(relationId) {
        await db.execute('DELETE FROM family_relations WHERE id = ?', [relationId]);
    }

    static async deleteAllForMember(memberId) {
        await db.execute(
            'DELETE FROM family_relations WHERE parent_profile_id = ? OR child_profile_id = ?',
            [memberId, memberId]
        );
    }
}

module.exports = Relationship;