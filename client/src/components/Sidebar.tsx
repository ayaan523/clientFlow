import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ContactRound,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
export default function Sidebar({
  page,
  setPage,
  onLogout,
}: {
  page: string;
  setPage: (page: string) => void;
  onLogout: () => void;
}) {
  const items: Array<[string, string, LucideIcon]> = [
    ["overview", "Overview", LayoutDashboard],
    ["clients", "Clients", ContactRound],
    ["pipeline", "Pipeline", KanbanSquare],
    ["activities", "Activities", CalendarDays],
    ["reports", "Reports", BarChart3],
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>CF</span>Client<span>Flow</span>
      </div>
      <div className="workspace-switch">
        <span>NS</span>
        <div>
          <small>Workspace</small>
          <strong>Northstar Studio</strong>
        </div>
        <ChevronDown size={14} />
      </div>
      <p className="nav-label">WORKSPACE</p>
      <nav>
        {items.map(([id, label, Icon]) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            onClick={() => setPage(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
      <p className="nav-label team-label">TEAM</p>
      <button className="nav-button">
        <UsersRound size={17} />
        Team
      </button>
      <button className="nav-button">
        <Settings size={17} />
        Settings
      </button>
      <div className="profile">
        <span>JD</span>
        <div>
          <strong>Jordan Davis</strong>
          <small>Owner</small>
        </div>
        <button onClick={onLogout} title="Log out">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
