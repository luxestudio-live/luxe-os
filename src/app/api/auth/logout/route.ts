import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('luxe_user_id');
    return NextResponse.json({ success: true, redirectUrl: '/login' });
  } catch (error: any) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
