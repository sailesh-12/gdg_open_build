import { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import '../../styles/Navigation.css';

const DashboardNavigation = ({ isCollapsed, onToggle }) => {
    const { householdId } = useParams();

    const navItems = [
        {
            path: `/dashboard/${householdId}`,
            label: 'Overview',
            icon: '📊',
            exact: true
        },
        {
            path: `/dashboard/${householdId}/summary`,
            label: 'Risk Summary',
            icon: '⚠️'
        },
        {
            path: `/dashboard/${householdId}/network`,
            label: 'Network Graph',
            icon: '🔗'
        },
        {
            path: `/dashboard/${householdId}/explanation`,
            label: 'Risk Factors',
            icon: '📋'
        },
        {
            path: `/dashboard/${householdId}/critical-members`,
            label: 'Critical Members',
            icon: '👥'
        },
        {
            path: `/dashboard/${householdId}/simulation`,
            label: 'Simulation',
            icon: '🧪'
        },
        {
            path: `/dashboard/${householdId}/recommendations`,
            label: 'Recommendations',
            icon: '💡'
        },
        {
            path: `/dashboard/${householdId}/loan-evaluation`,
            label: 'Loan Assessment',
            icon: '💰'
        }
    ];

    return (
        <nav className={`dashboard-navigation ${isCollapsed ? 'collapsed' : ''}`}>
            <button
                className="nav-toggle"
                onClick={onToggle}
                aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
            {!isCollapsed && (
                <div className="nav-header">
                    <h3>Analysis Sections</h3>
                </div>
            )}
            <ul className="nav-list">
                {navItems.map((item) => (
                    <li key={item.path}>
                        <NavLink
                            to={item.path}
                            end={item.exact}
                            className={({ isActive }) =>
                                isActive ? 'nav-item active' : 'nav-item'
                            }
                            title={isCollapsed ? item.label : ''}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default DashboardNavigation;
