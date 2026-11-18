import { NavLink } from 'react-router-dom';

const items = [
  {
    to: '/',
    label: '首页',
    icon: (
      <>
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6.5 9.5V20h11V9.5" />
        <path d="M10.5 20v-5h3v5" />
      </>
    ),
  },
  {
    to: '/courses',
    label: '课程',
    icon: (
      <>
        <path d="M4 5.5h6.5a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4z" />
        <path d="M20 5.5h-6.5a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2H20z" />
      </>
    ),
  },
  {
    to: '/lab',
    label: '实验室',
    icon: (
      <>
        <path d="M9 3h6" />
        <path d="M10 3v6.2L5.6 17a2.4 2.4 0 0 0 2.1 3.5h8.6A2.4 2.4 0 0 0 18.4 17L14 9.2V3" />
        <path d="M7.4 14.5h9.2" />
      </>
    ),
  },
  {
    to: '/mistakes',
    label: '错题',
    icon: (
      <>
        <path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
        <path d="M14.5 3.5V8H19" />
        <path d="m9 13.2 2.2 2.2L15 11" />
      </>
    ),
  },
  {
    to: '/me',
    label: '我的',
    icon: (
      <>
        <circle cx="12" cy="8.2" r="3.4" />
        <path d="M4.8 20.2c.9-3.5 3.8-5.4 7.2-5.4s6.3 1.9 7.2 5.4" />
      </>
    ),
  },
];

export default function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#F8F7F3]/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-page items-stretch justify-between px-2">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-[3px] py-2.5 transition-colors ${
                isActive ? 'text-ink' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute top-0 h-[2px] w-6 transition-opacity ${isActive ? 'bg-copper opacity-100' : 'opacity-0'}`}
                />
                <svg
                  viewBox="0 0 24 24"
                  width="21"
                  height="21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isActive ? 1.7 : 1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {it.icon}
                </svg>
                <span className={`text-[10px] tracking-[0.12em] ${isActive ? 'font-semibold' : ''}`}>{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
