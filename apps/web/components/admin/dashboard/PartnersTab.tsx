"use client";

import type { DashboardResponse } from "@arlink28/api-client";
import { BarList, Count, Donut, Ring, StackedColumns, Stars, type Slice } from "./charts";
import { useReveal } from "./motion";
import { sampleClients, sampleCommission, samplePartners } from "./placeholders";
import { Card, PALETTE, Stat, usd, usdShort } from "./shared";

const RATING_PARTS = [
  { key: "service", label: "Service", value: 4.8 },
  { key: "comms", label: "Communication", value: 4.7 },
  { key: "value", label: "Value for money", value: 4.4 },
  { key: "speed", label: "Speed of reply", value: 4.2 },
];

export function PartnersTab({ data }: { data: DashboardResponse }) {
  void data;
  const earned = sampleCommission.reduce((s, c) => s + c.a, 0);
  const pending = sampleCommission.reduce((s, c) => s + c.b, 0);
  const totalRevenue = samplePartners.reduce((s, p) => s + p.revenue, 0);
  const mix: Slice[] = [
    { key: "returning", label: "Returning clients", value: sampleClients.returning, color: "#0b1726" },
    { key: "new", label: "New clients", value: sampleClients.newClients, color: "#7da3d6" },
  ];

  return (
    <>
      <div className="dv-kpis">
        <Stat
          index={0}
          sample
          label="Active partners"
          value={<Count value={samplePartners.length} start />}
          sub="With a booking in the last 90 days."
        />
        <Stat
          index={1}
          sample
          label="Commission earned"
          value={<Count value={earned} start format={usd} />}
          sub="Over the last six months."
        />
        <Stat
          index={2}
          sample
          label="Commission still due"
          value={<Count value={pending} start format={usd} />}
          sub="Owed by partners, not yet paid."
        />
        <Stat
          index={3}
          sample
          label="Client score"
          value={<Count value={sampleClients.nps} start />}
          sub={`Net promoter score, from ${sampleClients.reviews} reviews.`}
        />
      </div>

      <Card
        title="Partners"
        note="Who brings in the bookings, and what each one earns us."
        span={12}
        index={4}
        sample="bookings and supplier commissions"
      >
        {(inView) => (
          <table className="dv-table">
            <thead>
              <tr>
                <th scope="col">Partner</th>
                <th scope="col" className="is-num">
                  Bookings
                </th>
                <th scope="col">Revenue</th>
                <th scope="col" className="is-num">
                  Commission
                </th>
                <th scope="col">Rating</th>
              </tr>
            </thead>
            <tbody>
              {samplePartners.map((p, i) => (
                <PartnerRow key={p.name} partner={p} total={totalRevenue} inView={inView} index={i} />
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card
        title="Commission by month"
        note="Earned, and still to be paid by partners."
        span={8}
        index={5}
        sample="supplier commissions"
      >
        {(inView) => (
          <StackedColumns items={sampleCommission} start={inView} format={usd} names={["Earned", "Still due"]} />
        )}
      </Card>

      <Card title="Client score" note="Net promoter score from reviews." span={4} index={6} sample="client reviews">
        {(inView) => (
          <div className="dv-target-card">
            <Ring
              value={(sampleClients.nps + 100) / 200}
              start={inView}
              centre={String(sampleClients.nps)}
              sub="NPS"
              label={`Net promoter score ${sampleClients.nps}`}
              tone="green"
            />
            <div className="dv-rating">
              <Stars rating={sampleClients.rating} label={`${sampleClients.rating} out of 5`} />
              <p>
                <strong>{sampleClients.rating}</strong> from {sampleClients.reviews} reviews
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card
        title="New and returning"
        note="Share of clients who have booked before."
        span={4}
        index={7}
        sample="client records"
      >
        {(inView) => (
          <Donut
            slices={mix}
            start={inView}
            centreLabel="returning"
            centreValue={`${Math.round(sampleClients.repeatShare * 100)}%`}
          />
        )}
      </Card>

      <Card title="What clients rate" note="Average score out of five." span={8} index={8} sample="client reviews">
        {(inView) => (
          <BarList
            items={RATING_PARTS.map((r, i) => ({
              key: r.key,
              label: `${r.label}  ${r.value.toFixed(1)}`,
              value: Math.round(r.value * 20),
              color: i === 0 ? PALETTE[0] : PALETTE[2],
            }))}
            start={inView}
            max={100}
          />
        )}
      </Card>
    </>
  );
}

function PartnerRow({
  partner,
  total,
  inView,
  index,
}: {
  partner: { name: string; kind: string; bookings: number; revenue: number; commission: number; rating: number };
  total: number;
  inView: boolean;
  index: number;
}) {
  const progress = useReveal(inView, 1000, total, index * 90);
  const share = partner.revenue / total;
  return (
    <tr>
      <th scope="row">
        {partner.name}
        <small>{partner.kind}</small>
      </th>
      <td className="is-num">{partner.bookings}</td>
      <td>
        <div className="dv-inline-bar">
          <div className="dv-track">
            <div className="dv-fill" style={{ width: `${share * 100 * progress}%` }} />
          </div>
          <span>{usdShort(partner.revenue)}</span>
        </div>
      </td>
      <td className="is-num">{usd(partner.commission)}</td>
      <td>
        <span className="dv-rate-cell">
          <Stars rating={partner.rating} label={`${partner.rating} out of 5`} />
          {partner.rating.toFixed(1)}
        </span>
      </td>
    </tr>
  );
}
