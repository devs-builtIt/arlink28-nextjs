"use client";

import type { DashboardResponse } from "@arlink28/api-client";
import { AreaChart, BarList, Count, Donut, Ring, Sparkline, type Slice } from "./charts";
import { useReveal } from "./motion";
import { Card, Delta, PALETTE, Stat, seriesPoints, usd, usdShort } from "./shared";
import {
  sampleAgents,
  sampleChannels,
  sampleConversion,
  sampleRevenue,
  sampleServiceRevenue,
  sampleTarget,
} from "./placeholders";
import { SamplePill, useShowSample } from "./sample";

/* ── funnel: the first two steps are real, the last two are samples ───────────────────────────── */

function Funnel({ data }: { data: DashboardResponse }) {
  const e = data.enquiries;
  const quoted = e.quoted.reduce((s, q) => s + q.count, 0);
  const booked = Math.round(quoted * sampleConversion.quoteToBooking);
  const paid = Math.round(booked * sampleConversion.bookingToPaid);
  const showSample = useShowSample();
  const stages = [
    { key: "enquiries", label: "Enquiries", value: e.total, sample: false },
    { key: "quoted", label: "Quoted", value: quoted, sample: false },
    { key: "booked", label: "Booked", value: booked, sample: true },
    { key: "paid", label: "Paid in full", value: paid, sample: true },
  ].filter((s) => !s.sample || showSample);
  return (
    <Card
      title="From enquiry to payment"
      note="Enquiries and quotes are real. Bookings and payments are samples."
      span={4}
      index={7}
    >
      {(inView) => <FunnelBody stages={stages} total={e.total} inView={inView} />}
    </Card>
  );
}

function FunnelBody({
  stages,
  total,
  inView,
}: {
  stages: { key: string; label: string; value: number; sample: boolean }[];
  total: number;
  inView: boolean;
}) {
  const progress = useReveal(inView, 1100, total);
  return (
    <ul className="dv-funnel">
      {stages.map((s, i) => {
        const local = Math.min(1, Math.max(0, progress * 1.4 - i * 0.18));
        const rate = i > 0 && stages[i - 1].value > 0 ? Math.round((s.value / stages[i - 1].value) * 100) : null;
        return (
          <li key={s.key}>
            <div className="dv-funnel-row">
              <span>
                {s.label} {s.sample && <SamplePill />}
              </span>
              <strong>
                {s.value}
                {rate !== null && <em className="dv-rate">{rate}%</em>}
              </strong>
            </div>
            <div className="dv-track dv-track-lg">
              <div
                className={`dv-fill ${s.sample ? "dv-tone-hatch" : "dv-tone-navy"}`}
                style={{ width: `${(total ? (s.value / total) * 100 : 0) * local}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function SalesTab({ data }: { data: DashboardResponse }) {
  const chart = seriesPoints(data);
  const revenue = sampleRevenue(
    data.enquiries.series.filter((_, i) => i % (data.days > 90 ? 7 : 1) === 0).map((d) => d.date),
    chart.points.map((p) => p.label),
  );
  const slices: Slice[] = sampleServiceRevenue.map((s, i) => ({
    key: s.key,
    label: s.label,
    value: Math.round(revenue.total * s.share),
    color: PALETTE[i % PALETTE.length],
  }));
  const channels = sampleChannels.map((c, i) => ({
    key: c.key,
    label: c.label,
    value: Math.round(revenue.total * c.share),
    sub: `${Math.round(c.share * 100)}% of revenue`,
    color: i === 0 ? "#0b1726" : "#7da3d6",
  }));
  const daily = revenue.points.map((p) => p.value);
  // The monthly target scaled to the period shown.
  const goal = Math.round((sampleTarget.goal * data.days) / 30);

  return (
    <>
      <div className="dv-kpis">
        <Stat
          index={0}
          sample
          label="Revenue"
          value={<Count value={revenue.total} start format={usd} />}
          sub={`${usd(revenue.previousTotal)} the period before.`}
        >
          <Sparkline values={daily} start label="Sample revenue over the period" />
        </Stat>
        <Stat
          index={1}
          sample
          label="Bookings"
          value={<Count value={revenue.bookings} start />}
          sub={`${revenue.previousBookings} the period before.`}
        >
          <Delta now={revenue.bookings} before={revenue.previousBookings} />
        </Stat>
        <Stat
          index={2}
          sample
          label="Average booking"
          value={<Count value={revenue.averageBooking} start format={usd} />}
          sub={`${usd(revenue.previousAverageBooking)} the period before.`}
        />
        <Stat
          index={3}
          sample
          label="Commission earned"
          value={<Count value={revenue.commission} start format={usd} />}
          sub={`${Math.round((revenue.commission / revenue.total) * 100)}% of revenue.`}
        />
      </div>

      <Card
        title="Revenue over time"
        note="Booked value by day, against the period before."
        span={8}
        index={4}
        sample="bookings"
      >
        {(inView) => (
          <>
            <AreaChart
              points={revenue.points}
              start={inView}
              replayKey={data.generatedAt}
              showPrevious
              unit=""
              format={usd}
              axisFormat={usdShort}
              target={goal / revenue.points.length}
              targetLabel="Daily target"
              previousLabel="Before"
            />
            <ul className="dv-key">
              <li>
                <i className="is-now" aria-hidden="true" />
                This period
              </li>
              <li>
                <i className="is-before" aria-hidden="true" />
                The period before
              </li>
              <li>
                <i className="is-target" aria-hidden="true" />
                Target
              </li>
            </ul>
          </>
        )}
      </Card>

      <Card title="Target" note="Progress to the revenue target for the period." span={4} index={5} sample="bookings">
        {(inView) => (
          <div className="dv-target-card">
            <Ring
              value={sampleTarget.achieved}
              start={inView}
              centre={`${Math.round(sampleTarget.achieved * 100)}%`}
              sub="of target"
              label={`${Math.round(sampleTarget.achieved * 100)}% of the revenue target`}
              tone="navy"
            />
            <dl className="dv-facts dv-facts-tight">
              <div>
                <dt>Target</dt>
                <dd>{usd(goal)}</dd>
              </div>
              <div>
                <dt>To go</dt>
                <dd>{usd(Math.max(0, goal * (1 - sampleTarget.achieved)))}</dd>
              </div>
            </dl>
          </div>
        )}
      </Card>

      <Funnel data={data} />

      <Card title="Revenue by service" note="Where the booked value came from." span={4} index={8} sample="bookings">
        {(inView) => <Donut slices={slices} start={inView} centreLabel="booked" format={usd} />}
      </Card>

      <Card title="Revenue by channel" note="How bookings reached us." span={4} index={9} sample="bookings">
        {(inView) => <BarList items={channels} start={inView} format={usd} />}
      </Card>

      <Card
        title="Agents"
        note="Revenue, bookings and how often quotes turn into bookings."
        span={12}
        index={10}
        sample="bookings"
      >
        {(inView) => (
          <table className="dv-table">
            <thead>
              <tr>
                <th scope="col">Agent</th>
                <th scope="col" className="is-num">
                  Revenue
                </th>
                <th scope="col" className="is-num">
                  Bookings
                </th>
                <th scope="col">Share of revenue</th>
                <th scope="col" className="is-num">
                  Quotes won
                </th>
              </tr>
            </thead>
            <tbody>
              {sampleAgents.map((a, i) => (
                <AgentRow
                  key={a.name}
                  agent={a}
                  total={sampleAgents.reduce((s, x) => s + x.revenue, 0)}
                  inView={inView}
                  index={i}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

function AgentRow({
  agent,
  total,
  inView,
  index,
}: {
  agent: { name: string; revenue: number; bookings: number; conversion: number };
  total: number;
  inView: boolean;
  index: number;
}) {
  const progress = useReveal(inView, 1000, total, index * 90);
  const share = agent.revenue / total;
  return (
    <tr>
      <th scope="row">
        <span className="dv-avatar" aria-hidden="true">
          {agent.name.slice(-1)}
        </span>
        {agent.name}
      </th>
      <td className="is-num">{usd(agent.revenue)}</td>
      <td className="is-num">{agent.bookings}</td>
      <td>
        <div className="dv-inline-bar">
          <div className="dv-track">
            <div className="dv-fill" style={{ width: `${share * 100 * progress}%` }} />
          </div>
          <span>{Math.round(share * 100)}%</span>
        </div>
      </td>
      <td className="is-num">{Math.round(agent.conversion * 100)}%</td>
    </tr>
  );
}
