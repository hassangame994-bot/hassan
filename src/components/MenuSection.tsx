import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Flame, 
  Shield, 
  Star, 
  Heart, 
  ShoppingBag, 
  Clock, 
  Sparkles, 
  MapPin, 
  Utensils, 
  ChefHat, 
  CheckCircle, 
  Calendar, 
  Users, 
  Phone, 
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Award,
  ChevronRight,
  ChevronLeft,
  DollarSign
} from 'lucide-react';
import { MenuItem, Category } from '../types.js';

interface MenuSectionProps {
  menu: MenuItem[];
  categories: Category[];
  lang: 'ar' | 'en';
  onAddToCart: (item: MenuItem) => void;
}

export default function MenuSection({ menu, categories, lang, onAddToCart }: MenuSectionProps) {
  const isAr = lang === 'ar';
  
  // States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Interactive Simulator State
  const [feastScale, setFeastScale] = useState<'individual' | 'family' | 'royal'>('family');
  
  // Hero Carousel State
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  
  // Reservation States
  const [reserveName, setReserveName] = useState('');
  const [reservePhone, setReservePhone] = useState('');
  const [reserveGuests, setReserveGuests] = useState('4');
  const [reserveDate, setReserveDate] = useState('');
  const [reserveNotes, setReserveNotes] = useState('');
  const [reservationSuccess, setReservationSuccess] = useState(false);

  // Review Carousel State
  const [activeReviewSlide, setActiveReviewSlide] = useState(0);

  // Custom Categories including visual emojis
  const cats = [
    { id: 'all', nameAr: 'كل الأكلات 🍽️', nameEn: 'All Dishes 🍽️' },
    ...categories.map(c => {
      let emoji = '🍲';
      if (c.id === 'grills') emoji = '🍖';
      if (c.id === 'pots') emoji = '🥘';
      if (c.id === 'pastries') emoji = '🫓';
      if (c.id === 'appetizers') emoji = '🥗';
      if (c.id === 'desserts') emoji = '🍰';
      if (c.id === 'drinks') emoji = '🥤';
      return {
        ...c,
        nameAr: `${c.nameAr} ${emoji}`,
        nameEn: `${c.nameEn} ${emoji}`
      };
    })
  ];

  // Featured Slides for the hero section (strictly no females in any illustration)
  const heroSlides = [
    {
      titleAr: 'أكل بلدي على أصوله الفلاحية المورقة',
      titleEn: 'Egyptian Heritage Cuisine at its Purest',
      descAr: 'مطبخ أبو قورة يقدم لكم روائع الريف المصري والمشويات المجهزة بالسمن البلدي الطبيعي 100% واللحوم الطازجة يومياً من مزارعنا.',
      descEn: 'Abu Qura brings you the finest masterpieces of the Egyptian countryside, prepared with 100% natural baladi ghee and fresh farm-sourced meats.',
      item: menu.find(i => i.id === 'm1') || menu[0],
      bgGradient: 'from-[#1E1F11] via-[#0E0F0A] to-[#040403]',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
      badgeAr: 'مشويات أبو قورة المميزة 🔥',
      badgeEn: 'Abu Qura Grills 🔥'
    },
    {
      titleAr: 'حمام محشي فلاحي بلدي محمر بالسمن الأصيل',
      titleEn: 'Signature Stuffed Baladi Pigeon Feast',
      descAr: 'جوز من الحمام البلدي الفاخر، محشي بالأرز المتبل بخلطة الكبد والقوانص والبهارات المعتقة، محمر لمقرمشة ذهبية ساحرة.',
      descEn: 'A luxury pair of tender pigeons, stuffed with richly seasoned giblet rice, fried to a perfect golden crunch in pure farmhouse butter.',
      item: menu.find(i => i.id === 'm6') || menu[0],
      bgGradient: 'from-[#251812] via-[#0E0A08] to-[#030202]',
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop&q=80',
      badgeAr: 'روعة الطواجن الفلاحي 👑',
      badgeEn: 'Traditional Claypots 👑'
    },
    {
      titleAr: 'فطير مشلتت مورق يرجعك لزمان الطيبين',
      titleEn: 'Flaky Layered Baladi Feteer Meshaltet',
      descAr: 'فطيرة فلاحي مورقة بالسمن البلدي النقي، تقدم ساخنة مقرمشة من الفرن مباشرة مع العسل الجبلي والقشطة والجبن الفلاحي القديم.',
      descEn: 'An authentic layered flaky pastry made with premium farmhouse ghee, baked hot in woodfire ovens. Served with pure honey and rich clotted cream.',
      item: menu.find(i => i.id === 'm5') || menu[0],
      bgGradient: 'from-[#1C1811] via-[#0D0B08] to-[#030302]',
      image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&auto=format&fit=crop&q=80',
      badgeAr: 'مخبوزات الفرن البلدي 🫓',
      badgeEn: 'Baladi Woodfire Oven 🫓'
    }
  ];

  // Auto scroll for hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide(prev => (prev + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const filteredMenu = menu.filter((item) => {
    const matchesSearch = 
      item.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      item.descriptionAr.toLowerCase().includes(search.toLowerCase()) ||
      item.descriptionEn.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleBookTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveName || !reservePhone) return;
    setReservationSuccess(true);
    setTimeout(() => {
      setReservationSuccess(false);
      setReserveName('');
      setReservePhone('');
      setReserveNotes('');
    }, 4500);
  };

  const activeSlide = heroSlides[activeHeroSlide];

  // Verified Client Testimonials (All names & photos are strictly male/neutral as requested)
  const clientReviews = [
    {
      nameAr: 'أحمد الشربيني',
      nameEn: 'Ahmed El-Sherbini',
      locationAr: 'الشيخ زايد',
      locationEn: 'Sheikh Zayed',
      stars: 5,
      avatarInitials: 'أش',
      avatarBg: 'bg-[#3D4021]',
      textAr: 'كباب وكفتة فظيعة واللحمة بلدي واضحة جداً وطعمها يدوب في البق. الفطير المشلتت الساخن مع العسل والقشطة يرجعك لأيام زمان والريف الحقيقي. التعبئة نظيفة جداً والأكل بيوصل بيغلي.',
      textEn: 'Outstanding kebab and kofta. The meat is genuinely fresh and baladi, melting right in your mouth. The hot layered Feteer with honey takes you back to real countryside memories.'
    },
    {
      nameAr: 'المستشار محمد قورة',
      nameEn: 'Judge Mohamed Qura',
      locationAr: 'الدقي، الجيزة',
      locationEn: 'Dokki, Giza',
      stars: 5,
      avatarInitials: 'مح',
      avatarBg: 'bg-[#D97706]',
      textAr: 'طاجن بامية بالموزة الضأن وحمام محشي ملهومش مثيل في مصر. السمن الفلاحي طعمه غني ومبهر، والتوصيل سريع جداً. كل عزوماتي الرسمية بطلبها من أبو قورة ودايماً بيشرفوني قدام ضيوفي.',
      textEn: 'Okra claypot with lamb shank and stuffed pigeons have absolutely no equal in Egypt. The rich local ghee aroma is divine. They always honor my banquets in front of my prestigious guests.'
    },
    {
      nameAr: 'المهندس كريم عبد اللطيف',
      nameEn: 'Eng. Karim Abdel-Latif',
      locationAr: 'التجمع الخامس',
      locationEn: 'Fifth Settlement',
      stars: 5,
      avatarInitials: 'كع',
      avatarBg: 'bg-[#C2410C]',
      textAr: 'جودة اللحوم بلدي مئة بالمية والتوابل موزونة بالملي غرام. فريق التنسيق الهاتفي محترم جداً والتوصيل سريع مع الحفاظ على الحرارة العالية للأكل بفضل الأظرف الحرارية المبرشمة.',
      textEn: 'The meat is top-tier 100% fresh, and seasoning is carefully weighed to perfection. Phone support is highly courteous, and delivery keeps food boiling hot inside hermetically sealed thermal envelopes.'
    },
    {
      nameAr: 'الأستاذ مصطفى الهواري',
      nameEn: 'Mostafa El-Hawary',
      locationAr: 'حدائق أكتوبر',
      locationEn: 'October Gardens',
      stars: 5,
      avatarInitials: 'مص',
      avatarBg: 'bg-emerald-700',
      textAr: 'بصراحة هذا المطعم فخر للأكلات الشعبية والفلاحية في مصر. نكهة شوي الفحم ممتازة، والأسعار مقابل الخدمة الكريمة ممتازة جداً. الفطير بالسمن البلدي يستحق التقييم الملكي.',
      textEn: 'Honestly, this is a masterpiece of traditional and country cooking in Egypt. The charcoal grill aroma is outstanding, and prices for such noble hospitality are highly reasonable.'
    }
  ];

  return (
    <div className="w-full space-y-24" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* SECTION 1: WORLD-CLASS MULTI-SLIDE INTERACTIVE HERO CAROUSEL */}
      <div className="relative overflow-hidden rounded-[3rem] shadow-[0_24px_80px_rgba(13,14,9,0.4)] border border-[#3D4021]/20 transition-all duration-700">
        
        {/* Dynamic sliding background panel */}
        <div className={`absolute inset-0 bg-gradient-to-br ${activeSlide.bgGradient} transition-all duration-700`}></div>
        
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#D97706_0.5px,transparent_0.5px)] [background-size:20px_20px] opacity-[0.05] pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-brand-gold/15 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-brand-clay/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Outer Banner Content */}
        <div className="relative max-w-7xl mx-auto px-6 sm:px-16 py-16 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 z-10">
          
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-right space-y-6 max-w-2xl">
            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-white/5 border border-white/10 text-brand-gold text-[10px] sm:text-xs font-black shadow-xs tracking-wider">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>
                {isAr ? activeSlide.badgeAr : activeSlide.badgeEn}
              </span>
            </div>

            {/* Main Premium Display Title */}
            <h1 className="text-4xl sm:text-7xl font-black tracking-tight leading-[1.1] text-white font-serif transition-all duration-500">
              {isAr ? activeSlide.titleAr : activeSlide.titleEn}
            </h1>

            {/* Subtitle */}
            <p className="text-gray-300 font-medium text-xs sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 transition-all duration-500">
              {isAr ? activeSlide.descAr : activeSlide.descEn}
            </p>

            {/* Trust Ratings Badge */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-extrabold text-gray-300 pt-2">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                <span className="text-amber-400 text-sm">★★★★★</span>
                <span className="text-brand-gold font-black ml-1">4.9/5.0</span>
              </div>
              <span className="text-gray-400">
                {isAr 
                  ? 'ثقة مطلقة من أكثر من ٢٥ ألف عميل وعائلة بمصر 🌟' 
                  : 'Highly rated by 25k+ loyal clients & families 🌟'}
              </span>
            </div>

            {/* Interactive Navigation Trigger Button & Call-to-actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <button
                onClick={() => {
                  if (activeSlide.item) {
                    onAddToCart(activeSlide.item);
                  }
                }}
                className="px-8 py-5 rounded-2xl bg-brand-gold hover:bg-[#F59E0B] text-[#0A0907] font-black text-sm shadow-lg shadow-brand-gold/25 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5 shrink-0" />
                <span>{isAr ? 'اطلب هذا الصنف الفاخر الآن' : 'Order This Delicacy Now'}</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('portion-simulator-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-brand-gold animate-pulse" />
                <span>{isAr ? 'اختر حجم العزيمة والمواصفات' : 'Configure Your Feast Size'}</span>
              </button>
            </div>
          </div>

          {/* Large circular spotlight food layout with interactive overlay elements (strictly no females shown) */}
          <div className="flex-1 relative shrink-0 w-full max-w-[420px] h-[340px] sm:h-[420px] flex items-center justify-center">
            
            {/* Glow backing */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-gold/40 to-brand-clay/30 rounded-full blur-[40px] animate-pulse"></div>
            
            {/* Main high-contrast platter plate */}
            <div className="relative w-72 h-72 sm:w-92 sm:h-92 rounded-full p-3 bg-gradient-to-tr from-brand-gold via-yellow-600 to-brand-clay shadow-2xl z-10 transition-transform duration-500 hover:rotate-3">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#151611] border-[6px] border-[#0D0E09]">
                <img 
                  src={activeSlide.image} 
                  alt="مأكولات أبو قورة" 
                  className="w-full h-full object-cover select-none pointer-events-none transition-all duration-700 scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Float floating price bubble on plate */}
              <div className="absolute -bottom-2 -right-2 bg-brand-clay text-white border-4 border-[#0D0E09] rounded-2xl px-4 py-2 text-xs font-black shadow-xl flex flex-col items-center">
                <span className="text-[9px] text-orange-200 uppercase tracking-widest">{isAr ? 'السعر' : 'ONLY'}</span>
                <span className="text-base font-black font-sans">{activeSlide.item?.price} <span className="text-[10px] font-bold">{isAr ? 'ج.م' : 'EGP'}</span></span>
              </div>
            </div>

            {/* Micro ingredient badge floating */}
            <div className="absolute top-10 -left-6 bg-[#1A1C12]/95 border border-brand-gold/30 rounded-2xl p-3.5 shadow-2xl z-20 hidden sm:flex items-center gap-2.5">
              <span className="text-xl">🔥</span>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-bold">{isAr ? 'مطهو طازج' : 'Live Charcoal Cooked'}</span>
                <span className="text-xs font-black text-brand-gold">{isAr ? 'سمن بلدي نقي 100%' : '100% Organic Ghee'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Carousel indicators dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveHeroSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                activeHeroSlide === index ? 'bg-brand-gold w-8' : 'bg-white/40 hover:bg-white/70'
              }`}
              title={`Slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Carousel left/right arrow controllers */}
        <button
          onClick={() => setActiveHeroSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute top-1/2 -translate-y-1/2 left-4 z-20 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white border border-white/10 transition-all cursor-pointer hidden sm:block"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveHeroSlide(prev => (prev + 1) % heroSlides.length)}
          className="absolute top-1/2 -translate-y-1/2 right-4 z-20 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white border border-white/10 transition-all cursor-pointer hidden sm:block"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

      </div>

      {/* SECTION 2: HIGH-CONTRAST HISTORICAL ACHIEVEMENTS BAR (Inspired by Image 4) */}
      <div className="bg-brand-primary rounded-[2.5rem] py-10 px-8 sm:px-16 text-white border border-brand-gold/20 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-primary-light/40 to-transparent pointer-events-none"></div>
        <div className="relative max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
          
          <div className="space-y-1 pb-4 md:pb-0">
            <span className="text-4xl sm:text-5xl font-serif font-black text-brand-gold block">15+</span>
            <span className="text-xs sm:text-sm text-gray-300 font-extrabold block">
              {isAr ? 'عاماً من عراقة الطهي الريفي' : 'Years of Traditional Heritage'}
            </span>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <span className="text-4xl sm:text-5xl font-serif font-black text-brand-gold block">100%</span>
            <span className="text-xs sm:text-sm text-gray-300 font-extrabold block">
              {isAr ? 'لحوم بلدية طازجة وسمن فلاحي' : 'Fresh Local Meats & Pure Ghee'}
            </span>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <span className="text-4xl sm:text-5xl font-serif font-black text-brand-gold block">4.9 ★</span>
            <span className="text-xs sm:text-sm text-gray-300 font-extrabold block">
              {isAr ? 'تقييم ممتاز على جوجل ووسائل الإعلام' : 'Outstanding Verified Rating'}
            </span>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <span className="text-4xl sm:text-5xl font-serif font-black text-brand-gold block">50k+</span>
            <span className="text-xs sm:text-sm text-gray-300 font-extrabold block">
              {isAr ? 'زبائن سعداء وعزومات ناجحة تم تقديمها' : 'Satisfied Feast Guests'}
            </span>
          </div>

        </div>
      </div>

      {/* SECTION 3: THE EXCITING BALADI FEAST SCALE SIMULATOR (Portion & Scale Selector) */}
      <div id="portion-simulator-section" className="bg-[#FFFDF9] border border-[#E5E2D9] rounded-[3.5rem] p-8 sm:p-12 space-y-10 shadow-sm relative overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-brand-gold/5 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3D4021]/5 text-brand-primary text-[11px] font-black border border-[#3D4021]/15 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            <span>{isAr ? 'مستشار العزومات والطلبات الذكي لأبو قورة' : 'Abu Qura Intelligent Feast Scale Configurator'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-brand-primary font-serif tracking-tight leading-tight">
            {isAr ? 'حدد حجم الطلب ومواصفات العزيمة' : 'Select Your Ideal Gathering Size'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-extrabold">
            {isAr 
              ? 'اختر حجم تجمعك أو عزيمتك لنقترح عليك الميزانية التقريبية وأهم الأطباق الفلاحية المناسبة التي تشرفك أمام ضيوفك.' 
              : 'Choose your gathering size to automatically preview estimated pricing, dishes volume, and recommendations.'}
          </p>
        </div>

        {/* Toggle cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* S - Individual */}
          <button
            onClick={() => setFeastScale('individual')}
            className={`text-right p-6 rounded-[2.2rem] border-2 transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer ${
              feastScale === 'individual'
                ? 'bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/10 scale-[1.02]'
                : 'bg-white border-[#E5E2D9] text-[#2D241E] hover:border-brand-primary/30'
            }`}
          >
            <div className="space-y-4 w-full">
              <div className="flex justify-between items-center w-full">
                <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                  feastScale === 'individual' ? 'bg-white/10 text-brand-gold' : 'bg-brand-primary/5 text-brand-primary'
                }`}>👤</span>
                <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md ${
                  feastScale === 'individual' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{isAr ? 'وجبة فردية' : 'Individual Scale'}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black font-serif">{isAr ? 'فردي شبعان جداً' : 'Solo Gourmet Portion'}</h3>
                <p className={`text-xs font-semibold leading-relaxed ${feastScale === 'individual' ? 'text-gray-200' : 'text-gray-500'}`}>
                  {isAr ? 'مثالي للغداء السريع أو وجبة شخصية سخية.' : 'Perfect for a robust personal meal or busy day lunch.'}
                </p>
              </div>
            </div>
            <div className="w-full pt-4 border-t border-current/15 flex justify-between items-center text-xs font-black">
              <span>{isAr ? 'السعر المقدر:' : 'Estimated Range:'}</span>
              <span className={feastScale === 'individual' ? 'text-brand-gold' : 'text-brand-clay'}>~ 150-280 ج.م</span>
            </div>
          </button>

          {/* M - Family */}
          <button
            onClick={() => setFeastScale('family')}
            className={`text-right p-6 rounded-[2.2rem] border-2 transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer ${
              feastScale === 'family'
                ? 'bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/10 scale-[1.02]'
                : 'bg-white border-[#E5E2D9] text-[#2D241E] hover:border-brand-primary/30'
            }`}
          >
            <div className="space-y-4 w-full">
              <div className="flex justify-between items-center w-full">
                <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                  feastScale === 'family' ? 'bg-white/10 text-brand-gold' : 'bg-brand-primary/5 text-brand-primary'
                }`}>👪</span>
                <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md ${
                  feastScale === 'family' ? 'bg-white/10 text-white' : 'bg-amber-100 text-brand-gold'
                }`}>{isAr ? 'لمة العيلة والخلان' : 'Family & Friends Scale'}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black font-serif">{isAr ? 'لمة عائلية ممتازة' : 'Medium Gathering Platter'}</h3>
                <p className={`text-xs font-semibold leading-relaxed ${feastScale === 'family' ? 'text-gray-200' : 'text-gray-500'}`}>
                  {isAr ? 'يكفي لـ ٣ إلى ٥ أفراد، يحتوي طواجن ومشويات منوعة.' : 'Feeds 3 to 5 hungry guests with varied grills & claypots.'}
                </p>
              </div>
            </div>
            <div className="w-full pt-4 border-t border-current/15 flex justify-between items-center text-xs font-black">
              <span>{isAr ? 'السعر المقدر:' : 'Estimated Range:'}</span>
              <span className={feastScale === 'family' ? 'text-brand-gold' : 'text-brand-clay'}>~ 500-900 ج.م</span>
            </div>
          </button>

          {/* L - Royal Feast */}
          <button
            onClick={() => setFeastScale('royal')}
            className={`text-right p-6 rounded-[2.2rem] border-2 transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer ${
              feastScale === 'royal'
                ? 'bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/10 scale-[1.02]'
                : 'bg-white border-[#E5E2D9] text-[#2D241E] hover:border-brand-primary/30'
            }`}
          >
            <div className="space-y-4 w-full">
              <div className="flex justify-between items-center w-full">
                <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                  feastScale === 'royal' ? 'bg-white/10 text-brand-gold' : 'bg-brand-primary/5 text-brand-primary'
                }`}>👑</span>
                <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md ${
                  feastScale === 'royal' ? 'bg-white/10 text-white' : 'bg-red-100 text-red-600'
                }`}>{isAr ? 'عزومة فخمة ملكية' : 'Royal Banquet Feast'}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black font-serif">{isAr ? 'طبلية عزومة ملكية' : 'Grand Traditional Banquet'}</h3>
                <p className={`text-xs font-semibold leading-relaxed ${feastScale === 'royal' ? 'text-gray-200' : 'text-gray-500'}`}>
                  {isAr ? 'يكفي لـ ٨ إلى ١٢ فرد، مجهز بالخروف أو المشويات الكبرى والشوربات.' : 'Feeds 8 to 12 guests. Elegant choice for business or wedding events.'}
                </p>
              </div>
            </div>
            <div className="w-full pt-4 border-t border-current/15 flex justify-between items-center text-xs font-black">
              <span>{isAr ? 'السعر المقدر:' : 'Estimated Range:'}</span>
              <span className={feastScale === 'royal' ? 'text-brand-gold' : 'text-brand-clay'}>~ 1800-3000 ج.م</span>
            </div>
          </button>

        </div>

        {/* Dynamic Result Box from Selection */}
        <div className="bg-[#FAF9F6] rounded-[2rem] p-6 border border-[#E5E2D9] max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 transition-all duration-300">
          
          <div className="text-right space-y-2">
            <h4 className="text-sm font-black text-brand-primary flex items-center gap-1.5">
              <span>💡</span>
              <span>{isAr ? 'نصيحة الشيف أبو قورة لهذه العزيمة:' : 'Our Chef Recommended Setup for this scale:'}</span>
            </h4>
            <p className="text-xs text-gray-500 font-bold max-w-2xl leading-relaxed">
              {feastScale === 'individual' && (isAr 
                ? 'ننصحك بطلب "حمام محشي أرز مميز" مع "شوربة لسان عصفور بلدي". وجبة متكاملة، تمنحك شبعاً فائقاً وتحلية أم علي!' 
                : 'We highly suggest the Signature Stuffed Pigeon paired with hot Orzo Soup. A traditional compact yet extremely satisfying feast.')}
              {feastScale === 'family' && (isAr 
                ? 'التشكيلة المثالية: كباب وكفتة مشوية، طاجن بامية بالموزة الضأن المطهو ببطء، فطير مشلتت فلاحي مورق وسلطة خضراء.' 
                : 'The perfect set: Kebab & Kofta, slow-baked Okra Lamb Shank Claypot, fresh layered Feteer, and green salad for a harmonious family table.')}
              {feastScale === 'royal' && (isAr 
                ? 'ننصحك بالتنسيق الهاتفي الفوري لحجز طبلية كاملة تحتوي على: ٢ ريش ضأن، ٢ كباب وكفتة كبار، ٢ طاجن ورق عنب بالكوارع، وفطيرتين بالسمن البلدي.' 
                : 'Go for a master arrangement: 2x grilled lamb chops, 2x signature kebab & kofta platter, 2x grape leaves with trotters claypot, and hot baladi pastries.')}
            </p>
          </div>

          <button
            onClick={() => {
              // Direct scroll to search or menu items
              const el = document.getElementById('menu-list');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              
              // Preset search/filter to direct attention
              if (feastScale === 'individual') {
                setSelectedCategory('all');
                setSearch(isAr ? 'حمام' : 'Pigeon');
              } else if (feastScale === 'family') {
                setSelectedCategory('grills');
                setSearch('');
              } else {
                setSelectedCategory('pots');
                setSearch('');
              }
            }}
            className="px-6 py-4.5 rounded-xl bg-[#D97706] hover:bg-[#F59E0B] text-[#0A0907] font-black text-xs transition-all duration-300 cursor-pointer shadow-md shrink-0 flex items-center gap-1"
          >
            <span>{isAr ? 'عرض الأصناف المقترحة بالأسفل 👇' : 'Show Recommended Items Below 👇'}</span>
          </button>

        </div>

      </div>

      {/* SECTION 4: THE CRAFT JOURNEY IN STEPS (Inspired by Image 2, 3) */}
      <div className="space-y-12 text-right" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3D4021]/5 text-brand-primary text-[11px] font-black border border-[#3D4021]/15 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            <span>{isAr ? 'كواليس المطبخ الفلاحي الأصيل' : 'The Secrets of Our Baladi Kitchen'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-brand-primary font-serif tracking-tight">
            {isAr ? 'خطوات تحضير طلبك بامتياز' : 'How We Bake & Grill For You'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-extrabold max-w-xl mx-auto">
            {isAr 
              ? 'نهتم بأدق التفاصيل في رحلة الطعام من المزرعة لتبلغ طاولتك ساخنة برائحة الحطب المشتعل.' 
              : 'Our meticulous heritage process ensures authentic tastes delivered sizzling hot.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Step 1 */}
          <div className="relative group bg-[#FFFDF9] hover:bg-white rounded-[2rem] p-6 border border-[#E5E2D9] hover:border-brand-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#3D4021]/5 flex flex-col justify-between">
            <div className="absolute top-6 left-6 text-5xl font-serif text-[#3D4021]/5 font-black group-hover:text-brand-gold/15 transition-colors select-none">01</div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-2xs">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-brand-primary font-serif">
                  {isAr ? 'انتقاء لحوم بلدية طازجة' : 'Handpicked Fresh Cattle'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  {isAr 
                    ? 'نختار ذبائحنا الفلاحية الطازجة يومياً من مزارعنا الخاصة بالريف لنضمن لك مذاقاً أصيلاً مئة بالمئة.' 
                    : 'We select fresh local cattle daily to guarantee maximum quality and rich historical taste.'}
                </p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E5E2D9]/40 text-[10px] font-extrabold text-[#D97706]">
              {isAr ? 'بلدي طازج يومياً 🍖' : '100% Local Daily 🍖'}
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative group bg-[#FFFDF9] hover:bg-white rounded-[2rem] p-6 border border-[#E5E2D9] hover:border-brand-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#3D4021]/5 flex flex-col justify-between">
            <div className="absolute top-6 left-6 text-5xl font-serif text-[#3D4021]/5 font-black group-hover:text-brand-gold/15 transition-colors select-none">02</div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-2xs">
                <ChefHat className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-brand-primary font-serif">
                  {isAr ? 'تتبيل سري معتق وغني' : 'Heritage Secret Seasoning'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  {isAr 
                    ? 'تتبيلة توارثتها أجيال عائلة أبو قورة، نستخدم فيها البهارات الطازجة وأجود أنواع السمن البلدي الطبيعي.' 
                    : 'A family recipe handed down over generations, using rich pure clarified butter and organic hand-ground spices.'}
                </p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E5E2D9]/40 text-[10px] font-extrabold text-[#D97706]">
              {isAr ? 'خلطة أبو قورة السحرية ✨' : 'Secret Heritage Blend ✨'}
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative group bg-[#FFFDF9] hover:bg-white rounded-[2rem] p-6 border border-[#E5E2D9] hover:border-brand-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#3D4021]/5 flex flex-col justify-between">
            <div className="absolute top-6 left-6 text-5xl font-serif text-[#3D4021]/5 font-black group-hover:text-brand-gold/15 transition-colors select-none">03</div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-2xs">
                <Flame className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-brand-primary font-serif">
                  {isAr ? 'شوي على هادئ الفحم' : 'Slow Charcoal Grilling'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  {isAr 
                    ? 'نشوي اللحوم ببطء تحت إشراف معلمين المشويات، لنحقق لك مزيجاً متناهي الطراوة مع طعم الفحم الأصيل.' 
                    : 'Low and slow grilling over clean wood coal to achieve the ultimate tenderness and smoky profile.'}
                </p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E5E2D9]/40 text-[10px] font-extrabold text-[#D97706]">
              {isAr ? 'نكهة الفحم البلدي 🔥' : 'Wood-Fired Smoke 🔥'}
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative group bg-[#FFFDF9] hover:bg-white rounded-[2rem] p-6 border border-[#E5E2D9] hover:border-brand-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#3D4021]/5 flex flex-col justify-between">
            <div className="absolute top-6 left-6 text-5xl font-serif text-[#3D4021]/5 font-black group-hover:text-brand-gold/15 transition-colors select-none">04</div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-2xs">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-brand-primary font-serif">
                  {isAr ? 'تعبئة حرارية مبرشمة' : 'Sealed Thermal Delivery'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  {isAr 
                    ? 'يغلف الطلب في أظرف حرارية سميكة لمنع خروج الأبخرة والحرارة، لتصلك الوجبة ساخنة تلهب حماسك.' 
                    : 'Dispatched in air-tight thermal vacuum foils to preserve structural heat and absolute freshness.'}
                </p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E5E2D9]/40 text-[10px] font-extrabold text-[#D97706]">
              {isAr ? 'ساخن وكأنه على الشواية 🛵' : 'Sizzling Hot Delivery 🛵'}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 5: DISH FILTERING BAR & CATEGORIES GRID */}
      <div className="bg-[#FFFDF9] border border-[#E5E2D9] rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-sm" id="menu-list">
        <div className="space-y-1.5 max-w-sm text-right">
          <h3 className="text-lg font-bold text-brand-primary font-serif flex items-center gap-2">
            <span>🔍</span>
            <span>{isAr ? 'تصفح قائمتنا اللذيذة' : 'Filter Our Fine Menu'}</span>
          </h3>
          <p className="text-xs text-gray-400 font-bold leading-normal">
            {isAr 
              ? `وجدت ${filteredMenu.length} صنف يتناسب مع اختيارك الآن` 
              : `Found ${filteredMenu.length} premium dishes matching your taste`}
          </p>
        </div>

        {/* Custom Input */}
        <div className="flex-1 relative max-w-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث عما تشتهيه نفسك (كباب، كفتة، حمام، طاجن بامية...)' : 'What are you craving? (Kebab, kofta, pigeon...)'}
            className="w-full px-6 py-4.5 pr-14 rounded-2xl border border-[#E5E2D9] text-xs font-black focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-brand-gold bg-white text-[#1A1A1A] placeholder:text-gray-400/80 transition-all shadow-xs"
          />
          <span className="absolute top-1/2 -translate-y-1/2 right-5 text-gray-400">
            <Search className="w-5 h-5 text-[#3D4021]" />
          </span>
        </div>
      </div>

      {/* Dynamic Category Sliders with Count Badges */}
      <div className="sticky top-20 md:top-24 z-30 -mx-4 px-4 py-4.5 bg-white/95 backdrop-blur-md border-y border-[#E5E2D9] flex gap-3 overflow-x-auto no-scrollbar scroll-smooth shadow-xs">
        {cats.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = cat.id === 'all' 
            ? menu.length 
            : menu.filter(item => item.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearch('');
              }}
              className={`whitespace-nowrap px-6 py-3.5 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-2xs ${
                isSelected
                  ? 'bg-brand-primary text-brand-gold scale-[1.03] shadow-md border border-brand-primary'
                  : 'bg-white border border-[#E5E2D9] text-brand-primary hover:bg-[#FDFBF7]'
              }`}
            >
              <span>{isAr ? cat.nameAr : cat.nameEn}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                isSelected ? 'bg-white/10 text-white' : 'bg-brand-primary/5 text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Search Tag Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-black" dir={isAr ? 'rtl' : 'ltr'}>
        <span className="text-gray-400">{isAr ? 'كلمات بحث شائعة:' : 'Popular:'}</span>
        {[
          { textAr: 'كباب', textEn: 'Kebab' },
          { textAr: 'حمام', textEn: 'Pigeon' },
          { textAr: 'طاجن', textEn: 'Claypot' },
          { textAr: 'فطير', textEn: 'Feteer' },
          { textAr: 'بامية', textEn: 'Okra' },
          { textAr: 'كوارع', textEn: 'Trotters' }
        ].map((tag, idx) => (
          <button
            key={idx}
            onClick={() => setSearch(isAr ? tag.textAr : tag.textEn)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-brand-primary/5 text-gray-600 transition-all cursor-pointer border border-[#E5E2D9]"
          >
            #{isAr ? tag.textAr : tag.textEn}
          </button>
        ))}
      </div>

      {/* SECTION 6: THE PREMIUM FOOD BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMenu.map((item) => {
          const isFav = favorites.includes(item.id);
          const isHot = item.category === 'grills' || item.category === 'pots';
          const isSpecial = item.price >= 300;

          return (
            <div 
              key={item.id} 
              className="group flex flex-col bg-[#FFFDF9]/60 hover:bg-white rounded-[2.2rem] overflow-hidden border border-[#E5E2D9]/80 shadow-xs hover:shadow-2xl hover:shadow-[#3D4021]/10 hover:border-brand-primary/20 transition-all duration-500 transform hover:-translate-y-1.5"
            >
              {/* Image Container with badges */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF6F0] border-b border-[#E5E2D9]/50">
                <img 
                  src={item.image} 
                  alt={isAr ? item.nameAr : item.nameEn}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                    item.available === false ? 'grayscale-[50%] contrast-90' : ''
                  }`}
                  loading="lazy"
                />

                {/* Glassmorphic Category Tag */}
                <span className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-brand-gold text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-white/10">
                  {isAr 
                    ? (categories.find(c => c.id === item.category)?.nameAr || '')
                    : (categories.find(c => c.id === item.category)?.nameEn || '')}
                </span>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  className={`absolute top-4 left-4 p-2.5 rounded-full backdrop-blur-md border transition-all duration-300 cursor-pointer ${
                    isFav 
                      ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                      : 'bg-black/30 border-white/10 text-white hover:bg-black/50'
                  }`}
                  title="Favorite"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                </button>

                {/* Status Badges */}
                {item.available !== false && (
                  <div className="absolute bottom-4 right-4 flex gap-1.5">
                    {isHot && (
                      <span className="bg-brand-clay text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5 animate-pulse text-yellow-300" />
                        <span>{isAr ? 'من الشواية' : 'Sizzling'}</span>
                      </span>
                    )}
                    {isSpecial && (
                      <span className="bg-brand-gold text-[#0A0907] text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-md">
                        👑 {isAr ? 'ملكي فلاحي' : 'Royal Feast'}
                      </span>
                    )}
                  </div>
                )}

                {/* Out of stock tag */}
                {item.available === false && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white border border-rose-500 text-xs font-black shadow-lg">
                      {isAr ? 'نفذت الوجبة مؤقتاً ⚠️' : 'Finished Temporarily ⚠️'}
                    </span>
                  </div>
                )}
              </div>

              {/* Details & Actions Panel */}
              <div className="flex-grow p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-black text-brand-primary font-serif leading-tight group-hover:text-brand-primary-light transition-colors">
                      {isAr ? item.nameAr : item.nameEn}
                    </h3>
                    <div className="flex text-amber-400 text-xs font-black tracking-tighter items-center shrink-0">
                      <span>★ 4.9</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold min-h-[40px]">
                    {isAr ? item.descriptionAr : item.descriptionEn}
                  </p>
                </div>

                {/* Pricing & Add to cart button */}
                <div className="pt-4 border-t border-[#E5E2D9]/50 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-gray-400 font-black block leading-none">{isAr ? 'سعر الوجبة' : 'PRICE'}</span>
                    <div className="flex items-baseline mt-1 font-sans">
                      <span className="text-xl font-black text-brand-clay">
                        {item.price}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 mr-0.5">
                        {isAr ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                  </div>

                  {item.available !== false ? (
                    <button
                      onClick={() => onAddToCart(item)}
                      className="px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-light text-brand-gold hover:text-white font-black text-xs shadow-xs transition-all duration-300 tap-scale flex items-center gap-1 border border-brand-primary cursor-pointer"
                    >
                      <span>+</span>
                      <span>{isAr ? 'طلب وتخصيص الوجبة' : 'Order & Customise'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 font-extrabold text-xs flex items-center gap-1 cursor-not-allowed select-none"
                    >
                      <span>{isAr ? 'غير متوفر' : 'Out of Stock'}</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {filteredMenu.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-[#E5E2D9] text-center flex flex-col items-center justify-center p-8">
            <span className="text-4xl">🥘</span>
            <h3 className="text-lg font-bold text-brand-primary font-serif mt-4">
              {isAr ? 'عذراً، لم نجد وجبات مطابقة لبحثك' : 'No delicious dishes matched your search'}
            </h3>
            <p className="text-xs text-gray-400 mt-2.5 max-w-xs leading-relaxed font-semibold">
              {isAr ? 'يرجى مراجعة التهجئة أو التصفح عبر الأقسام العلوية لمشاهدة كافة الوجبات.' : 'Try searching for other culinary keywords or browse our standard categories.'}
            </p>
          </div>
        )}
      </div>

      {/* SECTION 7: TRADITIONAL FEAST BOOKING TABLE (Inspired by Image 2, 5) */}
      <div id="reservation-section" className="bg-[#FFFDF9] border border-[#E5E2D9] rounded-[3.5rem] p-8 sm:p-14 shadow-lg flex flex-col lg:flex-row items-center gap-12" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex-1 text-right space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-primary/5 text-brand-primary text-xs font-black border border-brand-primary/15">
            <span>📅</span>
            <span>{isAr ? 'كرم الضيافة المصري على أصوله' : 'Hospitality in its Highest Baladi Standards'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-brand-primary font-serif tracking-tight leading-tight">
            {isAr ? 'احجز عزومتك أو طبلية أبو قورة الفخمة' : 'Book a Traditional Feast Table'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-extrabold leading-relaxed">
            {isAr 
              ? 'هل تخطط لعشاء عائلي كبير أو عزومة عمل فاخرة؟ دَعْ عائلة أبو قورة تُرتب لك طبلية مجهزة بكافة المشويات والحلويات والفطير الساخن، مع خدمة ضيافة ملكية تليق بضيوفك الكرام.' 
              : 'Planning a large family gathering or professional feast? Let the Abu Qura family manage it with traditional grills, hot pastries, and royal local service.'}
          </p>

          <ul className="space-y-3 pt-2 text-xs font-extrabold text-[#3D4021]">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#D97706]" />
              <span>{isAr ? 'تجهيز طواجن مخصصة بالسمن الفلاحي الطبيعي' : 'Custom claypots baked with premium baladi ghee'}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#D97706]" />
              <span>{isAr ? 'حجز مساحات خاصة مغلقة للعائلات الكبيرة' : 'Private sections dedicated for large family gatherings'}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#D97706]" />
              <span>{isAr ? 'ضيافة فلاحية ترحيبية بالقهوة والخبز البلدي مجاناً' : 'Complimentary welcome hospitality coffee & baladi bread'}</span>
            </li>
          </ul>
        </div>

        {/* Dynamic Reservation Form Panel */}
        <div className="w-full lg:w-[450px] bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E2D9] shadow-md space-y-6">
          <h3 className="text-base font-bold text-brand-primary font-serif text-right border-b border-[#E5E2D9] pb-3">
            {isAr ? 'أدخل تفاصيل التنسيق الفوري' : 'Fill Booking Request Details'}
          </h3>

          {reservationSuccess ? (
            <div className="py-8 text-center space-y-3">
              <span className="text-4xl animate-bounce block">✨🟢✨</span>
              <h4 className="text-sm font-black text-emerald-600">{isAr ? 'تم إرسال طلب الحجز بنجاح!' : 'Feast Requested Successfully!'}</h4>
              <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                {isAr 
                  ? 'سيتواصل معك الشيف أبو قورة أو مسئول الضيافة خلال 15 دقيقة هاتفياً لتأكيد الأكلات وضمان كرم الوفادة.' 
                  : 'Our heritage hospitality manager will call you within 15 minutes to confirm details.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleBookTable} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-black block text-right">{isAr ? 'الاسم الكريم بالكامل' : 'Your Full Name'}</label>
                <input 
                  type="text" 
                  required
                  value={reserveName}
                  onChange={(e) => setReserveName(e.target.value)}
                  placeholder={isAr ? 'مثال: الأستاذ يوسف حسن' : 'e.g. Youssef Hassan'} 
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E2D9] text-xs font-black focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 font-black block text-right">{isAr ? 'رقم الهاتف للتنسيق' : 'Phone Number'}</label>
                  <input 
                    type="tel" 
                    required
                    value={reservePhone}
                    onChange={(e) => setReservePhone(e.target.value)}
                    placeholder={isAr ? 'مثال: 01002345678' : 'e.g. 01001234567'} 
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E2D9] text-xs font-black focus:outline-none focus:border-[#D97706] text-left font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 font-black block text-right">{isAr ? 'عدد الأفراد المتوقع' : 'Number of Guests'}</label>
                  <select 
                    value={reserveGuests}
                    onChange={(e) => setReserveGuests(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E2D9] text-xs font-black focus:outline-none focus:border-[#D97706]"
                  >
                    <option value="2">2 {isAr ? 'أفراد' : 'Guests'}</option>
                    <option value="4">4 {isAr ? 'أفراد' : 'Guests'}</option>
                    <option value="6">6 {isAr ? 'أفراد' : 'Guests'}</option>
                    <option value="10">10+ {isAr ? 'أفراد (عزومة)' : 'Guests'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-black block text-right">{isAr ? 'طلبات خاصة أو أكلات معينة تود تجهيزها' : 'Special Dietary Requests'}</label>
                <textarea 
                  rows={2}
                  value={reserveNotes}
                  onChange={(e) => setReserveNotes(e.target.value)}
                  placeholder={isAr ? 'أضف مثلاً: كفتة إضافية، حمام محشي فريك، أرز بالخلطة، عيش حواوشي بلدي...' : 'e.g., extra pigeons, specific mandi spices, feteer honey...'} 
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E2D9] text-xs font-black focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 rounded-xl bg-brand-primary hover:bg-[#4D5129] text-brand-gold hover:text-white font-black text-xs transition-all duration-300 shadow-md cursor-pointer border border-brand-primary"
              >
                {isAr ? 'إرسال طلب الحجز والتجهيز الفوري 🌟' : 'Send Feast Booking Request 🌟'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* SECTION 8: COHESIVE CLIENT REVIEWS CAROUSEL (strictly male / neutral, as instructed) */}
      <div className="space-y-12 text-right" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1 bg-[#D97706]/10 px-3.5 py-1.5 rounded-full text-[10px] font-black text-[#D97706] border border-[#D97706]/20">
            <span>👍</span>
            <span>{isAr ? 'أشخاص حقيقيون • تجارب موثقة' : 'Verified Google Reviews'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-brand-primary font-serif tracking-tight">
            {isAr ? 'ماذا يقول عشاق مطبخ أبو قورة؟' : 'Our Verified Guest Testimonials'}
          </h2>
          <p className="text-xs text-gray-400 font-bold max-w-sm mx-auto">
            {isAr ? 'شهادات وتقييمات نفخر بها من كبار العملاء.' : 'Real testimonies from our distinguished regular guests.'}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-4xl mx-auto px-4">
          <div className="overflow-hidden bg-[#FFFDF9] border border-[#E5E2D9] rounded-[2.5rem] p-8 sm:p-12 shadow-md relative min-h-[220px] transition-all duration-300 flex flex-col justify-between">
            <span className="absolute top-6 left-6 text-6xl font-serif text-[#3D4021]/10 font-black">“</span>
            
            <div className="space-y-4">
              <div className="flex text-amber-400 text-sm">
                {Array.from({ length: clientReviews[activeReviewSlide].stars }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-sm sm:text-base text-[#2D241E] font-bold leading-relaxed">
                {isAr ? clientReviews[activeReviewSlide].textAr : clientReviews[activeReviewSlide].textEn}
              </p>
            </div>

            <div className="flex items-center gap-4 border-t border-[#E5E2D9]/40 pt-6 mt-6">
              <div className={`w-12 h-12 rounded-full ${clientReviews[activeReviewSlide].avatarBg} text-white flex items-center justify-center font-bold text-sm font-sans`}>
                {clientReviews[activeReviewSlide].avatarInitials}
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-brand-primary block">
                  {isAr ? clientReviews[activeReviewSlide].nameAr : clientReviews[activeReviewSlide].nameEn}
                </span>
                <span className="text-[11px] text-gray-400 font-bold block">
                  {isAr ? `عميل دائم • ${clientReviews[activeReviewSlide].locationAr}` : `Regular Guest • ${clientReviews[activeReviewSlide].locationEn}`}
                </span>
              </div>
            </div>
          </div>

          {/* Dots controller under the reviews */}
          <div className="flex justify-center gap-2 mt-6">
            {clientReviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveReviewSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  activeReviewSlide === idx ? 'bg-brand-primary w-6' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Review ${idx + 1}`}
              />
            ))}
          </div>

          {/* Left/Right controls for reviews */}
          <button
            onClick={() => setActiveReviewSlide(prev => (prev - 1 + clientReviews.length) % clientReviews.length)}
            className="absolute top-1/2 -translate-y-1/2 -left-3 sm:-left-12 p-2.5 rounded-full bg-white border border-[#E5E2D9] text-brand-primary shadow-xs hover:bg-gray-50 transition-all cursor-pointer"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveReviewSlide(prev => (prev + 1) % clientReviews.length)}
            className="absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-12 p-2.5 rounded-full bg-white border border-[#E5E2D9] text-brand-primary shadow-xs hover:bg-gray-50 transition-all cursor-pointer"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>
      </div>

    </div>
  );
}
