// src/services/family.ts
import { api } from '@/config/axios';
import { FamilyMember, FamilyRelation, FamilyTreeData, RelationshipType } from '@/interfaces/family';
import { ProfileFormData } from '@/interfaces/profile';

export const FamilyService = {
  getFamilyTree: async (): Promise<FamilyTreeData> => {
    try {
      const response = await api.get('/api/family/tree');
      return response.data;
    } catch (error) {
      console.error('Error fetching family tree:', error);
      throw error;
    }
  },

  createFamilyMember: async (profileData: ProfileFormData): Promise<FamilyMember> => {
    try {
      const response = await api.post<FamilyMember>('/api/family/member', profileData);
      return response.data;
    } catch (error) {
      console.error('Error creating family member:', error);
      throw error;
    }
  },

  addSpouseRelation: async (
    spouse1Id: number,
    spouse2Id: number,
    relationshipType: 'wife' | 'husband'
  ): Promise<FamilyRelation> => {
    try {
        console.log('Adding spouse relation:', { spouse1Id, spouse2Id, relationshipType });
        const response = await api.post<FamilyRelation>('/api/family/spouse-relation', {
            spouse1_id: spouse1Id,
            spouse2_id: spouse2Id,
            relationship_type: relationshipType
        });
        return response.data;
    } catch (error) {
        console.error('Error adding spouse relation:', error);
        throw error;
    }
  },
  addFamilyRelation: async (
    parentId: number,
    childId: number,
    relationshipType: RelationshipType
  ): Promise<FamilyRelation> => {
    const isSpouse = relationshipType === 'wife' || relationshipType === 'husband';
    
    if (isSpouse) {
        return FamilyService.addSpouseRelation(parentId, childId, relationshipType);
    }

    try {
        console.log('Adding family relation:', { parentId, childId, relationshipType });
        const response = await api.post<FamilyRelation>('/api/family/relation', {
            parent_id: parentId,
            child_id: childId,
            relationship_type: relationshipType
        });
        return response.data;
    } catch (error) {
        console.error('Error adding family relation:', error);
        throw error;
    }
  },


  removeFamilyRelation: async (relationId: number): Promise<void> => {
    try {
      await api.delete(`/api/family/relation/${relationId}`);
    } catch (error) {
      console.error('Error removing family relation:', error);
      throw error;
    }
  },

  removeFamilyMember: async (memberId: number): Promise<void> => {
    try {
      await api.delete(`/api/family/member/${memberId}`);
    } catch (error) {
      console.error('Error removing family member:', error);
      throw error;
    }
  },

  getFamilyMembers: async (): Promise<FamilyMember[]> => {
    try {
      const response = await api.get('/api/family/members');
      return response.data;
    } catch (error) {
      console.error('Error fetching family members:', error);
      throw error;
    }
  }
};