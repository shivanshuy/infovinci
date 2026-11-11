import { useState } from 'react'

type Hop = { abbr: string; name: string; note: string }

type ProductionCase = {
  id: string
  label: string
  product: string
  summary: string
  hops: Hop[]
  points: string[]
  sourceHref: string
  sourceLabel: string
}

const CASES: ProductionCase[] = [
  {
    id: 'netflix',
    label: 'Netflix',
    product: 'Streaming site and apps',
    summary:
      'Published Zuul architecture. Elastic Load Balancing spreads connections across the gateway fleet. Zuul is the gateway. A second, software load balancer inside Zuul spreads calls across origin instances.',
    hops: [
      { abbr: 'APP', name: 'Device or browser', note: 'All external traffic' },
      { abbr: 'ELB', name: 'Elastic Load Balancing', note: 'In front of the Zuul fleet' },
      { abbr: 'ZUL', name: 'Zuul', note: 'Auth, routing, load shedding' },
      { abbr: 'RIB', name: 'Ribbon + Eureka', note: 'Picks a healthy origin' },
      { abbr: 'EC2', name: 'Origin clusters', note: 'EC2 auto scaling groups' },
    ],
    points: [
      'Zuul’s own docs call it the front door for devices and websites, and describe routing to more than one Amazon auto scaling group. The Zuul 2 post (Netflix Tech Blog) says that fleet was the entry for external traffic, on the order of a million requests a second across dozens of Zuul clusters.',
      'Two load balancers, two jobs. The AWS load balancer only keeps the Zuul replicas reachable. Ribbon, using Eureka, chooses the origin. Zuul 2 later scored origins and used choice-of-two so a hot instance received less traffic.',
      'Isthmus, their multi-region design, uses Zuul to send a request at one region’s load balancer toward another region. A zone or region loss is a routing change at the gateway, not a DNS edit in the client.',
      'They have publicly described leaving Classic load balancers for NLB on critical domains (re:Invent 2018). The published pictures are from that era. They do not describe a separate WAF product in front of Zuul; authentication and rejection live in Zuul filters.',
    ],
    sourceHref: 'https://github.com/Netflix/zuul/wiki/How-We-Use-Zuul-At-Netflix',
    sourceLabel: 'How we use Zuul at Netflix',
  },
  {
    id: 'lyft',
    label: 'Lyft',
    product: 'Ride app and API',
    summary:
      'Published Envoy rollout. A TCP load balancer on AWS sits in front of edge Envoy. Envoy is the L7 hop: routing, TLS, stats. Internal load balancers were removed once every service had its own Envoy.',
    hops: [
      { abbr: 'APP', name: 'Riders and drivers', note: 'Internet' },
      { abbr: 'ELB', name: 'AWS TCP ELB', note: 'L4. First did TLS, then passed it through' },
      { abbr: 'ENV', name: 'Front Envoy', note: 'Path routing, HTTP/2, edge stats' },
      { abbr: 'SVC', name: 'Services', note: 'Monolith, then Go and Python' },
    ],
    points: [
      'Matt Klein’s account: Envoy launched at Lyft as an edge proxy behind AWS ELBs that terminated TLS. By late 2015 that edge was on the request path for Lyft traffic. The KubeCon diagram is the same shape: AWS TCP ELB, edge Envoy, then /foo, /bar, /baz to services.',
      'The ELB was not the API gateway. It could not route on the path or emit per-route latency. Envoy did. That is the L4-in-front-of-L7 pattern from the self-hosted diagram above.',
      'Service-to-service traffic started on internal ELBs, with an Envoy beside the app for ingress buffering. They then discovered instances directly and deleted those internal load balancers. East-west traffic stopped paying for a cloud balancer hop.',
      'HAProxy was already beside the PHP monolith, mostly for MongoDB, and Envoy replaced it. The public edge and the mesh ended up as the same binary.',
    ],
    sourceHref: 'https://mattklein123.dev/2021/09/14/5-years-envoy-oss/',
    sourceLabel: '5 years of Envoy OSS',
  },
  {
    id: 'slack',
    label: 'Slack',
    product: 'slack.com and the clients',
    summary:
      'Published edge, still the one their engineering blog describes. DNS sends the user to an NLB in a nearby edge region. Envoy terminates and routes. Core services stay in us-east-1.',
    hops: [
      { abbr: 'APP', name: 'Client', note: 'Web, desktop, mobile' },
      { abbr: 'DNS', name: 'NS1 or Route 53', note: 'Nearest edge PoP' },
      { abbr: 'NLB', name: 'NLB', note: 'In that edge region' },
      { abbr: 'ENV', name: 'envoy-edge or envoy-wss', note: 'HTTP APIs, or websockets' },
      { abbr: 'CORE', name: 'us-east-1', note: 'Webapp and channel services, per AZ' },
    ],
    points: [
      'Traffic 101 (Slack Engineering): non-websocket traffic — API, webhooks, files, images — enters envoy-edge. Websocket traffic enters envoy-wss via wss-primary.slack.com and wss-backup.slack.com. NS1 or Route 53 aims the name at an NLB close to the user. The NLB forwards to Envoy.',
      'HTTP and websockets are different Envoy fleets on purpose. A websocket hold should not share a process with short API calls.',
      'For years the ingress balancer was HAProxy behind a layer-4 load balancer, with Consul rendering backends. They moved ingress to Envoy so endpoint changes did not require a reload. Rotor, their xDS control plane, can set a us-east-1 availability zone’s weight to zero and drain it without dropping in-flight requests.',
      'These posts do not put a WAF on the diagram. The published hops are DNS, NLB, and Envoy. Adding a WAF would be a new hop in front of the NLB or on the Envoy listener, not a rename of Envoy.',
    ],
    sourceHref: 'https://slack.engineering/traffic-101-packets-mostly-flow/',
    sourceLabel: 'Traffic 101: Packets Mostly Flow',
  },
  {
    id: 'shopify',
    label: 'Shopify',
    product: 'Storefronts, including Hydrogen on Oxygen',
    summary:
      'A real website edge that is not an ALB. Cloudflare runs the WAF. For custom storefronts, a Gateway Worker is the API-style front door, then a Storefront Worker runs the page.',
    hops: [
      { abbr: 'BUY', name: 'Buyer', note: 'Custom domain' },
      { abbr: 'WAF', name: 'Cloudflare', note: 'WAF, bots, DDoS' },
      { abbr: 'GW', name: 'Gateway Worker', note: 'Shop and version allowed?' },
      { abbr: 'SF', name: 'Storefront Worker', note: 'Hydrogen page, at the edge' },
    ],
    points: [
      'Cloudflare’s Shopify case study: Shopify runs the Cloudflare WAF, Bot Management, DDoS protection, and Workers. The WAF is at the CDN, which is the first hop that can read HTTP.',
      'Oxygen, their host for custom Hydrogen storefronts (Shopify Engineering): a buyer request hits a Gateway Worker. That worker checks that the caller may access the shop and that storefront version, then dynamic-dispatch sends them to the Storefront Worker that has the page. The gateway and the app are both isolates on the edge. There is no customer VPC and no ALB in this path.',
      'This is the “skip the load balancer” case from the single-server scenario, at a CDN’s scale. The fleet is Cloudflare’s. You still have a WAF and a gateway; you do not operate a balancer in front of your own tasks.',
      'A merchant who proxies a Shopify domain through another Cloudflare zone adds a second hop. Shopify’s own docs treat that extra proxy as latency unless it is doing something the platform edge is not.',
    ],
    sourceHref: 'https://shopify.engineering/how-we-built-oxygen',
    sourceLabel: 'How we built Oxygen',
  },
]

export function ProductionCases() {
  const [id, setId] = useState(CASES[0].id)
  const item = CASES.find((entry) => entry.id === id) ?? CASES[0]

  return (
    <div className="edge-prod">
      <div className="edge-choices" role="group" aria-label="Published production stacks">
        {CASES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={entry.id === item.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
            onClick={() => setId(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <article className="edge-prod__card" aria-live="polite">
        <header>
          <span className="edge-kicker">{item.product}</span>
          <h4>{item.label}</h4>
          <p>{item.summary}</p>
        </header>
        <ol className="edge-prod__path" aria-label={`${item.label} request path`}>
          {item.hops.map((hop, index) => (
            <li key={`${hop.abbr}-${hop.name}`}>
              {index > 0 && (
                <span className="edge-aws-arrow" aria-hidden="true">
                  →
                </span>
              )}
              <div className="edge-aws-tile">
                <span className="edge-aws-mark" aria-hidden="true">
                  {hop.abbr}
                </span>
                <span>
                  <strong>{hop.name}</strong>
                  <em>{hop.note}</em>
                </span>
              </div>
            </li>
          ))}
        </ol>
        <ul>
          {item.points.map((point) => (
            <li key={point.slice(0, 48)}>{point}</li>
          ))}
        </ul>
        <p className="edge-prod__source">
          <span className="edge-kicker">Published source</span>
          <a href={item.sourceHref} target="_blank" rel="noopener noreferrer">
            {item.sourceLabel}
          </a>
        </p>
      </article>
    </div>
  )
}
