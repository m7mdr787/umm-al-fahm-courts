'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './src/lib/supabase';

// 1. واجهات البيانات (Interfaces)
interface Court {
  id: string | number;
  name: string;
  price: number;
}

interface Booking {
  id?: string;
  court_id: string;
  court_name: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  start_slot: string;
  duration_minutes: number;
  reserved_slots: string[];
  total_price: number;
  extras?: string[];
}

// الملاعب المتاحة
const COURTS: Court[] = [
  { id: '1', name: 'ملعب السنديان', price: 200 },
  { id: '2', name: 'ملعب الوفاق', price: 200 },
  { id: '3', name: 'ملعب البانياس', price: 200 },
];

// توليد الساعات من 08:00 حتى 23:00 (كل خانة 30 دقيقة)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 22; hour++) {
    const h = hour < 10 ? `0${hour}` : `${hour}`;
    slots.push(`${h}:00`);
    slots.push(`${h}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function Home() {
  // 2. الحالات (States)
  const [selectedCourt, setSelectedCourt] = useState<Court>(COURTS[0]);
  const [bookingDate, setBookingDate] = useState<string>('2026-07-30');
  const [startSlot, setStartSlot] = useState<string>('08:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(90); // 90 دقيقة كحد افتراضي
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  // الإضافات
  const [addBall, setAddBall] = useState<boolean>(false);
  const [addGloves, setAddGloves] = useState<boolean>(false);
  const [addVests, setAddVests] = useState<boolean>(false);

  // قائمة الحجوزات القادمة من Supabase
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // 3. دالة جلب الحجوزات من Supabase
  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase.from('bookings').select('*');
      if (error) {
        console.error('خطأ أثناء جلب الحجوزات:', error);
      } else if (data) {
        setBookings(data as Booking[]);
      }
    } catch (err) {
      console.error('خطأ غير متوقع عند الجلب:', err);
    }
  };

  // 4. التزامن اللحظي (Realtime Subscription)
  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // حساب النطاق المختار من الساعات (مثلاً 90 دقيقة = 3 خانات 30 دقيقة)
  const getSelectedRange = () => {
    const startIndex = TIME_SLOTS.indexOf(startSlot);
    if (startIndex === -1) return [];
    const slotsCount = Math.ceil(durationMinutes / 30);
    return TIME_SLOTS.slice(startIndex, startIndex + slotsCount);
  };

  const selectedRange = getSelectedRange();

  // 5. فحص هل الساعة محجوزة مسبقاً؟
  const isSlotBooked = (slotTime: string) => {
    return bookings.some((b) => {
      const isSameCourt = String(b.court_id) === String(selectedCourt.id);
      const isSameDate = b.date === bookingDate;
      const isSlotTaken = b.reserved_slots?.includes(slotTime);
      return isSameCourt && isSameDate && isSlotTaken;
    });
  };

  // فحص التعارض للكرة الحالية المُختارة
  const hasConflict = selectedRange.some((slot) => isSlotBooked(slot));

  // حساب السعر الإجمالي
  const totalPrice = selectedCourt.price + (addBall ? 20 : 0) + (addGloves ? 15 : 0) + (addVests ? 15 : 0);

  // 6. دالة تأكيد الحجز بالإرسال إلى Supabase
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('يرجى كتابة الاسم ورقم الهاتف بشكل صحيح!');
      return;
    }

    if (hasConflict) {
      alert('عذراً، بعض الساعات في هذا التوقيت محجوزة بالفعل! اختر وقتاً آخر.');
      return;
    }

    const extrasArray: string[] = [];
    if (addBall) extrasArray.push('طابة');
    if (addGloves) extrasArray.push('كفوف حارس');
    if (addVests) extrasArray.push('شيالات');

    const newBooking = {
      court_id: String(selectedCourt.id),
      court_name: selectedCourt.name,
      customer_name: customerName,
      customer_phone: customerPhone,
      date: bookingDate,
      start_slot: startSlot,
      duration_minutes: durationMinutes,
      reserved_slots: selectedRange,
      total_price: totalPrice,
      extras: extrasArray,
    };

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([newBooking])
        .select();

      if (error) {
        console.error('خطأ Supabase:', error);
        alert(`حدث خطأ أثناء حفظ الحجز: ${error.message}`);
      } else {
        console.log('تم الحفظ بنجاح:', data);
        setBookingSuccess(true);
        fetchBookings();
        // إعادة تعيين المدخلات
        setCustomerName('');
        setCustomerPhone('');
        setTimeout(() => setBookingSuccess(false), 4000);
      }
    } catch (err) {
      console.error('خطأ في الإرسال:', err);
      alert('تعذر الاتصال بقاعدة البيانات!');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dir-rtl p-4 md:p-8 font-sans text-right">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-6">
        <h1 className="text-3xl font-bold text-center text-green-700 mb-6">
          حجز ملاعب أم الفحم ⚽
        </h1>

        {/* اختيار الملعب */}
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">اختر الملعب:</label>
          <div className="grid grid-cols-3 gap-3">
            {COURTS.map((court) => (
              <button
                key={court.id}
                type="button"
                onClick={() => setSelectedCourt(court)}
                className={`p-3 rounded-xl border transition-all font-semibold ${
                  selectedCourt.id === court.id
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {court.name}
              </button>
            ))}
          </div>
        </div>

        {/* تحديد التاريخ والمدة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2">تاريخ الحجز:</label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">مدة الحجز:</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={90}>90 دقيقة (ساعة ونصف - 200 ₪)</option>
              <option value={60}>60 دقيقة (ساعة)</option>
              <option value={120}>120 دقيقة (ساعتان)</option>
            </select>
          </div>
        </div>

        {/* شبكة اختيار الساعات */}
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">اختر ساعة البداية:</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-2 border rounded-xl">
            {TIME_SLOTS.map((slot) => {
              const booked = isSlotBooked(slot);
              const isSelected = selectedRange.includes(slot);

              return (
                <button
                  key={slot}
                  type="button"
                  disabled={booked}
                  onClick={() => setStartSlot(slot)}
                  className={`p-2 rounded-lg text-sm font-medium border transition-all ${
                    booked
                      ? 'bg-red-500 text-white cursor-not-allowed opacity-70 border-red-500'
                      : isSelected
                      ? 'bg-green-600 text-white border-green-600 shadow'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-green-50'
                  }`}
                >
                  {slot} {booked ? '(محجوز)' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* خيارات إضافية */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="block text-gray-700 font-bold mb-2">معدات إضافية:</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
              <input
                type="checkbox"
                checked={addBall}
                onChange={(e) => setAddBall(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded"
              />
              <span>طابة (+20 ₪)</span>
            </label>
            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
              <input
                type="checkbox"
                checked={addGloves}
                onChange={(e) => setAddGloves(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded"
              />
              <span>كفوف حارس (+15 ₪)</span>
            </label>
            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
              <input
                type="checkbox"
                checked={addVests}
                onChange={(e) => setAddVests(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded"
              />
              <span>شيالات (+15 ₪)</span>
            </label>
          </div>
        </div>

        {/* نموذج بيانات الزبون والتأكيد */}
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-bold mb-1">الاسم الكامل:</label>
              <input
                type="text"
                required
                placeholder="أدخل اسمك"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">رقم الهاتف:</label>
              <input
                type="tel"
                required
                placeholder="05X-XXXXXXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <span className="text-gray-600 block text-sm">السعر الإجمالي:</span>
              <span className="text-2xl font-bold text-green-700">{totalPrice} ₪</span>
            </div>

            <button
              type="submit"
              disabled={hasConflict}
              className={`px-8 py-3 rounded-xl text-white font-bold transition-all shadow-lg ${
                hasConflict
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 active:scale-95'
              }`}
            >
              {hasConflict ? 'التوقيت محجوز' : 'تأكيد الحجز'}
            </button>
          </div>
        </form>

        {bookingSuccess && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 text-center rounded-xl font-bold">
            🎉 تم حفظ الحجز بنجاح وتحديث الجدول فوراً!
          </div>
        )}
      </div>
    </main>
  );
}