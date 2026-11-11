const aiAgentContent = {
    header: "Model Context Protocol",
    text: `MCP is an open protocol that standardizes how applications provide context to LLMs. MCP provides a standardized way to connect AI models to different data sources and tools.`,
    contents: [
        {
            type: "header",
            text: "Components of MCP"
        },
        {
            type: "text",
            text: `It consists of four components: MCP Host, MCP Client and MCP Server, Data Sources.`
        },
        {
            type: "subHeader",
            text: "MCP Host"
        },
        {
            type: "text",
            text: `LLM application (such as Cursor) that manages connections.`
        },
        {
            type: "subHeader",
            text: "MCP Client"
        },
        {
            type: "text",
            text: `Maintains 1:1 connections with MCP servers. When a client connects to a server, it sends an initialize message, with information about what protocol version it supports. The server responds in kind.
From there, the client can ask the server about what features it has.`
        },
        {
            type: "subHeader",
            text: "MCP Server"
        },
        {
            type: "text",
            text: `Provides context, tools, and capabilities to the LLMs. MCP describes three different kinds of features that a server can provide: Prompts, Resources, and Tools.`
        },
        {
            type: "subHeader",
            text: "Data Sources"
        },
        {
            type: "text",
            text: `The actual sources of data. These can be databases, APIs, or other services.`
        },
        {
            type: "image",
            src: "./mcp.png"
        },
        {
            type: "reference",
            href: "https://nshipster.com/model-context-protocol",
            text: "model-context-protocol"
        },
        {
            type: "reference",
            href: "https://modelcontextprotocol.io/introduction",
            text: "modelcontextprotocol-io-introduction"
        }
    ]
}
export default aiAgentContent;