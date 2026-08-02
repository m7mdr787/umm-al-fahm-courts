import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// إنشاء اتصال مباشر وموثوق بدون Caching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // استثناء صفحة الصيانة والملفات الثابتة لمنع التكرار (Infinite Loops)
  if (
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    // الاتصال بـ Supabase وقراءة الحالة بدون كاش
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('system_settings')
      .select('is_maintenance')
      .eq('id', 'global')
      .single();

    if (error) {
      console.error('Supabase fetch error in middleware:', error.message);
      return NextResponse.next();
    }

    // إذا كانت القيمة true يوجه لصفحة الصيانة فوراً
    if (data?.is_maintenance) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  } catch (err) {
    console.error('Middleware execution error:', err);
  }

  return NextResponse.next();
}

// تحديد المسارات التي يطبق عليها الـ Middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};