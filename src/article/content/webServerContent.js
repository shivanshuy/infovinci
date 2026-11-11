const aiAgentContent = {
    header: "Introduction to Web Server",
    text: `A web server is a combination of software and hardware that delivers web content to users over the internet. It plays a crucial role in hosting and serving websites by storing, processing, and delivering web pages, images, videos, and other data to clients, typically web browsers, using the Hypertext Transfer Protocol (HTTP) or its secure variant HTTPS.`,
    contents: [
        {
            type: "image",
            src: "./web-server.png"
        },
        {
            type: "header",
            text: "Usage statistics and market shares of web servers"
        },
        {
            type: "text",
            text: `Nginx leads the market with a significant share, followed by Apache and Cloudflare Server.`
        },
        {
            type: "image",
            src: "./web-server-share.png"
        },
        {
            type: "header",
            text: "NGINX Process Architecture"
        },
        {
            type: "text",
            text: `NGINX has a master process (which performs the privileged operations such as reading configuration and binding to ports) and a number of worker and helper processes. On four‑core server, the NGINX master process creates four worker processes and a couple of cache helper processes which manage the on‑disk content cache.`
        },
        {
            type: "image",
            src: "./ngnix-arch.png"
        },
        {
            type: "code",
            code: `NGINX uses a predictable process model that is tuned to the available hardware resources:

- The master process performs the privileged operations such as reading configuration and binding to ports, and then creates a small number of child processes (the next three types).
- The cache loader process runs at startup to load the disk‑based cache into memory, and then exits. It is scheduled conservatively, so its resource demands are low.
- The cache manager process runs periodically and prunes entries from the disk caches to keep them within the configured sizes.
- The worker processes do all of the work! They handle network connections, read and write content to disk, and communicate with upstream servers.
`
        },
        {
            type: "header",
            text: "NGINX as Reverse Proxy"
        },
        {
            type: "text",
            text: `A reverse proxy is a server that sits in front of one or more web servers, acting as an intermediary between clients (like web browsers) and the servers. It intercepts requests from clients, forwards them to the appropriate server, and then returns the response to the client, appearing as if it originated from the proxy itself.
            By utilizing Nginx as a reverse proxy, you can avoid CORS issues altogether. Nginx can act as a reverse proxy for your API, which means it will forward requests from clients to your API and then return the response to the client. This way, the client only communicates with Nginx, and Nginx communicates with the API.`
        },
        {
            type: "image",
            src: "./ngnix-reverse.png"
        },
        {
            type: "header",
            text: "Forward vs Reverse Proxy"
        },
        {
            type: "text",
            text: `A forward proxy is a type of proxy server that operates on behalf of the client. It is the designated exit point for subnet users seeking to connect with resources outside their private network. In contrast, a reverse proxy server is the entry point for external systems to access resources within a private subnet. A reverse proxy is a server that sits between client devices (such as web browsers) and web servers, acting as an intermediary. Unlike a forward proxy, which handles client requests and forwards them to the internet, a reverse proxy handles client requests by forwarding them to one or more back-end servers.`
        },
        {
            type: "image",
            src: "./fp-vs-rp.png"
        },
        {
            type: "reference",
            href: "https://blog.nginx.org/blog/inside-nginx-how-we-designed-for-performance-scale",
            text: "inside-nginx-how-we-designed-for-performance-scale"
        },
        {
            type: "reference",
            href: "https://nginxblog-8de1046ff5a84f2c-endpoint.azureedge.net/blobnginxbloga72cde487e/wp-content/uploads/2024/12/150427_NGINX_Architecture_IG_CMYK.pdf",
            text: "_NGINX_Architecture_IG_CMYK.pd"
        },
        {
            type: "reference",
            href: "https://w3techs.com/technologies/overview/web_server",
            text: "web_servers_share"
        }
    ]
}
export default aiAgentContent;