'use client';
import React, { useState } from 'react';

// الملاعب الافتراضية
const initialCourts = [
  { id: '1', name: 'ملعب العيون', pricePerHour: 200 },
  { id: '2', name: 'ملعب الشاغور', pricePerHour: 200 },
  { id: '3', name: 'ملعب البانياس', pricePerHour: 200 },
];

// دالة لتوليد نطاق نصف ساعة (من - إلى)
const generateHalfHourSlotsWithEnd = () => {
  const slots: { start: string; end: string; label: string }[] = [];
  for (let hour = 8; hour <= 23; hour++) {
    const hStr = hour < 10 ? `0${hour}` : `${hour}`;
    const nextHStr = (hour + 1) < 10 ? `0${hour + 1}` : `${hour + 1}`;

    // النصف الأول: XX:00 - XX:30
    slots.push({
      start: `${hStr}:00`,
      end: `${hStr}:30`,
      label: `${hStr}:00 - ${hStr}:30`
    });

    // النصف الثاني: XX:30 - (XX+1):00
    if (hour < 23) {
      slots.push({
        start: `${hStr}:30`,
        end: `${nextHStr}:00`,
        label: `${hStr}:30 - ${nextHStr}:00`
      });
    }
  }
  return slots;
};

const TIME_SLOTS_DATA = generateHalfHourSlotsWithEnd();

// خيارات المدة بدقائق
const DURATION_OPTIONS = [
  { label: 'نصف ساعة', minutes: 30 },
  { label: 'ساعة', minutes: 60 },
  { label: 'ساعة ونصف ', minutes: 90 },
  { label: 'ساعتان', minutes: 120 },
  { label: 'ساعتان ونصف', minutes: 150 },
  { label: 'ثلاث ساعات', minutes: 180 },
];

interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startSlot: string;
  durationMinutes: number;
  reservedSlots: string[];
  totalPrice: number;
  extras: string[];
}

export default function Home() {
  const [view, setView] = useState<'home' | 'details' | 'login' | 'admin'>('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [courts, setCourts] = useState(initialCourts);
  const [selectedCourt, setSelectedCourt] = useState<typeof initialCourts[0] | null>(null);

  // قائمة الحجوزات
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'b1',
      courtId: '1',
      courtName: 'ملعب العيون',
      customerName: 'محمد عجبارية',
      customerPhone: '0501234567',
      date: '2026-07-29',
      startSlot: '18:00',
      durationMinutes: 90,
      reservedSlots: ['18:00', '18:30', '19:00'],
      totalPrice: 200,
      extras: ['طابة كرة قدم'],
    }
  ]);

  // نموذج الحجز للزبون
  const [bookingDate, setBookingDate] = useState('2026-07-29');
  const [startSlot, setStartSlot] = useState<string>('08:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [addBall, setAddBall] = useState(false);
  const [addGloves, setAddGloves] = useState(false);
  const [addVests, setAddVests] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // تعديل الأدمن
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtPrice, setNewCourtPrice] = useState('');
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [newPriceInput, setNewPriceInput] = useState<string>('');

  // ------------------ LOGIC ------------------

  const handleOpenDetails = (court: typeof initialCourts[0]) => {
    setSelectedCourt(court);
    setView('details');
    setBookingSuccess(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === 'radmin' && loginPass === '12345') {
      setIsAdminLoggedIn(true);
      setView('admin');
      setLoginError('');
    } else {
      setLoginError('اسم المستخدم أو كلمة السر غير صحيحة!');
    }
  };

  // حساب السلوتات المختارة
  const getSelectedTimeRange = () => {
    const startIndex = TIME_SLOTS_DATA.findIndex(s => s.start === startSlot);
    if (startIndex === -1) return [];
    const slotsCount = durationMinutes / 30;
    return TIME_SLOTS_DATA.slice(startIndex, startIndex + slotsCount).map(s => s.start);
  };

  const selectedRange = getSelectedTimeRange();

  const getBookedSlotsForCourt = (courtId: string, date: string) => {
    return bookings
      .filter(b => b.courtId === courtId && b.date === date)
      .flatMap(b => b.reservedSlots);
  };

  const currentBookedSlots = selectedCourt 
    ? getBookedSlotsForCourt(selectedCourt.id, bookingDate) 
    : [];

  const slotsNeeded = durationMinutes / 30;
  const startIndex = TIME_SLOTS_DATA.findIndex(s => s.start === startSlot);
  const isOverflow = (startIndex + slotsNeeded) > TIME_SLOTS_DATA.length;

  const hasConflict = selectedRange.some(slot => currentBookedSlots.includes(slot)) || isOverflow;

  const calculatePrice = () => {
    if (!selectedCourt) return 0;
    const extraServicesTotal = (addBall ? 20 : 0) + (addGloves ? 15 : 0) + (addVests ? 25 : 0);

    if (durationMinutes === 90) {
      return 200 + extraServicesTotal;
    }

    const courtPrice = (selectedCourt.pricePerHour * durationMinutes) / 60;
    return courtPrice + extraServicesTotal;
  };

  const totalPrice = calculatePrice();

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourt || hasConflict || !customerName || !customerPhone) return;

    const extrasArray = [];
    if (addBall) extrasArray.push('كرة');
    if (addGloves) extrasArray.push('كفوف حارس');
    if (addVests) extrasArray.push('شيالات');

    const newBooking: Booking = {
      id: Date.now().toString(),
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      customerName,
      customerPhone,
      date: bookingDate,
      startSlot,
      durationMinutes,
      reservedSlots: selectedRange,
      totalPrice,
      extras: extrasArray,
    };

    setBookings([...bookings, newBooking]);
    setBookingSuccess(true);
  };

  const handleDeleteBooking = (id: string) => {
    setBookings(bookings.filter(b => b.id !== id));
  };

  const handleUpdatePrice = (id: string) => {
    const priceNum = Number(newPriceInput);
    if (isNaN(priceNum) || priceNum < 0) return;

    setBookings(bookings.map(b => b.id === id ? { ...b, totalPrice: priceNum } : b));
    setEditingBookingId(null);
    setNewPriceInput('');
  };

  const handleAddCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourtName || !newCourtPrice) return;
    setCourts([...courts, { id: Date.now().toString(), name: newCourtName, pricePerHour: Number(newCourtPrice) }]);
    setNewCourtName('');
    setNewCourtPrice('');
  };

  const handleDeleteCourt = (id: string) => {
    setCourts(courts.filter(c => c.id !== id));
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border mb-6">
        <h1 
          className="text-2xl font-bold text-emerald-600 cursor-pointer flex items-center gap-2"
          onClick={() => setView('home')}
        >
          ⚽ ملاعب أم الفحم
        </h1>
        
        <div>
          {isAdminLoggedIn ? (
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => setView('admin')} 
                className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700 transition"
              >
                لوحة الأدمن ({bookings.length} حجز)
              </button>
              <button 
                onClick={() => { setIsAdminLoggedIn(false); setView('home'); }} 
                className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 transition"
              >
                خروج
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setView('login')} 
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
            >
              تسجيل الدخول (أدمن)
            </button>
          )}
        </div>
      </header>

      {/* 1. HOME VIEW */}
      {view === 'home' && (
        <div className="max-w-5xl mx-auto">
          <section className="text-center bg-white p-8 rounded-2xl shadow-sm border mb-8">
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">احجز ملعبك بأم الفحم بسهولة</h2>
            <p className="text-slate-500">حجز مرن، تحديد أوقات واضح، وتأكيد فوري.</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div key={court.id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between hover:shadow-md transition">
                <div className="text-center">
                  <div className="text-5xl mb-4">⚽</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{court.name}</h3>
                  <p className="text-emerald-600 font-bold mb-4">{court.pricePerHour} ₪ / ساعة</p>
                </div>
                <button 
                  onClick={() => handleOpenDetails(court)}
                  className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition"
                >
                  عرض الأوقات المتاحة
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. DETAILS & BOOKING VIEW */}
      {view === 'details' && selectedCourt && (
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-sm border">
          <button onClick={() => setView('home')} className="text-slate-500 hover:text-slate-800 text-sm font-bold mb-4 inline-block">
            ← العودة للملاعب
          </button>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">تفاصيل الحجز - {selectedCourt.name}</h2>
          <p className="text-emerald-600 font-semibold mb-6">السعر: {selectedCourt.pricePerHour} ₪ / ساعة | (ساعة ونصف بـ 200 ₪)</p>

          {bookingSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-bold mb-2">تم الحجز بنجاح!</h3>
              <p>شكراً لك **{customerName}**، تم تأكيد حجزك في **{selectedCourt.name}**.</p>
              <p className="text-sm mt-2 text-emerald-700">السعر الإجمالي: {totalPrice} ₪</p>
              <button onClick={() => setView('home')} className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700">
                العودة للرئيسية
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div>
                <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">1. اختيار الوقت والمدة</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-800 mb-1">تاريخ الحجز</label>
                  <input 
                    type="date" 
                    value={bookingDate} 
                    onChange={(e) => setBookingDate(e.target.value)} 
                    className="w-full p-2.5 border rounded-lg text-slate-900 font-medium bg-white" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">وقت البدء</label>
                    <select 
                      value={startSlot} 
                      onChange={(e) => setStartSlot(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg text-slate-900 font-medium bg-white"
                    >
                      {TIME_SLOTS_DATA.map((slot) => (
                        <option key={slot.start} value={slot.start} className="text-slate-900">
                          {slot.start}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">مدة الحجز</label>
                    <select 
                      value={durationMinutes} 
                      onChange={(e) => setDurationMinutes(Number(e.target.value))} 
                      className="w-full p-2.5 border rounded-lg text-slate-900 font-medium bg-white"
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt.minutes} value={opt.minutes} className="text-slate-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* معدات إضافية بأسماء واضحة باللون الأسود */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">معدات إضافية</label>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-2.5 border rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                      <span className="flex items-center gap-2 text-slate-900 font-medium">
                        <input type="checkbox" checked={addBall} onChange={(e) => setAddBall(e.target.checked)} className="w-4 h-4 accent-emerald-600" /> 
                        طابة كرة قدم
                      </span>
                      <span className="text-sm font-bold text-emerald-600">+20 ₪</span>
                    </label>
                    
                    <label className="flex items-center justify-between p-2.5 border rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                      <span className="flex items-center gap-2 text-slate-900 font-medium">
                        <input type="checkbox" checked={addGloves} onChange={(e) => setAddGloves(e.target.checked)} className="w-4 h-4 accent-emerald-600" /> 
                        كفوف حارس
                      </span>
                      <span className="text-sm font-bold text-emerald-600">+15 ₪</span>
                    </label>
                    
                    <label className="flex items-center justify-between p-2.5 border rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                      <span className="flex items-center gap-2 text-slate-900 font-medium">
                        <input type="checkbox" checked={addVests} onChange={(e) => setAddVests(e.target.checked)} className="w-4 h-4 accent-emerald-600" /> 
                        شيالات تمييز
                      </span>
                      <span className="text-sm font-bold text-emerald-600">+25 ₪</span>
                    </label>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">2. تفاصيل الزبون</h3>
                <form onSubmit={handleConfirmBooking} className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="الاسم الكامل" 
                    required 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    className="w-full p-2.5 border rounded-lg text-slate-900 placeholder:text-slate-400 font-medium bg-white" 
                  />
                  <input 
                    type="tel" 
                    placeholder="رقم الهاتف" 
                    required 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)} 
                    className="w-full p-2.5 border rounded-lg text-slate-900 placeholder:text-slate-400 font-medium bg-white" 
                  />

                  <div className="bg-slate-100 p-4 rounded-xl flex justify-between items-center my-4">
                    <span className="font-bold text-slate-800">السعر النهائي:</span>
                    <span className="text-2xl font-extrabold text-emerald-600">{totalPrice} ₪</span>
                  </div>

                  {hasConflict && (
                    <div className="text-red-600 text-sm font-bold text-center bg-red-50 p-2 rounded-lg mb-2 border border-red-200">
                      ⚠️ الوقت المحدد محجوز أو يتجاوز ساعات العمل!
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={hasConflict} 
                    className={`w-full py-3 rounded-lg font-bold text-white transition ${hasConflict ? 'bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    تأكيد الحجز
                  </button>
                </form>
              </div>

              {/* الجدول الزمني من - إلى بأسلوب واضح */}
              <div>
                <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">جدول الساعات (من - إلى)</h3>
                <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto p-1">
                  {TIME_SLOTS_DATA.map((slot) => {
                    const isBooked = currentBookedSlots.includes(slot.start);
                    const isSelected = selectedRange.includes(slot.start);

                    let statusStyle = "bg-emerald-50 border-emerald-300 text-emerald-800";
                    let label = "متاح";

                    if (isBooked) {
                      statusStyle = "bg-red-100 border-red-300 text-red-700 font-bold opacity-90 cursor-not-allowed";
                      label = "محجوز";
                    } else if (isSelected) {
                      statusStyle = "bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm";
                      label = "تحديدك";
                    }

                    return (
                      <div key={slot.start} className={`p-2.5 border rounded-lg flex justify-between items-center text-sm ${statusStyle}`}>
                        <span className="font-mono dir-ltr font-bold text-base">{slot.label}</span>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* 3. LOGIN VIEW */}
      {view === 'login' && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border mt-10">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">دخول الأدمن 🔑</h2>
          {loginError && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">{loginError}</div>}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">اسم المستخدم</label>
              <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full p-2.5 border rounded-lg text-slate-900 bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">كلمة السر</label>
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full p-2.5 border rounded-lg text-slate-900 bg-white" required />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800">دخول</button>
          </form>
        </div>
      )}

      {/* 4. ADMIN DASHBOARD VIEW */}
      {view === 'admin' && isAdminLoggedIn && (
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">إدارة الحجوزات 📅</h2>
            <p className="text-slate-500 text-sm mb-6">عرض كافة الحجوزات مع إمكانية التعديل والإلغاء.</p>

            {bookings.length === 0 ? (
              <p className="text-slate-400 text-center py-8">لا يوجد أي حجوزات حالية.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 text-sm font-bold">
                      <th className="p-3 border-b">اسم الزبون</th>
                      <th className="p-3 border-b">رقم الهاتف</th>
                      <th className="p-3 border-b">الملعب</th>
                      <th className="p-3 border-b">التاريخ والوقت</th>
                      <th className="p-3 border-b">المدة</th>
                      <th className="p-3 border-b">الإضافات</th>
                      <th className="p-3 border-b">السعر النهائي</th>
                      <th className="p-3 border-b">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b hover:bg-slate-50 text-sm text-slate-900">
                        <td className="p-3 font-bold">{b.customerName}</td>
                        <td className="p-3 font-mono dir-ltr">{b.customerPhone}</td>
                        <td className="p-3">{b.courtName}</td>
                        <td className="p-3">
                          <div>{b.date}</div>
                          <div className="text-xs text-emerald-600 font-mono font-bold">{b.reservedSlots.join(', ')}</div>
                        </td>
                        <td className="p-3">{b.durationMinutes} دقيقة</td>
                        <td className="p-3 text-xs">{b.extras.length > 0 ? b.extras.join(' + ') : 'بدون'}</td>
                        <td className="p-3 font-bold text-emerald-600">
                          {editingBookingId === b.id ? (
                            <div className="flex gap-1 items-center">
                              <input 
                                type="number" 
                                value={newPriceInput} 
                                onChange={(e) => setNewPriceInput(e.target.value)} 
                                className="w-20 p-1 border rounded text-slate-900"
                                placeholder={b.totalPrice.toString()}
                              />
                              <button onClick={() => handleUpdatePrice(b.id)} className="bg-emerald-600 text-white text-xs px-2 py-1 rounded">حفظ</button>
                            </div>
                          ) : (
                            <span>{b.totalPrice} ₪</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setEditingBookingId(b.id); setNewPriceInput(b.totalPrice.toString()); }}
                              className="text-xs bg-slate-100 border px-2 py-1 rounded hover:bg-slate-200 text-slate-800"
                            >
                              تعديل السعر
                            </button>
                            <button 
                              onClick={() => handleDeleteBooking(b.id)}
                              className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-100"
                            >
                              إلغاء 🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border">
            <h3 className="font-bold text-slate-800 text-lg mb-4">إدارة الملاعب والأسعار</h3>
            <form onSubmit={handleAddCourt} className="flex flex-col md:flex-row gap-4 mb-6">
              <input type="text" placeholder="اسم الملعب" value={newCourtName} onChange={(e) => setNewCourtName(e.target.value)} className="flex-1 p-2.5 border rounded-lg text-slate-900 bg-white" required />
              <input type="number" placeholder="السعر للساعة (₪)" value={newCourtPrice} onChange={(e) => setNewCourtPrice(e.target.value)} className="w-full md:w-48 p-2.5 border rounded-lg text-slate-900 bg-white" required />
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-700">إضافة ملعب +</button>
            </form>

            <div className="space-y-3">
              {courts.map((court) => (
                <div key={court.id} className="flex justify-between items-center p-3 border rounded-xl bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-800 ml-3">{court.name}</span>
                    <span className="text-emerald-600 font-semibold text-sm">{court.pricePerHour} ₪ / ساعة</span>
                  </div>
                  <button onClick={() => handleDeleteCourt(court.id)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-xs hover:bg-red-100">حذف الملعب</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}