import { useState } from 'react'
import { AwsApiSheet, AwsArchSheet } from './AwsArchSheet'
import { AwsLayouts } from './AwsLayouts'
import { EdgeBench } from './EdgeBench'
import { EdgePlayground } from './EdgePlayground'
import { EdgeField } from './EdgeField'
import { FlowMap } from './FlowMap'
import { NetworkDiagrams } from './NetworkDiagrams'
import { ProductionCases } from './ProductionCases'
import { SNIPPET_TABS } from './snippets'
import { TrafficSim } from './TrafficSim'
import './edge-stack.css'

const SCENARIOS: { id: string; label: string; use: string; skip: string; order: string }[] = [
  {
    id: 'blog',
    label: 'One server',
    use: 'A single nginx (or the app process itself) is the whole front door. Add a load balancer when a second instance appears, a WAF when the site is on the public internet and you will not keep filtering rules inside the app, and a gateway only when other teams call you as an API.',
    skip: 'Skip all three while there is one process and you accept the risk of an unfiltered public port.',
    order: 'Client → nginx → the site',
  },
  {
    id: 'shop',
    label: 'Shop, three app servers',
    use: 'WAF plus a load balancer. The shop is a website: login and the cart live in the app. The balancer’s job is health checks and spreading sessions or requests. Prefer a CDN in front if pages and images are cacheable; attach the WAF there. App servers stay private; add a NAT (one per AZ) if they must call payment or email APIs on the internet.',
    skip: 'Skip the API gateway. Path rules on the load balancer are enough to send /api to the app. Skip giving app servers public IPs — use a NAT for egress instead.',
    order: 'Client → CDN + WAF → load balancer → private app servers (egress via NAT when needed)',
  },
  {
    id: 'partners',
    label: 'Partner API',
    use: 'WAF, API gateway, and an internal load balancer. Partners get keys or OAuth tokens, a quota, and a stable URL. Services stay on private addresses. The gateway authenticates the caller; each service still checks authorization for the specific record. If those services call SaaS or pull images from the public internet, place a NAT in a public subnet — one per AZ in production.',
    skip: 'Do not skip the gateway and copy API-key checks into every service. Do not skip the WAF because “only partners have keys” — scanners do not send a key, and a stolen key can still carry an exploit. Do not skip the NAT by putting public IPs on the tasks.',
    order: 'Client → WAF → API gateway → internal load balancer → private services (+ NAT for outbound)',
  },
  {
    id: 'k8s',
    label: 'Kubernetes already',
    use: 'You already have a load balancer: Service, or an Ingress / Gateway API implementation (nginx, Envoy, cloud LB). Add a WAF on the cloud edge or as a filter in that proxy (Coraza). Add gateway policy — API keys, JWT, per-consumer limits — when callers are other teams or customers, not when you only needed a path rule.',
    skip: 'Kubernetes Gateway API alone is routing, closer to the load balancer than to an API product. A service mesh policy between pods does not replace a public WAF.',
    order: 'Client → cloud WAF → ingress or gateway → Service (internal balancer) → pods',
  },
  {
    id: 'page-two-apis',
    label: 'Page calling two APIs',
    use: 'Someone searches /search?q=boots. That browser request is public HTTP, so the WAF runs on it, then the load balancer, then the web app. The app itself calls the catalog API (GET /products?q=boots) and the inventory API (GET /stock?sku=…) on private addresses. Those two calls already passed the WAF when the search arrived. They do not get a second WAF, and they do not go out through a public API gateway. Each API still gets an internal load balancer when it has more than one task. The web app carries a credential the APIs trust, and each API still checks that this shop may see this SKU.',
    skip: 'Leave the public API gateway off the page path. Leave the WAF off the private hop from the web app to the two APIs. If those same APIs are also published to other companies, that public door is a separate front: its own WAF and gateway. The web app keeps using the private address.',
    order: 'Browser → WAF → load balancer → web app → catalog API and inventory API (private)',
  },
  {
    id: 'two-apis-outside',
    label: 'Two APIs, outside caller',
    use: 'There is no website in the middle. A partner calls GET /v1/products and GET /v1/stock from the internet. Both services share one public door, and the WAF is on that door. API Gateway then checks the key and the quota and sends /v1/products to catalog and /v1/stock to inventory. An internal load balancer sits in front of each service. A valid key still passes through the WAF, because a stolen key can carry an exploit. One WAF covers both APIs. A second WAF appears only if a service has its own public hostname.',
    skip: 'Leave a per-service public WAF out while both APIs share this door. Leave the gateway out and every service will parse the key its own way.',
    order: 'Outside caller → WAF → API gateway → catalog and inventory (internal load balancers)',
  },
]

const ROWS: { topic: string; waf: string; lb: string; gw: string; nat: string }[] = [
  {
    topic: 'Question it answers',
    waf: 'Does this HTTP look hostile?',
    lb: 'Which healthy process takes this connection?',
    gw: 'May this caller use this API operation, within quota?',
    nat: 'How do private tasks reach the internet without a public IP?',
  },
  {
    topic: 'Sees',
    waf: 'Method, path, headers, body, source IP',
    lb: 'Connections or requests, plus health checks',
    gw: 'Identity, consumer, route, sometimes a transformed body',
    nat: 'IP packets leaving a private subnet (not HTTP)',
  },
  {
    topic: 'Typical place',
    waf: 'First hop that can read HTTP',
    lb: 'Directly in front of a replica set',
    gw: 'Directly in front of API handlers',
    nat: 'Public subnet; private default route points at it',
  },
  {
    topic: 'Skip it when',
    waf: 'Nothing on the public internet speaks HTTP',
    lb: 'There is exactly one instance',
    gw: 'The site renders its own pages and owns its login',
    nat: 'Tasks never call the internet, or VPC endpoints cover the destinations',
  },
  {
    topic: 'Open source',
    waf: 'Coraza, ModSecurity CRS',
    lb: 'HAProxy, nginx, Envoy, IPVS',
    gw: 'Kong, Apache APISIX, Tyk, Envoy Gateway',
    nat: 'iptables / nftables MASQUERADE, OpenBSD pf, Linux NAT instances',
  },
  {
    topic: 'Managed examples',
    waf: 'AWS WAF, Cloudflare, Azure WAF, Cloud Armor',
    lb: 'ALB, NLB, Azure Load Balancer, Cloud Load Balancing',
    gw: 'API Gateway, Apigee, Azure API Management',
    nat: 'AWS NAT Gateway, Azure NAT Gateway, Cloud NAT',
  },
]

export function EdgeStackGuide() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const [tabId, setTabId] = useState(SNIPPET_TABS[0].id)
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0]
  const tab = SNIPPET_TABS.find((item) => item.id === tabId) ?? SNIPPET_TABS[0]

  return (
    <div className="edge-guide">
      <p className="edge-deck">
        Three inbound front doors get drawn as one box, and a fourth job sits on the way out. A WAF
        decides whether the HTTP is safe to spend capacity on. A load balancer decides which healthy
        process takes the work. An API gateway decides whether this caller is allowed to use this
        API, and how often. A NAT gateway lets private tasks call the internet without a public IP
        on each host. Use the ones whose question you actually have.
      </p>

      <nav className="edge-toc" aria-label="On this page">
        <a href="#edge-order">Order</a>
        <a href="#edge-rules">Rules</a>
        <a href="#edge-jobs">The four jobs</a>
        <a href="#edge-nat">NAT gateway</a>
        <a href="#edge-when">When to use which</a>
        <a href="#edge-play">Playground</a>
        <a href="#edge-trace">Watch a request</a>
        <a href="#edge-nets">Networks</a>
        <a href="#edge-bench">Bench</a>
        <a href="#edge-field">Simulator</a>
        <a href="#edge-aws">AWS layouts</a>
        <a href="#edge-prod">In production</a>
        <a href="#edge-code">Configuration</a>
        <a href="#edge-mixups">Mixing them up</a>
      </nav>

      <section id="edge-order" aria-labelledby="edge-order-title">
        <h3 id="edge-order-title">What comes first</h3>
        <p>
          Traffic walks inward. Each hop should exist because the hop behind it is the wrong place
          to do that job. DNS is not one of the three, and it is always first: the name must resolve
          to the edge, never to a private task.
        </p>
        <ol className="edge-order">
          <li>
            <span className="edge-kicker">1 · Name</span>
            <strong>DNS</strong>
            <span>Points at the CDN, the load balancer, or the gateway hostname.</span>
          </li>
          <li>
            <span className="edge-kicker">2 · Absorb</span>
            <strong>CDN and DDoS edge, if you have one</strong>
            <span>Soaks volume and caches safe responses before origin capacity is involved.</span>
          </li>
          <li>
            <span className="edge-kicker">3 · Filter</span>
            <strong>WAF</strong>
            <span>Reads HTTP and rejects exploits before a balancer slot or a gateway quota is spent.</span>
          </li>
          <li>
            <span className="edge-kicker">4 · Spread or govern</span>
            <strong>Load balancer and API gateway</strong>
            <span>Their relative order depends on which one of them is the fleet you operate.</span>
          </li>
          <li>
            <span className="edge-kicker">5 · Work</span>
            <strong>Your handlers</strong>
            <span>Business rules, including whether this caller may touch this record.</span>
          </li>
          <li>
            <span className="edge-kicker">↔ · Outbound</span>
            <strong>NAT gateway (when needed)</strong>
            <span>
              Separate arrow: private task → NAT in a public subnet → internet. Not on the inbound
              walk above.
            </span>
          </li>
        </ol>
        <FlowMap />
        <div className="edge-read">
          <div>
            <h4>Plain</h4>
            <p>
              Filter before you do real work. Then either spread visitors across copies of a website,
              or check the badge of an API caller and only then spread the call across copies of the
              service. A blog with one machine needs none of this yet.
            </p>
          </div>
          <div>
            <h4>Sharp</h4>
            <p>
              A WAF only sees HTTP on a hop that terminates TLS, or on traffic that hop already
              decrypted. An L4 balancer (NLB, IPVS, a TCP VIP) cannot be the WAF. If the WAF tier is
              itself a fleet, that outer VIP is a load balancer sitting in front of the WAF — it
              still does not inspect the request. AWS WAF on an ALB runs before the target is
              chosen, so filter and spread are one hop. A CloudFront Web ACL and a regional API
              Gateway Web ACL are different resources (scope <code>CLOUDFRONT</code> versus{' '}
              <code>REGIONAL</code>). Run the WAF on the viewer request, including cache hits, so a
              hostile payload is not what you store.
            </p>
          </div>
        </div>
      </section>

      <section id="edge-rules" aria-labelledby="edge-rules-title">
        <h3 id="edge-rules-title">Rules you can decide with</h3>
        <p>
          Nine lines for a drawing or a review. If a design breaks one, move that job back to the
          box that owns it. The rest of this page is the same rules with the exceptions written out.
        </p>
        <ol className="edge-rules">
          <li>
            <span className="edge-kicker">01</span>
            <strong>The WAF comes first.</strong>
            <span>
              Of the three boxes, the filter is the one in front. It reads the HTTP before a load
              balancer picks a process and before an API gateway spends a quota. DNS still resolves
              the name, and a CDN can sit outside. When the WAF itself is a fleet, the address in
              front of those replicas only spreads TCP.
            </span>
          </li>
          <li>
            <span className="edge-kicker">02</span>
            <strong>IP filtering is a WAF job.</strong>
            <span>
              Known-bad addresses, countries, and “this IP is flooding the site” are rules on the
              WAF or the CDN. A security group answers a smaller question: the app port accepts
              connections from the load balancer or the gateway.
            </span>
          </li>
          <li>
            <span className="edge-kicker">03</span>
            <strong>The load balancer only picks a healthy process.</strong>
            <span>
              Health checks, spreading, draining, and a path split such as <code>/api</code> and{' '}
              <code>/images</code>. It does not know the caller and it does not keep a quota. One
              process means this box waits until the second copy exists.
            </span>
          </li>
          <li>
            <span className="edge-kicker">04</span>
            <strong>A gateway is for a published API.</strong>
            <span>
              Keys or tokens, a quota per caller, and a stable versioned URL. A site that renders
              its own pages and signs its own users in keeps login in the app. The load balancer’s
              path rule is the front door.
            </span>
          </li>
          <li>
            <span className="edge-kicker">05</span>
            <strong>RBAC at the gateway.</strong>
            <span>
              Role and scope travel in the token: <code>orders:read</code>, admin, partner. The
              gateway can refuse the call from the token alone, before a service starts. Every
              service then inherits the same role check.
            </span>
          </li>
          <li>
            <span className="edge-kicker">06</span>
            <strong>The record stays in the handler.</strong>
            <span>
              “May this caller see order 1842” needs the row. That is the resource side of an
              attribute check. Caller attributes — role, plan, tenant — were already on the token
              the gateway read. The handler decides ownership next to the database.
            </span>
          </li>
          <li>
            <span className="edge-kicker">07</span>
            <strong>Floods and quotas are different counters.</strong>
            <span>
              Volume from an address is a WAF or DDoS rule. “This customer has used this minute”
              is a gateway rule. A valid key still passes through the WAF, because a stolen key can
              carry an exploit.
            </span>
          </li>
          <li>
            <span className="edge-kicker">08</span>
            <strong>Believe the header only from the hop in front.</strong>
            <span>
              The gateway writes <code>X-Consumer-Username</code>. The load balancer appends{' '}
              <code>X-Forwarded-For</code>. The app honors those headers when the connection came
              from that hop’s network.
            </span>
          </li>
          <li>
            <span className="edge-kicker">09</span>
            <strong>Private tasks leave through a NAT, not a public IP.</strong>
            <span>
              Keep app tasks without a public address. When they must call the internet — pull an
              image, hit a payment API, fetch a patch — the route goes private subnet → NAT gateway
              (in a public subnet) → internet gateway. A NAT does not accept inbound from the
              internet. Do not put a public IP on the task to “make egress work.”
            </span>
          </li>
        </ol>
      </section>

      <section id="edge-jobs" aria-labelledby="edge-jobs-title">
        <h3 id="edge-jobs-title">The four jobs</h3>
        <p>
          Three of these sit on the inbound path. The fourth — the NAT gateway — sits on the
          outbound path. They still get confused on the same diagram, so treat each as its own job.
        </p>

        <article className="edge-job">
          <h4>WAF</h4>
          <div className="edge-read">
            <div>
              <h4>Plain</h4>
              <p>
                A web application firewall is a bouncer that reads the request itself. It blocks
                things that look like attacks: SQL injection, cross-site scripting, huge bodies,
                known-bad addresses. It does not know who your users are, and it does not choose
                which server is free.
              </p>
            </div>
            <div>
              <h4>Sharp</h4>
              <p>
                Signature and anomaly inspection of parsed HTTP, sometimes of the response. OWASP
                CRS on Coraza or ModSecurity is the usual open-source engine; cloud WAFs add managed
                rule groups and IP reputation. Rate-based WAF rules key off the source address and
                protect capacity. They are not a per-customer quota. Tuning is the work: JSON bodies,
                file upload, and GraphQL false-positive until you exclude those locations. Volumetric
                floods are a shield or CDN problem in front of this, not a rule-group problem.
              </p>
            </div>
          </div>
        </article>

        <article className="edge-job">
          <h4>Load balancer</h4>
          <div className="edge-read">
            <div>
              <h4>Plain</h4>
              <p>
                A receptionist with a list of who is at their desk. Each new visitor goes to someone
                healthy. If a process stops answering its health check, it drops out of the rotation
                until it recovers. One server does not need a receptionist.
              </p>
            </div>
            <div>
              <h4>Sharp</h4>
              <p>
                L4 (NLB, HAProxy TCP, IPVS) balances connections and can pass TLS through untouched.
                L7 (ALB, nginx, Envoy, HAProxy HTTP) balances requests, terminates TLS, and can route
                on host and path. Algorithms that matter: round robin, least connections, and
                consistent hash when a websocket or a cache wants the same backend. Passive failure
                detection (nginx <code>max_fails</code>) is not an active probe; HAProxy{' '}
                <code>option httpchk</code>, nginx Plus, and cloud target groups actually poll.{' '}
                <code>X-Forwarded-For</code> is appended by a hop you trust, then restored with{' '}
                <code>real_ip</code> only from that hop’s CIDR. Path rules are still a load balancer.
                They do not issue API keys.
              </p>
            </div>
          </div>
        </article>

        <article className="edge-job">
          <h4>API gateway</h4>
          <div className="edge-read">
            <div>
              <h4>Plain</h4>
              <p>
                The front door of an API product. It checks the badge (API key or token), counts how
                often that caller knocks, and sends the call to the right version of the right
                service. The service still decides whether that caller may see that particular order.
              </p>
            </div>
            <div>
              <h4>Sharp</h4>
              <p>
                North-south API management: authentication offload (API key, JWT, OAuth, mTLS),
                per-consumer quotas, versioned routes, request and response transforms, and per-route
                metrics. Kong, APISIX, Tyk, Envoy Gateway, Amazon API Gateway, Apigee, Azure API
                Management. This is not a service mesh — mesh policy is east-west, pod to pod — and
                it is not the Kubernetes Gateway API, which configures load-balancer-style routing
                until you add consumer policy on top. Managed gateways hide their own fleet; if you
                run Kong yourself, those replicas still need a load balancer in front of them.
                Authentication at the gateway, authorization in the service. Streaming and websocket
                upgrades are uneven across managed gateways; check the idle timeout before you put
                one on that path.
              </p>
            </div>
          </div>
        </article>

        <article className="edge-job">
          <h4>NAT gateway</h4>
          <div className="edge-read">
            <div>
              <h4>Plain</h4>
              <p>
                A one-way door out. Private app servers have no public address. When they must call
                the internet — pull an image, hit a payment API, fetch a patch — they send traffic
                to a NAT in a public subnet. The NAT rewrites the source address and forwards the
                packets. Replies come back the same way. Browsers never knock on this door.
              </p>
            </div>
            <div>
              <h4>Sharp</h4>
              <p>
                Network Address Translation for egress only. Managed hops (AWS NAT Gateway, Azure
                NAT Gateway, Cloud NAT) live in a public subnet with an Elastic/public IP; private
                subnet default routes (<code>0.0.0.0/0</code>) point at them. They do not terminate
                TLS, read HTTP, balance inbound traffic, or accept new connections from the
                internet. Prefer VPC endpoints (S3, ECR, Secrets Manager, and peers in-region) when
                the destination is a cloud service — that traffic never needs the NAT. In
                production, place one NAT per availability zone so a zone loss does not black-hole
                all egress. Do not “fix” missing egress by putting a public IP on the task.
              </p>
            </div>
          </div>
        </article>

        <div className="edge-table-wrap">
          <table className="edge-table">
            <caption>Four jobs, four questions — NAT is outbound, not a fourth inbound front door</caption>
            <thead>
              <tr>
                <th scope="col"> </th>
                <th scope="col">WAF</th>
                <th scope="col">Load balancer</th>
                <th scope="col">API gateway</th>
                <th scope="col">NAT gateway</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.topic}>
                  <th scope="row">{row.topic}</th>
                  <td>{row.waf}</td>
                  <td>{row.lb}</td>
                  <td>{row.gw}</td>
                  <td>{row.nat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="edge-nat" aria-labelledby="edge-nat-title">
        <h3 id="edge-nat-title">NAT gateway — outbound only</h3>
        <p>
          The WAF, load balancer, and API gateway sit on the <em>inbound</em> path: internet → your
          app. A NAT gateway sits on the <em>outbound</em> path: your private app → the internet.
          It is not a fourth “edge box” in the same sense as those three. It is how private tasks
          reach the outside world without becoming public themselves.
        </p>
        <div className="edge-read">
          <div>
            <h4>What it is</h4>
            <p>
              Network Address Translation. A managed hop (AWS NAT Gateway, Azure NAT Gateway, Cloud
              NAT) lives in a <strong>public</strong> subnet and holds a public IP. Private tasks
              send traffic to it. It rewrites the source address and forwards through the internet
              gateway. Replies come back to the NAT, which returns them to the private task. From
              the internet’s point of view, only the NAT’s address exists — not the task.
            </p>
          </div>
          <div>
            <h4>What it is not</h4>
            <p>
              It is not a WAF. It does not read HTTP. It is not a load balancer for your users. It
              does not terminate TLS for browsers. It does not accept new connections from the
              internet into your VPC. Putting a NAT “in front of” the site is the wrong picture —
              browsers never hit it.
            </p>
          </div>
        </div>
        <div className="edge-nat-flow" aria-label="Outbound path through a NAT">
          <div className="edge-nat-flow__node">
            <strong>Private task</strong>
            <span>no public IP</span>
          </div>
          <div className="edge-nat-flow__arrow" aria-hidden>
            <span>egress</span>
          </div>
          <div className="edge-nat-flow__node edge-nat-flow__node--accent">
            <strong>NAT gateway</strong>
            <span>public subnet</span>
          </div>
          <div className="edge-nat-flow__arrow" aria-hidden>
            <span>IGW</span>
          </div>
          <div className="edge-nat-flow__node">
            <strong>Internet</strong>
            <span>SaaS · registry · patches</span>
          </div>
        </div>
        <p className="edge-nat-flow__caption">
          Inbound stays: Browser → WAF → balancer or gateway → private task. Outbound is a separate
          arrow out of the private subnet.
        </p>
        <div className="edge-table-wrap">
          <table className="edge-table">
            <caption>When a NAT is required</caption>
            <thead>
              <tr>
                <th scope="col">Situation</th>
                <th scope="col">Need a NAT?</th>
                <th scope="col">Why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Private ECS / EC2 / pods must call Stripe, Slack, or a SaaS API</th>
                <td>Yes</td>
                <td>Outbound HTTPS with no public IP on the task</td>
              </tr>
              <tr>
                <th scope="row">Private tasks pull container images or OS patches from the internet</th>
                <td>Yes</td>
                <td>Unless you use a private registry / VPC endpoints instead</td>
              </tr>
              <tr>
                <th scope="row">Tasks only talk to RDS, ElastiCache, and other VPC peers</th>
                <td>No</td>
                <td>No internet route required</td>
              </tr>
              <tr>
                <th scope="row">You already gave every task a public IP</th>
                <td>Avoid</td>
                <td>That is the wrong fix — close the public IP and add a NAT</td>
              </tr>
              <tr>
                <th scope="row">Multi-AZ production</th>
                <td>One NAT per AZ</td>
                <td>So a zone loss does not black-hole all egress</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Prefer VPC endpoints (S3, ECR, Secrets Manager, and so on) when the destination is another
          AWS service in the same region — that traffic never needs the NAT. Use a NAT for the
          leftovers that really are “the public internet.”
        </p>
      </section>

      <section id="edge-when" aria-labelledby="edge-when-title">
        <h3 id="edge-when-title">When to use which</h3>
        <p>
          Pick the system you actually have. The recommendation follows the questions above, not a
          default of “deploy all three.” A WAF is on every public HTTP door. A page search has one,
          in front of the site. The site’s calls to private APIs are a later hop and do not get
          another WAF. Two APIs called from the internet share one WAF on that outside door. Private
          tasks that must call the internet still need a NAT (rule 09) — that is separate from which
          of the three inbound boxes you deploy.
        </p>
        <div className="edge-choices" role="group" aria-label="System shape">
          {SCENARIOS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === scenario.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
              onClick={() => setScenarioId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="edge-scenario" aria-live="polite">
          <p>
            <span className="edge-kicker">Use</span>
            {scenario.use}
          </p>
          <p>
            <span className="edge-kicker">Leave out</span>
            {scenario.skip}
          </p>
          <p className="edge-scenario__order">
            <span className="edge-kicker">Order</span>
            {scenario.order}
          </p>
        </div>
      </section>

      <section id="edge-play" aria-labelledby="edge-play-title">
        <h3 id="edge-play-title">Playground</h3>
        <p>
          A board for the production shape. Web app is someone searching a page: the browser hits
          a WAF, then a load balancer, then the web app. Catalog and inventory stay private
          behind the app, and there is no API gateway. Service is someone calling the APIs from
          outside: one WAF, then the API gateway, then an internal load balancer, then the
          services. Both shapes also place a NAT gateway beside the private tasks for outbound
          internet — not on the inbound row. Suggest draws that path. Check leaves every box to
          you: drag the dot on a box to another box to draw a wire, and click a wire to remove
          it. Left to right is the public path. The note says whether the diagram holds.
        </p>
        <EdgePlayground />
      </section>

      <section id="edge-trace" aria-labelledby="edge-trace-title">
        <h3 id="edge-trace-title">Watch four requests</h3>
        <p>
          Same four calls, two shapes. The attack dies in the same place on both. The call with no
          key dies at the gateway on the API shape, and inside an app process on the website shape.
          Mark server B down and the balancer walks past it.
        </p>
        <TrafficSim />
        <figure className="edge-mixfig">
          <div
            className="edge-mix"
            role="img"
            aria-label="Illustrative 1000 public API calls: 40 blocked by the WAF, 70 rejected by the gateway, 890 served"
          >
            <span style={{ flex: 40 }} />
            <span style={{ flex: 70 }} />
            <span style={{ flex: 890 }} />
          </div>
          <figcaption>
            <span>WAF block · 40</span>
            <span>Gateway reject · 70</span>
            <span>Served · 890</span>
            Illustrative mix of 1,000 calls, not a benchmark. The thin bands are the point: most
            traffic is fine, and the rejects belong at the edge instead of in the service.
          </figcaption>
        </figure>
      </section>

      <section id="edge-nets" aria-labelledby="edge-nets-title">
        <h3 id="edge-nets-title">Where the boxes sit in a network</h3>
        <p>
          Product names below are the common cloud ones. The zones are the same on Azure, Google
          Cloud, and a rack: a public edge, a managed or self-hosted policy hop, and private
          workloads with no direct route from the internet.
        </p>
        <NetworkDiagrams />
        <p>
          Without a CDN, attach the WAF to the public load balancer or to the API gateway. Filtering
          and the next hop are then the same machine or the same managed listener. Tasks still do
          not get public addresses. When those tasks must reach the internet, add a NAT in the
          public subnet (rule 09) — shown on each diagram below as the egress hop. Security groups
          (or firewall rules) should allow the app port only from the balancer or the gateway, so a
          caller cannot skip the hop that strips a forged <code>X-Forwarded-For</code> or{' '}
          <code>X-Consumer-Username</code>.
        </p>
      </section>

      <section id="edge-bench" aria-labelledby="edge-bench-title">
        <h3 id="edge-bench-title">The request bench</h3>
        <p>
          The same machine, drawn so you can take it apart. Run a call, or step it. Click a block
          to read it. Explode pulls the parts off the rails. The upper rail is a website. The lower
          spur is the API gateway. A dim block is out of this run.
        </p>
        <EdgeBench />
      </section>

      <section id="edge-field" aria-labelledby="edge-field-title">
        <h3 id="edge-field-title">Field simulator</h3>
        <p>
          The panels read this one call the way a machine simulator reads a pose. Pick a pattern and
          run it: the status, the trace, and the lit block move together. Drag the model to orbit
          it. Press a subsystem and that block lifts off the floor; Exploded pulls every block
          apart. A dim block is out of this run. The milliseconds are illustrative, so the bars
          show which hops were touched, not a production latency graph.
        </p>
        <EdgeField />
      </section>

      <section id="edge-aws" aria-labelledby="edge-aws-title">
        <h3 id="edge-aws-title">AWS deployment layouts</h3>
        <p>
          The sheets below are drawn like an architecture diagram: group labels, a cloud boundary,
          a VPC, and a box per availability zone. Under them, the same three shapes are spelled out
          as zones and subnets.
        </p>
        <AwsArchSheet />
        <AwsApiSheet />
        <AwsLayouts />
      </section>

      <section id="edge-prod" aria-labelledby="edge-prod-title">
        <h3 id="edge-prod-title">How four real systems publish this</h3>
        <p>
          These are the request paths from engineering posts, not a private network map and not a
          claim that the diagram is unchanged this year. Each one uses a different subset of the
          three boxes.
        </p>
        <ProductionCases />
      </section>

      <section id="edge-code" aria-labelledby="edge-code-title">
        <h3 id="edge-code-title">Configuration that matches the order</h3>
        <p>
          Self-hosted order for an API fleet: Coraza (or CRS on nginx) as the public HTTP listener,
          HAProxy behind it across Kong replicas, Kong in front of the services. A website drops the
          Kong hop and points HAProxy at the app. The cloud tab only shows the associations between
          those same roles.
        </p>
        <div className="edge-choices" role="tablist" aria-label="Configuration samples">
          {SNIPPET_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`edge-tab-${item.id}`}
              aria-selected={item.id === tab.id}
              aria-controls={`edge-panel-${item.id}`}
              className={item.id === tab.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
              onClick={() => setTabId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={`edge-panel-${tab.id}`}
          aria-labelledby={`edge-tab-${tab.id}`}
          className="edge-panel"
        >
          <p>{tab.notes}</p>
          {tab.blocks.map((block) => (
            <figure key={block.title}>
              <figcaption>{block.title}</figcaption>
              <pre className="iv-article__pre">
                <code>{block.code}</code>
              </pre>
            </figure>
          ))}
        </div>
      </section>

      <section id="edge-mixups" aria-labelledby="edge-mixups-title">
        <h3 id="edge-mixups-title">What goes wrong when the order is wrong</h3>
        <ul className="edge-mixups">
          <li>
            <strong>WAF behind the app.</strong> The exploit has already taken a database connection
            by the time something rejects it.
          </li>
          <li>
            <strong>Gateway with no balancer in front of its replicas.</strong> One dead Kong process
            black-holes the callers aimed at it. Managed gateways hide this hop; self-hosted ones
            cannot.
          </li>
          <li>
            <strong>Load balancer used as a gateway.</strong> Every service parses <code>Authorization</code>{' '}
            its own way, and quotas drift per team.
          </li>
          <li>
            <strong>Gateway used as a WAF.</strong> It will reject a missing token and still accept a
            well-formed token carrying a SQL payload, and you pay gateway CPU for the scanners.
          </li>
          <li>
            <strong>Public access to the task.</strong> Callers skip the WAF and forge{' '}
            <code>X-Consumer-Username</code>. Close the app port to the gateway or balancer security
            group only.
          </li>
          <li>
            <strong>All three, by default.</strong> Each hop adds latency and a bill. A server-rendered
            site with two tasks wants a WAF and a load balancer, and does not want an API product in
            the middle.
          </li>
          <li>
            <strong>Private tasks with no NAT and no VPC endpoints.</strong> Image pulls, OS patches,
            and SaaS callbacks fail until someone “fixes” it by giving the task a public IP — which
            opens the inbound door you just closed.
          </li>
          <li>
            <strong>NAT used as an inbound front door.</strong> A NAT does not accept new connections
            from the internet. Browsers still need the WAF and the balancer or gateway. The NAT is
            only for traffic that starts inside the private subnet.
          </li>
        </ul>
      </section>

      <section aria-labelledby="edge-read-title">
        <h3 id="edge-read-title">Further reading</h3>
        <ul className="edge-refs">
          <li>
            <a href="https://coraza.io/" target="_blank" rel="noopener noreferrer">
              Coraza
            </a>
            <span>OWASP WAF engine, library and proxy</span>
          </li>
          <li>
            <a href="https://owasp.org/www-project-modsecurity-core-rule-set/" target="_blank" rel="noopener noreferrer">
              OWASP CRS
            </a>
            <span>Rule set used by ModSecurity and Coraza</span>
          </li>
          <li>
            <a href="https://www.haproxy.org/documentation/" target="_blank" rel="noopener noreferrer">
              HAProxy
            </a>
            <span>Active HTTP checks and leastconn</span>
          </li>
          <li>
            <a href="https://nginx.org/en/docs/http/ngx_http_realip_module.html" target="_blank" rel="noopener noreferrer">
              nginx realip
            </a>
            <span>Which proxy is allowed to set the client address</span>
          </li>
          <li>
            <a href="https://docs.konghq.com/gateway/latest/" target="_blank" rel="noopener noreferrer">
              Kong Gateway
            </a>
            <span>Services, routes, consumers, plugins</span>
          </li>
          <li>
            <a href="https://docs.aws.amazon.com/waf/latest/developerguide/how-aws-waf-works.html" target="_blank" rel="noopener noreferrer">
              AWS WAF
            </a>
            <span>Web ACLs on CloudFront, ALB, and API Gateway</span>
          </li>
          <li>
            <a href="https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html" target="_blank" rel="noopener noreferrer">
              AWS NAT Gateway
            </a>
            <span>Private subnet egress through a public NAT — not an inbound front door</span>
          </li>
          <li>
            <a href="https://kubernetes.io/docs/concepts/services-networking/gateway/" target="_blank" rel="noopener noreferrer">
              Kubernetes Gateway API
            </a>
            <span>Routing configuration, not an API product by itself</span>
          </li>
          <li>
            <a href="https://netflixtechblog.com/open-sourcing-zuul-2-82ea476cb2b3" target="_blank" rel="noopener noreferrer">
              Zuul 2 at Netflix
            </a>
            <span>Gateway fleet in front of origin clusters</span>
          </li>
          <li>
            <a href="https://eng.lyft.com/announcing-envoy-c-l7-proxy-and-communication-bus-92520b6c8191" target="_blank" rel="noopener noreferrer">
              Envoy at Lyft
            </a>
            <span>Edge proxy behind AWS elastic load balancers</span>
          </li>
          <li>
            <a href="https://slack.engineering/slacks-migration-to-a-cellular-architecture/" target="_blank" rel="noopener noreferrer">
              Slack cellular architecture
            </a>
            <span>Envoy weights drain an availability zone</span>
          </li>
          <li>
            <a href="https://www.cloudflare.com/case-studies/shopify/" target="_blank" rel="noopener noreferrer">
              Shopify on Cloudflare
            </a>
            <span>WAF, bots, and DDoS on a storefront edge</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
