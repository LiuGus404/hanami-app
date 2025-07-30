'use client';

import { useState, useEffect } from 'react';
import { HanamiCard, HanamiButton, HanamiSelect, HanamiInput } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface Parent {
  id: string;
  parent_email: string;
  parent_name: string;
  parent_phone: string;
  parent_status: string;
}

interface Student {
  id: string;
  full_name: string;
  nick_name: string | null;
  student_email: string | null;
  contact_number: string;
  course_type: string | null;
  student_type: string | null;
  access_role: string | null;
  address: string | null;
  created_at: string | null;
  updated_at: string | null;
  student_age: number | null;
}

interface Link {
  id: string;
  parent_id: string;
  student_id: string;
  relationship_type: string;
  is_primary_contact: boolean;
  parent_name: string;
  student_name: string;
}

export default function TestParentStudentLinkPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // 連結表單狀態
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [relationshipType, setRelationshipType] = useState('parent');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 載入家長列表
      const { data: parentsData, error: parentsError } = await supabase
        .from('hanami_parents')
        .select('*')
        .order('parent_name');

      if (parentsError) throw parentsError;
      setParents(parentsData || []);

      // 載入學生列表
      const { data: studentsData, error: studentsError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .order('full_name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // 載入連結列表
      await loadLinks();

    } catch (error) {
      console.error('載入資料錯誤:', error);
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const loadLinks = async () => {
    try {
      const { data: linksData, error: linksError } = await supabase
        .from('hanami_parent_student_links')
        .select(`
          *,
          hanami_parents!inner(parent_name),
          Hanami_Students!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      // 格式化連結資料
      const formattedLinks = (linksData || []).map(link => ({
        id: link.id,
        parent_id: link.parent_id,
        student_id: link.student_id,
        relationship_type: link.relationship_type,
        is_primary_contact: link.is_primary_contact,
        parent_name: (link as any).hanami_parents?.parent_name || '未知家長',
        student_name: (link as any).Hanami_Students?.full_name || '未知學生'
      }));

      setLinks(formattedLinks);
    } catch (error) {
      console.error('載入連結錯誤:', error);
    }
  };

  const createLink = async () => {
    if (!selectedParentId || !selectedStudentId) {
      setResult({ error: '請選擇家長和學生' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hanami_parent_student_links')
        .insert({
          parent_id: selectedParentId,
          student_id: selectedStudentId,
          relationship_type: relationshipType,
          is_primary_contact: isPrimaryContact
        })
        .select();

      if (error) throw error;

      setResult({
        success: true,
        message: '連結創建成功！',
        data: data
      });

      // 重新載入連結列表
      await loadLinks();

      // 清空表單
      setSelectedParentId('');
      setSelectedStudentId('');
      setRelationshipType('parent');
      setIsPrimaryContact(false);

    } catch (error) {
      console.error('創建連結錯誤:', error);
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm('確定要刪除此連結嗎？')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('hanami_parent_student_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setResult({
        success: true,
        message: '連結刪除成功！'
      });

      // 重新載入連結列表
      await loadLinks();

    } catch (error) {
      console.error('刪除連結錯誤:', error);
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const testParentLogin = async (parentEmail: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login-table-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: parentEmail,
          password: 'password123', // 假設密碼
          role: 'parent'
        }),
      });

      const data = await response.json();
      setResult({
        success: true,
        message: '家長登入測試結果',
        data: data
      });

    } catch (error) {
      console.error('家長登入測試錯誤:', error);
      setResult({ error: error instanceof Error ? error.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-[#4B4036] mb-6">家長-學生連結測試</h1>

      {/* 創建連結表單 */}
      <HanamiCard>
        <h2 className="text-xl font-semibold text-[#4B4036] mb-4">創建家長-學生連結</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[#2B3A3B] mb-2">選擇家長</label>
            <HanamiSelect
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              options={parents.map(parent => ({
                value: parent.id,
                label: `${parent.parent_name} (${parent.parent_email})`
              }))}
              placeholder="選擇家長"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2B3A3B] mb-2">選擇學生</label>
            <HanamiSelect
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              options={students.map(student => ({
                value: student.id,
                label: `${student.full_name} (${student.course_type})`
              }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[#2B3A3B] mb-2">關係類型</label>
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
              id="primaryContact"
              checked={isPrimaryContact}
              onChange={(e) => setIsPrimaryContact(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="primaryContact" className="text-sm text-[#2B3A3B]">
              主要聯絡人
            </label>
          </div>
        </div>

        <HanamiButton
          onClick={createLink}
          disabled={loading || !selectedParentId || !selectedStudentId}
          className="w-full"
        >
          {loading ? '創建中...' : '創建連結'}
        </HanamiButton>
      </HanamiCard>

      {/* 家長列表 */}
      <HanamiCard>
        <h2 className="text-xl font-semibold text-[#4B4036] mb-4">家長列表 ({parents.length})</h2>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {parents.map(parent => (
            <div key={parent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-[#4B4036]">{parent.parent_name}</div>
                <div className="text-sm text-[#2B3A3B]">{parent.parent_email}</div>
                <div className="text-sm text-[#2B3A3B]">{parent.parent_phone}</div>
              </div>
              <div className="flex space-x-2">
                <HanamiButton
                  variant="secondary"
                  size="sm"
                  onClick={() => testParentLogin(parent.parent_email)}
                  disabled={loading}
                >
                  測試登入
                </HanamiButton>
              </div>
            </div>
          ))}
        </div>
      </HanamiCard>

      {/* 學生列表 */}
      <HanamiCard>
        <h2 className="text-xl font-semibold text-[#4B4036] mb-4">學生列表 ({students.length})</h2>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {students.map(student => (
            <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-[#4B4036]">{student.full_name}</div>
                <div className="text-sm text-[#2B3A3B]">{student.course_type}</div>
                <div className="text-sm text-[#2B3A3B]">年齡: {student.student_age}歲</div>
              </div>
            </div>
          ))}
        </div>
      </HanamiCard>

      {/* 連結列表 */}
      <HanamiCard>
        <h2 className="text-xl font-semibold text-[#4B4036] mb-4">現有連結 ({links.length})</h2>
        
        <div className="space-y-2">
          {links.map(link => (
            <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-[#4B4036]">
                  {link.parent_name} ↔ {link.student_name}
                </div>
                <div className="text-sm text-[#2B3A3B]">
                  關係: {link.relationship_type === 'parent' ? '家長' : 
                         link.relationship_type === 'guardian' ? '監護人' : '緊急聯絡人'}
                  {link.is_primary_contact && ' (主要聯絡人)'}
                </div>
              </div>
              <HanamiButton
                variant="danger"
                size="sm"
                onClick={() => deleteLink(link.id)}
                disabled={loading}
              >
                刪除
              </HanamiButton>
            </div>
          ))}
        </div>
      </HanamiCard>

      {/* 結果顯示 */}
      {result && (
        <HanamiCard>
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">操作結果</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 