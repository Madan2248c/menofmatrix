import { useEffect, useRef, useState } from 'react';

/** Top-nav dropdown: toggle button + closable menu (click outside or pick an item). */
export default function NavDropdown({ label, align = 'left', children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div className="nav-dropdown" ref={ref}>
      <button className="link" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label} <span className="drop-caret">▾</span>
      </button>
      {open && (
        <div className={`drop-menu drop-${align}`} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}