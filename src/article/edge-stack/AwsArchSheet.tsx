import { useId } from 'react'

const PURPLE = '#7B4BB8'
const ORANGE = '#E87722'
const GREEN = '#2F7D32'
const BUCKET = '#3E8F45'
const MAIL = '#D6455D'
const INK = 'var(--fg)'

function Glyph({ kind }: { kind: string }) {
  if (kind === 'r53') {
    return (
      <text x="22" y="28" textAnchor="middle" fill="#fff" fontSize="14" fontFamily="Outfit, sans-serif" fontWeight="700">
        53
      </text>
    )
  }
  if (kind === 'elb') {
    return (
      <g fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
        <path d="M14 22h16" />
        <path d="M16 16l-4 6 4 6" />
        <path d="M28 16l4 6-4 6" />
      </g>
    )
  }
  if (kind === 'ec2') {
    return (
      <g fill="none" stroke="#fff" strokeWidth="1.6">
        <rect x="13" y="12" width="18" height="14" rx="1.5" />
        <path d="M16 30h12M19 32v3M25 32v3M19 35h6" />
      </g>
    )
  }
  if (kind === 'cache') {
    return (
      <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
        <path d="M14 16h16M14 22h16M14 28h16" />
      </g>
    )
  }
  if (kind === 'rds') {
    return (
      <g fill="none" stroke="#fff" strokeWidth="1.6">
        <ellipse cx="22" cy="15" rx="8" ry="3.2" />
        <path d="M14 15v12c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V15" />
      </g>
    )
  }
  if (kind === 'cf') {
    return (
      <path
        fill="#fff"
        d="M16 28h14a5 5 0 0 0 .4-10 6.2 6.2 0 0 0-11.8-1.6A4.2 4.2 0 0 0 16 28z"
      />
    )
  }
  if (kind === 's3') {
    return (
      <g fill="none" stroke="#fff" strokeWidth="1.6">
        <path d="M15 16h14l-2 16H17z" />
        <path d="M17 21h10" />
      </g>
    )
  }
  if (kind === 'waf') {
    return (
      <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M22 12l9 4v7c0 6-4 10-9 12-5-2-9-6-9-12v-7z" />
        <path d="M18 23l3 3 6-7" />
      </g>
    )
  }
  if (kind === 'gw') {
    return (
      <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
        <rect x="14" y="18" width="16" height="12" rx="1.5" />
        <path d="M17 18v-3a5 5 0 0 1 10 0v3" />
      </g>
    )
  }
  if (kind === 'nat') {
    return (
      <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 28h16M22 28V16" />
        <path d="M16 20l6-6 6 6" />
        <path d="M18 28v4h8v-4" />
      </g>
    )
  }
  return (
    <g fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round">
      <rect x="12" y="16" width="20" height="13" rx="1.5" />
      <path d="M12 18l10 7 10-7" />
    </g>
  )
}

function Svc({
  x,
  y,
  fill,
  label,
  kind,
}: {
  x: number | string
  y: number | string
  fill: string
  label: string
  kind: string
}) {
  const lines = label.split('\n')
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="44" height="44" rx="5" fill={fill} />
      <Glyph kind={kind} />
      <text className="edge-arch__label" textAnchor="middle" x="22" y="60">
        {lines.map((line, index) => (
          <tspan key={line} x="22" dy={index === 0 ? 0 : 13}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

function Pill({ x, y, w, text }: { x: number | string; y: number | string; w: number | string; text: string }) {
  const nx = Number(x)
  const ny = Number(y)
  const nw = Number(w)
  return (
    <g>
      <rect x={nx} y={ny} width={nw} height="26" rx="3" fill={GREEN} />
      <text className="edge-arch__pill" x={nx + nw / 2} y={ny + 17} textAnchor="middle">
        {text}
      </text>
    </g>
  )
}

export function AwsArchSheet() {
  const raw = useId().replace(/:/g, '')
  const arrow = `${raw}-arrow`

  return (
    <figure className="edge-arch-fig">
      <figcaption>
        <strong>Highly available web application</strong>
        <span>
          Route 53, then the WAF, then the load balancer, then a zone of EC2. CloudFront and S3
          stay on static files. SES stays on mail. On this website the load balancer is the hop
          after the WAF. The API gateway is the dashed hop, and it is not on the page path.
          A managed API puts the gateway first: WAF, then API Gateway, then an internal load
          balancer. A gateway you run yourself (Kong, APISIX) is a fleet, so the load balancer
          stays in front of it: WAF, then the load balancer, then the gateway. EC2 stays private;
          each AZ has a NAT gateway for outbound calls — not on the browser path.
        </span>
      </figcaption>
      <div className="edge-arch-scroll">
        <svg className="edge-arch" viewBox="0 0 1120 760" role="img" aria-labelledby={`${raw}-title`}>
          <title id={`${raw}-title`}>AWS architecture diagram of a highly available web application</title>
          <defs>
            <marker id={arrow} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0 0 L7 3 L0 6 Z" fill={INK} />
            </marker>
          </defs>

          <rect className="edge-arch__cloud" x="8" y="8" width="1104" height="744" rx="6" />
          <text className="edge-arch__cloud-label" x="24" y="28">
            AWS Cloud
          </text>

          <Pill x="70" y="48" w="150" text="Manage domain" />
          <Pill x="400" y="36" w="170" text="Application access" />
          <Pill x="720" y="36" w="130" text="Mail delivery" />
          <Pill x="930" y="36" w="140" text="Static content" />

          <Svc x="118" y="100" fill={PURPLE} kind="r53" label={'Amazon\nRoute 53'} />
          <Svc x="250" y="148" fill={PURPLE} kind="gw" label={'API Gateway\nAPI path only'} />
          <Svc x="463" y="88" fill="#C44536" kind="waf" label={'AWS WAF\non the ALB'} />
          <Svc x="748" y="96" fill={MAIL} kind="mail" label={'Amazon\nSES'} />
          <Svc x="978" y="96" fill={PURPLE} kind="cf" label={'Amazon\nCloudFront'} />
          <Svc x="978" y="360" fill={BUCKET} kind="s3" label={'Amazon\nS3'} />

          <rect className="edge-arch__vpc" x="48" y="230" width="860" height="490" rx="4" />
          <text className="edge-arch__vpc-label" x="64" y="252">
            Virtual private cloud
          </text>

          <Svc x="468" y="268" fill={PURPLE} kind="elb" label={'Load balancer\nALB'} />

          <rect className="edge-arch__az" x="70" y="390" width="390" height="300" rx="3" />
          <text className="edge-arch__az-label" x="86" y="412">
            Availability Zone A
          </text>
          <rect className="edge-arch__az" x="490" y="390" width="390" height="300" rx="3" />
          <text className="edge-arch__az-label" x="506" y="412">
            Availability Zone B
          </text>

          <Svc x="150" y="430" fill={ORANGE} kind="ec2" label="EC2" />
          <Svc x="280" y="430" fill={GREEN} kind="nat" label={'NAT\ngateway'} />
          <Svc x="620" y="430" fill={ORANGE} kind="ec2" label="EC2" />
          <Svc x="760" y="430" fill={GREEN} kind="nat" label={'NAT\ngateway'} />
          <Svc x="110" y="560" fill={PURPLE} kind="cache" label={'ElastiCache\nnode'} />
          <Svc x="250" y="560" fill={PURPLE} kind="rds" label={'Amazon\nRDS'} />
          <Svc x="560" y="560" fill={PURPLE} kind="rds" label={'Amazon\nRDS'} />
          <Svc x="740" y="560" fill={PURPLE} kind="cache" label={'ElastiCache\nnode'} />

          <g className="edge-arch__lines" markerEnd={`url(#${arrow})`}>
            <line x1="485" y1="62" x2="485" y2="88" />
            <line x1="162" y1="140" x2="463" y2="118" />
            <line x1="485" y1="175" x2="490" y2="268" />
            <line x1="490" y1="312" x2="194" y2="430" />
            <line x1="512" y1="312" x2="642" y2="430" />
            <line x1="194" y1="452" x2="280" y2="452" />
            <line x1="664" y1="452" x2="760" y2="452" />
            <line x1="172" y1="474" x2="140" y2="560" />
            <line x1="194" y1="474" x2="272" y2="560" />
            <line x1="642" y1="474" x2="590" y2="560" />
            <line x1="664" y1="474" x2="762" y2="560" />
            <line x1="1000" y1="168" x2="1000" y2="360" />
          </g>
          <path
            className="edge-arch__dash"
            d="M463 118 L 306 170 L 468 286"
            markerEnd={`url(#${arrow})`}
          />
          <text className="edge-arch__hint" x="508" y="230">
            Website: balancer next
          </text>
          <text className="edge-arch__hint" x="64" y="278">
            Managed API: gateway first
          </text>
          <path
            className="edge-arch__dash"
            d="M770 150 C 790 280, 700 360, 664 430"
            markerEnd={`url(#${arrow})`}
          />

          <g>
            <rect className="edge-arch__repl" x="360" y="648" width="250" height="22" rx="3" />
            <text className="edge-arch__repl-text" x="485" y="663" textAnchor="middle">
              Replication
            </text>
            <line className="edge-arch__repl-line" x1="294" y1="640" x2="360" y2="659" />
            <line className="edge-arch__repl-line" x1="604" y1="640" x2="610" y2="659" />
          </g>
        </svg>
      </div>
    </figure>
  )
}

export function AwsApiSheet() {
  const raw = useId().replace(/:/g, '')
  const arrow = `${raw}-arrow`

  return (
    <figure className="edge-arch-fig">
      <figcaption>
        <strong>HTTP API on AWS</strong>
        <span>
          Same drawing language, different front door. The WAF is on the API stage. API Gateway is
          the public hop. The load balancer is an internal NLB, and the tasks stay in private
          subnets. Each AZ also holds a NAT for task egress — partners never call it. A Lambda
          integration would stop at the gateway and skip the NLB.
        </span>
      </figcaption>
      <div className="edge-arch-scroll">
        <svg className="edge-arch edge-arch--api" viewBox="0 0 1120 640" role="img" aria-labelledby={`${raw}-title`}>
          <title id={`${raw}-title`}>AWS architecture diagram of an HTTP API</title>
          <defs>
            <marker id={arrow} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0 0 L7 3 L0 6 Z" fill={INK} />
            </marker>
          </defs>
          <rect className="edge-arch__cloud" x="8" y="8" width="1104" height="624" rx="6" />
          <text className="edge-arch__cloud-label" x="24" y="28">
            AWS Cloud
          </text>

          <Pill x="80" y="48" w="150" text="Manage domain" />
          <Pill x="420" y="36" w="160" text="API clients" />

          <Svc x="130" y="100" fill={PURPLE} kind="r53" label={'Amazon\nRoute 53'} />
          <Svc x="430" y="110" fill="#C44536" kind="waf" label={'AWS WAF\nregional'} />
          <Svc x="620" y="110" fill={PURPLE} kind="gw" label={'API Gateway\nHTTP API'} />

          <rect className="edge-arch__vpc" x="80" y="250" width="960" height="350" rx="4" />
          <text className="edge-arch__vpc-label" x="96" y="272">
            Virtual private cloud · private services + public NAT
          </text>

          <Svc x="500" y="290" fill={PURPLE} kind="elb" label={'Internal\nNLB'} />

          <rect className="edge-arch__az" x="110" y="400" width="420" height="170" rx="3" />
          <text className="edge-arch__az-label" x="126" y="422">
            Availability Zone A
          </text>
          <rect className="edge-arch__az" x="560" y="400" width="420" height="170" rx="3" />
          <text className="edge-arch__az-label" x="576" y="422">
            Availability Zone B
          </text>

          <Svc x="160" y="450" fill={ORANGE} kind="ec2" label={'ECS\norders'} />
          <Svc x="320" y="450" fill={GREEN} kind="nat" label={'NAT\ngateway'} />
          <Svc x="630" y="450" fill={ORANGE} kind="ec2" label={'ECS\norders'} />
          <Svc x="800" y="450" fill={GREEN} kind="nat" label={'NAT\ngateway'} />

          <g className="edge-arch__lines" markerEnd={`url(#${arrow})`}>
            <line x1="500" y1="62" x2="452" y2="110" />
            <line x1="174" y1="144" x2="430" y2="140" />
            <line x1="474" y1="154" x2="620" y2="140" />
            <line x1="642" y1="182" x2="544" y2="290" />
            <line x1="522" y1="362" x2="204" y2="450" />
            <line x1="544" y1="362" x2="674" y2="450" />
            <line x1="204" y1="472" x2="320" y2="472" />
            <line x1="674" y1="472" x2="800" y2="472" />
          </g>
        </svg>
      </div>
    </figure>
  )
}
