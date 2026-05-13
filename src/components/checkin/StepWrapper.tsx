interface StepWrapperProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function StepWrapper({ title, description, children }: StepWrapperProps) {
    return (
        <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
            {description && <p className="text-gray-600 mb-6">{description}</p>}
            {children}
        </div>
    );
}