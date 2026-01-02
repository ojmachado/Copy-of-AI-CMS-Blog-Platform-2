import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase();

    // 1. Busca o usuário alvo
    const userRecord = await adminAuth.getUser(userId);

    // 2. Proteção Imune (Hardcoded Security)
    if (userRecord.email?.toLowerCase() === superAdminEmail) {
      console.warn(`[SECURITY ALERT] Tentativa de excluir Super Admin: ${userRecord.email}`);
      return NextResponse.json(
        { error: 'ACTION_FORBIDDEN: You cannot delete the Super Admin.' },
        { status: 403 }
      );
    }

    // 3. Executa exclusão se não for o Super Admin
    await adminAuth.deleteUser(userId);
    
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}