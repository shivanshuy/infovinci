const LANES: {
  id: string
  name: string
  detail: string
  die?: boolean
  stops: { kicker: string; title: string; detail: string }[]
}[] = [
  {
    id: 'attack',
    name: 'Attack',
    detail: 'Dies at the WAF. Nothing behind it spends a connection.',
    die: true,
    stops: [
      { kicker: 'Start', title: 'Client', detail: 'Scanner or a crafted URL' },
      { kicker: 'Filter', title: 'WAF', detail: '403 on the exploit pattern' },
      { kicker: 'Stop', title: 'Dropped', detail: 'Load balancer never sees it' },
    ],
  },
  {
    id: 'site',
    name: 'Website',
    detail: 'No API gateway. The load balancer is the hop in front of the app.',
    stops: [
      { kicker: 'Start', title: 'Client', detail: 'Browser' },
      { kicker: 'Filter', title: 'WAF', detail: 'Request looks ordinary' },
      { kicker: 'Spread', title: 'Load balancer', detail: 'Picks a healthy app' },
      { kicker: 'Work', title: 'App servers', detail: 'Pages and their own login' },
    ],
  },
  {
    id: 'api',
    name: 'API platform',
    detail: 'Gateway enforces the API contract. An internal balancer sits behind it.',
    stops: [
      { kicker: 'Start', title: 'Client', detail: 'Partner or mobile app' },
      { kicker: 'Filter', title: 'WAF', detail: 'Still first. Tokens do not make HTTP safe' },
      { kicker: 'Policy', title: 'API gateway', detail: 'Key, JWT, quota, route' },
      { kicker: 'Spread', title: 'Internal LB', detail: 'Only healthy tasks' },
      { kicker: 'Work', title: 'Services', detail: 'Ownership checks live here' },
    ],
  },
  {
    id: 'egress',
    name: 'Outbound',
    detail: 'Separate from inbound. Private tasks leave through a NAT — browsers never hit it.',
    stops: [
      { kicker: 'Start', title: 'Private task', detail: 'No public IP on the instance' },
      { kicker: 'Translate', title: 'NAT gateway', detail: 'Public subnet, one per AZ' },
      { kicker: 'Door', title: 'Internet gateway', detail: 'VPC route for 0.0.0.0/0' },
      { kicker: 'Reach', title: 'Internet', detail: 'SaaS, registry, patches' },
    ],
  },
]

export function FlowMap() {
  return (
    <figure className="edge-lanes" aria-label="Three request paths">
      {LANES.map((lane) => (
        <div key={lane.id} className={`edge-lane${lane.die ? ' edge-lane--die' : ''}`}>
          <div className="edge-lane__label">
            <span className="edge-kicker">{lane.name}</span>
            <p>{lane.detail}</p>
          </div>
          <div className="edge-lane__scroll">
            <div className="edge-lane__track">
              <span className="edge-lane__dot" aria-hidden="true" />
              {lane.stops.map((stop, index) => (
                <div key={stop.title} className="edge-stop">
                  {index > 0 && (
                    <span className="edge-stop__arrow" aria-hidden="true">
                      →
                    </span>
                  )}
                  <div className="edge-node">
                    <span className="edge-kicker">{stop.kicker}</span>
                    <strong>{stop.title}</strong>
                    <span>{stop.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <figcaption>
        Concern order, outside in. A WAF reads HTTP, so it sits on the first hop that terminates
        TLS. The load balancer and the API gateway then trade places: in front of a self-hosted
        gateway fleet the balancer comes first; with a managed gateway your balancer starts where
        your own tasks start. The outbound lane is not a fourth inbound hop — it is how private
        tasks call the internet without a public IP on each host.
      </figcaption>
    </figure>
  )
}
