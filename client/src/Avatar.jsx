import React from 'react';

/**
 * Premium Avatar Component
 * Priority: 1. Image (Local or Google) 2. Initial fallback with gradient
 */
const Avatar = ({ src, name, size = "md", className = "" }) => {
  const [error, setError] = React.useState(false);

  const getInitials = (n) => {
    if (!n) return '?';
    return n.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };
  
  // Reset error state when src changes
  React.useEffect(() => {
    setError(false);
  }, [src]);

  const gradients = [
    'from-yellow-600 to-amber-800',
    'from-amber-500 to-yellow-700',
    'from-yellow-700 to-yellow-900',
    'from-amber-600 to-yellow-800',
  ];
  
  const getGradient = (n) => {
    if (!n) return gradients[0];
    const charCodeSum = n.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[charCodeSum % gradients.length];
  };

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-32 h-32 text-xl md:text-4xl", // Make responsive
    "2xl": "w-40 h-40 text-5xl"
  };

  // Convert relative paths (uploads) to full URLs, keep Google or data URLs as is
  const cleanSrc = (src && typeof src === 'string' && src.trim() !== '' && !src.includes('undefined')) ? src : null;
  const fullSrc = cleanSrc && (cleanSrc.startsWith('http') || cleanSrc.startsWith('data:image') ? cleanSrc : `https://kala-agalya-herbals.onrender.com${cleanSrc}`);

  return (
    <div className={`relative rounded-full overflow-hidden flex items-center justify-center border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] group transition-all duration-300 hover:border-yellow-500/50 ${sizeClasses[size] || size} ${className}`}>
      {(fullSrc && !error) ? (
        <img 
          src={fullSrc} 
          alt={name || "User Avatar"} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
          onError={() => setError(true)}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center`}>
          <span className="font-black text-white tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {getInitials(name)}
          </span>
        </div>
      )}
      
      {/* Decorative inner glow for premium feel */}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-full pointer-events-none"></div>
    </div>
  );
};

export default Avatar;
