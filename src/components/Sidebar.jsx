import React from 'react';
import ContentPanel from './ContentPanel';

const SidebarIconButton = ({ active, onClick, iconSrc, alt }) => (
  <div
    onClick={onClick}
    style={{
      width: '42px',
      height: '42px',
      margin: '0',
      borderRadius: '20%',
      background: active ? '#fff' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'background 0.2s',
      userSelect: 'none',
    }}
    tabIndex={0}
    aria-label={alt}
    role="button"
  >
    <img
      src={iconSrc}
      alt={alt}
      style={{
        width: '1.6rem',
        height: '1.6rem',
        filter: active ? 'invert(1)' : 'invert(0)',
        transition: 'filter 0.2s',
      }}
      draggable={false}
    />
  </div>
);

const SidebarSeparator = () => (
  <div
    style={{
      width: '60%',
      height: '1px',
      background: 'rgba(249, 249, 249, 0.25)',
      margin: '0.5rem auto',
    }}
  />
);

const Sidebar = ({ currentPage, onPageChange }) => {
  const sidebarButtons = [
    { id: 1, iconSrc: "analysis.svg", alt: "Analysis" },
    { id: 2, iconSrc: "MDT_allocation.svg", alt: "MDT Allocation" },
    { id: 3, iconSrc: "hexagons.svg", alt: "Hexagons" }
  ];

  return (
    <ContentPanel
      style={{
        width: 'fit-content',
        minWidth: '2%',
        padding: 0,
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 1)',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          alignItems: 'center',
        }}
      >
        {sidebarButtons.map((button, index) => (
          <React.Fragment key={button.id}>
            <SidebarIconButton
              active={currentPage === button.id}
              onClick={() => onPageChange(button.id)}
              iconSrc={button.iconSrc}
              alt={button.alt}
            />
            {index < sidebarButtons.length - 1 && <SidebarSeparator />}
          </React.Fragment>
        ))}
      </div>
    </ContentPanel>
  );
};

export default Sidebar;