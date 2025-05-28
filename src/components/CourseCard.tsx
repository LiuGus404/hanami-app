type Props = {
  icon: string;
  title: string;
  description: string;
  bgColor?: string;
};

export default function CourseCard({ icon, title, description, bgColor = '#FFD59A' }: Props) {
  return (
    <div className="rounded-2xl p-4 shadow flex flex-col items-center" style={{ background: bgColor }}>
      <img src={icon} alt={title} className="w-14 h-14 mb-2" />
      <div className="text-lg font-bold text-brown-700 mb-1">{title}</div>
      <div className="text-brown-500 text-sm text-center">{description}</div>
    </div>
  );
} 