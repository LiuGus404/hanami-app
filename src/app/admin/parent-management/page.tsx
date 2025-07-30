'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import HanamiSelect from '@/components/ui/HanamiSelect';

interface Parent {
  id: string;
  parent_email: string;
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  parent_status: string;
  parent_notes: string;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  full_name: string;
  student_email: string | null;
  contact_number: string;
  course_type: string | null;
  student_type: string | null;
  access_role: string | null;
  address: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  relationship_type: string;
  is_primary_contact: boolean;
  can_view_progress: boolean;
  can_receive_notifications: boolean;
  created_at: string;
  parent: Parent;
  student: Student;
}

export default function ParentManagementPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [links, setLinks] = useState<ParentStudentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 表單狀態
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<string>('parent');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 載入家長列表
      const parentsResponse = await fetch('/api/parents?action=list');
      const parentsResult = await parentsResponse.json();
      
      if (!parentsResult.success) {
        throw new Error(parentsResult.error || '載入家長列表失敗');
      }

      // 載入學生列表
      const { data: studentsData, error: studentsError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .order('full_name');

      if (studentsError) throw studentsError;

      // 載入家長-學生連結
      const linksResponse = await fetch('/api/parents?action=links');
      const linksResult = await linksResponse.json();
      
      if (!linksResult.success) {
        throw new Error(linksResult.error || '載入連結列表失敗');
      }

      setParents(parentsResult.data || []);
      setStudents(studentsData || []);
      setLinks(linksResult.data || []);
    } catch (err) {
      console.error('載入數據錯誤:', err);
      setError('載入數據失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    try {
      if (!selectedParent || !selectedStudent) {
        setError('請選擇家長和學生');
        return;
      }

      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_link',
          parent_id: selectedParent,
          student_id: selectedStudent,
          relationship_type: relationshipType,
          is_primary_contact: isPrimaryContact
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '創建連結失敗');
      }

      setSuccess('家長-學生連結創建成功！');
      setShowLinkForm(false);
      setSelectedParent('');
      setSelectedStudent('');
      setRelationshipType('parent');
      setIsPrimaryContact(false);
      
      await loadData();
    } catch (err) {
      console.error('創建連結錯誤:', err);
      setError('創建連結失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('確定要刪除這個連結嗎？')) return;

    try {
      const response = await fetch(`/api/parents?action=delete_link&id=${linkId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '刪除連結失敗');
      }

      setSuccess('連結刪除成功！');
      await loadData();
    } catch (err) {
      console.error('刪除連結錯誤:', err);
      setError('刪除連結失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
    }
  };

  const handleDeleteParent = async (parentId: string) => {
    if (!confirm('確定要刪除這個家長帳戶嗎？這會同時刪除所有相關的學生連結。')) return;

    try {
      const response = await fetch(`/api/parents?action=delete_parent&id=${parentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '刪除家長帳戶失敗');
      }

      setSuccess('家長帳戶刪除成功！');
      await loadData();
    } catch (err) {
      console.error('刪除家長錯誤:', err);
      setError('刪除家長失敗: ' + (err instanceof Error ? err.message : '未知錯誤'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'parent': return 'text-blue-600 bg-blue-100';
      case 'guardian': return 'text-purple-600 bg-purple-100';
      case 'emergency_contact': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto"></div>
          <p className="mt-4 text-[#2B3A3B]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-2">家長帳戶管理</h1>
        <p className="text-[#2B3A3B]">管理家長帳戶和學生連結關係</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* 家長帳戶列表 */}
      <HanamiCard className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#4B4036]">家長帳戶列表</h2>
          <span className="text-sm text-[#2B3A3B]">共 {parents.length} 個帳戶</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EADBC8]">
                <th className="text-left p-3 text-[#4B4036] font-medium">姓名</th>
                <th className="text-left p-3 text-[#4B4036] font-medium">郵箱</th>
                <th className="text-left p-3 text-[#4B4036] font-medium">電話</th>
                <th className="text-left p-3 text-[#4B4036] font-medium">狀態</th>
                <th className="text-left p-3 text-[#4B4036] font-medium">創建時間</th>
                <th className="text-left p-3 text-[#4B4036] font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((parent) => (
                <tr key={parent.id} className="border-b border-[#EADBC8] hover:bg-[#FFF9F2]">
                  <td className="p-3 text-[#4B4036]">{parent.parent_name}</td>
                  <td className="p-3 text-[#2B3A3B]">{parent.parent_email}</td>
                  <td className="p-3 text-[#2B3A3B]">{parent.parent_phone || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(parent.parent_status)}`}>
                      {parent.parent_status === 'active' ? '啟用' : 
                       parent.parent_status === 'inactive' ? '停用' : '暫停'}
                    </span>
                  </td>
                  <td className="p-3 text-[#2B3A3B] text-sm">
                    {new Date(parent.created_at).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="p-3">
                    <HanamiButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteParent(parent.id)}
                    >
                      刪除
                    </HanamiButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </HanamiCard>

      {/* 創建家長-學生連結 */}
      <HanamiCard className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#4B4036]">創建家長-學生連結</h2>
          <HanamiButton
            variant="primary"
            onClick={() => setShowLinkForm(!showLinkForm)}
          >
            {showLinkForm ? '取消' : '新增連結'}
          </HanamiButton>
        </div>

        {showLinkForm && (
          <div className="space-y-4 p-4 bg-[#FFF9F2] rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  選擇家長
                </label>
                <HanamiSelect
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                  options={[
                    { value: '', label: '請選擇家長' },
                    ...parents.map((parent) => ({
                      value: parent.id,
                      label: `${parent.parent_name} (${parent.parent_email})`
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  選擇學生
                </label>
                <HanamiSelect
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  options={[
                    { value: '', label: '請選擇學生' },
                    ...students.map((student) => ({
                      value: student.id,
                      label: `${student.full_name} (${student.student_email || 'N/A'})`
                    }))
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  關係類型
                </label>
                <HanamiSelect
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  options={[
                    { value: 'parent', label: '家長' },
                    { value: 'guardian', label: '監護人' },
                    { value: 'emergency_contact', label: '緊急聯絡人' }
                  ]}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimaryContact"
                  checked={isPrimaryContact}
                  onChange={(e) => setIsPrimaryContact(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isPrimaryContact" className="text-sm text-[#4B4036]">
                  主要聯絡人
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <HanamiButton
                variant="secondary"
                onClick={() => setShowLinkForm(false)}
              >
                取消
              </HanamiButton>
              <HanamiButton
                variant="primary"
                onClick={handleCreateLink}
                disabled={!selectedParent || !selectedStudent}
              >
                創建連結
              </HanamiButton>
            </div>
          </div>
        )}
      </HanamiCard>

      {/* 家長-學生連結列表 */}
      <HanamiCard>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#4B4036]">家長-學生連結</h2>
          <span className="text-sm text-[#2B3A3B]">共 {links.length} 個連結</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EADBC8]">
                <th className="text-left p-3 text-[#4B4036] font-medium">家長</th>
                <th className="text-left p-3 text-[#4B4036] font-medium">學生</th>
                <th className="text-left p-3 text-[#4B4036] font-medium">關係</th>
                <th className="text-left p-3 text-[#4B4036] font-medium">主要聯絡人</th>
                <th className="text-left p-3 text-[#4B4036] font-medium">創建時間</th>
                <th className="text-left p-3 text-[#4B4036] font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-[#EADBC8] hover:bg-[#FFF9F2]">
                  <td className="p-3 text-[#4B4036]">
                    <div>
                      <div className="font-medium">{link.parent.parent_name}</div>
                      <div className="text-sm text-[#2B3A3B]">{link.parent.parent_email}</div>
                    </div>
                  </td>
                  <td className="p-3 text-[#4B4036]">
                    <div>
                      <div className="font-medium">{link.student.full_name}</div>
                      <div className="text-sm text-[#2B3A3B]">{link.student.student_email || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(link.relationship_type)}`}>
                      {link.relationship_type === 'parent' ? '家長' :
                       link.relationship_type === 'guardian' ? '監護人' : '緊急聯絡人'}
                    </span>
                  </td>
                  <td className="p-3">
                    {link.is_primary_contact ? (
                      <span className="text-green-600 text-sm">✓ 是</span>
                    ) : (
                      <span className="text-gray-500 text-sm">否</span>
                    )}
                  </td>
                  <td className="p-3 text-[#2B3A3B] text-sm">
                    {new Date(link.created_at).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="p-3">
                    <HanamiButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      刪除
                    </HanamiButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </HanamiCard>
    </div>
  );
} 