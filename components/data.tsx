'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import type {PortfolioData} from '@/lib/types';
import publicSeed from '@/lib/public-seed.json';
const Context=createContext<{data:PortfolioData;error:string;loading:boolean}>({data:publicSeed as PortfolioData,error:'',loading:true});
export function DataProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<PortfolioData>(publicSeed as PortfolioData),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{fetch('/api/content').then(async r=>{if(!r.ok)throw new Error('Live content could not be loaded. Please refresh to try again.');setData(await r.json());}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 return <Context.Provider value={{data,error,loading}}>{children}</Context.Provider>;
}
export const usePortfolio=()=>useContext(Context);
