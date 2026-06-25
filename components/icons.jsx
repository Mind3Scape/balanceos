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
  Share: (p) => <Icon {...p}><path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M8 11H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Minus: (p) => <Icon {...p}><path d="M5 12h14"/></Icon>,
  ChevronRight: (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Help: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7v.5"/><path d="M12 17h.01"/></Icon>,
  Logout: (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></Icon>,
  Mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></Icon>,
  Phone: (p) => <Icon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>,
  MessageCircle: (p) => <Icon {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></Icon>,
  MapPin: (p) => <Icon {...p}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon>,
  Briefcase: (p) => <Icon {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Icon>,
  Pencil: (p) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></Icon>,
  Refresh: (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15.5-6.4M21 4v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.4M3 20v-5h5"/></Icon>,
  Target: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></Icon>,
  Sparkles: ({filled, ...p}) => { const f = filled ? (p.color || "currentColor") : "none"; return <Icon {...p}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" fill={f}/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" fill={f}/></Icon>; },
  Lock: (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Icon>,
  Volume: (p) => <Icon {...p}><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M19 12a4 4 0 0 0-2-3.5"/><path d="M16 8.5a4 4 0 0 1 0 7"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Icon>,
  Heart: (p) => <Icon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={p.filled ? "currentColor" : "none"}/></Icon>,
  Compass: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor"/></Icon>,
  Foot: (p) => <Icon {...p}><circle cx="8" cy="6" r="2.5"/><circle cx="14" cy="6" r="1.6"/><circle cx="17" cy="9" r="1.4"/><circle cx="18" cy="13" r="1.2"/><path d="M5 13c0 4 2 7 5 7s5-3 5-7c0-2-1-4-3-5"/></Icon>,
  Send: (p) => <Icon {...p}><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>,
  X: (p) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>,
  ChartBar: (p) => <Icon {...p}><path d="M3 21V8M9 21V3M15 21v-9M21 21v-6"/></Icon>,
  Book: (p) => <Icon {...p}><path d="M2 4a2 2 0 0 1 2-2h6v18H4a2 2 0 0 1-2-2V4z"/><path d="M22 4a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2V4z"/></Icon>,
  Play: (p) => <Icon {...p}><polygon points="6,4 20,12 6,20" fill="currentColor"/></Icon>,
  Pause: (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/></Icon>,
  Mic: (p) => <Icon {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>,
  More: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></Icon>,
  Users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="8" r="2.5"/><path d="M14 16c2.5 0 7 1.5 7 4"/></Icon>,
  Trophy: (p) => <Icon {...p}><path d="M8 4h8v6a4 4 0 0 1-8 0V4z"/><path d="M5 4h3v3a3 3 0 0 1-3-3z"/><path d="M19 4h-3v3a3 3 0 0 0 3-3z"/><path d="M10 14v3h4v-3M8 21h8"/></Icon>,
  Flag: (p) => <Icon {...p}><path d="M4 21V4h12l-2 4 2 4H4"/></Icon>,
  Smile: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="0.6" fill="currentColor"/><circle cx="15" cy="10" r="0.6" fill="currentColor"/></Icon>,
  Dumbbell: (p) => <Icon {...p}><path d="M3 9v6M6.5 7v10M17.5 7v10M21 9v6M6.5 12h11"/></Icon>,
  Bulb: (p) => <Icon {...p}><path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.8 10.6c.5.4.8 1 .8 1.7v.2h6v-.2c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3z"/></Icon>,
  Wallet: (p) => <Icon {...p}><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M15.5 11H21v4h-5.5a2 2 0 0 1 0-4z"/></Icon>,
  Moon: (p) => <Icon {...p}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></Icon>,
};

window.I = I;
