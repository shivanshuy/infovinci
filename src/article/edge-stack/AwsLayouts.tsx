function Mark({ abbr }: { abbr: string }) {
  return (
    <span className="edge-aws-mark" aria-hidden="true">
      {abbr}
    </span>
  )
}

function Tile({ abbr, name, note }: { abbr: string; name: string; note: string }) {
  return (
    <div className="edge-aws-tile">
      <Mark abbr={abbr} />
      <span>
        <strong>{name}</strong>
        <em>{note}</em>
      </span>
    </div>
  )
}

function Az({
  name,
  publicTiles,
  privateTiles,
}: {
  name: string
  publicTiles: { abbr: string; name: string; note: string }[]
  privateTiles: { abbr: string; name: string; note: string }[]
}) {
  return (
    <div className="edge-aws-az">
      <span className="edge-kicker">{name}</span>
      {publicTiles.length > 0 && (
        <div className="edge-aws-sub edge-aws-sub--pub">
          <span className="edge-kicker">Public subnet</span>
          {publicTiles.map((tile) => (
            <Tile key={`${name}-${tile.name}-${tile.note}`} {...tile} />
          ))}
        </div>
      )}
      <div className="edge-aws-sub edge-aws-sub--priv">
        <span className="edge-kicker">Private subnet</span>
        {privateTiles.map((tile) => (
          <Tile key={`${name}-${tile.name}-${tile.note}`} {...tile} />
        ))}
      </div>
    </div>
  )
}

export function AwsLayouts() {
  return (
    <div className="edge-aws-deck">
      <figure className="edge-aws">
        <figcaption>
          <strong>Website · CloudFront, WAF, ALB</strong>
          <span>
            Two availability zones. The load balancer is the only public origin. There is no API
            gateway.
          </span>
        </figcaption>
        <div className="edge-aws-region">
          <span className="edge-aws-bound">Region · us-east-1</span>
          <div className="edge-aws-flow" aria-label="Edge path">
            <Tile abbr="R53" name="Route 53" note="Alias to the distribution" />
            <span className="edge-aws-arrow" aria-hidden="true">
              →
            </span>
            <Tile abbr="CF" name="CloudFront" note="TLS from the browser ends here" />
            <span className="edge-aws-arrow" aria-hidden="true">
              →
            </span>
            <Tile abbr="WAF" name="AWS WAF" note="Scope CLOUDFRONT, on the viewer request" />
          </div>
          <p className="edge-aws-down" aria-hidden="true">
            ↓ origin is the load balancer, HTTPS only
          </p>
          <div className="edge-aws-vpc">
            <span className="edge-aws-bound">VPC · 10.0.0.0/16</span>
            <div className="edge-aws-azs">
              <Az
                name="AZ us-east-1a"
                publicTiles={[
                  { abbr: 'ALB', name: 'ALB node', note: 'One balancer, a node in each AZ' },
                  { abbr: 'NAT', name: 'NAT gateway', note: 'Egress only. Tasks have no public IP' },
                ]}
                privateTiles={[
                  { abbr: 'ECS', name: 'App task', note: 'Security group allows the ALB only' },
                  { abbr: 'ECS', name: 'App task', note: 'Target group checks /healthz' },
                ]}
              />
              <Az
                name="AZ us-east-1b"
                publicTiles={[
                  { abbr: 'ALB', name: 'ALB node', note: 'Same target group as AZ a' },
                  { abbr: 'NAT', name: 'NAT gateway', note: 'One per AZ, so egress survives a zone loss' },
                ]}
                privateTiles={[
                  { abbr: 'ECS', name: 'App task', note: 'Private address' },
                  { abbr: 'ECS', name: 'App task', note: 'Same service, other zone' },
                ]}
              />
            </div>
          </div>
        </div>
      </figure>

      <figure className="edge-aws">
        <figcaption>
          <strong>HTTP API · WAF, API Gateway, internal NLB</strong>
          <span>
            The gateway is the public front door. Your load balancer starts inside the VPC, in front
            of tasks. NAT sits in a public subnet for egress only — partners never hit it.
          </span>
        </figcaption>
        <div className="edge-aws-region">
          <span className="edge-aws-bound">Region · us-east-1</span>
          <div className="edge-aws-flow" aria-label="API edge path">
            <Tile abbr="R53" name="Route 53" note="Alias to the regional API hostname" />
            <span className="edge-aws-arrow" aria-hidden="true">
              →
            </span>
            <Tile abbr="WAF" name="AWS WAF" note="Scope REGIONAL, on the API stage" />
            <span className="edge-aws-arrow" aria-hidden="true">
              →
            </span>
            <Tile abbr="API" name="API Gateway" note="JWT or key, quota, route" />
          </div>
          <p className="edge-aws-down" aria-hidden="true">
            ↓ VPC Link. A Lambda integration would skip the NLB
          </p>
          <div className="edge-aws-vpc">
            <span className="edge-aws-bound">VPC · private services + public NAT</span>
            <div className="edge-aws-azs">
              <Az
                name="AZ us-east-1a"
                publicTiles={[
                  { abbr: 'NAT', name: 'NAT gateway', note: 'Egress for Orders. Not on the partner path' },
                ]}
                privateTiles={[
                  { abbr: 'NLB', name: 'Internal NLB', note: 'No public listener' },
                  { abbr: 'ECS', name: 'Orders', note: 'Checks ownership, not the API key' },
                ]}
              />
              <Az
                name="AZ us-east-1b"
                publicTiles={[
                  { abbr: 'NAT', name: 'NAT gateway', note: 'One per AZ so egress survives a zone loss' },
                ]}
                privateTiles={[
                  { abbr: 'NLB', name: 'Internal NLB', note: 'Same target group' },
                  { abbr: 'ECS', name: 'Orders', note: 'Other zone, same route' },
                ]}
              />
            </div>
          </div>
        </div>
      </figure>

      <figure className="edge-aws">
        <figcaption>
          <strong>Edge proxy fleet · NLB in front of Zuul or Envoy</strong>
          <span>
            The cloud load balancer is L4. TLS and API policy end on the proxy fleet, which is
            itself a target group. Origins stay private; NAT covers their outbound calls.
          </span>
        </figcaption>
        <div className="edge-aws-region">
          <span className="edge-aws-bound">Region · us-east-1</span>
          <div className="edge-aws-flow" aria-label="Proxy fleet path">
            <Tile abbr="R53" name="Route 53" note="Alias to the NLB" />
            <span className="edge-aws-arrow" aria-hidden="true">
              →
            </span>
            <Tile abbr="NLB" name="Network LB" note="TCP across the proxy fleet. Not a WAF" />
            <span className="edge-aws-arrow" aria-hidden="true">
              →
            </span>
            <Tile abbr="TLS" name="Proxy fleet" note="Zuul or Envoy terminates TLS" />
          </div>
          <p className="edge-aws-down" aria-hidden="true">
            ↓ the proxy’s own balancer picks the origin
          </p>
          <div className="edge-aws-vpc">
            <span className="edge-aws-bound">VPC · proxy and apps stay private</span>
            <div className="edge-aws-azs">
              <Az
                name="AZ us-east-1a"
                publicTiles={[
                  { abbr: 'NLB', name: 'NLB node', note: 'Public. Forwards TCP only' },
                  { abbr: 'NAT', name: 'NAT gateway', note: 'Origin egress. Not on the user path' },
                ]}
                privateTiles={[
                  { abbr: 'GW', name: 'Zuul or Envoy', note: 'Auth, route, shed load' },
                  { abbr: 'EC2', name: 'Origin', note: 'Accepts the proxy security group only' },
                ]}
              />
              <Az
                name="AZ us-east-1b"
                publicTiles={[
                  { abbr: 'NLB', name: 'NLB node', note: 'Same balancer' },
                  { abbr: 'NAT', name: 'NAT gateway', note: 'One per AZ' },
                ]}
                privateTiles={[
                  { abbr: 'GW', name: 'Zuul or Envoy', note: 'Other replica' },
                  { abbr: 'EC2', name: 'Origin', note: 'Chosen by Ribbon or Envoy, not by the NLB' },
                ]}
              />
            </div>
          </div>
        </div>
      </figure>
    </div>
  )
}
