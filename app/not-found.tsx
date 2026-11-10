import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
export default function NotFound(){return <section className="not-found"><span className="eyebrow">A SMALL DETOUR</span><h1>Nothing here. <em>Yet.</em></h1><p>This page may have moved, or the project is still on the workbench.</p><Link href="/projects" className="button button-dark">Explore the workbench <ArrowRight size={17}/></Link></section>;}
