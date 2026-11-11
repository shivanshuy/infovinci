type ZoneNode = { title: string; detail: string; mark?: string }

type Zone = { name: string; tone: 'edge' | 'public' | 'private' | 'managed'; nodes: ZoneNode[] }

type Net = { id: string; title: string; summary: string; zones: Zone[] }

const NETS: Net[] = [
  {
    id: 'website',
    title: 'Public website',
    summary:
      'WAF at the CDN. The only public origin is the load balancer. Tasks have private addresses. Outbound internet goes through a NAT in the public subnet.',
    zones: [
      {
        name: 'Internet',
        tone: 'edge',
        nodes: [
          { title: 'DNS', detail: 'Name points at the CDN, not at a task' },
          { title: 'CDN', detail: 'TLS from the browser ends here', mark: 'TLS' },
          { title: 'WAF', detail: 'Attached to the CDN, on the viewer request' },
        ],
      },
      {
        name: 'Public subnet',
        tone: 'public',
        nodes: [
          {
            title: 'Load balancer',
            detail: 'HTTPS to the origin. Forwards only what the WAF allowed',
            mark: 'TLS',
          },
          {
            title: 'NAT gateway',
            detail: 'Egress only. Private tasks reach SaaS and registries through here',
            mark: 'OUT',
          },
          {
            title: 'Internet gateway',
            detail: 'VPC door to the internet. Inbound to ALB; outbound from NAT',
          },
        ],
      },
      {
        name: 'Private subnet',
        tone: 'private',
        nodes: [
          { title: 'App', detail: 'No public IP. Default route to the NAT for 0.0.0.0/0' },
          { title: 'App', detail: 'Security group allows the balancer only' },
          { title: 'App', detail: 'Health check is /healthz' },
        ],
      },
    ],
  },
  {
    id: 'api',
    title: 'Managed API',
    summary:
      'The gateway is the front door. Your load balancer is internal. Tasks stay private. A NAT still sits in a public subnet when those tasks must call the internet.',
    zones: [
      {
        name: 'Provider edge',
        tone: 'managed',
        nodes: [
          { title: 'DNS', detail: 'Name points at the gateway hostname' },
          { title: 'WAF', detail: 'Regional ACL on the API stage', mark: 'TLS' },
          { title: 'API gateway', detail: 'JWT or key, quota, route, VPC link' },
        ],
      },
      {
        name: 'Public subnet',
        tone: 'public',
        nodes: [
          {
            title: 'NAT gateway',
            detail: 'Not on the partner path. Only for task egress',
            mark: 'OUT',
          },
        ],
      },
      {
        name: 'Private subnet',
        tone: 'private',
        nodes: [
          { title: 'Internal LB', detail: 'Network load balancer, no public listener' },
          { title: 'Orders', detail: 'Checks ownership, not the API key' },
          { title: 'Billing', detail: 'Reached only if a route says so' },
        ],
      },
    ],
  },
  {
    id: 'self',
    title: 'Self-hosted',
    summary:
      'You run every hop. The public balancer exists because the WAF and the gateway are fleets too. Private services egress through a NAT, not a public IP on each host.',
    zones: [
      {
        name: 'Public edge',
        tone: 'public',
        nodes: [
          { title: 'L4 balancer', detail: 'Spreads TCP across WAF replicas. It cannot be the WAF', mark: 'TLS' },
          { title: 'WAF', detail: 'Coraza or ModSecurity CRS, TLS terminated' },
          {
            title: 'NAT gateway',
            detail: 'Private service → NAT → internet. One per AZ in production',
            mark: 'OUT',
          },
        ],
      },
      {
        name: 'Platform',
        tone: 'managed',
        nodes: [
          { title: 'L7 balancer', detail: 'HAProxy or Envoy, least connections' },
          { title: 'Gateway', detail: 'Kong or APISIX replicas' },
        ],
      },
      {
        name: 'Private',
        tone: 'private',
        nodes: [
          { title: 'Service', detail: 'Accepts traffic from the gateway only' },
          { title: 'Service', detail: 'Authorization stays in the handler' },
        ],
      },
    ],
  },
]

export function NetworkDiagrams() {
  return (
    <div className="edge-nets">
      {NETS.map((net) => (
        <figure key={net.id} className="edge-net">
          <figcaption>
            <strong>{net.title}</strong>
            <span>{net.summary}</span>
          </figcaption>
          <ol className="edge-net__zones">
            {net.zones.map((zone) => (
              <li key={zone.name} className={`edge-zone edge-zone--${zone.tone}`}>
                <span className="edge-kicker">{zone.name}</span>
                <ul>
                  {zone.nodes.map((node) => (
                    <li key={`${node.title}-${node.detail}`} className="edge-node">
                      {node.mark && <span className="edge-node__mark">{node.mark}</span>}
                      <strong>{node.title}</strong>
                      <span>{node.detail}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </figure>
      ))}
    </div>
  )
}
