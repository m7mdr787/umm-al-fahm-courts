'use client';

import React, { useState, useEffect } from 'react';
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
  Moon,
  MessageSquare,
  Ban
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function BookingPage() {
  const [selectedStadium, setSelectedStadium] = useState<string>('eloyoun');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmedData, setBookingConfirmedData] = useState<any>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');

  const stadiums = [
    { id: 'eloyoun', name: 'ملعب العيون' },
    { id: 'shaghour', name: 'ملعب الشاغور' },
    { id: 'banyas', name: 'ملعب البانياس' },
  ];

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

  // جلب الحجوزات السابقة لمنع التداخل
  useEffect(() => {
    async function fetchBookings() {
      setIsLoadingBookings(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('court_id', selectedStadium)
          .eq('date', selectedDate);

        if (!error && data) {
          setExistingBookings(data);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setIsLoadingBookings(false);
      }
    }

    fetchBookings();
  }, [selectedStadium, selectedDate]);

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // حساب الأوقات الفرعية المحجوزة
  const getSlotSlotsRange = (startStr: string, durMinutes: number) => {
    const startMins = timeToMinutes(startStr);
    const endMins = startMins + durMinutes;
    const slots: string[] = [];
    
    for (let m = startMins; m < endMins; m += 30) {
      const h = Math.floor(m / 60);
      const mins = m % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    }
    return slots;
  };

  // فحص تداخل الحجوزات مع المخطط الجديد
  const isTimeSlotOverlap = (slotStartStr: string, slotDurationMinutes: number) => {
    const newStart = timeToMinutes(slotStartStr);
    const newEnd = newStart + slotDurationMinutes;

    return existingBookings.some((b) => {
      const existingStart = timeToMinutes(b.start_time || b.start_slot || '00:00');
      const existingDuration = Number(b.duration_minutes || b.time_range || 90);
      const existingEnd = existingStart + existingDuration;

      return newStart < existingEnd && newEnd > existingStart;
    });
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

  // إرسال الحجز مع تطابق كامل لقاعدة البيانات
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim()) {
      alert('الرجاء إدخال الاسم الكامل ورقم الهاتف');
      return;
    }

    if (isTimeSlotOverlap(startTime, duration)) {
      alert('عذراً! هذا الوقت متعارض مع حجز آخر. يرجى اختيار وقت آخر.');
      return;
    }

    setIsSubmitting(true);

    const stadiumObj = stadiums.find(s => s.id === selectedStadium);
    const formattedTimeText = formatTimeSlot(startTime, duration);
    const totalPrice = calculateTotal();
    const reservedSlotsArr = getSlotSlotsRange(startTime, duration);

    // كائن الإدخال المطابق لقاعدة البيانات بالكامل
    const bookingPayload = {
      court_id: selectedStadium,
      stadium_name: stadiumObj?.name,
      court_name: stadiumObj?.name,
      customer_name: fullName,
      customer_phone: phone,
      date: selectedDate,
      start_time: startTime,
      duration_minutes: String(duration), // تحويل الرقم لنص text بحسب الـ SQL Schema
      time_range: duration,              // الوقت الممتد كـ integer بحسب الـ SQL Schema
      reserved_slots: reservedSlotsArr,   // array jsonb
      total_price: totalPrice,
      extras: selectedExtras,
    };

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingPayload])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        alert(`حدث خطأ أثناء حفظ الحجز: ${error.message}`);
      } else {
        setBookingConfirmedData({
          ...bookingPayload,
          id: data?.id || 'UUID-CONFIRMED',
          formatted_time: formattedTimeText
        });
      }
    } catch (err: any) {
      console.error('Submission catch error:', err);
      alert('حدث خطأ أثناء الاتصال بالسيرفر.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // إرسال تذكير وإيصال عبر الواتساب
  const sendWhatsAppReminder = () => {
    if (!bookingConfirmedData) return;

    let formattedPhone = bookingConfirmedData.customer_phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '972' + formattedPhone.substring(1);
    }

    const message = `⚽ *تفاصيل وإيصال حجز الملعب*%0A%0A` +
      `👤 *الاسم:* ${bookingConfirmedData.customer_name}%0A` +
      `📍 *الملعب:* ${bookingConfirmedData.stadium_name}%0A` +
      `📅 *التاريخ:* ${bookingConfirmedData.date}%0A` +
      `⏰ *الوقت:* ${bookingConfirmedData.formatted_time} (${bookingConfirmedData.duration_minutes} دقيقة)%0A` +
      `💰 *المبلغ النهائي:* ${bookingConfirmedData.total_price} ₪%0A%0A` +
      `نتمنى لكم مباراة ممتعة! 🏆`;

    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const handleSendReport = () => {
    if (!reportText.trim()) return alert('الرجاء كتابة تفاصيل البلاغ');
    const currentStadiumName = stadiums.find(s => s.id === selectedStadium)?.name;
    const message = `⚠️ *بلاغ عن مشكلة في ${currentStadiumName}*%0A%0A*التفاصيل:* ${reportText}%0A*التاريخ:* ${selectedDate}`;
    window.open(`https://wa.me/972503477552?text=${message}`, '_blank');
    setShowReportModal(false);
    setReportText('');
  };

  // شاشة الإيصال والتأكيد النهائي
  if (bookingConfirmedData) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 text-center space-y-6">
          
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">تم تأكيد حجزك بنجاح!</h2>
            <p className="text-xs text-slate-500 mt-1 truncate">رقم الحجز: {bookingConfirmedData.id}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-right space-y-3.5 text-sm">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-slate-500 font-bold">الملعب:</span>
              <span className="font-black text-emerald-700 text-base">{bookingConfirmedData.stadium_name}</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-slate-500 font-bold">التاريخ:</span>
              <span className="font-bold text-slate-900">{bookingConfirmedData.date}</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-slate-500 font-bold">الوقت المحدد:</span>
              <span className="font-bold text-slate-900">{bookingConfirmedData.formatted_time} ({bookingConfirmedData.duration_minutes} دقيقة)</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-slate-500 font-bold">اسم الحاجز:</span>
              <span className="font-bold text-slate-900">{bookingConfirmedData.customer_name}</span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-slate-500 font-bold">رقم الهاتف:</span>
              <span className="font-bold text-slate-900">{bookingConfirmedData.customer_phone}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-900 font-black text-base">المبلغ النهائي للدفع:</span>
              <span className="font-black text-xl text-emerald-600">{bookingConfirmedData.total_price} ₪</span>
            </div>
          </div>

          <button 
            onClick={sendWhatsAppReminder}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <MessageSquare className="w-5 h-5" /> إرسال إيصال وتذكير الحجز عبر الواتساب
          </button>

          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> طباعة
            </button>

            <button 
              onClick={() => {
                setBookingConfirmedData(null);
                window.location.reload();
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> حجز جديد
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24">
      
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

      <main className="max-w-4xl mx-auto px-4 -mt-8">
        <form onSubmit={handleBookingSubmit} className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 text-slate-900 space-y-8">
          
          {/* اختيار الملعب */}
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

          {/* التاريخ والمدة */}
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
                <Clock className="w-4 h-4 text-emerald-600" /> مدة اللعب:
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

          {/* الأوقات وتفادي التداخل */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-slate-900 font-bold text-base block">
                اختر الفترة والوقت المناسب:
              </label>
              {isLoadingBookings && <span className="text-xs text-emerald-600 font-bold animate-pulse">جاري المزامنة...</span>}
            </div>

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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              {timePeriods[activePeriod].slots.map((time) => {
                const formattedRange = formatTimeSlot(time, duration);
                const isSelected = startTime === time;
                const isBooked = isTimeSlotOverlap(time, duration);

                return (
                  <button
                    key={time}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setStartTime(time)}
                    className={`p-3 rounded-xl text-xs sm:text-sm font-black border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      isBooked
                        ? 'bg-rose-50 text-rose-300 border-rose-200 cursor-not-allowed opacity-60 line-through'
                        : isSelected 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02] cursor-pointer' 
                          : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'
                    }`}
                  >
                    {isBooked ? (
                      <span className="flex items-center gap-1 text-rose-400">
                        <Ban className="w-3.5 h-3.5" /> محجوز ({time})
                      </span>
                    ) : (
                      <span>{formattedRange}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* معدات إضافية */}
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

          {/* معلومات العميل */}
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

          {/* زر التأكيد والملخص السريع */}
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
              disabled={isSubmitting || isTimeSlotOverlap(startTime, duration)}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5" /> 
              {isSubmitting ? 'جاري الحفظ...' : 'تأكيد وإرسال الحجز'}
            </button>
          </div>

        </form>

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

      {/* مودال البلاغات */}
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
              placeholder="اكتب تفاصيل المشكلة..."
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