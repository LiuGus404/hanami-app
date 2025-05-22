import Image from 'next/image';
import FeatureMenu from '@/components/FeatureMenu';
import CourseCard from '@/components/CourseCard';
import TestimonialCard from '@/components/TestimonialCard';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-[#FFF9F2] min-h-screen pb-10 flex flex-col">
      {/* 歡迎區 */}
      <section className="text-center mt-6">
        <h1 className="text-3xl font-bold text-brown-700">Hello!</h1>
        <p className="text-sm text-brown-500">
          歡迎來到 Hanami 音樂，讓我們一起陪孩子快樂成長 🎶
        </p>
      </section>

      {/* 開心學習插圖 */}
      <div className="mt-4 px-6">
        <img
          src="/illustrations/kids-learning-happy.png"
          alt="開心學習插圖"
          className="w-full rounded-2xl shadow-md"
        />
      </div>

      {/* 搜尋欄 */}
      <div className="flex justify-center mt-6 px-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search"
            className="w-full rounded-full border border-[#E0E0E0] py-2 pl-5 pr-10 text-brown-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <img src="/icons/search.png" alt="search" className="w-5 h-5 opacity-60" />
          </span>
        </div>
      </div>

      {/* 功能選單 */}
      <FeatureMenu />

      {/* 限時優惠 Banner */}
      <div className="mt-6 mx-4 rounded-xl bg-[#D2E0AA] px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <img src="/icons/owl.png" className="w-6 h-6" />
          <div className="text-brown-700 font-semibold">
            限時優惠：10% off 所有課程
          </div>
        </div>
      </div>

      {/* 推薦課程與商品 */}
      <section className="mt-8 px-4">
        <h2 className="text-xl font-semibold text-brown-700 mb-2">課程與商品</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CourseCard
            icon="/icons/star.png"
            title="Pre-K Class"
            description="適合3-6歲，啟發音樂潛能，快樂學習。"
            bgColor="#FFD59A"
          />
          <CourseCard
            icon="/icons/guitar.png"
            title="Recorded Songs"
            description="精選錄音教材，隨時隨地快樂唱。"
            bgColor="#BFE3FF"
          />
        </div>
      </section>

      {/* 更多優惠專區 */}
      <section className="mt-10 px-4">
        <h2 className="text-xl font-semibold text-brown-700 mb-2">🎁 更多精彩優惠</h2>
        <ul className="space-y-3">
          <li className="bg-[#FCCEB4] rounded-lg p-3 shadow-sm">🎶 購買 5 堂送 1 堂</li>
          <li className="bg-[#ABD7FB] rounded-lg p-3 shadow-sm">🎨 報讀音樂班送色彩遊戲組</li>
          <li className="bg-[#F9F2EF] rounded-lg p-3 shadow-sm">👨‍👩‍👧‍👦 推薦朋友再享課程折扣</li>
        </ul>
      </section>

      {/* 家長好評 Testimonials */}
      <section className="mt-10 px-4">
        <h2 className="text-xl font-semibold text-brown-700 mb-2">🌟 家長真心推薦</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TestimonialCard
            name="小彤媽媽"
            comment="第一次見到女兒咁投入唱歌，真係感動～"
            avatar="/avatars/mom1.png"
          />
          <TestimonialCard
            name="浩浩爸爸"
            comment="老師好有愛心，小朋友學得開心又專心。"
            avatar="/avatars/dad1.png"
          />
          <TestimonialCard
            name="思樂媽媽"
            comment="本來怕分離，依家返學都笑笑口！"
            avatar="/avatars/mom2.png"
          />
        </div>
      </section>

      {/* 底部登入導引 */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 py-3 flex justify-center shadow-inner z-10">
        <Link href="/admin/login">
          <button className="px-6 py-2 rounded-full bg-[#FFD59A] text-brown-700 font-bold shadow hover:bg-[#FFC266] transition">
            管理員登入
          </button>
        </Link>
      </div>
    </div>
  );
} 