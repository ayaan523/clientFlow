import { Plus } from "lucide-react";
type Deal = {
  id: string;
  title: string;
  value: string | number;
  stage: string;
  client_name?: string;
};
const stages = [
  ["lead", "Lead"],
  ["qualified", "Qualified"],
  ["proposal", "Proposal"],
  ["negotiation", "Negotiation"],
  ["won", "Won"],
];
export default function Pipeline({
  deals,
  onStage,
}: {
  deals: Deal[];
  onStage: (id: string, stage: string) => void;
}) {
  return (
    <section className="card pipeline">
      <div className="card-head">
        <div>
          <h2>Sales pipeline</h2>
          <p>Track deals from first contact to close</p>
        </div>
        <button className="primary">
          <Plus size={15} /> Add deal
        </button>
      </div>
      <div className="kanban">
        {stages.map(([id, label]) => (
          <div className="kanban-col" key={id}>
            <div className="stage-title">
              <span>{label}</span>
              <b>{deals.filter((deal) => deal.stage === id).length}</b>
            </div>
            {deals
              .filter((deal) => deal.stage === id)
              .map((deal) => (
                <article className="deal" key={deal.id}>
                  <strong>{deal.title}</strong>
                  <small>{deal.client_name || "No client"}</small>
                  <div>
                    <b>${Number(deal.value).toLocaleString()}</b>
                    <select
                      value={deal.stage}
                      onChange={(e) => onStage(deal.id, e.target.value)}
                      aria-label={`Move ${deal.title}`}
                    >
                      <option value="lead">Lead</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </article>
              ))}
            <button className="add-stage">
              <Plus size={13} /> Add deal
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
