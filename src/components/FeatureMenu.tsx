import Link from 'next/link';

const features = [
  { icon: '/icons/star.png', label: 'Dashboard', href: '/dashboard' },
  { icon: '/icons/bear.png', label: 'Calendar', href: '/calendar' },
  { icon: '/icons/music.png', label: 'News', href: '/news' },
  { icon: '/icons/bunny.png', label: 'Store', href: '/store' },
];

export default function FeatureMenu() {
  return (
    <nav className="flex justify-around mt-6 mb-2 px-4">
      {features.map((f) => (
        <Link key={f.label} className="flex flex-col items-center" href={f.href}>
          <img alt={f.label} className="w-12 h-12 mb-1" src={f.icon} />
          <span className="text-brown-700 text-sm font-medium">{f.label}</span>
        </Link>
      ))}
    </nav>
  );
} 