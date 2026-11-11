const aiAgentContent = {
    header: "Elastic Search",
    text: `Elasticsearch is a powerful, distributed search and analytics engine designed for handling large volumes of structured and unstructured data in real time. Built on Apache Lucene, it enables fast full-text search, filtering, and aggregations across massive datasets. It exposes a RESTful APIs for updates, creates, and searches. Elasticsearch can be loosely defined as a NoSQL database.  But more accurately, it’s a distributed search engine.`,
    contents: [
        {
            type: "image",
            src: "./elastic-1.png"
        },
        {
            type: "header",
            text: "Elasticsearch is not another NoSQL database"
        },
        {
            type: "text",
            text: `There are plenty of NoSQL databases like MongoDB, PostgreSQL, Solr that can be used to store and query unstructured data. However, these NoSQL databases have limited capabilities for executing complex queries and often they do not perform well for real-time information retrieval. This is where Elasticsearch comes into the picture to fill the gap.
            Unlike other NoSQL databases, Elasticsearch is primarily designed to be a search engine, instead of a datastore. It has amazing capabilities to perform fast, almost real-time, and advanced searches.
            Elastic has published an in-depth article discussing the use of Elasticsearch as a NoSQL data store. While there isn't a universally accepted definition for NoSQL data stores, most share a key feature: flexible schema management.

Although Elasticsearch also supports schema flexibility, its approach to schema management differs from traditional NoSQL stores. The article highlights the schema management process in Elasticsearch and explains why it shouldn't be treated as just another NoSQL store.`
        },
        {
            type: "reference",
            href: "https://www.elastic.co/guide/en/elasticsearch/reference/6.4/_mapping_concepts_across_sql_and_elasticsearch.html#_mapping_concepts_across_sql_and_elasticsearch",
            text: "mapping_concepts_across_sql_and_elasticsearch"
        },
        {
            type: "header",
            text: "Why shouldn't we use ElasticSearch as my primary datastore?"
        },
        {
            type: "text",
            text: `Elasticsearch is commonly used in addition to another database. A database system with stronger focus on constraints, correctness and robustness, and on being readily and transactionally updatable, has the master record - which is then asynchronously pushed to Elasticsearch. (Or pulled, if you use one of Elasticsearch's "rivers".) Keeping things in sync is something we'll cover in depth in a future article. Here at Found, we typically use PostgreSQL and ZooKeeper as keeper of truths, which we feed into Elasticsearch for awesome searching.`
        },
        {
            type: "reference",
            href: "https://www.elastic.co/blog/found-elasticsearch-as-nosql",
            text: "elasticsearch-as-nosql"
        },
        {
            type: "header",
            text: "Overall Architecrure"
        },
        {
            type: "image",
            src: "./elastic-2.png"
        },
        {
            type: "header",
            text: "Nodes"
        },
        {
            type: "text",
            text: `Nodes are individual Elasticsearch processes.Usually, you’d run a single Elasticsearch process per machine, so it's easier to think of them as individual servers. Each of these processes is running in isolation from others and is only connected via a common network. Elasticsearch generally runs as a large-scale distributed system, which means you’d typically be running multiple machines(or nodes).
            But a node is an instance. it is not a machine. This means you can also run multiple nodes on a single machine. `
        },
        {
            type: "header",
            text: "Cluster"
        },
        {
            type: "text",
            text: `A cluster is a collection of one or more nodes that together hold all the data and provide federated indexing and search capabilities across nodes. In Elasticsearch, clusters ensure data is replicated and load is distributed across nodes, ensuring high availability and fault tolerance. Each cluster has a unique identifier for coordinating tasks among nodes. Clusters can be scaled horizontally by adding more nodes. `
        },
        {
            type: "header",
            text: "Types of Nodes"
        },
        {
            type: "text",
            text: `Elasticsearch nodes can be categorized into several types based on their roles and responsibilities within the cluster. Here are the main types of nodes in Elasticsearch: `
        },
        {
            type: "subHeader",
            text: "Master Node"
        },
        {
            type: "text",
            text: `The master node is responsible for cluster-wide activities such as creating or deleting an index, adding or removing nodes, and managing the cluster state. `
        },
        {
            type: "subHeader",
            text: "Data Node"
        },
        {
            type: "text",
            text: `Data nodes are responsible for storing and indexing data. This is the default configuration for nodes.`
        },
        {
            type: "subHeader",
            text: "Client Node"
        },
        {
            type: "text",
            text: `A client node is designed to handle client requests and doesn’t store data or participate in the indexing process.`
        },
        {
            type: "subHeader",
            text: "Ingest Node"
        },
        {
            type: "text",
            text: `Ingest nodes are responsible for pre-processing documents before they are indexed.`
        },
        {
            type: "image",
            src: "./elastic-cluster.png"
        },
        {
            type: "header",
            text: "Index"
        },
        {
            type: "text",
            text: `An Elasticsearch index is a logical namespace that holds a collection of documents, where each document is a collection of fields — which, in turn, are key-value pairs that contain your data..
            Think of an Elasticsearch cluster as a database that can contain many indices you can consider as a table, and within each index, you have many documents.`
        },
        {
            type: "reference",
            href: "https://www.elastic.co/guide/en/elasticsearch/reference/6.0/removal-of-types.html",
            text: "removal-of-types"
        },
        {
            type: "header",
            text: "Shards"
        },
        {
            type: "text",
            text: `Documents in an index are divided into multiple shards. Each shard stores a certain subset of the documents of the index.
            These shards would then live in different data nodes across our cluster. Sharding allows you to distribute your documents throughout multiple servers, allowing a single search to be done in parallel on different hardware.`
        },
        {
            type: "image",
            src: "./shard-1.png"
        },
        {
            type: "image",
            src: "./shard-2.png"
        },
        {
            type: "header",
            text: "Replica Shards"
        },
        {
            type: "text",
            text: `One problem with our architecture so far is that if a particular node dies or becomes unavailable, the data in “Shard A” is lost forever. To solve this issue, there are “Replica Shards”. Replica shards are shards that simply store the same documents that the primary shard is associated with stores. So, a replica shard is simply “replicating” or duplicating a particular primary shard.
             Replicas are never placed on the node containing the original (primary) shards`
        },
        {
            type: "image",
            src: "./shard-3.png"
        },
        {
            type: "header",
            text: "Elastic Data Flow"
        },
        {
            type: "image",
            src: "./data-flow.gif"
        },
        {
            type: "header",
            text: "Elasticsearch Rest APIs"
        },
        {
            type: "text",
            text: `Elasticsearch provides a comprehensive RESTful API that allows you to interact with your data and cluster programmatically.`
        },
        {
            type: "reference",
            href: "https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html",
            text: "search-search"
        },
        {
            type: "image",
            src: "./elastic-rest.png"
        },
        {
            type: "header",
            text: "Query DSL"
        },
        {
            type: "code",
            code: `
{
//match- Returns all documents with field name matching the mentioned keyword.

POST <>/_search
{
  "query": {
    "match": {
      "description": "elasticsearch tutorial"
    }
  }
}

//match_phrase - The "match_phrase" query matches exact phrases in a field. It analyzes the text and searches for the exact phrase in the specified field.

POST <>/_search
{
  "query": {
    "match_phrase": {
      "content": "quick brown fox"
    }
  }
}

//Multi-Match Query: The "multi_match" query allows searching for a query string in multiple fields simultaneously. It can specify different fields and boost values for each field to influence the relevance scoring.

POST <>/_search
{
  "query": {
    "multi_match": {
      "query": "elasticsearch tutorial",
      "fields": [
        "title",
        "description^2"
      ]
    }
  }
}

//Term Query: The term query is used to search for an exact term in a specific field.

POST <>/_search
{
  "term": {
    "user": "johnsmith"
  }
}

//Terms Query: The terms query allows you to search for documents that match any of the specified terms in a field.

POST <>/_search
{
  "terms": {
    "status": [
      "open",
      "pending"
    ]
  }
}

//Range Query: The range query is used to search for documents within a specified range of values in a numeric or date field. It allows you to define inclusive or exclusive boundaries. For example, to search for documents where the "price" field is between 10 and 100, you can use the following query.
POST <>/_search
{
  "range": {
    "price": {
      "gte": 10,
      "lte": 100
    }
  }
}

//Exists Query: The exists query is used to search for documents that have a non-null value in a specific field. It is useful when you want to find documents that contain a particular field. For example, to search for documents where the "tags" field exists.

POST <>/_search
{
  "exists": {
    "field": "tags"
  }
}

//Bool Query: The bool query is a versatile and commonly used compound query that allows you to combine multiple query or filter clauses using boolean logic. It provides the following clauses:

//must: All specified clauses must match. This is equivalent to the logical AND operation.
//must_not: All specified clauses must not match. This is equivalent to the logical NOT operation.
//should: At l east one of the specified clauses must match. You can control the minimum number of matches required using the minimum_should_match parameter.
//filter: Specifies additional filters that should be applied. Filters in the filter clause are used in the filter context, meaning they do not affect the relevance score calculation.
//The bool query is highly flexible and allows you to create complex search conditions by combining various clauses.

POST <>/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "country": "China"
          }
        },
        {
          "range": {
            "salary": {
              "gte": 500000
            }
          }
        }
      ],
      "must_not": [
        {
          "match": {
            "gender": "Male"
          }
        }
      ]
    }
  }
}
`
        },
        {
            type: "header",
            text: "Kibana"
        },
        {
            type: "text",
            text: `In addition to the API documentation, Elasticsearch also provides a powerful tool called "Kibana" that allows you to interact with Elasticsearch through a graphical user interface (GUI).`
        },
        {
            type: "image",
            src: "./gif-kibana-lens-710-shortened.gif"
        },
        {
            type: "header",
            text: "Intalling Elastic Search and Kibana on Windows"
        },
        {
            type: "reference",
            href: "https://www.elastic.co/guide/en/elasticsearch/reference/current/zip-windows.html#windows-running",
            text: "Install Elasticsearch with .zip on Windows"
        },
        {
            type: "reference",
            href: "https://www.elastic.co/guide/en/kibana/current/windows.html",
            text: "Install Kibana on Windows"
        },
        {
            type: "reference",
            href: "https://www.youtube.com/watch?v=OewydCFoycg",
            text: "how to setup elasticserach and kibana | elasticserach | Kibana"
        },
        {
            type: "reference",
            href: "https://medium.com/better-programming/system-design-series-elasticsearch-architecting-for-search-5d5e61360463",
            text: "architecting-for-search"
        },
        {
            type: "reference",
            href: "https://opstree.com/blog/2019/10/01/tuning-of-elasticsearch-cluster",
            text: "tuning-of-elasticsearch-cluster"
        },
        {
            type: "reference",
            href: "https://www.atatus.com/blog/elasticsearch-query-dsl",
            text: "elasticsearch-query-dsl"
        },
        {
            type: "reference",
            href: "https://medium.com/@reshra3893/a-beginners-guide-to-elasticsearch-queries-d0205512de2d",
            text: "a-beginners-guide-to-elasticsearch-querie"
        }
    ]
}
export default aiAgentContent;