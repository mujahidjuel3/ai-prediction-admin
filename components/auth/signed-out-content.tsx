"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { buttonClassName } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
export function SignedOutContent({forbidden=false}:{forbidden?:boolean}){const router=useRouter();useEffect(()=>{if(!forbidden)void signOut().finally(()=>router.replace('/login'));},[forbidden,router]);return <main className="flex min-h-screen items-center justify-center px-4 py-10"><Card className="w-full max-w-lg"><CardContent className="py-8"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white"><GraduationCap className="h-5 w-5" aria-hidden="true" /></div><h1 className="text-xl font-semibold text-slate-900">{forbidden?'Administrator access required':`Signing out of ${APP_NAME}`}</h1><p className="mt-2 text-sm text-slate-600">{forbidden?'This account is not authorized to open the administration panel.':'Your server session is being ended.'}</p><Link href="/login" className={`${buttonClassName('primary','md')} mt-6`}>Go to sign in</Link></CardContent></Card></main>;}
