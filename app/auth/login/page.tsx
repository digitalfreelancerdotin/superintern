import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Auth from '../../components/Auth';

export const dynamic = 'force-dynamic';

type SearchParamsProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function LoginPage({ searchParams = {} }: SearchParamsProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard/intern');
  }

  return <Auth />;
}