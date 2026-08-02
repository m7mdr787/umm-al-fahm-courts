'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  MessageCircle, 
  ShieldAlert, 
  Sparkles,
  Shirt,
  MapPin
} from 'lucide-react';

export default function BookingPage() {
  // اختيار الملعب (الشاغور / العيون / البانياس)
  const [selectedStadium, setSelectedStadium] = useState<string>('eloyoun');
  const [selectedDate, setSelectedDate] = useState('2026-08-03');
  const [duration, setDuration] = useState<number>(90); // 90 min default
  const [startTime, setStartTime] = useState<string>('08:00');
  
  const [selectedExtras, setSelectedExtras] = useState<{ [key: string]: boolean }>({
    ball: false,
    gloves: false,
    vests: false,
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');

  // قائمة الملاعب المتاحة
  const stadiums = [
    { id: 'eloyoun', name: 'ملعب العيون', desc: 'عشب صناعي ممتاز - إضاءة حديثة' },
    { id: 'shaghour', name: 'ملعب الشاغور', desc: 'أرضية قانونية وسيعة - مدرجات' },
    { id: 'banyas', name: 'ملعب البانياس', desc: 'أجواء ممتازة وتجهيزات كاملة' },
  ];

  // الأوقات المتاحة
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'
  ];

  // تسعير المدة
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

  // إرسال البلاغ للواتساب مباشر
  const handleSendReport = () => {
    if (!reportText.trim()) return alert('الرجاء كتابة تفاصيل البلاغ');
    
    const currentStadiumName = stadiums.find(s => s.id === selectedStadium)?.name;
    const message = `⚠️ *بلاغ عن مشكلة في ${currentStadiumName}*%0A%0A*تفاصيل المشكلة:* ${reportText}%0A*التاريخ:* ${selectedDate}`;
    
    // فتح الواتساب للرقم الخاص بك
    window.open(`https://wa.me/972503477552?text=${message}`, '_blank');
    setShowReportModal(false);
    setReportText('');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24">
      
      {/* Header */}
      <header className="relative bg-gradient-to-b from-emerald-900 to-slate-900 pt-10 pb-16 px-4 text-center border-b border-emerald-500/20">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> حجز ملاعب أم الفحم أونلاين
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
            احجز ملعبك <span className="text-emerald-400">بسهولة وسرعة</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-medium">
            اختر الملعب والوقت المناسب وسدد إلكترونياً أو عند الوصول
          </p>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 text-slate-900 space-y-8">
          
          {/* Section 0: اختيار الملعب */}
          <div>
            <label className="block text-slate-900 font-black text-base mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> اختر الملعب المطلوب:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stadiums.map((stadium) => {
                const isSelected = selectedStadium === stadium.id;
                return (
                  <button
                    key={stadium.id}
                    type="button"
                    onClick={() => setSelectedStadium(stadium.id)}
                    className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-600/20'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-slate-900 text-base">{stadium.name}</span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      </div>
                      <p className="text-xs font-semibold text-slate-600">{stadium.desc}</p>
                    </div>
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

          {/* Section 2: اختيار الوقت (من - إلى) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-slate-900 font-bold text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" /> اختر الوقت المناسب:
              </label>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md">
                المدة: {duration} دقيقة
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto p-1">
              {timeSlots.map((time) => {
                const formattedRange = formatTimeSlot(time, duration);
                const isSelected = startTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setStartTime(time)}
                    className={`p-3 rounded-xl text-xs sm:text-sm font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]' 
                        : 'bg-slate-50 text-slate-900 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50'
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
                placeholder="05X-XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-4 py-3 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-xl">
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">الملعب والمبلغ النهائي:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">{calculateTotal()} ₪</span>
                <span className="text-xs text-slate-300">({stadiums.find(s => s.id === selectedStadium)?.name})</span>
              </div>
              <span className="text-xs text-slate-400 block mt-1">
                الوقت: <strong className="text-white">{formatTimeSlot(startTime, duration)}</strong>
              </span>
            </div>

            <button 
              type="button"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" /> تأكيد الحجز
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-slate-400 text-xs px-2">
          <button 
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg"
          >
            <ShieldAlert className="w-4 h-4" /> الإبلاغ عن مشكلة بالملعب
          </button>

          <span>© إدارات ملاعب أم الفحم</span>
        </div>
      </main>

      {/* Floating WhatsApp Chat (رقمك المباشر) */}
      <a 
        href="https://wa.me/972503477552" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm z-50 transition-all hover:scale-110"
      >
        <MessageCircle className="w-6 h-6 fill-slate-950" />
        <span className="hidden sm:inline">واتساب مباشر</span>
      </a>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
              <AlertTriangle className="w-6 h-6" /> إرسال بلاغ عن {stadiums.find(s => s.id === selectedStadium)?.name}
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              سيتم إرسال هذا البلاغ مباشرة لإدارة الملعب عبر الواتساب للمتابعة الفورية.
            </p>
            <textarea 
              rows={4}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="اكتب تفاصيل المشكلة أو العطل..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                إلغاء
              </button>
              <button 
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