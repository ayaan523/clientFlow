import { Mail, MoreHorizontal, Plus, Search, UserRound } from "lucide-react";
type Client = { id: string; name: string; email?: string; company?: string };
export default function ClientList({
  clients,
  onCreate,
}: {
  clients: Client[];
  onCreate: () => void;
}) {
  return (
    <section className="card client-list">
      <div className="card-head">
        <div>
          <h2>Clients</h2>
          <p>Manage your client relationships</p>
        </div>
        <button className="primary">
          <Plus size={15} /> Add client
        </button>
      </div>
      <div className="toolbar">
        <label>
          <Search size={15} />
          <input placeholder="Search clients..." />
        </label>
        <button className="filter">All clients⌄</button>
      </div>
      <div className="client-table">
        <div className="list-head">
          <span>CLIENT</span>
          <span>COMPANY</span>
          <span>CONTACT</span>
          <span>STATUS</span>
          <span />
        </div>
        {clients.map((client) => (
          <div className="client-row" key={client.id}>
            <div className="client-name">
              <span>
                <UserRound size={15} />
              </span>
              <div>
                <strong>{client.name}</strong>
                <small>{client.email}</small>
              </div>
            </div>
            <span>{client.company || "—"}</span>
            <span className="email">
              <Mail size={13} />
              {client.email || "—"}
            </span>
            <b className="status-pill">Active</b>
            <button className="more">
              <MoreHorizontal size={17} />
            </button>
          </div>
        ))}
      </div>
      {!clients.length && (
        <div className="empty">
          No clients yet. Add your first client to get started.
        </div>
      )}
      <button className="table-foot" onClick={onCreate}>
        View all clients →
      </button>
    </section>
  );
}
