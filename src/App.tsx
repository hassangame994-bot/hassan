import React, { useState, useEffect } from 'react';
import { 
  Shield, Bell, X, ChefHat, CheckCircle, Flame, MessageSquareCode,
  Leaf, Clock, Star, Compass, ArrowDown, LogOut, Menu, ShoppingCart, User
} from 'lucide-react';
import { User as UserType, MenuItem, CartItem, Order, OrderStatus, Category } from './types.js';
import Navbar from './components/Navbar.js';
import AuthModal from './components/AuthModal.js';
import CartDrawer from './components/CartDrawer.js';
import UserOrders from './components/UserOrders.js';
import AdminDashboard from './components/AdminDashboard.js';
import BottomNavigation from './components/BottomNavigation.js';
import ProfileSettings from './components/ProfileSettings.js';
import MealCustomizationModal from './components/MealCustomizationModal.js';
import { playNotificationChime, playStatusUpdateChime } from './utils/audio.js';
import { io } from 'socket.io-client';

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

// القائمة الافتراضية المطابقة تماماً لصور التصميم الأصلي
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    nameAr: 'كباب وكفتة أبو قورة المميز',
    nameEn: 'Abu Qura Signature Kebab & Kofta',
    descriptionAr: 'سيخ كباب بلدي مع سيخ كفتة متبلة بخلطة أبو قورة السرية، مشوية على الفحم مع خضار مشوية وطحينة وخبز طازج.',
    descriptionEn: 'Grilled local kebab and minced meat skewers seasoned with Abu Qura secret blend, served with grilled vegetables, tahini, and fresh bread.',
    price: 320,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    category: 'grills'
  },
  {
    id: 'm2',
    nameAr: 'ريش ضأن مشوية على الفحم',
    nameEn: 'Charcoal Grilled Lamb Chops',
    descriptionAr: 'قطع ريش الغنم المتبلة بالأعشاب والبهارات الشرقية، مشوية على الفحم الساخن لتذوب في الفم، تقدم مع الأرز الأصفر والصلصة الحارة.',
    descriptionEn: 'Premium lamb chops marinated in oriental herbs and spices, coal grilled to perfection. Served with seasoned yellow rice and spicy dip.',
    price: 450,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    category: 'grills'
  },
  {
    id: 'm3',
    nameAr: 'طاجن بامية بلحم الضأن الموزة',
    nameEn: 'Lamb Shank Okra Claypot',
    descriptionAr: 'طاجن فخار بلدي يحتوي على بامية صغيرة طازجة مطبوخة مع قطع لحم الموزة الضأن في صلصة الطماطم الغنية بالثوم والكزبرة.',
    descriptionEn: 'Traditional claypot of fresh baby okra slow-cooked with tender lamb shank in a rich garlic, tomato, and coriander sauce.',
    price: 290,
    image: 'https://images.unsplash.com/photo-1547928576-a4a33237bea3?w=600&auto=format&fit=crop&q=80',
    category: 'pots'
  },
  {
    id: 'm4',
    nameAr: 'طاجن ورق عنب بالكوارع',
    nameEn: 'Stuffed Grape Leaves with Trotters Claypot',
    descriptionAr: 'ورق عنب محشي بخلطة الأرز والأعشاب، مطبوخ في طاجن فخار ومغطى بقطع الكوارع المخلية المطهوة ببطء في مرقة غنية بالليمون.',
    descriptionEn: 'Claypot slow-cooked grape leaves stuffed with spiced rice, topped with tender boneless beef trotters in a tangy lemon broth.',
    price: 340,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    category: 'pots'
  },
  {
    id: 'm5',
    nameAr: 'فطير مشلتت فلاحي بالسمن البلدي',
    nameEn: 'Traditional Rural Feteer Meshaltet',
    descriptionAr: 'فطيرة فلاحي مورقة ومقرمشة ومحمرة بالسمن البلدي النقي، تقدم مع العسل الأبيض، القشطة الطازجة، والجبن القديم.',
    descriptionEn: 'Flaky layered golden pastry made with pure local ghee. Served with honey, fresh clotted cream, and traditional aged cheese.',
    price: 180,
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&auto=format&fit=crop&q=80',
    category: 'pastries'
  },
  {
    id: 'm6',
    nameAr: 'حمام محشي أرز مميز',
    nameEn: 'Signature Stuffed Pigeon',
    descriptionAr: 'زوج من الحمام الفاخر محشي بالأرز المتبل بخلطة الكبد والقوانص والبهارات الخاصة، محمر ومقرمش بالسمن البلدي.',
    descriptionEn: 'A pair of pigeons stuffed with seasoned rice, giblets, and aromatic spices, roasted crispy in authentic clarified butter.',
    price: 380,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80',
    category: 'pots'
  },
  {
    id: 'm7',
    nameAr: 'سلطة أبو قورة الخضراء المميزه',
    nameEn: 'Abu Qura Signature Green Salad',
    descriptionAr: 'مزيج منعش من الجرجير، الطماطم، الخيار، الفجل، والنعناع الأخضر، متبل بالليمون، زيت الزيتون ودبس الرمان والخبز المقرمش.',
    descriptionEn: 'Crisp arugula, tomatoes, cucumbers, radish, and fresh mint, tossed with lemon dressing, olive oil, sweet pomegranate molasses, and crispy bread.',
    price: 75,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    category: 'appetizers'
  },
  {
    id: 'm8',
    nameAr: 'شوربة لسان عصفور بلدي',
    nameEn: 'Traditional Orzo Soup',
    descriptionAr: 'مرقة الدجاج واللحم الغنية مع لسان العصفور المحمر بالسمن البلدي ولمسة ليمون منعشة.',
    descriptionEn: 'Rich, comforting bone broth soup with roasted orzo pasta and a fresh squeeze of lemon juice.',
    price: 60,
    image: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&auto=format&fit=crop&q=80',
    category: 'appetizers'
  },
  {
    id: 'm9',
    nameAr: 'أم علي بالمكسرات والقشطة والفرن',
    nameEn: 'Oven Baked Om Ali Dessert',
    descriptionAr: 'رقاق مخبوز بالفرن مغطى بالحليب الطازج المكثف، الكريمة الغنية، السمن البلدي، ومزيج الفستق واللوز والزبيب وجوز الهند.',
    descriptionEn: 'Traditional baked bread pudding layered with sweet whole milk, heavy cream, ghee, topped with roasted pistachios, almonds, and coconut.',
    price: 110,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
    category: 'desserts'
  },
  {
    id: 'm10',
    nameAr: 'عصير ليمون بالنعناع فريش',
    nameEn: 'Fresh Mint Lemonade',
    descriptionAr: 'ليمون طازج معسور بارد مع أوراق النعناع البري ومكعبات الثلج لانتعاش فوري.',
    descriptionEn: 'Freshly squeezed lemon juice cold-blended with organic mint leaves and crushed ice for instant refreshment.',
    price: 55,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    category: 'drinks'
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', nameAr: 'الكل', nameEn: 'All' },
  { id: 'grills', nameAr: 'مشاوي أبو قورة', nameEn: 'Grills' },
  { id: 'pots', nameAr: 'طواجن الحمام واللحوم', nameEn: 'Claypots & Pigeon' },
  { id: 'pastries', nameAr: 'فطير ومخبوزات', nameEn: 'Feteer & Pastries' },
  { id: 'appetizers', nameAr: 'مقبلات وشوربة', nameEn: 'Appetizers' },
  { id: 'desserts', nameAr: 'الحلويات الشرقية', nameEn: 'Desserts' },
  { id: 'drinks', nameAr: 'المشروبات الباردة', nameEn: 'Refreshments' }
];

// معجم الترجمات لضمان الدعم الكامل للغتين
const TRANSLATIONS = {
  ar: {
    heroTitle: 'ابو قوره',
    heroSubtitle: 'طعم أصيل من قلب مصر',
    orderNow: 'اطلب الآن',
    discoverStory: 'اكتشف قصتنا',
    discover: 'اكتشف',
    statsDishes: 'عدد الأطباق',
    statsExperience: 'سنوات الخبرة',
    statsClients: 'عملاء سعداء',
    statsRating: 'تقييم النجوم',
    menuTitle: 'قائمة الطعام',
    menuSubtitle: 'نقدم لكم تشكيلة واسعة من أشهى الأطباق المحضرة يومياً من مكونات طازجة 100%',
    addToOrder: 'إضافة للطلب',
    whyTitle: 'لماذا تختار ابو قوره؟',
    feature1Title: 'مكونات طازجة يومياً',
    feature1Desc: 'نختار لحومنا وخضرواتنا بعناية فائقة كل صباح لنضمن لكم الجودة.',
    feature2Title: 'طهاة محترفون',
    feature2Desc: 'وصفات متوارثة وأيادي ماهرة تصنع الفرق في كل طبق نقدمه.',
    feature3Title: 'توصيل سريع',
    feature3Desc: 'طعامك يصلك ساخناً وفي وقت قياسي بفضل أسطولنا المجهز.',
    feature4Title: 'أسعار مناسبة',
    feature4Desc: 'نقدم لك القيمة الحقيقية: طعام فاخر بأسعار في متناول الجميع.',
    storyTag: 'قصتنا',
    storyTitle: 'أصالة المذاق منذ عام 2005',
    storyP1: 'بدأت حكاية "ابو قوره" من مطبخ صغير وشغف كبير بتقديم الأكل المصري على أصوله. كنا نؤمن دائماً أن الطعام ليس مجرد وجبة، بل هو ذاكرة وتاريخ واجتماع للأحبة على مائدة واحدة.',
    storyP2: 'على مدار السنوات، حافظنا على سر التتبيلة الأصيلة واهتمامنا البالغ بجودة اللحوم والمكونات. نطبخ بحب، ونقدم بشغف، لنجعل من كل زيارة لمطعمنا تجربة لا تُنسى.',
    storyQuote: 'هدفنا أن تشعر وكأنك تتناول الطعام في بيت العائلة، حيث الدفء والكرم والمذاق الذي لا يُعلى عليه',
    storyBtn: 'تصفح قائمة الطعام',
    storyBadge: 'عاماً من التميز والأصالة',
    reviewsTitle: 'آراء عملائنا',
    reviewsSubtitle: 'نفخر بثقة عملائنا، فهي الدافع الأكبر لنا لتقديم الأفضل دائماً.',
    review1Name: 'أحمد محمود',
    review1Role: 'عاشق للمشويات',
    review1Text: 'أفضل كفتة أكلتها في حياتي! التتبيلة مضبوطة جداً واللحمة بتدوب في الفم. المكان نظيف والخدمة ممتازة',
    review2Name: 'سارة عبد الرحمن',
    review2Role: 'مرشدة سياحية',
    review2Text: 'كل ما أستقبل ضيوف أجانب لازم أجيبهم هنا. ابو قوره يعبر عن الأكل المصري الحقيقي بكل فخر',
    review3Name: 'كريم حسن',
    review3Role: 'عميل دائم',
    review3Text: 'وجبة التوفير العائلية فعلاً ممتازة وتكفي العيلة كلها وأكثر. التوصيل كان سريع جداً والأكل وصل سخن',
    review4Name: 'مها السيد',
    review4Role: 'متذوقة طعام',
    review4Text: 'النظافة، الجودة، والسعر.. معادلة صعبة لكن ابو قوره حققها بجدارة. الشيش طاووق عندهم حكاية!',
  },
  en: {
    heroTitle: 'Abu Qura',
    heroSubtitle: 'Authentic taste from the heart of Egypt',
    orderNow: 'Order Now',
    discoverStory: 'Discover Our Story',
    discover: 'Discover',
    statsDishes: 'Dishes Count',
    statsExperience: 'Years of Experience',
    statsClients: 'Happy Clients',
    statsRating: 'Star Rating',
    menuTitle: 'Food Menu',
    menuSubtitle: 'We offer a wide selection of delicious dishes prepared daily from 100% fresh ingredients',
    addToOrder: 'Add to Order',
    whyTitle: 'Why Choose Abu Qura?',
    feature1Title: 'Daily Fresh Ingredients',
    feature1Desc: 'We choose our meats and vegetables with extreme care every morning to ensure top quality.',
    feature2Title: 'Professional Chefs',
    feature2Desc: 'Heritage recipes and skilled hands that make a difference in every dish we serve.',
    feature3Title: 'Fast Delivery',
    feature3Desc: 'Your food arrives hot and in record time thanks to our equipped fleet.',
    feature4Title: 'Reasonable Prices',
    feature4Desc: 'We offer real value: premium food at prices within everyone\'s reach.',
    storyTag: 'Our Story',
    storyTitle: 'Authentic taste since 2005',
    storyP1: 'The story of "Abu Qura" started from a small kitchen and a big passion for serving authentic Egyptian food. We always believed that food is not just a meal, but a memory, history, and gathering of loved ones around one table.',
    storyP2: 'Over the years, we preserved the secret of our authentic seasoning and our deep attention to the quality of meat and ingredients. We cook with love and serve with passion, making every visit an unforgettable experience.',
    storyQuote: 'Our goal is to make you feel like you are dining at family home, where warmth, generosity, and unparalleled taste unite',
    storyBtn: 'Browse Food Menu',
    storyBadge: 'Years of Excellence & Authenticity',
    reviewsTitle: 'Customer Reviews',
    reviewsSubtitle: 'We take pride in our customers\' trust, it is our greatest motivation to always offer the best.',
    review1Name: 'Ahmed Mahmoud',
    review1Role: 'Grills Lover',
    review1Text: 'Best kofta I\'ve had in my life! The seasoning is spot on and the meat melts in the mouth. Clean place and excellent service',
    review2Name: 'Sara Abdelrahman',
    review2Role: 'Tour Guide',
    review2Text: 'Whenever I host foreign guests, I must bring them here. Abu Qura represents real Egyptian food with pride',
    review3Name: 'Karim Hassan',
    review3Role: 'Regular Customer',
    review3Text: 'The family saving meal is truly excellent and easily feeds the whole family and more. Delivery was super fast and food arrived hot',
    review4Name: 'Maha El-Sayed',
    review4Role: 'Food Connoisseur',
    review4Text: 'Cleanliness, quality, and price.. a hard equation but Abu Qura achieved it brilliantly. Their shish tawook is legendary!',
  }
};

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [user, setUser] = useState<UserType | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [currentTab, setCurrentTab] = useState<'menu' | 'orders' | 'admin' | 'profile'>('menu');
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [customizingMenuItem, setCustomizingMenuItem] = useState<MenuItem | null>(null);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const isAr = lang === 'ar';
  const t = TRANSLATIONS[lang];

  // حقن خط Cairo لإضفاء طابع المحاذاة والجمال البصري المماثل تمامًا للتصاميم المرسلة
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMenu(data);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    let alreadyLoggedInAdmin = false;
    const savedUser = localStorage.getItem('abu_qura_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as UserType;
        setUser(parsed);
        if (parsed.role === 'admin') {
          setCurrentTab('admin');
          alreadyLoggedInAdmin = true;
        } else {
          setCurrentTab('menu');
        }
      } catch (err) {
        localStorage.removeItem('abu_qura_user');
      }
    }

    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    if (path === '/admin_abu_qura_user') {
      if (alreadyLoggedInAdmin) {
        window.history.replaceState({}, '', '/');
        addToast(
          isAr ? '👑 مرحباً بك مجدداً كمدير للقروب' : '👑 Welcome back, admin',
          isAr ? 'تم تحويلك مباشرة للوحة التحكم الإدارية.' : 'Redirected directly to the Admin Dashboard.',
          'success'
        );
      } else {
        fetch('/api/auth/admin-privacy-status')
          .then((res) => res.json())
          .then((data) => {
            if (data && data.privacyEnabled) {
              addToast(
                isAr ? '🛡️ وضع الحماية مفعل' : '🛡️ Protection Active',
                isAr 
                  ? 'لا يمكنك التسجيل أو الدخول كمسؤول حالياً لإنك قمت بتفعيل وضع الخصوصية لضمان عدم دخول أي جهاز آخر.' 
                  : 'You cannot register or login as admin right now because you activated session privacy to prevent unauthorized access.',
                'warning'
              );
              window.history.replaceState({}, '', '/');
            } else {
              setIsAdminRoute(true);
              setAuthOpen(true);
            }
          })
          .catch(() => {
            setIsAdminRoute(true);
            setAuthOpen(true);
          });
      }
    }

    fetchMenu();
    fetchCategories();
  }, []);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const url = user.role === 'admin' 
        ? `/api/orders?isAdmin=true&userId=${user.id}` 
        : `/api/orders?userId=${user.id}`;
      const res = await fetch(url, {
        headers: {
          'x-user-id': user.id,
          'Authorization': user.token ? `Bearer ${user.token}` : ''
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, currentTab]);

  useEffect(() => {
    const socket = io({
      query: {
        userId: user?.id || '',
        isAdmin: user?.role === 'admin' ? 'true' : 'false',
        token: user?.token || ''
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('📡 [Socket.io] Live real-time sync tunnel connected.');
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ [Socket.io] Connection error, attempting fallback transports...', error);
    });

    socket.on('new-order', (newOrder: Order) => {
      try {
        if (!user || user.role !== 'admin') return;

        let wasAdded = false;
        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          wasAdded = true;
          return [newOrder, ...prev];
        });

        setTimeout(() => {
          if (wasAdded) {
            playNotificationChime();
            addToast(
              isAr ? '🔔 طلب كباب ومأكولات جديد!' : '🔔 New Delicious Order!',
              isAr 
                ? `وصل للتو طلب جديد من العميل (${newOrder.username}) بقيمة ${newOrder.total} ج.م` 
                : `New order received from client (${newOrder.username}) totaling ${newOrder.total} EGP`,
              'success'
            );
          }
        }, 50);
      } catch (err) {
        console.error('Error handling Socket.io new-order event:', err);
      }
    });

    socket.on('order-status-updated', (updatedOrder: Order) => {
      try {
        if (!user) return;

        let isUpdated = false;
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === updatedOrder.id);
          if (exists) {
            if (exists.status === updatedOrder.status) return prev;
            isUpdated = true;
            return prev.map((o) => o.id === updatedOrder.id ? updatedOrder : o);
          } else {
            const shouldAdd = user?.role === 'admin' || updatedOrder.userId === user?.id;
            if (shouldAdd) {
              isUpdated = true;
              return [updatedOrder, ...prev];
            }
            return prev;
          }
        });

        setTimeout(() => {
          if (isUpdated) {
            const statusAr = updatedOrder.status === 'preparing' 
              ? 'جاري تحضيره وطهيه الآن في المطبخ 🍳' 
              : updatedOrder.status === 'delivered' 
              ? 'تم توصيله لك بالهناء والشفاء! 🛵' 
              : 'نعتذر بشدة، تم رفض الطلب ❌';

            const statusEn = updatedOrder.status === 'preparing'
              ? 'is being prepared and cooked now! 🍳'
              : updatedOrder.status === 'delivered'
              ? 'has been delivered! Enjoy your meal! 🛵'
              : 'has been rejected due to busy hours ❌';

            playStatusUpdateChime(updatedOrder.status !== 'rejected');

            addToast(
              isAr ? '👨‍🍳 تحديث حالة طلبك' : '👨‍🍳 Order Status Update',
              isAr 
                ? `طلبك رقم #${updatedOrder.id} ${statusAr}` 
                : `Your order #${updatedOrder.id} ${statusEn}`,
              updatedOrder.status === 'rejected' ? 'warning' : 'info'
            );
          }
        }, 50);
      } catch (err) {
        console.error('Error handling Socket.io order-status event:', err);
      }
    });

    socket.on('order-deleted', (deletedOrderId: string) => {
      try {
        if (!user) return;
        setOrders((prev) => prev.filter((o) => o.id !== deletedOrderId));
        console.log(`🗑️ [Socket.io] Order ${deletedOrderId} deleted on server, sync complete.`);
      } catch (err) {
        console.error('Error handling Socket.io order-deleted event:', err);
      }
    });

    socket.on('menu-updated', () => {
      console.log('🍔 [Socket.io] Menu updated on server. Fetching latest menu...');
      fetchMenu();
    });

    socket.on('categories-updated', () => {
      console.log('📂 [Socket.io] Categories updated on server. Fetching latest categories...');
      fetchCategories();
    });

    let eventSource: EventSource | null = null;
    if (user) {
      const queryParams = new URLSearchParams({
        userId: user.id,
        isAdmin: user.role === 'admin' ? 'true' : 'false',
        token: user.token || ''
      });

      eventSource = new EventSource(`/api/events?${queryParams.toString()}`);

      eventSource.addEventListener('new-order', (event: any) => {
        try {
          if (user?.role !== 'admin') return;
          const newOrder = JSON.parse(event.data) as Order;
          setOrders((prev) => {
            if (prev.some((o) => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
        } catch (err) {}
      });

      eventSource.addEventListener('order-status-updated', (event: any) => {
        try {
          const updatedOrder = JSON.parse(event.data) as Order;
          setOrders((prev) => {
            const exists = prev.find((o) => o.id === updatedOrder.id);
            if (exists) {
              return prev.map((o) => o.id === updatedOrder.id ? updatedOrder : o);
            } else {
              const shouldAdd = user?.role === 'admin' || updatedOrder.userId === user?.id;
              return shouldAdd ? [updatedOrder, ...prev] : prev;
            }
          });
        } catch (err) {}
      });
    }

    return () => {
      socket.disconnect();
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user, lang]);

  const handleAuthSuccess = (authUser: UserType) => {
    setUser(authUser);
    localStorage.setItem('abu_qura_user', JSON.stringify(authUser));
    
    addToast(
      isAr ? '🟢 تم تسجيل الدخول بنجاح' : '🟢 Logged In Successfully',
      isAr 
        ? `أهلاً بك يا ${authUser.username} في مطعم أبو قورة` 
        : `Welcome, ${authUser.username} to Abu Qura Restaurant`,
      'success'
    );

    if (authUser.role === 'admin') {
      setCurrentTab('admin');
      window.history.replaceState({}, '', '/');
    } else {
      setCurrentTab('menu');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('abu_qura_user');
    setCartItems([]);
    setOrders([]);
    setCurrentTab('menu');

    addToast(
      isAr ? '⚪ تم تسجيل الخروج' : '⚪ Logged Out',
      isAr ? 'نتمنى رؤيتك قريباً للاستمتاع بوجباتنا الشهية' : 'We hope to see you again soon for more culinary delights',
      'info'
    );
  };

  const handleAddToCart = (item: MenuItem) => {
    setCustomizingMenuItem(item);
  };

  const handleUpdateCartQuantity = (item: MenuItem, change: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (!existing) return prev;

      const newQty = existing.quantity + change;
      if (newQty <= 0) {
        return prev.filter((i) => i.menuItem.id !== item.id);
      }
      return prev.map((i) => i.menuItem.id === item.id ? { ...i, quantity: newQty } : i);
    });
  };

  const handleRemoveCartItem = (item: MenuItem) => {
    setCartItems((prev) => prev.filter((i) => i.menuItem.id !== item.id));
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      setOrders((prev) => prev.map((o) => o.id === orderId ? data.order : o));

      addToast(
        isAr ? '✅ تم تحديث حالة الطلب' : '✅ Order Status Updated',
        isAr 
          ? `الطلب #${orderId} الآن في حالة (${status === 'preparing' ? 'التحضير والطهي' : status === 'delivered' ? 'التسليم' : 'الرفض'})`
          : `Order #${orderId} is now (${status})`,
        'success'
      );
    } catch (err: any) {
      addToast(
        isAr ? '❌ فشل تحديث حالة الطلب' : '❌ Failed to Update Order',
        err.message || 'An error occurred',
        'warning'
      );
    }
  };

  // معالجة الفرز والتصنيف بالتطابق البصري والبرمجي
  const activeCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const activeMenu = menu.length > 0 ? menu : DEFAULT_MENU_ITEMS;

  const filteredMenu = activeMenu.filter((item) => {
    if (selectedCategory === 'all') return true;
    const catObj = activeCategories.find((c) => c.id === selectedCategory);
    if (!catObj) return item.category === selectedCategory;
    return item.category === catObj.nameAr || item.category === catObj.nameEn || item.category === catObj.id;
  });

  return (
    <div 
      style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "inherit" }} 
      className="min-h-screen bg-gray-50 flex flex-col transition-all duration-300" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      
      {/* Dynamic Top Navigation Header */}
      <Navbar
        user={user}
        lang={lang}
        setLang={setLang}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'orders' && !user) {
            setAuthOpen(true);
          } else {
            setCurrentTab(tab);
            if (tab === 'menu') {
              setTimeout(() => {
                document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          }
        }}
      />

      {/* Main Container Content */}
      <main className="flex-grow w-full">
        
        {currentTab === 'menu' && (
          <>
            {/* 1. SECTION: HERO (مستوحى من input_file_0.png) */}
            <section 
              id="hero" 
              className="relative h-[95vh] flex items-center justify-center overflow-hidden bg-cover bg-center"
              style={{ 
                backgroundImage: `url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1600')` 
              }}
            >
              {/* التراكب المظلم لإبراز المحتوى */}
              <div className="absolute inset-0 bg-black/60 backdrop-brightness-75 z-0" />
              
              <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-wide select-none drop-shadow-2xl">
                  {t.heroTitle}
                </h1>
                
                {/* الخط الذهبي الفاصل أسفل الكلمة */}
                <div className="w-24 h-1.5 bg-[#f3a216] rounded-full mt-4 drop-shadow" />
                
                <p className="text-lg md:text-2xl font-bold text-white mt-6 opacity-95 drop-shadow">
                  {t.heroSubtitle}
                </p>

                {/* أزرار اتخاذ القرار ثنائية التنسيق */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full max-w-md">
                  <button 
                    onClick={() => {
                      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto bg-[#af301d] hover:bg-[#922415] text-white font-black px-8 py-3.5 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl"
                  >
                    {t.orderNow}
                  </button>
                  <button 
                    onClick={() => {
                      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto bg-[#231d1a]/60 hover:bg-[#231d1a]/85 text-white font-black px-8 py-3.5 rounded-full border border-white/20 transition-all duration-300 transform hover:scale-105 shadow-xl"
                  >
                    {t.discoverStory}
                  </button>
                </div>
              </div>

              {/* مؤشر التنقل للأسفل */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
                <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">
                  {t.discover}
                </span>
                <div className="w-[1px] h-10 bg-[#f3a216] mt-2 animate-bounce rounded-full" />
              </div>
            </section>

            {/* 2. SECTION: STATS COUNTERS (مستوحى من input_file_1.png) */}
            <section className="bg-[#231d1a] text-white py-14 border-y border-white/5 relative z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
                  
                  {/* العداد 4 */}
                  <div className="flex flex-col items-center justify-center text-center px-4 md:border-l md:border-white/10 last:border-l-0">
                    <span className="text-4xl md:text-5xl font-black text-[#f3a216] drop-shadow-sm">4.9</span>
                    <span className="text-xs md:text-sm text-gray-400 font-bold mt-2">{t.statsRating}</span>
                  </div>

                  {/* العداد 3 */}
                  <div className="flex flex-col items-center justify-center text-center px-4 md:border-l md:border-white/10">
                    <span className="text-4xl md:text-5xl font-black text-[#f3a216] drop-shadow-sm">+50k</span>
                    <span className="text-xs md:text-sm text-gray-400 font-bold mt-2">{t.statsClients}</span>
                  </div>

                  {/* العداد 2 */}
                  <div className="flex flex-col items-center justify-center text-center px-4 md:border-l md:border-white/10">
                    <span className="text-4xl md:text-5xl font-black text-[#f3a216] drop-shadow-sm">18</span>
                    <span className="text-xs md:text-sm text-gray-400 font-bold mt-2">{t.statsExperience}</span>
                  </div>

                  {/* العداد 1 */}
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <span className="text-4xl md:text-5xl font-black text-[#f3a216] drop-shadow-sm">+150</span>
                    <span className="text-xs md:text-sm text-gray-400 font-bold mt-2">{t.statsDishes}</span>
                  </div>

                </div>
              </div>
            </section>

            {/* 3. SECTION: THE MENU AREA (مستوحى من input_file_2.png & input_file_3.png) */}
            <section id="menu" className="bg-white py-20 md:py-28 relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* رأس قسم القائمة والخط الأحمر الفاصل */}
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-4xl md:text-5xl font-black text-[#231d1a] tracking-tight">
                    {t.menuTitle}
                  </h2>
                  <div className="w-16 h-1 bg-[#af301d] mx-auto mt-4 rounded-full" />
                  <p className="text-sm md:text-base text-gray-500 font-medium mt-4 leading-relaxed">
                    {t.menuSubtitle}
                  </p>
                </div>

                {/* أزرار الفلترة المستديرة */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-10 mb-16">
                  {activeCategories.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-6 py-2 rounded-full font-bold text-xs md:text-sm transition-all duration-300 transform hover:scale-105 shadow-sm ${
                          isActive 
                            ? 'bg-[#af301d] text-white' 
                            : 'bg-white text-gray-600 hover:text-black border border-gray-200'
                        }`}
                      >
                        {isAr ? cat.nameAr : cat.nameEn}
                      </button>
                    );
                  })}
                </div>

                {/* شبكة المنتجات بتطابق بصري 100% */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredMenu.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col group hover:-translate-y-1"
                    >
                      {/* حاوية الصورة وشارة السعر المستديرة */}
                      <div className="relative h-60 w-full overflow-hidden shrink-0">
                        <img 
                          src={item.image} 
                          alt={isAr ? item.nameAr : item.nameEn}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#231d1a] font-black text-xs px-4 py-2 rounded-full shadow-md z-10">
                          {item.price} {isAr ? 'ج.م' : 'EGP'}
                        </div>
                      </div>

                      {/* نصوص الكارت بالتنسيق اليميني */}
                      <div className="p-6 flex flex-col flex-grow text-right" dir="rtl">
                        <h3 className="text-lg md:text-xl font-bold text-[#231d1a] leading-tight">
                          {isAr ? item.nameAr : item.nameEn}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium mt-2 line-clamp-2 min-h-[40px]">
                          {isAr ? item.descriptionAr : item.descriptionEn}
                        </p>

                        {/* زر السلة ذو اللون الكريمي والخط الأحمر */}
                        <div className="mt-6 pt-2">
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="w-full py-3 rounded-xl bg-[#f7eae8] hover:bg-[#ebd5d1] text-[#af301d] font-bold text-xs md:text-sm transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            {t.addToOrder}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            {/* 4. SECTION: WHY CHOOSE US (مستوحى من input_file_4.png) */}
            <section id="why-choose-us" className="bg-[#f8f7f5] py-20 md:py-24 border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-black text-[#231d1a] tracking-tight">
                    {t.whyTitle}
                  </h2>
                  <div className="w-16 h-1 bg-[#f3a216] mx-auto mt-3 rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                  
                  {/* الميزة 4: الأسعار المناسبة */}
                  <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-[#f7eae8] flex items-center justify-center text-[#af301d] mb-6 shadow-sm">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-base md:text-lg font-black text-[#231d1a] mb-2">{t.feature4Title}</h3>
                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-semibold">{t.feature4Desc}</p>
                  </div>

                  {/* الميزة 3: توصيل سريع */}
                  <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-[#f7eae8] flex items-center justify-center text-[#af301d] mb-6 shadow-sm">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-base md:text-lg font-black text-[#231d1a] mb-2">{t.feature3Title}</h3>
                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-semibold">{t.feature3Desc}</p>
                  </div>

                  {/* الميزة 2: طهاة محترفون */}
                  <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-[#f7eae8] flex items-center justify-center text-[#af301d] mb-6 shadow-sm">
                      <ChefHat className="w-6 h-6" />
                    </div>
                    <h3 className="text-base md:text-lg font-black text-[#231d1a] mb-2">{t.feature2Title}</h3>
                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-semibold">{t.feature2Desc}</p>
                  </div>

                  {/* الميزة 1: مكونات طازجة يومياً */}
                  <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-[#f7eae8] flex items-center justify-center text-[#af301d] mb-6 shadow-sm">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <h3 className="text-base md:text-lg font-black text-[#231d1a] mb-2">{t.feature1Title}</h3>
                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-semibold">{t.feature1Desc}</p>
                  </div>

                </div>

              </div>
            </section>

            {/* 5. SECTION: OUR STORY (مستوحى من input_file_5.png) */}
            <section id="about" className="bg-white py-20 md:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  {/* عمود النصوص من اليمين لليسار */}
                  <div className="lg:col-span-6 flex flex-col text-right items-start" dir="rtl">
                    <div className="flex items-center gap-2">
                      <span className="text-[#f3a216] font-extrabold text-sm tracking-wider uppercase block">{t.storyTag}</span>
                      <div className="w-6 h-[2px] bg-[#f3a216]" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-[#231d1a] leading-tight mt-2">
                      {t.storyTitle}
                    </h2>
                    <p className="text-sm md:text-base text-gray-500 leading-relaxed font-semibold mt-6">
                      {t.storyP1}
                    </p>
                    <p className="text-sm md:text-base text-gray-500 leading-relaxed font-semibold mt-4">
                      {t.storyP2}
                    </p>

                    {/* المقتبس الكريمي والحد الأحمر الأيمن البارز */}
                    <div className="bg-[#f7eae8] p-6 rounded-2xl border-r-4 border-[#af301d] text-right text-[#231d1a] font-extrabold text-sm leading-relaxed italic mt-6 shadow-sm w-full">
                      "{t.storyQuote}"
                    </div>

                    <button 
                      onClick={() => {
                        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-[#231d1a] hover:bg-[#1a1412] text-white font-black text-xs md:text-sm px-8 py-3.5 rounded-full mt-8 shadow-md transition-all transform hover:scale-105"
                    >
                      {t.storyBtn}
                    </button>
                  </div>

                  {/* عمود صورة المخبز التقليدي والشارة الملحقة */}
                  <div className="lg:col-span-6 relative">
                    <div className="rounded-[32px] overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] md:aspect-square lg:aspect-[4/3]">
                      <img 
                        src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1000" 
                        alt="فرن ابو قورة" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* الشارة البيضاء العائمة للتميز */}
                    <div className="absolute -bottom-4 -right-4 bg-white py-5 px-6 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center justify-center text-center z-10 max-w-[140px]">
                      <span className="text-4xl font-black text-[#af301d]">+18</span>
                      <span className="text-[10px] text-gray-400 font-extrabold mt-1 leading-snug">{t.storyBadge}</span>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* 6. SECTION: TESTIMONIALS (مستوحى من input_file_6.png) */}
            <section id="reviews" className="bg-[#f8f7f5] py-20 md:py-24 border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-black text-[#231d1a] tracking-tight">
                    {t.reviewsTitle}
                  </h2>
                  <div className="w-16 h-1 bg-[#af301d] mx-auto mt-3 rounded-full" />
                  <p className="text-sm md:text-base text-gray-500 font-medium mt-4 leading-relaxed">
                    {t.reviewsSubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                  
                  {/* بطاقة التقييم 4 (أحمد محمود) */}
                  <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-0.5 justify-end mb-4">
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold italic text-right mb-6">
                      "{t.review1Text}"
                    </p>
                    <div className="text-right mt-auto">
                      <h4 className="text-sm font-black text-[#231d1a]">{t.review1Name}</h4>
                      <span className="text-[10px] text-[#af301d] font-bold block mt-0.5">{t.review1Role}</span>
                    </div>
                  </div>

                  {/* بطاقة التقييم 3 (سارة عبد الرحمن) */}
                  <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-0.5 justify-end mb-4">
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold italic text-right mb-6">
                      "{t.review2Text}"
                    </p>
                    <div className="text-right mt-auto">
                      <h4 className="text-sm font-black text-[#231d1a]">{t.review2Name}</h4>
                      <span className="text-[10px] text-[#af301d] font-bold block mt-0.5">{t.review2Role}</span>
                    </div>
                  </div>

                  {/* بطاقة التقييم 2 (كريم حسن - 4 نجوم فقط طبق الأصل) */}
                  <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-0.5 justify-end mb-4">
                      <Star className="w-4 h-4 text-gray-300" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold italic text-right mb-6">
                      "{t.review3Text}"
                    </p>
                    <div className="text-right mt-auto">
                      <h4 className="text-sm font-black text-[#231d1a]">{t.review3Name}</h4>
                      <span className="text-[10px] text-[#af301d] font-bold block mt-0.5">{t.review3Role}</span>
                    </div>
                  </div>

                  {/* بطاقة التقييم 1 (مها السيد) */}
                  <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-0.5 justify-end mb-4">
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                      <Star className="w-4 h-4 fill-[#f3a216] text-[#f3a216]" />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold italic text-right mb-6">
                      "{t.review4Text}"
                    </p>
                    <div className="text-right mt-auto">
                      <h4 className="text-sm font-black text-[#231d1a]">{t.review4Name}</h4>
                      <span className="text-[10px] text-[#af301d] font-bold block mt-0.5">{t.review4Role}</span>
                    </div>
                  </div>

                </div>

              </div>
            </section>
          </>
        )}

        {currentTab === 'orders' && user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <UserOrders
              userId={user.id}
              lang={lang}
              orders={orders}
              onRefresh={fetchOrders}
              loading={loadingOrders}
            />
          </div>
        )}

        {currentTab === 'admin' && user?.role === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <AdminDashboard
              user={user}
              orders={orders}
              lang={lang}
              menu={menu}
              categories={categories}
              onUpdateStatus={handleUpdateOrderStatus}
              onRefresh={fetchOrders}
              onRefreshMenu={fetchMenu}
              onRefreshCategories={fetchCategories}
              loading={loadingOrders}
            />
          </div>
        )}

        {currentTab === 'profile' && user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <ProfileSettings
              user={user}
              lang={lang}
              onUpdateUser={(updatedUser) => {
                setUser(updatedUser);
                localStorage.setItem('abu_qura_user', JSON.stringify(updatedUser));
              }}
              addToast={addToast}
            />
          </div>
        )}

      </main>

      {/* Culinary Footer Block */}
      <footer id="contact" className="bg-[#231d1a] text-white pt-16 pb-32 md:py-16 border-t border-white/5" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#E0A93B] bg-white shrink-0 shadow-lg transition-transform duration-300 hover:scale-105 flex items-center justify-center">
              <img 
                src="/src/assets/images/abu_goura_original_logo_1784129485186.jpg" 
                alt="أبو قورة" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-right">
              <span className="text-lg font-black tracking-tight block text-white">مطعم أبو قورة الفلاحي</span>
              <span className="text-[10px] text-[#f3a216] font-bold uppercase tracking-widest block -mt-0.5">ABU GOURA RESTAURANT</span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 font-semibold">
              © {new Date().getFullYear()} {isAr ? 'مطعم أبو قورة. جميع الحقوق محفوظة لأسرة قورة.' : 'Abu Qura Restaurant. All rights reserved.'}
            </p>
            <span className="text-[9px] text-[#f3a216]/70 font-mono block mt-1">
              {isAr ? 'نظام دمج وتنسيق سحابي متكامل' : 'Full-Stack Server Synced Engine'}
            </span>
          </div>
        </div>
      </footer>

      {/* Overlays / Drawers */}
      
      {/* 1. Auth Login / Register Dialog */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        lang={lang}
        allowAdmin={isAdminRoute || user?.role === 'admin'}
      />

      {/* Customization modal for meals toppings and rating */}
      <MealCustomizationModal
        isOpen={customizingMenuItem !== null}
        onClose={() => setCustomizingMenuItem(null)}
        menuItem={customizingMenuItem}
        lang={lang}
        onConfirm={(customCartItem) => {
          setCartItems((prev) => {
            const existingIndex = prev.findIndex((i) => {
              if (i.menuItem.id !== customCartItem.menuItem.id) return false;
              const iExtras = i.extras || [];
              const cExtras = customCartItem.extras || [];
              if (iExtras.length !== cExtras.length) return false;
              return iExtras.every((ie) => cExtras.some((ce) => ce.nameAr === ie.nameAr));
            });

            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                quantity: updated[existingIndex].quantity + customCartItem.quantity
              };
              return updated;
            }
            return [...prev, customCartItem];
          });

          addToast(
            isAr ? '🛒 تمت إضافة وجبتك المخصصة للسلة' : '🛒 Added customized meal to cart',
            isAr 
              ? `تم إضافة (${customCartItem.menuItem.nameAr}) مع الإضافات لسلتك` 
              : `Added (${customCartItem.menuItem.nameEn}) with extras to your cart`,
            'info'
          );
        }}
      />

      {/* 2. Side Sliding Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        user={user}
        onOpenAuth={() => {
          setCartOpen(false);
          setAuthOpen(true);
        }}
        lang={lang}
        onOrderSuccess={(updatedUser, newOrder) => {
          if (updatedUser) {
            setUser(updatedUser);
            localStorage.setItem('abu_qura_user', JSON.stringify(updatedUser));
          }
          if (newOrder) {
            setOrders((prev) => {
              if (prev.some((o) => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
          }
          addToast(
            isAr ? '🎉 تم إرسال طلبك للمطبخ!' : '🎉 Order sent to Kitchen!',
            isAr 
              ? 'تلقى الطهاة طلبك وسيبدأ العمل عليه فوراً. تتبع حالة طلبك مباشرة!' 
              : 'Our chefs received your order and will start cooking immediately. Track it live!',
            'success'
          );
          setCurrentTab('orders');
          fetchOrders();
        }}
      />

      {/* Modern Fixed Bottom Navigation Bar for Mobile */}
      <BottomNavigation
        user={user}
        lang={lang}
        setLang={setLang}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'menu') {
            setTimeout(() => {
              document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }}
      />

      {/* Floating Stack of Real-time Toaster Alerts */}
      <div 
        className="fixed bottom-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4"
        style={{
          right: isAr ? 'auto' : '1.5rem',
          left: isAr ? '1.5rem' : 'auto',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="p-4.5 rounded-2xl bg-white border border-brand-primary/10 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <div className="p-1 rounded-lg bg-brand-primary/5 shrink-0 text-[#f3a216]">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 text-right" dir={isAr ? 'rtl' : 'ltr'}>
              <h4 className="text-xs font-black text-brand-primary">
                {t.title}
              </h4>
              <p className="text-[10px] text-gray-500 leading-relaxed font-semibold mt-0.5">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}