/* Icon set for BalanceOS — line-art SVGs that match the Figma's stroke-icon system */
const Icon = ({ children, size = 24, color = "currentColor", strokeWidth = 1.6, filled, ...rest }) => {
  delete rest.filled;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {children}
    </svg>
  );
};

const I = {
  Home: ({filled, ...p}) => <Icon {...p}><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z" fill={filled ? p.color || "currentColor" : "none"} /></Icon>,
  Bolt: ({filled, ...p}) => <Icon {...p}><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" fill={filled ? p.color || "currentColor" : "none"}/></Icon>,
  Flame: ({filled, ...p}) => <Icon {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill={filled ? p.color || "currentColor" : "none"}/></Icon>,
  Group: ({filled, ...p}) => filled
    ? <Icon {...p}>
        <circle cx="16.5" cy="8" r="2.5" fill="currentColor" stroke="none"/>
        <path d="M16.5 11c2.9 0 5.2 2.3 5.4 5.1.04.5-.34.9-.84.9H13.5v-1c0-2.8 .3-5 3-5Z" fill="currentColor" stroke="none"/>
        <circle cx="9" cy="7.4" r="3.5" fill="currentColor" stroke="none"/>
        <path d="M9 10.4C5.1 10.4 2 13.5 2 17.3V18a1.2 1.2 0 0 0 1.2 1.2h11.6A1.2 1.2 0 0 0 16 18v-.7C16 13.5 12.9 10.4 9 10.4Z" fill="currentColor" stroke="none"/>
      </Icon>
    : <Icon {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M14.5 14.2c.8-.3 1.6-.4 2.5-.4 2.5 0 4.5 2 4.5 4.5"/></Icon>,
  Eye: ({filled, ...p}) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill={filled ? p.color || "currentColor" : "none"}/></Icon>,
  Check: (p) => <Icon {...p}><path d="M5 12l5 5 9-11"/></Icon>,
  Hash: (p) => <Icon {...p}><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/></Icon>,
  Share: (p) => <Icon {...p}><path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M8 11H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"/></Icon>,
  Plus: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><rect x="10.5" y="4.5" width="3" height="15" rx="1.5" fill={p.color || "currentColor"}/><rect x="4.5" y="10.5" width="15" height="3" rx="1.5" fill={p.color || "currentColor"}/></Icon> : <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Minus: (p) => <Icon {...p}><path d="M5 12h14"/></Icon>,
  ChevronRight: (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>,
  Search: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fillRule="evenodd" fill={p.color || "currentColor"} d="M10.8 3a7.8 7.8 0 0 1 6.05 12.7l3.9 3.9a1.3 1.3 0 0 1-1.85 1.85l-3.9-3.9A7.8 7.8 0 1 1 10.8 3zm0 3.1a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4z"/></Icon> : <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Help: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7v.5"/><path d="M12 17h.01"/></Icon>,
  Logout: (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></Icon>,
  Mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></Icon>,
  Phone: (p) => <Icon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>,
  MessageCircle: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fill={p.color || "currentColor"} d="M12 3.4c-4.85 0-8.8 3.4-8.8 7.7 0 1.5.5 2.9 1.3 4.1L3.2 20a.7.7 0 0 0 .85.85l4.9-1.35c1.05.45 2.2.7 3.05.7 4.85 0 8.8-3.4 8.8-7.7S16.85 3.4 12 3.4z"/></Icon> : <Icon {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></Icon>,
  MapPin: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fillRule="evenodd" fill={p.color || "currentColor"} d="M12 2a8 8 0 0 0-8 8c0 5.6 7 12.5 7.3 12.8a1 1 0 0 0 1.4 0C13 22.5 20 15.6 20 10a8 8 0 0 0-8-8zm0 5.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6z"/></Icon> : <Icon {...p}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon>,
  Briefcase: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fillRule="evenodd" fill={p.color || "currentColor"} d="M15 5.4V4.6C15 3.7 14.3 3 13.4 3h-2.8C9.7 3 9 3.7 9 4.6v.8H5.6A2.6 2.6 0 0 0 3 8v10a2.6 2.6 0 0 0 2.6 2.6h12.8A2.6 2.6 0 0 0 21 18V8a2.6 2.6 0 0 0-2.6-2.6H15zm-1.6 0h-2.8v-.8h2.8v.8z"/></Icon> : <Icon {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Icon>,
  Pencil: (p) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></Icon>,
  Refresh: (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15.5-6.4M21 4v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.4M3 20v-5h5"/></Icon>,
  Target: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fillRule="evenodd" fill={p.color || "currentColor"} d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 3.4a5.6 5.6 0 1 1 0 11.2 5.6 5.6 0 0 1 0-11.2zm0 2.4a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z"/></Icon> : <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></Icon>,
  Sparkles: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fill={p.color || "currentColor"} d="M12 2.8L14.7 9.3L21.2 12L14.7 14.7L12 21.2L9.3 14.7L2.8 12L9.3 9.3Z"/></Icon> : <Icon {...p}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></Icon>,
  Lock: (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Icon>,
  Volume: (p) => <Icon {...p}><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M19 12a4 4 0 0 0-2-3.5"/><path d="M16 8.5a4 4 0 0 1 0 7"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Icon>,
  // «Вселенная» — СПИРАЛЬНАЯ ГАЛАКТИКА (David: «красивая иконка спиралевидной галактики, не атом»):
  // ядро + два плавных рукава-спирали (логарифмическая спираль, 180°-симметрия = вертушка-галактика),
  // тонкая линия как у I.Pencil. Сгенерировано и отобрано визуально (вариант «два открытых рукава»).
  Galaxy: (p) => <Icon {...p}><path d="M12 9.8C12.2 9.8 12.8 9.7 13.1 9.8C13.4 9.9 13.8 10.1 14.1 10.3C14.4 10.6 14.7 10.9 14.9 11.3C15.1 11.7 15.2 12.2 15.2 12.7C15.2 13.2 15.1 13.8 14.8 14.3C14.6 14.8 14.2 15.3 13.7 15.6C13.2 15.9 12.6 16.3 12 16.4C11.4 16.5 10.6 16.6 9.9 16.4C9.2 16.2 8.3 15.9 7.7 15.4C7.1 14.9 6.5 14.1 6.1 13.3C5.7 12.5 5.5 11.5 5.5 10.5C5.5 9.5 5.7 8.4 6.2 7.4C6.7 6.4 7.5 5.4 8.5 4.7C9.5 4.0 11.4 3.3 12 3"/><path d="M12 14.2C11.8 14.2 11.3 14.3 10.9 14.2C10.6 14.1 10.2 13.9 9.9 13.7C9.6 13.4 9.3 13.1 9.1 12.7C8.9 12.3 8.8 11.8 8.8 11.3C8.8 10.8 8.9 10.2 9.2 9.7C9.4 9.2 9.8 8.8 10.3 8.4C10.8 8.1 11.4 7.7 12 7.6C12.6 7.5 13.4 7.4 14.1 7.6C14.8 7.8 15.7 8.1 16.3 8.6C16.9 9.1 17.5 9.9 17.9 10.7C18.3 11.5 18.5 12.5 18.5 13.5C18.5 14.5 18.3 15.6 17.8 16.6C17.3 17.6 16.5 18.6 15.5 19.3C14.5 20.0 12.6 20.7 12 21"/><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/></Icon>,
  Heart: (p) => <Icon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={p.filled ? "currentColor" : "none"}/></Icon>,
  Compass: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fillRule="evenodd" fill={p.color || "currentColor"} d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm4.2 4.8l-2.1 6.3-6.3 2.1 2.1-6.3z"/></Icon> : <Icon {...p}><circle cx="12" cy="12" r="9"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor"/></Icon>,
  Foot: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><g fill={p.color || "currentColor"}><path d="M8.5 10.4c3 0 5 1.7 5 4.4 0 3-2 5.4-4.6 5.4S4 18.1 4 15.2c0-2.7.9-4.8 4.5-4.8z"/><ellipse cx="8" cy="5.4" rx="1.7" ry="2.1"/><ellipse cx="12.4" cy="5.1" rx="1.4" ry="1.8"/><ellipse cx="15.8" cy="7.1" rx="1.3" ry="1.6"/><ellipse cx="17.5" cy="10.5" rx="1.2" ry="1.4"/></g></Icon> : <Icon {...p}><circle cx="8" cy="6" r="2.5"/><circle cx="14" cy="6" r="1.6"/><circle cx="17" cy="9" r="1.4"/><circle cx="18" cy="13" r="1.2"/><path d="M5 13c0 4 2 7 5 7s5-3 5-7c0-2-1-4-3-5"/></Icon>,
  Send: (p) => <Icon {...p}><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>,
  X: (p) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>,
  ChartBar: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><g fill={p.color || "currentColor"}><rect x="2.6" y="12" width="3.6" height="8.5" rx="1.1"/><rect x="8.1" y="3.5" width="3.6" height="17" rx="1.1"/><rect x="13.6" y="8" width="3.6" height="12.5" rx="1.1"/><rect x="19.1" y="14.5" width="3.6" height="6" rx="1.1"/></g></Icon> : <Icon {...p}><path d="M3 21V8M9 21V3M15 21v-9M21 21v-6"/></Icon>,
  Book: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><g fill={p.color || "currentColor"}><path d="M11.2 5.1C9.9 4 8.1 3.4 6 3.4c-.9 0-1.8.1-2.6.3a1 1 0 0 0-.8 1v11.9a1 1 0 0 0 1.2 1c.7-.2 1.5-.2 2.2-.2 1.7 0 3.2.4 4.2 1.2a1 1 0 0 0 .8.2z"/><path d="M20.6 4.7c-.8-.2-1.7-.3-2.6-.3-2.1 0-3.9.6-5.2 1.7v13.1a1 1 0 0 0 .8-.2c1-.8 2.5-1.2 4.2-1.2.7 0 1.5 0 2.2.2a1 1 0 0 0 1.2-1V5.7a1 1 0 0 0-.8-1z"/></g></Icon> : <Icon {...p}><path d="M2 4a2 2 0 0 1 2-2h6v18H4a2 2 0 0 1-2-2V4z"/><path d="M22 4a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2V4z"/></Icon>,
  Play: (p) => <Icon {...p}><polygon points="6,4 20,12 6,20" fill="currentColor"/></Icon>,
  Pause: (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/></Icon>,
  Mic: (p) => <Icon {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>,
  More: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></Icon>,
  Users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="8" r="2.5"/><path d="M14 16c2.5 0 7 1.5 7 4"/></Icon>,
  Trophy: ({filled, ...p}) => <Icon {...p}><path d="M8 4h8v6a4 4 0 0 1-8 0V4z" fill={filled ? p.color || "currentColor" : "none"}/><path d="M5 4h3v3a3 3 0 0 1-3-3z"/><path d="M19 4h-3v3a3 3 0 0 0 3-3z"/><path d="M10 14v3h4v-3M8 21h8"/></Icon>,
  Flag: (p) => <Icon {...p}><path d="M4 21V4h12l-2 4 2 4H4"/></Icon>,
  Smile: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fillRule="evenodd" fill={p.color || "currentColor"} d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.2 8.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm5.6 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM7.7 13.4c1.1 1.7 2.6 2.6 4.3 2.6s3.2-.9 4.3-2.6c-1.3.8-2.8 1.2-4.3 1.2s-3-.4-4.3-1.2z"/></Icon> : <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="0.6" fill="currentColor"/><circle cx="15" cy="10" r="0.6" fill="currentColor"/></Icon>,
  Person: ({filled, ...p}) => <Icon {...p}><circle cx="12" cy="7.6" r="3.5" fill={filled ? p.color || "currentColor" : "none"}/><path d="M5.2 20c.9-3.8 3.6-5.9 6.8-5.9s5.9 2.1 6.8 5.9" fill={filled ? p.color || "currentColor" : "none"}/></Icon>,
  // Семья live-таббара «система колец» (David: «все в одном стиле»): солнце (твой день в
  // центре) · орбита с людьми · искры ИИ (Sparkles) · ты в кольце уровня.
  Sun: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><g fill={p.color || "currentColor"}><circle cx="12" cy="12" r="4.7"/>{[0,45,90,135,180,225,270,315].map(function(a){return <rect key={a} x="11" y="1.4" width="2" height="3.7" rx="1" transform={"rotate("+a+" 12 12)"}/>;})}</g></Icon> : <Icon {...p}><circle cx="12" cy="12" r="4.1"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6"/></Icon>,
  OrbitPeople: ({filled, ...p}) => <Icon {...p}><circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r={filled ? 2.4 : 1.7} fill="currentColor" stroke="none"/><circle cx="5.9" cy="8.4" r="2" fill="currentColor" stroke="none"/><circle cx="19" cy="15" r="2" fill="currentColor" stroke="none"/><circle cx="13.8" cy="20" r="1.5" fill="currentColor" stroke="none"/></Icon>,
  PersonRing: ({filled, ...p}) => <Icon {...p}><circle cx="12" cy="9.8" r="2.7" fill={filled ? p.color || "currentColor" : "none"}/><path d="M7.9 16.8c.9-2.1 2.3-3.1 4.1-3.1s3.2 1 4.1 3.1"/><path d="M20.1 8.2A9 9 0 1 1 15.6 3.8"/></Icon>,
  Dumbbell: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><g fill={p.color || "currentColor"}><rect x="2" y="8.4" width="2.6" height="7.2" rx="1.1"/><rect x="5.1" y="6.3" width="2.8" height="11.4" rx="1.3"/><rect x="8.3" y="10.7" width="7.4" height="2.6" rx="1.2"/><rect x="16.1" y="6.3" width="2.8" height="11.4" rx="1.3"/><rect x="19.4" y="8.4" width="2.6" height="7.2" rx="1.1"/></g></Icon> : <Icon {...p}><path d="M3 9v6M6.5 7v10M17.5 7v10M21 9v6M6.5 12h11"/></Icon>,
  Bulb: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><g fill={p.color || "currentColor"}><path d="M12 2.4a6.6 6.6 0 0 0-4 11.9c.5.4.85.95.95 1.55l.15.95h5.8l.15-.95c.1-.6.45-1.15.95-1.55A6.6 6.6 0 0 0 12 2.4z"/><rect x="9.3" y="17.6" width="5.4" height="1.7" rx="0.85"/><rect x="10.3" y="20" width="3.4" height="1.7" rx="0.85"/></g></Icon> : <Icon {...p}><path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.8 10.6c.5.4.8 1 .8 1.7v.2h6v-.2c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3z"/></Icon>,
  Wallet: (p) => <Icon {...p}><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M15.5 11H21v4h-5.5a2 2 0 0 1 0-4z"/></Icon>,
  Moon: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fill={p.color || "currentColor"} d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></Icon> : <Icon {...p}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></Icon>,
  Leaf: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fill={p.color || "currentColor"} d="M4.6 19.4C4.6 10.9 10.8 4.6 20 4.6a.9.9 0 0 1 .9.9c0 9.2-6.3 15.4-14.8 15.4h-.6a.9.9 0 0 1-.9-.9v-.6z"/><path fill={p.color || "currentColor"} d="M6.4 18.2C9 13 13 9.4 18 7.4c-3.9 2.7-6.7 6.4-8.4 11.2z" opacity="0.55"/></Icon> : <Icon {...p}><path d="M4.6 20C4.6 11 11 4.6 20 4.6c0 9-6.4 15.4-15.4 15.4z"/><path d="M6.5 18C9 13 13 9.5 18 7.5"/></Icon>,
  Droplet: ({filled, ...p}) => <Icon {...p}><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z" fill={filled ? p.color || "currentColor" : "none"}/></Icon>,
  Ban: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fillRule="evenodd" fill={p.color || "currentColor"} d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM16.4 6.4l1.2 1.2L7.6 17.6l-1.2-1.2z"/></Icon> : <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></Icon>,
  // Кроссовок (David: «Бег вместе» — стопа читалась как лапка). Силуэт сбоку, носок вправо: пятка
  // слева, язычок-подъём, длинная подошва с рифлением-точками. Заливной, читается на малом размере.
  Sneaker: ({filled, ...p}) => filled ? <Icon {...p} strokeWidth={0}><path fill={p.color || "currentColor"} d="M2.4 15.1c.05-1.15.85-1.75 2.15-1.85l2.5-.2c.85-.07 1.45-.45 1.9-1.15l1.75-2.75c.6-.95 1.5-1.3 2.55-.9.8.3 1.25 1 1.35 1.9l.2 1.9c.07.7.5 1.1 1.25 1.3l3.5 1c1.55.45 2.35 1.15 2.4 2.35.03.7-.2 1.25-.7 1.65-.5.4-1.2.6-2.1.6H4.6c-1.5 0-2.25-.75-2.25-2.25 0-.5.02-1 .05-1.5z"/><g fill={p.color || "currentColor"}><rect x="6.2" y="18.1" width="1.4" height="2.2" rx="0.7"/><rect x="9.6" y="18.1" width="1.4" height="2.2" rx="0.7"/><rect x="13" y="18.1" width="1.4" height="2.2" rx="0.7"/><rect x="16.4" y="18.1" width="1.4" height="2.2" rx="0.7"/></g></Icon> : <Icon {...p}><path d="M2.6 14.8l2.7-.2c.7-.05 1.3-.4 1.7-1l2-3c.5-.8 1.5-1 2.2-.5.5.35.7.9.75 1.5l.2 2c.06.6.5 1 1.1 1.2l3.3.95c1.3.4 2 1 2 2.05v.7H4c-1 0-1.6-.6-1.6-1.6z"/></Icon>,
};

window.I = I;
