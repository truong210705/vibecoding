import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import portraitPhuocTrucReunited from '../assets/images/phuoc_truc_reunited_1792344680888.jpg';
import portraitBossOfficer from '../assets/images/boss_patrol_officer_1792342260575.jpg';
import mapLevel1Img from '../assets/images/level1_song_buong_pixel_1792345673840.jpg';
import mapLevel2Img from '../assets/images/level2_pho_huyen_csgt_1792347208571.jpg';
import level4XeMayNgaImg from '../assets/images/level4_xe_may_nga_1792348181254.jpg';
import mapLevel4SaigonImg from '../assets/images/level4_saigon_night_map_1792349469369.jpg';
import {
  getPhuocAvatar,
  subscribePhuocAvatar,
  getBaHoLongAvatar,
  subscribeBaHoLongAvatar,
} from '../utils/avatarManager';
import { AvatarUploaderButton } from './AvatarUploaderButton';

interface StoryCutsceneProps {
  onStartPlaying: () => void;
  specificScene?: 'intro' | 'level2_briefing' | 'level3_briefing' | 'level4_briefing';
}

export const StoryCutscene: React.FC<StoryCutsceneProps> = ({
  onStartPlaying,
  specificScene = 'intro',
}) => {
  const [phuocAvatar, setPhuocAvatarState] = useState<string>(getPhuocAvatar());
  const [baHoLongAvatar, setBaHoLongAvatarState] = useState<string>(getBaHoLongAvatar());

  useEffect(() => {
    const unsubPhuoc = subscribePhuocAvatar((newUrl) => setPhuocAvatarState(newUrl));
    const unsubBaHo = subscribeBaHoLongAvatar((newUrl) => setBaHoLongAvatarState(newUrl));
    return () => {
      unsubPhuoc();
      unsubBaHo();
    };
  }, []);

  const introSlides = [
    {
      title: 'HỒI 1: CHÀNG TRAI PHƯỚC BÊN CẦU SÔNG BUÔNG',
      subtitle: 'Chàng trai chân chất hàng ngày vui đùa cùng rái cá',
      image: phuocAvatar,
      alt: 'Chàng trai Phước bên Cầu Sông Buông',
      content: (
        <>
          <p className="mb-2">
            Tại vùng đất hiền hòa ven <span className="text-amber-300 font-bold">Cầu Sông Buông</span> (Đồng Nai),
            chàng thanh niên tên <span className="text-emerald-300 font-bold">Phước</span> đeo kính cận, dáng vẻ
            thư sinh nhưng hào sảng, quanh năm chèo ghe chài lưới và bầu bạn cùng bầy rái cá tinh nghịch.
          </p>
          <p className="mb-3">
            Phước đem lòng thương thầm cô em gái hàng xóm tên <span className="text-pink-300 font-bold">Trúc</span>.
            Cả hai sớm tối bên nhau trao lời hứa hẹn thắm thiết.
          </p>
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
            <span className="text-xs text-stone-400">Ảnh đại diện Phước:</span>
            <AvatarUploaderButton target="phuoc" variant="full" />
          </div>
        </>
      ),
    },
    {
      title: 'HỒI 2: TAI HỌA TỪ BÁ HỘ LONG',
      subtitle: 'Kẻ quyền thế giàu có cướp người vô tội',
      image: baHoLongAvatar,
      alt: 'Bá hộ Long',
      content: (
        <>
          <p className="mb-2">
            Xui xẻo thay, <span className="text-purple-400 font-bold">Bá Hộ Long</span> – một phú hộ giàu có trẻ tuổi
            khét tiếng trong vùng vô tình để mắt tới nhan sắc của Trúc.
          </p>
          <p className="mb-3">
            Hắn sai gia đinh ập tới bắt Trúc về Dinh thự để ép làm thiếp! Thậm chí đàn rái cá sông Buông cũng bị tay sai
            kích động, chặn mọi ngả đường không cho ai cứu viện!
          </p>
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
            <span className="text-xs text-stone-400">Ảnh đại diện Bá Hộ Long:</span>
            <AvatarUploaderButton target="baholong" variant="full" />
          </div>
        </>
      ),
    },
    {
      title: 'BẢN ĐỒ MÀN 1: CẦU SÔNG BUÔNG',
      subtitle: 'Phong cảnh làng quê sông nước & bầy rái cá tinh nghịch',
      image: mapLevel1Img,
      alt: 'Bản đồ Màn 1 Cầu Sông Buông',
      content: (
        <>
          <p className="mb-2">
            Toàn cảnh <span className="text-amber-300 font-bold">Cầu Sông Buông</span>: từ những nếp nhà sàn mái lá tranh bên rặng dừa, bến đò hoa súng cho tới chiếc cầu tre bắc ngang dòng sông biếc lấp lánh.
          </p>
          <p className="mb-2">
            Bầy rái cá lông nâu mắt sáng đang tuần tra trên bờ và mặt cầu.
          </p>
          <p className="text-emerald-300 font-medium text-xs bg-emerald-950/40 p-2 rounded border border-emerald-500/30">
            💡 Mẹo: Nhảy đạp lên đầu rái cá để nảy cao, chạm vào Trái Tim ❤️ để hồi máu và cộng thêm 10 giây thời gian!
          </p>
        </>
      ),
    },
    {
      title: 'HỒI 3: PHƯỚC QUYẾT TÂM LÊN ĐƯỜNG GIẢI CỨU TRÚC',
      subtitle: 'Vượt sông Buông & Băng qua mọi hiểm nguy',
      image: portraitPhuocTrucReunited,
      alt: 'Quyết tâm cứu Trúc',
      content: (
        <>
          <p className="mb-2">
            Nhìn người mình thương bị bắt cóc, Phước lập tức khoác balo lên đường vượt Cầu Sông Buông!
          </p>
          <p className="mb-2">
            <strong>Màn 1:</strong> Phước vượt sông Buông, thu thập tiền vàng, nhặt trái tim hồi máu và nảy qua bầy rái cá!
          </p>
          <p>
            <strong>Màn 2:</strong> Chạm trán <span className="text-sky-300 font-bold">Mini-boss Công An</span> có súng! Phước phải canh thời gian 1s hồi chiêu để bắn lý lẽ <span className="text-amber-300 font-extrabold underline">"BECAUSE!"</span> giải vây!
          </p>
        </>
      ),
    },
  ];

  const level2Slides = [
    {
      title: 'CỬA ẢI PHỐ HUYỆN: CHẠM TRÁN MINI-BOSS CÔNG AN',
      subtitle: 'Né đạn súng lục & Phản đòn bằng lý lẽ đanh thép "BECAUSE"!',
      image: mapLevel2Img,
      alt: 'Bản đồ Màn 2 Phố Huyện & Trạm CSGT',
      content: (
        <>
          <p className="mb-2">
            Phước đã tiến vào <span className="text-amber-300 font-bold">Phố Huyện</span>: dãy quán Phở Bò, cửa hàng Tạp Hóa mái tôn và Trạm CSGT có xe mô tô đặc chủng!
          </p>
          <p className="mb-2 text-rose-300 font-bold bg-rose-950/40 p-2 rounded border border-rose-500/30">
            ⚠️ Chú ý: Trưởng trạm CSGT nay được trang bị <span className="underline">SÚNG LỤC BẮN ĐẠN LIÊN THANH</span> cực kỳ nguy hiểm! Hãy leo lên giàn giáo hoặc nhảy né đạn!
          </p>
          <p className="mb-2 text-amber-200 bg-amber-950/60 p-2.5 rounded-lg border border-amber-500/40 text-xs">
            ⚡ <strong>Thời gian hồi chiêu 1 Giây:</strong> Mỗi lần Phước hô <span className="font-extrabold text-amber-300">"BECAUSE!"</span> phải mất 1 giây để thu hồi khí lực mới dùng lại được. Hãy canh thời điểm chính xác!
          </p>
          <p className="text-emerald-300 text-xs bg-emerald-950/40 p-2 rounded border border-emerald-500/30">
            ❤️ <strong>Hồi Máu:</strong> Chạm vào các Trái Tim trên nóc Tạp Hóa và giàn giáo để lập tức hồi máu và cộng thêm 10 giây!
          </p>
        </>
      ),
    },
  ];

  const level3Slides = [
    {
      title: 'MÀN 3: ĐỘT NHẬP CỔNG DINH BÁ HỘ LONG',
      subtitle: 'Bẫy đầm sen hiểm trở & Bầy hộ vệ rái cá thiện chiến',
      image: baHoLongAvatar,
      alt: 'Cổng Dinh Bá Hộ Long',
      content: (
        <>
          <p className="mb-2">
            Vượt qua Phố Huyện, Phước đã tiếp cận bờ tường và cổng ngoài của <span className="text-purple-300 font-bold">Dinh Cơ Bá Hộ Long</span>!
          </p>
          <p className="mb-2">
            Khuôn viên dinh cơ được bố trí dày đặc bè bèo di động, bẫy rào chắn và những chú rái cá hộ vệ nhảy chồm hung hăng.
          </p>
          <p className="bg-amber-950/60 p-2.5 rounded border border-amber-500/40 text-xs text-amber-200">
            💡 <strong>Mẹo vượt ải:</strong> Sử dụng đòn hô <span className="font-bold text-amber-300">BECAUSE!</span> để làm choáng lính gác từ xa và nhặt Trái Tim hồi máu trên mái ngói!
          </p>
        </>
      ),
    },
  ];

  const level4Slides = [
    {
      title: 'BẢN ĐỒ MÀN 4: ĐẠI LỘ SÀI GÒN & CẦU ĐÊM TRƯỜNG TIỀN',
      subtitle: 'Bản đồ cao tốc về đêm rực rỡ Landmark 81, Bitexco & Cú ngã xe của Long',
      image: mapLevel4SaigonImg,
      alt: 'Bản đồ Màn 4 Đại Lộ Sài Gòn Đêm',
      content: (
        <>
          <p className="mb-2">
            Phước đã rượt đuổi <span className="text-purple-300 font-bold">Bá Hộ Long</span> tới tận <span className="text-amber-300 font-bold">Đại Lộ Cầu Đêm Sài Gòn</span> – nơi có các tòa tháp Landmark 81, Bitexco tỏa sáng bên sông Sài Gòn!
          </p>
          <p className="mb-2">
            Do quá hoảng sợ trước bước chân thần tốc của Phước, chiếc xe máy của Long trượt bánh lật nhào bên lan can dải phân cách cầu cao tốc!
          </p>
          <p className="mb-2 text-pink-200">
            Trúc được dìu nằm nghỉ an toàn bên lối đi bộ cạnh hàng rào cảnh báo. Long đứng dậy lăm lăm vũ khí chuẩn bị tử chiến!
          </p>
        </>
      ),
    },
    {
      title: 'QUYẾT CHIẾN BÁ HỘ LONG: XÚC XẮC MA THUẬT & BÃO NÉM TIỀN ĐÔ',
      subtitle: 'Long tung xúc xắc và bão tiền đô – Phước phản đòn bằng "BECAUSE!" (hồi chiêu 2.5s)',
      image: baHoLongAvatar,
      alt: 'Bá Hộ Long Streetwear LAS Model',
      content: (
        <>
          <p className="mb-2 text-rose-300 font-bold bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
            🎲 <strong>Vũ khí Xúc Xắc:</strong> Long tung các cặp xúc xắc nảy lách cách trên mặt đường đại lộ, sát thương cao!
          </p>
          <p className="mb-2 text-emerald-300 font-bold bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
            💵 <strong>Chiêu thức Mới - Ném Tiền Đô La:</strong> Long cậy giàu có, liên tục vung bão tiền đô la $100 và các xấp tiền bay rợp trời để cản bước Phước!
          </p>
          <p className="mb-2 text-amber-200 bg-amber-950/60 p-2.5 rounded-lg border border-amber-500/40 text-xs">
            🗣️ <strong>Chiêu thức "BECAUSE!":</strong> Phước phản đòn bằng tiếng hô duy nhất <span className="font-extrabold text-amber-300">"BECAUSE!"</span> (thời gian mỗi lần tung chiêu là 2.5 giây, chỉ hô "BECAUSE!") để đập tan bão tiền và hạ gục Long!
          </p>
          <p className="text-pink-300 text-xs bg-pink-950/40 p-2 rounded border border-pink-500/30">
            ❤️ <strong>Hồi Máu:</strong> Chạm vào các Trái Tim trên các giàn giáo cầu để hồi phục HP và cộng thêm 10 giây thời gian!
          </p>
        </>
      ),
    },
  ];

  let slides = introSlides;
  if (specificScene === 'level2_briefing') slides = level2Slides;
  else if (specificScene === 'level3_briefing') slides = level3Slides;
  else if (specificScene === 'level4_briefing') slides = level4Slides;
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onStartPlaying();
    }
  };

  const active = slides[currentSlide];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-md z-30 select-none">
      <div className="w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Left Side: Real Character / Story Illustration */}
        <div className="relative w-full md:w-5/12 h-64 md:h-auto min-h-[320px] bg-stone-950 flex items-center justify-center overflow-hidden p-2">
          <img
            src={active.image}
            alt={active.alt}
            className="w-full h-full object-contain max-h-[360px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-stone-900/40 pointer-events-none" />
        </div>

        {/* Right Side: Narrative Text */}
        <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                CỐT TRUYỆN TRANH
              </span>
              <div className="flex items-center gap-2">
                <span>
                  {currentSlide + 1} / {slides.length}
                </span>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-stone-100 tracking-tight mb-1">
              {active.title}
            </h2>
            <p className="text-xs text-stone-400 mb-4">{active.subtitle}</p>

            <div className="text-stone-300 text-sm md:text-base leading-relaxed space-y-2">
              {active.content}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between">
            <button
              onClick={onStartPlaying}
              className="text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              Bỏ qua giới thiệu
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>{currentSlide < slides.length - 1 ? 'Tiếp theo' : 'Vào Màn Chơi'}</span>
              {currentSlide < slides.length - 1 ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
