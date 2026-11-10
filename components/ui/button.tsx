import * as React from 'react';
import {cva,type VariantProps} from 'class-variance-authority';
import {clsx,type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
export function cn(...inputs:ClassValue[]){return twMerge(clsx(inputs));}
const variants=cva('button',{variants:{variant:{default:'button-dark',outline:'button-outline',ghost:'button-ghost',orange:'button-orange'},size:{default:'',sm:'button-sm'}},defaultVariants:{variant:'default',size:'default'}});
export function Button({className,variant,size,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&VariantProps<typeof variants>){return <button className={cn(variants({variant,size}),className)} {...props}/>;}
