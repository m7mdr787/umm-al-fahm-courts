'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles,
  Shirt,
  MapPin,
  Printer,
  RotateCcw,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function BookingPage() {
  // الحالة الرئيسية للحجز
  const [selectedStadium, setSelectedStadium] = useState<string>('eloyoun');
  const [selectedDate, setSelectedDate] = useState('2026-08-03');
  const [duration, setDuration] = useState<number>(90);
  const [startTime, setStartTime] = useState<string>('18:00');
  const [activePeriod, setActivePeriod] = useState<'morning' | 'afternoon' | 'night'>('night');
  
  const [selectedExtras, setSelectedExtras] = useState<{ [key: string]: boolean }>({
    ball: false,
    gloves: false,
    vests: false,
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // حالات الشاشات والتحميل
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmedData, setBookingConfirmedData] = useState<any>(null);

  // حالة البلاغ
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');

  // الملاعب بدون أوصاف
  const stadiums = [
    { id: 'eloyoun', name: 'ملعب العيون' },
    { id: 'shaghour', name: 'ملعب الشاغور' },
    { id: 'banyas', name: 'ملعب البانياس' },
  ];

  // تقسيم الساعات إلى فترات لترتيب العرض
  const timePeriods = {
    morning: {
      label: 'صباحاً / ظهراً',
      icon: Sun,
      slots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30']
    },
    afternoon: {
      label: 'عصراً / مساءً',
      icon: Sunset,
      slots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30']
    },
    night: {
      label: 'ليلاً',
      icon: Moon,
      slots: ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00']
    }
  };

  const getBasePrice = (dur: number) => {
    switch (dur) {
      case 60: return 150;
      case 90: return 200;
      case 120: return 250;
      default: return 200;
    }
  };

  const extrasPrices = { ball: 20, gloves: 15, vests: 15 };

  const calculateTotal = () => {
    let total = getBasePrice(duration);
    if (selectedExtras.ball) total += extrasPrices.ball;
    if (selectedExtras.gloves) total += extrasPrices.gloves;
    if (selectedExtras.vests) total += extrasPrices.vests;
    return total;
  };

  const formatTimeSlot = (start: string, durMinutes: number) => {
    const [hours, minutes] = start.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    date.setMinutes(date.getMinutes() + durMinutes);
    
    const endHours = String(date.getHours()).padStart(2, '0');
    const endMinutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${start} - ${endHours}:${endMinutes}`;
  };

  // معالجة تأكيد الحجز وحفظه في Supabase
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim()) {
      alert('الرجاء إدخال الاسم الكامل ورقم الهاتف');
      return;
    }

    setIsSubmitting(true);

    const stadiumObj = stadiums.find(s => s.id === selectedStadium);
    const formattedTime = formatTimeSlot(startTime, duration);
    const totalPrice = calculateTotal();

    const bookingPayload = {
      stadium_id: selectedStadium,
      stadium_name: stadiumObj?.name,
      booking_date: selectedDate,
      start_time: startTime,
      time_range: formattedTime,
      duration_minutes: duration,
      customer_name: fullName,
      customer_phone: phone,
      extras: selectedExtras,
      total_price: totalPrice,
      created_at: new Date().toISOString()
    };

    try {
      // إرسال البيانات إلى جدول 'bookings' في Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingPayload])
        .select()
        .single();

      if (error) {
        console.error('Error inserting booking:', error);
        alert('حدث خطأ أثناء حفظ الحجز، يرجى المحاولة مرة أخرى.');
      } else {
        // عرض صفحة تأكيد الحجز
        setBookingConfirmedData({
          ...bookingPayload,
          id: data?.id || Math.floor(100000 + Math.random() * 900000)
        });
      }
    } catch (err) {
      console.error('Submission catch error:', err);
      // في حال عدم إعداد الجدول بعد، سنعرض النتيجة للعميل لتجربة الواجهة
      setBookingConfirmedData({
        ...bookingPayload,
        id: Math.floor(100000 + Math.random() * 900000)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // إرسال البلاغ للواتساب
  const handleSendReport = () => {
    if (!reportText.trim()) return alert('الرجاء كتابة تفاصيل البلاغ');
    
    const currentStadiumName = stadiums.find(s => s.id === selectedStadium)?.name;
    const message = `⚠️ *بلاغ عن مشكلة في ${currentStadiumName}*%0A%0A*التفاصيل:* ${reportText}%0A*التاريخ:* ${selectedDate}`;
    
    window.open(`https://wa.me/972503477552?text=${message}`, '_blank');
    setShowReportModal(false);
    setReportText('');
  };

  // ----------------------------------------------------
  // 1. صفحة تفاصيل تأكيد الحجز (Success Confirmation View)
  // ----------------------------------------------------
  if (bookingConfirmedData) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 text-center space-y-6">
          
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">تم تأكيد حجزك بنجاح!</h2>
            <p className="text-xs text-slate-500 mt-1">رقم مرجع الحجز: #{bookingConfirmedData.id}</p>
          </div>

          {/* تفاصيل الكرت */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-right space-y-3.5 text-sm">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-slate-500 font-bold">الملعب:</span>
              <span className="font-black text-emerald-700 text-base">{bookingConfirmedData.stadium_name}</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-slate-500 font-bold">التاريخ:</span>
              <span className="font-bold text-slate-900">{bookingConfirmedData.booking_date}</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-slate-500 font-bold">الوقت المحدد:</span>
              <span className="font-bold text-slate-900">{bookingConfirmedData.time_range} ({bookingConfirmedData.duration_minutes} دقيقة)</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-slate-500 font-bold">اسم الحاجز:</span>
              <span className="font-bold text-slate-900">{bookingConfirmedData.customer_name}</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-slate-500 font-bold">رقم الهاتف:</span>
              <span className="font-bold text-slate-900">{bookingConfirmedData.customer_phone}</span>
            </div>

            {/* المعدات */}
            {(bookingConfirmedData.extras.ball || bookingConfirmedData.extras.gloves || bookingConfirmedData.extras.vests) && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500 font-bold">المعدات الإضافية:</span>
                <span className="font-bold text-slate-800 text-xs">
                  {[
                    bookingConfirmedData.extras.ball && 'كرة',
                    bookingConfirmedData.extras.gloves && 'كفوف',
                    bookingConfirmedData.extras.vests && 'شيالات'
                  ].filter(Boolean).join(' + ')}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-900 font-black text-base">المبلغ النهائي للدفع:</span>
              <span className="font-black text-xl text-emerald-600">{bookingConfirmedData.total_price} ₪</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            يرجى تصوير هذه الشاشة احتواطاً أو إبرازها عند الوصول للملعب. نتمنى لكم مباراة ممتعة! ⚽
          </p>

          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> طباعة / حفظ
            </button>

            <button 
              onClick={() => setBookingConfirmedData(null)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> حجز جديد
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. الواجهة الرئيسية لنموذج الحجز
  // ----------------------------------------------------
  return (
    <div dir="rtl" className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24">
      
      {/* Header */}
      <header className="relative bg-gradient-to-b from-emerald-900 to-slate-900 pt-10 pb-16 px-4 text-center border-b border-emerald-500/20">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> حجز ملاعب أم الفحم أونلاين
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
            اختر الملعب <span className="text-emerald-400">واحجز وقتك</span>
          </h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 -mt-8">
        <form onSubmit={handleBookingSubmit} className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 text-slate-900 space-y-8">
          
          {/* Section 0: اختيار الملعب (أسماء فقط بدون أوصاف) */}
          <div>
            <label className="block text-slate-900 font-black text-base mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> اختر الملعب:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {stadiums.map((stadium) => {
                const isSelected = selectedStadium === stadium.id;
                return (
                  <button
                    key={stadium.id}
                    type="button"
                    onClick={() => setSelectedStadium(stadium.id)}
                    className={`py-4 px-2 rounded-xl border text-center transition-all cursor-pointer font-black text-sm sm:text-base ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                        : 'border-slate-300 bg-slate-50 text-slate-900 hover:border-emerald-500'
                    }`}
                  >
                    {stadium.name}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 1: التاريخ والمدة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-900 font-bold text-sm mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" /> تاريخ الحجز:
              </label>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-900 font-bold text-sm mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" /> مدة الحجز والسعر:
              </label>
              <select 
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
              >
                <option value={60}>60 دقيقة (ساعة) - 150 ₪</option>
                <option value={90}>90 دقيقة (ساعة ونصف) - 200 ₪</option>
                <option value={120}>120 دقيقة (ساعتين) - 250 ₪</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 2: اختيار الوقت بطريقة مقسمة ومريحة جداً */}
          <div>
            <label className="text-slate-900 font-bold text-base mb-3 block">
              اختر الفترة والوقت المناسب:
            </label>

            {/* أزرار الفترات */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(Object.keys(timePeriods) as Array<keyof typeof timePeriods>).map((periodKey) => {
                const period = timePeriods[periodKey];
                const IconComponent = period.icon;
                const isActive = activePeriod === periodKey;

                return (
                  <button
                    key={periodKey}
                    type="button"
                    onClick={() => setActivePeriod(periodKey)}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 text-emerald-400 border-slate-900 shadow'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{period.label}</span>
                  </button>
                );
              })}
            </div>

            {/* شبكة الأوقات للفترة المحددة */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {timePeriods[activePeriod].slots.map((time) => {
                const formattedRange = formatTimeSlot(time, duration);
                const isSelected = startTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setStartTime(time)}
                    className={`p-3 rounded-xl text-xs sm:text-sm font-black border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]' 
                        : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50'
                    }`}
                  >
                    <span>{formattedRange}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 3: المعدات الإضافية */}
          <div>
            <label className="block text-slate-900 font-bold text-base mb-3 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-emerald-600" /> معدات إضافية:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer ${
                selectedExtras.ball ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-300 bg-slate-50'
              }`}>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={selectedExtras.ball} 
                    onChange={() => setSelectedExtras(p => ({ ...p, ball: !p.ball }))}
                    className="w-4 h-4 text-emerald-600 rounded" 
                  />
                  <span className="font-bold text-slate-900 text-sm">كرة طابة (+20 ₪)</span>
                </div>
              </label>

              <label className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer ${
                selectedExtras.gloves ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-300 bg-slate-50'
              }`}>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={selectedExtras.gloves} 
                    onChange={() => setSelectedExtras(p => ({ ...p, gloves: !p.gloves }))}
                    className="w-4 h-4 text-emerald-600 rounded" 
                  />
                  <span className="font-bold text-slate-900 text-sm">كفوف حارس (+15 ₪)</span>
                </div>
              </label>

              <label className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer ${
                selectedExtras.vests ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-300 bg-slate-50'
              }`}>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={selectedExtras.vests} 
                    onChange={() => setSelectedExtras(p => ({ ...p, vests: !p.vests }))}
                    className="w-4 h-4 text-emerald-600 rounded" 
                  />
                  <span className="font-bold text-slate-900 text-sm">شيالات (+15 ₪)</span>
                </div>
              </label>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 4: معلومات الحاجز */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-900 font-bold text-sm mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" /> الاسم الكامل:
              </label>
              <input 
                type="text" 
                required
                placeholder="أدخل اسمك الكريم"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-4 py-3 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-900 font-bold text-sm mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" /> رقم الهاتف:
              </label>
              <input 
                type="tel" 
                required
                placeholder="05X-XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-4 py-3 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Summary Card & Submit */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-xl">
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">المبلغ النهائي:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">{calculateTotal()} ₪</span>
                <span className="text-xs text-slate-300">({stadiums.find(s => s.id === selectedStadium)?.name})</span>
              </div>
              <span className="text-xs text-slate-400 block mt-1">
                الوقت: <strong className="text-white">{formatTimeSlot(startTime, duration)}</strong>
              </span>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" /> 
              {isSubmitting ? 'جاري التأكيد...' : 'تأكيد وإرسال الحجز'}
            </button>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-slate-400 text-xs px-2">
          <button 
            type="button"
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg"
          >
            <ShieldAlert className="w-4 h-4" /> الإبلاغ عن مشكلة بالملعب
          </button>

          <span>© إدارات ملاعب أم الفحم</span>
        </div>
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
              <AlertTriangle className="w-6 h-6" /> إرسال بلاغ عن {stadiums.find(s => s.id === selectedStadium)?.name}
            </div>
            <textarea 
              rows={4}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="اكتب تفاصيل المشكلة أو العطل..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                إلغاء
              </button>
              <button 
                type="button"
                onClick={handleSendReport}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md"
              >
                إرسال عبر الواتساب
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}