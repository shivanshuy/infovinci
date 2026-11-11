export type SnippetTab = {
  id: string
  label: string
  notes: string
  blocks: { title: string; code: string }[]
}

export const SNIPPET_TABS: SnippetTab[] = [
  {
    id: 'lb',
    label: 'Load balancer',
    notes:
      'HAProxy actively probes /healthz and skips a dead process. nginx open source only notices a dead server after a real request fails, so the health check below is HAProxy on purpose. The nginx block is the header contract between that balancer and the app.',
    blocks: [
      {
        title: 'HAProxy — least connections, active health checks',
        code: `frontend https_in
    bind :443 ssl crt /etc/haproxy/site.pem
    default_backend app

backend app
    balance leastconn
    option httpchk GET /healthz
    http-check expect status 200
    server app1 10.0.1.11:8080 check
    server app2 10.0.1.12:8080 check
    server app3 10.0.1.13:8080 check`,
      },
      {
        title: 'nginx on the app — trust the balancer, preserve the client',
        code: `# Trust the load balancer subnet only. A client who can hit
# this port directly could forge X-Forwarded-For.
set_real_ip_from 10.0.0.0/8;
real_ip_header X-Forwarded-For;
real_ip_recursive on;

upstream app {
    least_conn;
    server 10.0.1.11:8080;
    server 10.0.1.12:8080;
    keepalive 32;
}

server {
    listen 8080;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }
}`,
      },
    ],
  },
  {
    id: 'waf',
    label: 'WAF',
    notes:
      'The ModSecurity rule is a local rule (id 1001) meant to load after the OWASP Core Rule Set. The JSON is one AWS WAFv2 rule in a Web ACL. Both block a SQL-injection pattern in the query string. Free-text search will false-positive; exclude that path instead of disabling the WAF.',
    blocks: [
      {
        title: 'ModSecurity / Coraza — custom rule after CRS',
        code: `# /etc/modsecurity.d/custom/sqli.conf
# Included after the CRS setup file, before CRS rules finish.
SecRule ARGS "@detectSQLi" \\
    "id:1001,phase:2,deny,status:403,log,\\
    msg:'SQL injection in parameters',tag:'edge-stack'"`,
      },
      {
        title: 'AWS WAFv2 — one managed-style rule',
        code: `{
  "Name": "BlockSQLiQueryString",
  "Priority": 10,
  "Action": { "Block": {} },
  "Statement": {
    "SqliMatchStatement": {
      "FieldToMatch": { "QueryString": {} },
      "TextTransformations": [
        { "Priority": 0, "Type": "URL_DECODE" },
        { "Priority": 1, "Type": "HTML_ENTITY_DECODE" }
      ]
    }
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "BlockSQLiQueryString"
  }
}`,
      },
    ],
  },
  {
    id: 'gw',
    label: 'API gateway',
    notes:
      'Kong, in DB-less mode, checks the key and the quota before the request reaches the service. The service still decides whether this caller may touch this particular order. Trust X-Consumer-Username only from the gateway network.',
    blocks: [
      {
        title: 'Kong declarative config — key and per-consumer limit',
        code: `_format_version: "3.0"

services:
  - name: orders
    url: http://orders.internal:8080
    routes:
      - name: orders-v1
        paths:
          - /v1/orders

consumers:
  - username: partner-app
    keyauth_credentials:
      - key: dev-key-change-me

plugins:
  - name: key-auth
    service: orders
    config:
      key_names:
        - apikey
  - name: rate-limiting
    service: orders
    config:
      minute: 120
      policy: local
      limit_by: consumer`,
      },
      {
        title: 'Service — authentication already happened, authorization did not',
        code: `// The gateway rejected a missing key and counted the quota.
// This handler still has to decide whether THIS caller may
// read THIS order. A gateway cannot know your ownership rules.
//
// Trust X-Consumer-Username only when the security group
// allows this port from the gateway, not from the internet.

app.get('/v1/orders/:id', (req, res) => {
  const caller = req.get('x-consumer-username')
  const order = orders.get(req.params.id)
  if (!caller || !order || order.owner !== caller) {
    return res.status(403).end()
  }
  res.json(order)
})`,
      },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud wiring',
    notes:
      'A sketch of which resource points at which. It is not a module to apply. A CloudFront Web ACL uses scope CLOUDFRONT. An API Gateway Web ACL uses scope REGIONAL. They cannot be the same ACL.',
    blocks: [
      {
        title: 'Website — WAF on the CDN, CDN origin is the load balancer',
        code: `# Scope of aws_wafv2_web_acl.cdn must be CLOUDFRONT.
resource "aws_cloudfront_distribution" "site" {
  enabled     = true
  web_acl_id  = aws_wafv2_web_acl.cdn.arn

  origin {
    origin_id   = "alb"
    domain_name = aws_lb.public.dns_name

    custom_origin_config {
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      http_port              = 80
      https_port             = 443
    }
  }

  # default_cache_behavior, viewer_certificate, restrictions
  # omitted — wire the origin above to the public ALB only.
}`,
      },
      {
        title: 'API — regional WAF on the stage, tasks stay private',
        code: `# Scope of aws_wafv2_web_acl.api must be REGIONAL.
# The HTTP API integrates through a VPC link to an internal NLB.
# Application tasks have no public address.

resource "aws_wafv2_web_acl_association" "api" {
  resource_arn = aws_apigatewayv2_stage.v1.arn
  web_acl_arn  = aws_wafv2_web_acl.api.arn
}

# aws_apigatewayv2_integration.orders.connection_type = "VPC_LINK"
# aws_apigatewayv2_integration.orders.connection_id   = aws_apigatewayv2_vpc_link.internal.id
# vpc link target: aws_lb.internal_nlb (private subnets)`,
      },
    ],
  },
]
