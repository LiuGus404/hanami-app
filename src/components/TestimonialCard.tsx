type Props = {
  name: string;
  comment: string;
  avatar: string;
};

export default function TestimonialCard({ name, comment, avatar }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
      <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
      <div>
        <div className="font-semibold text-brown-700">{name}</div>
        <div className="text-brown-500 text-sm">{comment}</div>
      </div>
    </div>
  );
} 