const aiAgentContent = {
    header: "CAP Theorem: Why You Can't Have It All",
    text: `The CAP theorem says that a distributed system can deliver only two of three desired characteristics:
consistency, availability and partition tolerance (the "C," "A" and "P" in CAP).
The CAP theorem is also called Brewer’s Theorem, because it was first advanced by Professor Eric A. Brewer during a talk he gave on distributed computing in 2000. Two years later, MIT professors Seth Gilbert and Nancy Lynch published a proof of “Brewer’s Conjecture.”`,
    contents: [
        {
            type: "image",
            src: "./cap.png"
        },
        {
            type: "header",
            text: "Consistentcy"
        },
        {
            type: "text",
            text: `Every read request receives the most recent write or an error when consistency can’t be guaranteed. I n oter words data should be always uptodate on all nodes.`
        },
        {
            type: "header",
            text: "Availability"
        },
        {
            type: "text",
            text: `Every request receives a non-error response, even when nodes are down or unavailable.`
        },
        {
          type: "header",
          text: "Partition tolerance"
        },
        {
            type: "text",
            text: `The system continues to operate despite the loss of an arbitrary number of messages between nodes.
            A network partition occurs when a failure in the communication links within a distributed system results in the network splitting into two or more separate subnetworks.`
        },
        {
            type: "header",
            text: "Summary"
        },
        {
          type: "text",
          text: `Most distributed systems have to tolerate network failures, and thus, network partitioning has to be allowed. This means that these workloads have to make a choice between consistency and availability when a network partition occurs. If the workload chooses availability, then it always returns a response, but with potentially inconsistent data. If it chooses consistency, then during a network partition it would return an error since the workload can’t be sure about the consistency of the data.`
        },
        {
          type: "image",
          src: "./network-partition.jpg"
        },
        {
            type: "image",
            src: "./cap-2.png"
        },
        {
          type: "header",
          text: "CAP theorem trade-offs"
        },
        {
          type: "text",
          text: `The CAP theorem has three system configurations: CP, AP, and CA.`
        },
        {
            type: "subHeader",
            text: "CP Systems (Consistency and Partition Tolerance)"
        },
        {
            type: "text",
            text: `CP systems prioritize Consistency and Partition Tolerance over Availability. In these systems, when a network partition occurs, they choose to maintain strong consistency even if it means sacrificing availability temporarily. This means that during a partition, updates to the system may be blocked until consistency is achieved or the partition is resolved.
            CP systems are typically used in scenarios where data consistency is crucial, such as financial applications or systems that require strict synchronization. They are willing to sacrifice availability during network partitions to ensure that all nodes have the same consistent view of the data.`
        },
        {
          type: "subHeader",
          text: "AP Systems (Availability and Partition Tolerance)"
        },
        {
          type: "text",
          text: `AP systems prioritize Availability and Partition Tolerance over strong Consistency. These systems choose to remain available and provide responses to user requests even during network partitions, accepting that different nodes may have temporarily inconsistent views of the data.
          AP systems are often used in scenarios where high availability is essential, such as real-time collaboration applications or content delivery networks (CDNs). They prioritize providing a responsive service even if it means accepting eventual consistency and allowing temporary inconsistencies across nodes.`
        },
        {
          type: "subHeader",
          text: "CA Systems (Consistency and Availability)"
        },
        {
          type: "text",
          text: `CA systems aim to achieve both Consistency and Availability, but they sacrifice Partition Tolerance. In other words, they prioritize maintaining a consistent view of the data and providing responses to user requests even when there are no network partitions.
          CA systems are typically deployed in environments with strong network reliability and low chances of network partitions. They are well-suited for applications where data consistency and high availability are critical, such as traditional single-site databases.`
        },
        {
            type: "reference",
            href: "https://factor-bytes.com/2023/07/22/understanding-cap-theorem-balancing-consistency-availability-and-partition-tolerance-in-distributed-systems/",
            text: "Understanding CAP Theorem"
        },
        {
          type: "reference",
          href: "https://docs.aws.amazon.com/whitepapers/latest/availability-and-beyond-improving-resilience/cap-theorem.html",
          text: "availability-and-beyond-improving-resilience"
        },
        {
        type: "reference",
        href: "https://www.youtube.com/watch?v=gkg-FAEXIkY",
        text: "Friendly Intro To the CAP Theorem"
        }
    ]
}
export default aiAgentContent;