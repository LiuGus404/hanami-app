type Props = {
  name: string;
  comment: string;
  avatar: string;
};

export default function TestimonialCard({ name, comment, avatar }: Props) {
  const isEmoji = avatar.length <= 2; // 簡單判斷是否為 emoji
  
  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
      {isEmoji ? (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
          {avatar}
        </div>
      ) : (
        <img alt={name} className="w-12 h-12 rounded-full object-cover" src={avatar} />
      )}
      <div>
        <div className="font-semibold text-brown-700">{name}</div>
        <div className="text-brown-500 text-sm">{comment}</div>
      </div>
    </div>
  );
} 