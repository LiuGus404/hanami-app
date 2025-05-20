// /app/admin/students/add/page.tsx
import AddRegularStudentForm from '@/components/AddRegularStudentForm'

export default function AddStudentPage() {
  return (
    <div className="min-h-screen bg-[#FFFCEB] px-6 py-10 font-['Quicksand',_sans-serif]">
      <AddRegularStudentForm />
    </div>
  )
}