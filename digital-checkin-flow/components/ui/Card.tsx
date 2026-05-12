import * as React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Card({ className, ...props }: CardProps) {
    return <div className={`rounded-xl border bg-white p-6 shadow-sm ${className || ''}`} {...props} />;
}