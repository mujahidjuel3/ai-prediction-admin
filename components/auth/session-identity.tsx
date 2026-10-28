"use client";

import { Avatar } from "@/components/ui/avatar";
import { apiGet } from "@/lib/api";
import { useEffect, useState } from "react";

interface CurrentUser { name:string; role:string; }
export function SessionIdentity(){const[user,setUser]=useState<CurrentUser|null>(null);useEffect(()=>{let active=true;void apiGet<CurrentUser>("/auth/me").then((result)=>{if(active)setUser(result.data);}).catch(()=>{if(active)setUser(null);});return()=>{active=false;};},[]);return <div className="flex min-w-0 items-center gap-2"><Avatar name={user?.name??"Account"} size="sm"/><span className="min-w-0 leading-tight"><span className="block truncate text-sm font-medium text-slate-900">{user?.name??"Loading account"}</span><span className="block truncate text-xs text-slate-500">{user?.role??""}</span></span></div>;}
