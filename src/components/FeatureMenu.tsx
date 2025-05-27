import Link from 'next/link';
import Image from 'next/image';

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
        <Link key={f.label} href={f.href} className="flex flex-col items-center">
          <div className="relative w-12 h-12 mb-1">
            <Image
              src={f.icon}
              alt={f.label}
              fill
              sizes="(max-width: 768px) 48px, 48px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-brown-700 text-sm font-medium">{f.label}</span>
        </Link>
      ))}
    </nav>
  );
} 