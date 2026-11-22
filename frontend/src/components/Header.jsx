import {FiArrowRight, FiMenu, FiLogOut } from 'react-icons/fi';

const Header = ({ activeSection, setIsSidebarOpen, serviceStatus = 'checking', user, onLogout }) => {
    return (
        <header className="topbar">
            <button className="icon-button menu-button" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
                <FiMenu />
            </button>
                    
            <div className="breadcrumb">
                <span>Workspace</span>
                <FiArrowRight />
                <strong>{activeSection}</strong>
            </div>
                    
            <div className="status-pill">
                <span
                    className={serviceStatus === 'ready' ? '' : 'status-offline'}
                    style={serviceStatus === 'ready' ? undefined : { background: '#d66a6a' }}
                />
                {serviceStatus === 'ready' ? 'System ready' : serviceStatus === 'offline' ? 'Service offline' : 'Checking service'}
            </div>

            <div className="header-user">
                <span>{user?.name || 'User'}</span>
                <button type="button" onClick={onLogout} aria-label="Logout"><FiLogOut /> Logout</button>
            </div>
        </header>
    );
}

export default Header;