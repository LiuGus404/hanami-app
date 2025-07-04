// /app/admin/students/add/page.tsx
import AddRegularStudentForm from '@/components/AddRegularStudentForm'
import BackButton from '@/components/ui/BackButton'

export default function AddStudentPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F2] px-6 py-10 font-['Quicksand',_sans-serif]">
      {/* 返回按鈕 */}
      <div className="mb-6">
        <BackButton href="/admin/students" label="返回學生管理" />
      </div>
      
      <AddRegularStudentForm />
    </div>
  )
}