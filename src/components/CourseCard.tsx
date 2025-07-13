type Props = {
  icon: string;
  title: string;
  description: string;
  bgColor?: string;
};

export default function CourseCard({ icon, title, description, bgColor = '#FFD59A' }: Props) {
  const isEmoji = icon.length <= 2; // 簡單判斷是否為 emoji
  
  return (
    <div className="rounded-2xl p-4 shadow flex flex-col items-center" style={{ background: bgColor }}>
      {isEmoji ? (
        <div className="text-4xl mb-2">{icon}</div>
      ) : (
        <img alt={title} className="w-14 h-14 mb-2" src={icon} />
      )}
      <div className="text-lg font-bold text-brown-700 mb-1">{title}</div>
      <div className="text-brown-500 text-sm text-center">{description}</div>
    </div>
  );
} 