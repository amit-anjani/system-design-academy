import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Flame, Zap, Lock, Check, ArrowLeft, ArrowRight, RotateCcw,
  ChevronRight, Radio, X, Sparkles, Loader2, Play, Pause, Square, LogOut
} from "lucide-react";

/* ----------------------------- CONTENT DATA ----------------------------- */

const LESSONS = [
  {
    id: "scalability",
    title: "Scaling Systems",
    tagline: "Bigger machine, or more machines?",
    diagram: { type: "fanout", labels: ["Incoming Traffic", "Server A", "Server B", "Server C"] },
    intro: "When one server can't handle the traffic, you have two paths: make it bigger (vertical scaling) or add more of them (horizontal scaling).",
    bullets: [
      "Vertical scaling means beefier hardware on one machine. Simple, but it hits a hardware ceiling and stays a single point of failure.",
      "Horizontal scaling means spreading load across many machines. No hard ceiling, but it needs coordination \u2014 load balancing, shared state, consistency.",
      "Most large-scale systems scale horizontally once vertical scaling stops being cost-effective."
    ],
    insight: "Interviewers want to hear you weigh both, then justify horizontal scaling for anything expected to outgrow one machine.",
    quiz: [
      { q: "What's the main risk of relying only on vertical scaling?", options: ["It's too expensive to even start", "The server stays a single point of failure with a hard capacity ceiling", "It requires more servers than horizontal scaling", "It can't run a database"], correct: 1, note: "One bigger box is still one box \u2014 if it goes down, everything goes down with it." },
      { q: "Horizontal scaling primarily solves capacity limits by:", options: ["Buying a faster CPU", "Adding more machines to share the load", "Compressing stored data", "Reducing user traffic"], correct: 1, note: "Spread the work across a fleet instead of asking one machine to do it all." },
      { q: "Which approach introduces more coordination complexity?", options: ["Vertical scaling", "Horizontal scaling", "Both are equal", "Neither requires coordination"], correct: 1, note: "More machines means you now need to route traffic and share state between them." }
    ]
  },
  {
    id: "load-balancing",
    title: "Load Balancing",
    tagline: "Deciding who handles the next request",
    diagram: { type: "fanout", labels: ["Load Balancer", "Server 1", "Server 2", "Server 3"] },
    intro: "A load balancer sits in front of your servers and decides which one handles each incoming request, so no single server gets overwhelmed.",
    bullets: [
      "Common algorithms: round robin (even rotation), least connections (send to the least busy server), and IP hash (same client always hits the same server).",
      "Load balancers run continuous health checks, automatically routing around servers that stop responding.",
      "They can operate at the network layer (L4, fast, routes by IP/port) or application layer (L7, smarter, can route by URL or content)."
    ],
    insight: "A load balancer turns 'one server that might crash' into 'a fleet that degrades gracefully.'",
    quiz: [
      { q: "What does a load balancer's health check do?", options: ["Encrypts traffic", "Detects and routes around unresponsive servers", "Compresses response payloads", "Logs every request"], correct: 1, note: "It quietly stops sending traffic to anything that isn't answering." },
      { q: "Which algorithm sends traffic to whichever server has the fewest active connections?", options: ["Round robin", "IP hash", "Least connections", "Random"], correct: 2, note: "It watches current load instead of just rotating blindly." },
      { q: "An L7 (application layer) load balancer can do something L4 can't \u2014 what?", options: ["Route based on URL path or request content", "Balance traffic at all", "Run without health checks", "Handle more than one server"], correct: 0, note: "L7 reads the request itself, so it can make smarter routing decisions." }
    ]
  },
  {
    id: "caching",
    title: "Caching Strategies",
    tagline: "Skip the slow path on repeat requests",
    diagram: { type: "linear", labels: ["Client", "Cache", "Database"] },
    intro: "A cache stores a copy of expensive-to-compute or frequently-requested data somewhere faster to access, so repeat requests skip the slow path.",
    bullets: [
      "Cache-aside: the app checks the cache first; on a miss, it fetches from the database and writes the result back to the cache.",
      "Write-through: every write goes to the cache and the database at the same time, keeping them in sync but slowing writes down.",
      "Eviction policies like LRU (least recently used) decide what gets removed once the cache fills up."
    ],
    insight: "Caching buys speed by trading off freshness \u2014 the hard part is deciding how stale is acceptable.",
    quiz: [
      { q: "In cache-aside, what happens on a cache miss?", options: ["The request fails", "The app fetches from the database and populates the cache", "The cache is cleared entirely", "The database is skipped"], correct: 1, note: "A miss is just a signal to go fetch it once, then remember it for next time." },
      { q: "LRU eviction removes:", options: ["The largest item", "A random item", "The least recently used item", "The most recently used item"], correct: 2, note: "It assumes what hasn't been touched in a while is least likely to be needed next." },
      { q: "What's the main tradeoff caching introduces?", options: ["Speed versus data freshness", "Cost versus security", "Storage versus CPU", "Reads versus writes"], correct: 0, note: "Faster answers, at the risk of occasionally serving slightly outdated ones." }
    ]
  },
  {
    id: "db-indexing",
    title: "Database Indexing",
    tagline: "Finding rows without scanning everything",
    diagram: { type: "linear", labels: ["Query", "Index", "Table Rows"] },
    intro: "An index is a separate data structure that lets the database find rows without scanning the entire table \u2014 like a book's index pointing you to a page.",
    bullets: [
      "Indexes dramatically speed up reads (lookups, WHERE clauses, joins) on the columns they cover.",
      "They slow down writes, since every insert or update also has to update the index.",
      "Indexing every column isn't free \u2014 it costs storage and write performance, so index the columns you actually query on."
    ],
    insight: "Good indexing is one of the highest-leverage, lowest-effort performance wins in a system.",
    quiz: [
      { q: "What's the main cost of adding an index?", options: ["Slower writes and extra storage", "Slower reads", "Less accurate queries", "No cost at all"], correct: 0, note: "Every write now has to update the table and the index." },
      { q: "Indexes primarily speed up:", options: ["Every query equally", "Read queries that filter or sort on indexed columns", "Only INSERT statements", "Backups"], correct: 1, note: "They give the database a shortcut straight to the matching rows." },
      { q: "Why not just index every column?", options: ["It's not technically possible", "Each index adds write overhead and storage cost", "Indexes only work on numbers", "Databases limit you to one index"], correct: 1, note: "More indexes means more upkeep on every write." }
    ]
  },
  {
    id: "sql-vs-nosql",
    title: "SQL vs NoSQL",
    tagline: "Structure versus flexibility",
    diagram: { type: "compare", labels: ["SQL \u2014 Structured & Relational", "NoSQL \u2014 Flexible & Distributed"] },
    intro: "SQL databases enforce a fixed schema and strong relationships between tables. NoSQL databases trade some of that structure for flexibility and easier horizontal scale.",
    bullets: [
      "SQL (Postgres, MySQL) excels at complex queries, joins, and strict data consistency.",
      "NoSQL (MongoDB, DynamoDB, Cassandra) excels at flexible schemas, huge write volumes, and horizontal scaling.",
      "The choice depends on your access patterns, not which is 'better' \u2014 many large systems use both."
    ],
    insight: "Pick based on how you'll query the data, not on which technology is trendier.",
    quiz: [
      { q: "SQL databases are generally the better fit when you need:", options: ["Complex joins and strong consistency", "Schema-less documents", "Massive write throughput only", "No structure at all"], correct: 0, note: "Relational structure and strict consistency are SQL's home turf." },
      { q: "NoSQL databases are often chosen for:", options: ["Strict schemas", "Flexible schemas and horizontal write scale", "Complex multi-table joins", "Smaller data volumes"], correct: 1, note: "They're built to scale out and adapt shape easily." },
      { q: "The right database choice mainly depends on:", options: ["Which one is newer", "Your data's access patterns", "Marketing trends", "Team headcount"], correct: 1, note: "How you'll read and write the data should drive the decision." }
    ]
  },
  {
    id: "sharding",
    title: "Database Sharding",
    tagline: "Splitting one big database into pieces",
    diagram: { type: "fanout", labels: ["Router", "Shard 1 (A\u2013H)", "Shard 2 (I\u2013P)", "Shard 3 (Q\u2013Z)"] },
    intro: "Sharding splits one large database into smaller pieces, called shards, each holding a subset of the data \u2014 usually split by a key like user ID.",
    bullets: [
      "A router or the app decides which shard owns a given piece of data, often via a hash or range of the shard key.",
      "Sharding lets writes scale horizontally, since each shard only handles its own slice of traffic.",
      "The tradeoff: cross-shard queries (joins across shards) become expensive or impossible without extra coordination."
    ],
    insight: "Choosing the right shard key is the single most important decision \u2014 a bad key creates hot shards.",
    quiz: [
      { q: "What determines which shard a piece of data lives on?", options: ["The server's uptime", "The shard key", "Random chance every time", "The database vendor"], correct: 1, note: "The shard key is the rule that maps data to a specific shard." },
      { q: "What's a common downside of sharding?", options: ["Cross-shard queries become expensive or complex", "Writes get slower on every shard", "It removes the need for indexes", "It only works with NoSQL"], correct: 0, note: "Once data is split up, pulling it back together across shards costs extra work." },
      { q: "A poorly chosen shard key can lead to:", options: ["Faster overall performance", "Hot shards that get disproportionate traffic", "Automatic replication", "Fewer servers needed"], correct: 1, note: "If one key value is far more popular than others, its shard gets overloaded." }
    ]
  },
  {
    id: "replication",
    title: "Replication",
    tagline: "Keeping copies so one failure isn't fatal",
    diagram: { type: "fanout", labels: ["Primary DB", "Replica 1", "Replica 2"] },
    intro: "Replication keeps copies of your data on multiple machines, so a single server failure doesn't mean data loss or downtime.",
    bullets: [
      "In primary-replica setups, writes go to the primary and are copied out to replicas, which typically serve reads.",
      "Synchronous replication guarantees replicas are up to date but adds write latency; asynchronous is faster but risks a brief data lag.",
      "Replication improves both availability (failover to a replica) and read throughput (spread reads across replicas)."
    ],
    insight: "Replication answers 'what if this machine dies?' \u2014 it's a foundational piece of any highly-available system.",
    quiz: [
      { q: "In a primary-replica setup, writes typically go to:", options: ["Any replica", "The primary", "A random node", "All nodes simultaneously with no leader"], correct: 1, note: "The primary is the single source of truth that changes flow through first." },
      { q: "Synchronous replication trades write speed for:", options: ["Lower storage cost", "Guaranteed up-to-date replicas", "Simpler code", "Higher availability"], correct: 1, note: "Waiting for replicas to confirm makes writes slower but safer." },
      { q: "One benefit of replication is:", options: ["Spreading read traffic across multiple copies", "Eliminating the need for backups", "Removing the primary entirely", "Guaranteeing zero latency"], correct: 0, note: "Replicas can absorb read load that would otherwise all hit one machine." }
    ]
  },
  {
    id: "cap-theorem",
    title: "CAP Theorem",
    tagline: "Pick two, when the network splits",
    diagram: { type: "custom-cap" },
    intro: "CAP theorem says a distributed system can only fully guarantee two of three things during a network partition: Consistency, Availability, and Partition tolerance.",
    bullets: [
      "Consistency: every read gets the most recent write, everywhere.",
      "Availability: every request gets a response, even if it isn't the very latest data.",
      "Partition tolerance is non-negotiable in real distributed systems \u2014 networks will fail \u2014 so the real choice is between C and A during a partition."
    ],
    insight: "In practice, CAP is less a strict law and more a prompt: when the network splits, do you serve stale data, or no data?",
    quiz: [
      { q: "Which property is essentially mandatory for any real distributed system?", options: ["Consistency", "Availability", "Partition tolerance", "Latency"], correct: 2, note: "Networks fail. A distributed system has to tolerate that reality." },
      { q: "Choosing Availability over Consistency during a partition means:", options: ["Rejecting all requests", "Serving requests even if the data might be stale", "Shutting the system down", "Guaranteeing the latest write everywhere"], correct: 1, note: "You keep answering, accepting the data might briefly lag behind." },
      { q: "CAP theorem's tradeoff specifically applies during:", options: ["Normal operation with no issues", "A network partition", "Database backups", "User login"], correct: 1, note: "Outside of a partition, a system can often be both consistent and available." }
    ]
  },
  {
    id: "message-queues",
    title: "Message Queues",
    tagline: "Decoupling work from workers",
    diagram: { type: "linear", labels: ["Producer", "Queue", "Consumer"] },
    intro: "A message queue decouples the service that produces work from the service that processes it, letting them run independently and absorb bursts of traffic.",
    bullets: [
      "Producers push messages onto the queue; consumers pull them off and process at their own pace.",
      "Queues smooth out traffic spikes \u2014 if consumers fall behind, messages simply wait instead of overwhelming the system.",
      "They also improve resilience: if a consumer crashes mid-task, the message can be retried instead of lost."
    ],
    insight: "Queues turn a fragile synchronous chain into a resilient, independently-scalable pipeline.",
    quiz: [
      { q: "What problem do message queues primarily solve?", options: ["Decoupling producers and consumers so each can scale independently", "Encrypting data in transit", "Replacing databases entirely", "Reducing storage costs"], correct: 0, note: "Producer and consumer no longer need to move at the same speed." },
      { q: "During a traffic spike, a queue helps by:", options: ["Rejecting excess requests immediately", "Buffering work instead of overwhelming consumers", "Speeding up the consumer automatically", "Deleting old messages"], correct: 1, note: "Messages wait patiently instead of crashing the downstream service." },
      { q: "If a consumer crashes while processing a message, a good queue setup allows:", options: ["The message to be lost silently", "The message to be retried", "The queue to shut down", "The producer to stop sending"], correct: 1, note: "Unacknowledged messages can go back on the queue for another attempt." }
    ]
  },
  {
    id: "cdn",
    title: "Content Delivery Networks",
    tagline: "Serving content from nearby, not far away",
    diagram: { type: "fanout", labels: ["Origin Server", "Edge \u2014 US", "Edge \u2014 EU", "Edge \u2014 Asia"] },
    intro: "A CDN caches your static content on servers spread around the world, so users get it from a location near them instead of your origin server.",
    bullets: [
      "CDNs drastically cut latency for users far from your origin, since content travels a shorter physical distance.",
      "They also absorb traffic \u2014 popular assets get served from the edge, reducing load on your origin server.",
      "CDNs work best for static or rarely-changing content: images, video, CSS/JS, and increasingly, cached API responses."
    ],
    insight: "A CDN is often the highest-leverage, lowest-effort latency fix available to a growing system.",
    quiz: [
      { q: "The main benefit of a CDN is reducing:", options: ["Database load only", "Latency by serving content from a nearby edge location", "The number of users", "Code complexity"], correct: 1, note: "Shorter physical distance means a faster round trip." },
      { q: "CDNs are best suited for:", options: ["Highly dynamic, per-user data", "Static or rarely-changing content", "Live database writes", "One-time password codes"], correct: 1, note: "Content that doesn't change often is safe to cache widely." },
      { q: "Besides latency, CDNs also help by:", options: ["Reducing load on the origin server", "Replacing the need for a database", "Increasing write throughput", "Eliminating the need for caching"], correct: 0, note: "Every request served from the edge is one less request hitting your origin." }
    ]
  },
  {
    id: "rate-limiting",
    title: "Rate Limiting",
    tagline: "Keeping the system fair for everyone",
    diagram: { type: "linear", labels: ["Client Requests", "Rate Limiter", "API Server"] },
    intro: "Rate limiting caps how many requests a client can make in a given window, protecting your system from abuse, bugs, and traffic spikes.",
    bullets: [
      "Token bucket: a client has a bucket of tokens that refill over time; each request spends one, and an empty bucket gets rejected or delayed.",
      "Rate limiting protects backend resources and keeps one noisy client from degrading service for everyone else.",
      "It's usually enforced at the edge (API gateway or load balancer) before a request ever reaches application servers."
    ],
    insight: "Rate limiting is less about punishing users and more about keeping the system fair and available for everyone.",
    quiz: [
      { q: "The token bucket algorithm rejects a request when:", options: ["The server is idle", "The bucket has no tokens left", "The client has a slow connection", "The queue is empty"], correct: 1, note: "No tokens left means no budget left for another request right now." },
      { q: "Rate limiting is typically enforced:", options: ["Deep inside the database", "At the edge, before requests reach application servers", "Only on the client side", "After the response is sent"], correct: 1, note: "Stopping excess traffic early protects everything behind it." },
      { q: "The main goal of rate limiting is to:", options: ["Punish specific users", "Protect the system and keep it fair for all clients", "Increase revenue", "Slow down the whole system"], correct: 1, note: "It's a fairness and stability mechanism, not a penalty." }
    ]
  },
  {
    id: "microservices",
    title: "Microservices vs Monolith",
    tagline: "One deployable unit, or many?",
    diagram: { type: "compare", labels: ["Monolith \u2014 One Unit", "Microservices \u2014 Independent Services"] },
    intro: "A monolith ships all functionality as one deployable unit. Microservices split that functionality into small, independently deployable services.",
    bullets: [
      "Monoliths are simpler to build, test, and deploy early on \u2014 one codebase, one deploy pipeline.",
      "Microservices let teams scale, deploy, and choose technology independently, at the cost of network overhead and operational complexity.",
      "Most successful systems start as a monolith and split into services only when a real scaling or team-org pain point appears."
    ],
    insight: "Microservices solve organizational and scaling problems \u2014 they aren't automatically 'more advanced' architecture.",
    quiz: [
      { q: "A key advantage of a monolith early on is:", options: ["Independent scaling", "Simplicity \u2014 one codebase and deploy pipeline", "Guaranteed high availability", "Automatic sharding"], correct: 1, note: "Fewer moving parts means faster iteration when a system is young." },
      { q: "Microservices primarily help with:", options: ["Reducing all network calls", "Independent scaling, deployment, and team ownership", "Removing the need for testing", "Guaranteeing lower latency"], correct: 1, note: "Each service can scale and ship on its own schedule." },
      { q: "A common real-world path is to:", options: ["Start with microservices and merge into a monolith", "Start monolithic and split into services as pain points emerge", "Never change architecture", "Always start with 50+ services"], correct: 1, note: "Most teams earn their way into microservices rather than starting there." }
    ]
  },
  {
    id: "consistent-hashing",
    title: "Consistent Hashing",
    tagline: "Adding a server shouldn't reshuffle everything",
    diagram: { type: "custom-ring" },
    intro: "Consistent hashing maps both servers and data onto a circular hash ring, so adding or removing a server only reshuffles a small fraction of the data instead of everything.",
    bullets: [
      "Without it, adding or removing a server in a simple hash-mod-N scheme reshuffles almost all keys \u2014 expensive and disruptive.",
      "On the ring, each key is assigned to the next server found clockwise from its hash position.",
      "It's the backbone of distributed caches and databases like DynamoDB, Cassandra, and many CDNs."
    ],
    insight: "Consistent hashing is what makes scaling a distributed cache or database up and down cheap instead of catastrophic.",
    quiz: [
      { q: "What problem does consistent hashing solve compared to simple hash-mod-N?", options: ["It avoids reshuffling almost all keys when a server is added or removed", "It makes hashing faster", "It removes the need for a hash function", "It guarantees perfect consistency"], correct: 0, note: "Only the keys near the change on the ring need to move." },
      { q: "On the hash ring, a key is assigned to:", options: ["A random server", "The next server clockwise from its position", "The server with the lowest load", "Every server at once"], correct: 1, note: "Each key simply walks clockwise until it finds its owning server." },
      { q: "Consistent hashing is commonly used in:", options: ["Single-server applications", "Distributed caches and databases", "Client-side rendering", "CSS layout engines"], correct: 1, note: "Anywhere data needs to be spread across a changing set of nodes." }
    ]
  },
  {
    id: "api-gateway",
    title: "API Gateway",
    tagline: "One front door for every client",
    diagram: { type: "fanin", labels: ["Web Client", "Mobile Client", "Partner API", "API Gateway"] },
    intro: "An API Gateway is the single entry point that sits in front of your backend services, handling routing, authentication, and cross-cutting concerns in one place.",
    bullets: [
      "It routes each incoming request to the right backend service, so clients don't need to know your internal architecture.",
      "Common responsibilities: authentication, rate limiting, request/response transformation, and logging \u2014 all handled once instead of per-service.",
      "It also simplifies clients: mobile and web apps talk to one gateway instead of dozens of individual services."
    ],
    insight: "An API Gateway trades a bit of added latency for a much simpler, more secure surface for everything behind it.",
    quiz: [
      { q: "The main role of an API Gateway is to:", options: ["Store application data", "Act as a single entry point that routes requests to backend services", "Replace the load balancer entirely", "Render the user interface"], correct: 1, note: "It's the front door \u2014 everything comes through it first." },
      { q: "Handling authentication at the gateway instead of each service means:", options: ["It's implemented once instead of duplicated everywhere", "Every service must reimplement it", "Authentication becomes optional", "Requests skip authentication"], correct: 0, note: "Centralizing cross-cutting concerns avoids repeating the same logic in every service." },
      { q: "One tradeoff of adding an API Gateway is:", options: ["Guaranteed zero latency", "A small amount of added latency", "Removing the need for services", "No more need for routing"], correct: 1, note: "An extra hop adds a little overhead in exchange for a lot of simplicity." }
    ]
  }
];

const TOTAL = LESSONS.length;

/* ------------------------------ DIAGRAMS -------------------------------- */

function FlowDiagram({ type, labels }) {
  const W = 640;
  const boxW = 148, boxH = 58;

  if (type === "linear") {
    const H = 150;
    const n = labels.length;
    const gap = (W - n * boxW) / (n + 1);
    const xs = labels.map((_, i) => gap + i * (boxW + gap));
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg">
        <defs>
          <marker id="arrowL" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 Z" className="diagram-arrowhead" />
          </marker>
        </defs>
        {xs.slice(0, -1).map((x, i) => (
          <line key={i} x1={x + boxW} y1={H / 2} x2={xs[i + 1]} y2={H / 2} className="diagram-line" markerEnd="url(#arrowL)" />
        ))}
        {labels.map((label, i) => (
          <g key={i}>
            <rect x={xs[i]} y={H / 2 - boxH / 2} width={boxW} height={boxH} rx="7" className={`diagram-box ${i === Math.floor(n / 2) ? "diagram-box-primary" : ""}`} />
            <foreignObject x={xs[i]} y={H / 2 - boxH / 2} width={boxW} height={boxH}>
              <div className="diagram-label">{label}</div>
            </foreignObject>
          </g>
        ))}
      </svg>
    );
  }

  if (type === "fanout" || type === "fanin") {
    const H = 230;
    const primary = type === "fanout" ? labels[0] : labels[labels.length - 1];
    const others = type === "fanout" ? labels.slice(1) : labels.slice(0, -1);
    const n = others.length;
    const gap = (W - n * boxW) / (n + 1);
    const oXs = others.map((_, i) => gap + i * (boxW + gap));
    const primX = W / 2 - boxW / 2;
    const primY = type === "fanout" ? 22 : H - boxH - 22;
    const oY = type === "fanout" ? H - boxH - 22 : 22;
    const markerId = type === "fanout" ? "arrowFO" : "arrowFI";
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg">
        <defs>
          <marker id={markerId} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 Z" className="diagram-arrowhead" />
          </marker>
        </defs>
        {oXs.map((x, i) => {
          const cx = x + boxW / 2;
          const [x1, y1, x2, y2] = type === "fanout"
            ? [W / 2, primY + boxH, cx, oY]
            : [cx, oY + boxH, W / 2, primY];
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="diagram-line" markerEnd={`url(#${markerId})`} />;
        })}
        <rect x={primX} y={primY} width={boxW} height={boxH} rx="7" className="diagram-box diagram-box-primary" />
        <foreignObject x={primX} y={primY} width={boxW} height={boxH}>
          <div className="diagram-label">{primary}</div>
        </foreignObject>
        {others.map((label, i) => (
          <g key={i}>
            <rect x={oXs[i]} y={oY} width={boxW} height={boxH} rx="7" className="diagram-box" />
            <foreignObject x={oXs[i]} y={oY} width={boxW} height={boxH}>
              <div className="diagram-label">{label}</div>
            </foreignObject>
          </g>
        ))}
      </svg>
    );
  }

  return null;
}

function CompareDiagram({ labels }) {
  return (
    <svg viewBox="0 0 640 160" className="diagram-svg">
      <rect x="40" y="30" width="250" height="100" rx="8" className="diagram-box" />
      <foreignObject x="40" y="30" width="250" height="100"><div className="diagram-label diagram-label-lg">{labels[0]}</div></foreignObject>
      <text x="320" y="88" textAnchor="middle" className="diagram-vs">VS</text>
      <rect x="350" y="30" width="250" height="100" rx="8" className="diagram-box diagram-box-primary" />
      <foreignObject x="350" y="30" width="250" height="100"><div className="diagram-label diagram-label-lg">{labels[1]}</div></foreignObject>
    </svg>
  );
}

function CapTriangle() {
  return (
    <svg viewBox="0 0 640 280" className="diagram-svg">
      <polygon points="320,40 100,220 540,220" className="diagram-triangle" />
      <circle cx="320" cy="40" r="30" className="diagram-node-ring" />
      <text x="320" y="47" textAnchor="middle" className="diagram-node-text">C</text>
      <text x="320" y="90" textAnchor="middle" className="diagram-caption">Consistency</text>
      <circle cx="100" cy="220" r="30" className="diagram-node-ring" />
      <text x="100" y="227" textAnchor="middle" className="diagram-node-text">A</text>
      <text x="100" y="262" textAnchor="middle" className="diagram-caption">Availability</text>
      <circle cx="540" cy="220" r="30" className="diagram-node-ring" />
      <text x="540" y="227" textAnchor="middle" className="diagram-node-text">P</text>
      <text x="540" y="262" textAnchor="middle" className="diagram-caption">Partition Tolerance</text>
    </svg>
  );
}

function HashRing() {
  const cx = 320, cy = 140, r = 95;
  const nodes = [
    { label: "Server A", angle: -90, dy: -42 },
    { label: "Server B", angle: 0, dy: 8, dx: 46 },
    { label: "Server C", angle: 100, dy: 42 },
    { label: "Server D", angle: 190, dy: 8, dx: -50 }
  ];
  return (
    <svg viewBox="0 0 640 280" className="diagram-svg">
      <circle cx={cx} cy={cy} r={r} className="diagram-ring" />
      {nodes.map((n, i) => {
        const rad = (n.angle * Math.PI) / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="19" className="diagram-node-ring" />
            <text x={x} y={y + 4} textAnchor="middle" className="diagram-node-text-sm">{i + 1}</text>
            <text x={x + (n.dx || 0)} y={y + n.dy} textAnchor="middle" className="diagram-caption-sm">{n.label}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="3.5" className="diagram-hub" />
    </svg>
  );
}

function Diagram({ diagram }) {
  if (diagram.type === "custom-cap") return <CapTriangle />;
  if (diagram.type === "custom-ring") return <HashRing />;
  if (diagram.type === "compare") return <CompareDiagram labels={diagram.labels} />;
  return <FlowDiagram type={diagram.type} labels={diagram.labels} />;
}

/* -------------------------------- HELPERS -------------------------------- */

const ACCOUNTS_KEY = "sda-accounts-v1";
const SESSION_KEY = "sda-session-v1";
const todayStr = () => new Date().toISOString().slice(0, 10);

async function hashPassword(pw) {
  try {
    const enc = new TextEncoder().encode(pw);
    const buf = await window.crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    // Fallback if SubtleCrypto isn't available \u2014 not cryptographic, just avoids storing plaintext.
    let h = 0;
    for (let i = 0; i < pw.length; i++) h = (Math.imul(h, 31) + pw.charCodeAt(i)) | 0;
    return "fb-" + (h >>> 0).toString(16);
  }
}

function daysBetween(a, b) {
  const d1 = new Date(a), d2 = new Date(b);
  return Math.round((d2 - d1) / 86400000);
}

/* ---------------------------- TEXT-TO-SPEECH ------------------------------ */

function pickVoice(voices) {
  if (!voices || !voices.length) return null;
  const score = (v) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/natural/.test(n)) s += 100;
    if (/neural/.test(n)) s += 90;
    if (/online/.test(n)) s += 40;
    if (/google/.test(n) && /us english/.test(n)) s += 70;
    if (/samantha|karen|moira|daniel|aria|jenny|guy|ava|nova/.test(n)) s += 60;
    if (v.lang === "en-US") s += 20;
    else if (v.lang && v.lang.startsWith("en")) s += 10;
    if (v.localService) s += 5;
    return s;
  };
  return [...voices].sort((a, b) => score(b) - score(a))[0];
}

function useSpeech() {
  const [status, setStatus] = useState("idle"); // idle | playing | paused
  const [rate, setRate] = useState(0.95);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const voiceRef = useRef(null);
  const rateRef = useRef(rate);
  const queueRef = useRef([]);
  const idxRef = useRef(0);
  const stoppedRef = useRef(true);

  useEffect(() => { rateRef.current = rate; }, [rate]);

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) voiceRef.current = pickVoice(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  const speakNext = useCallback(() => {
    if (stoppedRef.current || idxRef.current >= queueRef.current.length) {
      setStatus("idle");
      setCurrent(0);
      return;
    }
    const chunk = queueRef.current[idxRef.current];
    setCurrent(idxRef.current + 1);
    const utter = new SpeechSynthesisUtterance(chunk);
    utter.rate = rateRef.current;
    utter.pitch = 1;
    utter.volume = 1;
    if (voiceRef.current) utter.voice = voiceRef.current;
    utter.onend = () => {
      if (stoppedRef.current) return;
      idxRef.current += 1;
      const gap = idxRef.current === 1 ? 260 : 180; // slightly longer breath after the opener
      setTimeout(() => { if (!stoppedRef.current) speakNext(); }, gap);
    };
    utter.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utter);
  }, []);

  const play = useCallback((chunks) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    stoppedRef.current = false;
    queueRef.current = chunks;
    idxRef.current = 0;
    setTotal(chunks.length);
    setStatus("playing");
    speakNext();
  }, [supported, speakNext]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus("playing");
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    setStatus("idle");
    setCurrent(0);
  }, [supported]);

  return { status, play, pause, resume, stop, supported, rate, setRate, current, total };
}

function AudioBar({ chunks, speech }) {
  if (!speech.supported) return null;
  const { status, current, total } = speech;
  const pct = total ? Math.round(((current - (status === "idle" ? 0 : 1)) / total) * 100) : 0;
  const rates = [
    { v: 0.8, label: "Slow" },
    { v: 0.95, label: "Normal" },
    { v: 1.15, label: "Fast" }
  ];
  return (
    <div className="audio-bar-wrap">
      <div className="audio-bar">
        <button
          className="audio-btn"
          onClick={() => {
            if (status === "playing") speech.pause();
            else if (status === "paused") speech.resume();
            else speech.play(chunks);
          }}
        >
          {status === "playing" ? <Pause size={14} /> : <Play size={14} />}
          {status === "playing" ? "Pause" : status === "paused" ? "Resume" : "Listen to this module"}
        </button>
        {status !== "idle" && (
          <button className="audio-btn audio-btn-ghost" onClick={speech.stop}>
            <Square size={12} /> Stop
          </button>
        )}
        <div className="rate-pills">
          {rates.map((r) => (
            <button
              key={r.v}
              className={`rate-pill ${speech.rate === r.v ? "rate-pill-active" : ""}`}
              onClick={() => speech.setRate(r.v)}
            >
              {r.label}
            </button>
          ))}
        </div>
        {status !== "idle" && (
          <span className="mono-label dim audio-status">
            {status === "playing" ? "READING " : "PAUSED "}{current}/{total}
          </span>
        )}
      </div>
      {status !== "idle" && (
        <div className="audio-progress-track">
          <div className="audio-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------- APP ------------------------------------ */

export default function App() {
  const [phase, setPhase] = useState("loading"); // loading | auth | onboarding | dashboard | lesson
  const [accounts, setAccounts] = useState({});
  const [username, setUsername] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [saving, setSaving] = useState(false);

  const persistAccounts = useCallback(async (accs) => {
    setSaving(true);
    try {
      await window.storage.set(ACCOUNTS_KEY, JSON.stringify(accs), false);
    } catch (e) {
      console.error("Storage error:", e);
    } finally {
      setSaving(false);
    }
  }, []);

  const persistSession = useCallback(async (uname) => {
    try {
      if (uname) await window.storage.set(SESSION_KEY, JSON.stringify({ username: uname }), false);
      else await window.storage.delete(SESSION_KEY, false);
    } catch (e) {
      // no-op \u2014 losing the session key just means you'll need to sign in again next visit
    }
  }, []);

  useEffect(() => {
    (async () => {
      let accs = {};
      try {
        const accRes = await window.storage.get(ACCOUNTS_KEY, false);
        if (accRes && accRes.value) accs = JSON.parse(accRes.value);
      } catch (e) {}
      setAccounts(accs);

      let sessionUser = null;
      try {
        const sessRes = await window.storage.get(SESSION_KEY, false);
        if (sessRes && sessRes.value) sessionUser = JSON.parse(sessRes.value).username;
      } catch (e) {}

      if (sessionUser && accs[sessionUser]) {
        setUsername(sessionUser);
        const acc = accs[sessionUser];
        if (acc.profile) {
          setProfile(acc.profile);
          setPhase("dashboard");
        } else {
          setPhase("onboarding");
        }
      } else {
        setPhase("auth");
      }
    })();
  }, []);

  // Whenever the active profile changes (onboarding finished, lesson completed, streak/xp updated),
  // sync it into the account record and persist.
  useEffect(() => {
    if (!username || !profile) return;
    setAccounts((prev) => {
      const merged = { ...prev, [username]: { ...prev[username], profile } };
      persistAccounts(merged);
      return merged;
    });
  }, [profile, username]);

  const signup = async (rawUsername, password) => {
    const key = rawUsername.trim();
    if (!key) return { error: "Enter a username." };
    if (accounts[key]) return { error: "That username is already taken." };
    const passwordHash = await hashPassword(password);
    const nextAccounts = { ...accounts, [key]: { passwordHash, profile: null } };
    setAccounts(nextAccounts);
    await persistAccounts(nextAccounts);
    await persistSession(key);
    setUsername(key);
    setPhase("onboarding");
    return { ok: true };
  };

  const login = async (rawUsername, password) => {
    const key = rawUsername.trim();
    const acc = accounts[key];
    if (!acc) return { error: "No account found with that username." };
    const passwordHash = await hashPassword(password);
    if (passwordHash !== acc.passwordHash) return { error: "Incorrect password." };
    await persistSession(key);
    setUsername(key);
    if (acc.profile) {
      setProfile(acc.profile);
      setPhase("dashboard");
    } else {
      setPhase("onboarding");
    }
    return { ok: true };
  };

  const logout = async () => {
    await persistSession(null);
    setUsername(null);
    setProfile(null);
    setActiveLessonId(null);
    setPhase("auth");
  };

  const finishOnboarding = (answers) => {
    const next = {
      name: answers.name || "Engineer",
      level: answers.level,
      goal: answers.goal,
      xp: 0,
      streak: 0,
      lastActiveDate: null,
      completed: []
    };
    setProfile(next);
    setPhase("dashboard");
  };

  const completeLesson = (lessonId, score) => {
    setProfile((prev) => {
      const already = prev.completed.includes(lessonId);
      const completed = already ? prev.completed : [...prev.completed, lessonId];
      let streak = prev.streak;
      const today = todayStr();
      if (!prev.lastActiveDate) {
        streak = 1;
      } else {
        const diff = daysBetween(prev.lastActiveDate, today);
        if (diff === 0) streak = prev.streak || 1;
        else if (diff === 1) streak = prev.streak + 1;
        else streak = 1;
      }
      return {
        ...prev,
        completed,
        xp: prev.xp + (already ? 0 : 20 + score * 5),
        streak,
        lastActiveDate: today
      };
    });
  };

  const resetProgress = async () => {
    setProfile(null);
    setActiveLessonId(null);
    setAccounts((prev) => {
      const merged = { ...prev, [username]: { ...prev[username], profile: null } };
      persistAccounts(merged);
      return merged;
    });
    setPhase("onboarding");
  };

  const openLesson = (id) => {
    setActiveLessonId(id);
    setPhase("lesson");
  };

  const backToDashboard = () => {
    setActiveLessonId(null);
    setPhase("dashboard");
  };

  return (
    <div className="sda-root">
      <GlobalStyle />
      {phase === "loading" && <LoadingScreen />}
      {phase === "auth" && <AuthScreen onLogin={login} onSignup={signup} />}
      {phase === "onboarding" && <Onboarding onDone={finishOnboarding} />}
      {phase === "dashboard" && profile && (
        <Dashboard
          profile={profile}
          username={username}
          onOpenLesson={openLesson}
          onReset={resetProgress}
          onLogout={logout}
          saving={saving}
        />
      )}
      {phase === "lesson" && profile && activeLessonId && (
        <LessonView
          lesson={LESSONS.find((l) => l.id === activeLessonId)}
          index={LESSONS.findIndex((l) => l.id === activeLessonId)}
          onBack={backToDashboard}
          onComplete={completeLesson}
          alreadyCompleted={profile.completed.includes(activeLessonId)}
        />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <Loader2 className="spin" size={28} />
      <div className="mono-label">BOOTING SYSTEM DESIGN ACADEMY</div>
    </div>
  );
}

/* --------------------------------- AUTH ------------------------------------ */

function AuthScreen({ onLogin, onSignup }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setError("");
  };

  const submit = async () => {
    if (busy) return;
    setError("");
    if (!username.trim() || !password) {
      setError("Enter a username and password.");
      return;
    }
    if (mode === "signup") {
      if (password.length < 4) {
        setError("Password must be at least 4 characters.");
        return;
      }
      if (password !== confirmPw) {
        setError("Passwords don't match.");
        return;
      }
    }
    setBusy(true);
    try {
      const result = mode === "login" ? await onLogin(username, password) : await onSignup(username, password);
      if (result && result.error) setError(result.error);
    } catch (e) {
      console.error("Auth error:", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onEnter = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="onboarding-screen">
      <div className="intake-panel">
        <div className="intake-header">
          <Lock size={16} className="cyan-icon" />
          <span className="mono-label">ACCESS TERMINAL</span>
        </div>

        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${mode === "login" ? "auth-tab-active" : ""}`} onClick={() => switchMode("login")}>
            Sign in
          </button>
          <button type="button" className={`auth-tab ${mode === "signup" ? "auth-tab-active" : ""}`} onClick={() => switchMode("signup")}>
            Create account
          </button>
        </div>

        <div className="intake-body">
          <h1 className="intake-title">{mode === "login" ? "Welcome back" : "Provision a new account"}</h1>
          <p className="intake-sub">
            {mode === "login" ? "Sign in to resume your track." : "Stored privately with your Claude account \u2014 this isn't sent to any external server."}
          </p>
          <input
            className="intake-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={onEnter}
            autoFocus
          />
          <input
            className="intake-input"
            style={{ marginTop: 10 }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onEnter}
          />
          {mode === "signup" && (
            <input
              className="intake-input"
              style={{ marginTop: 10 }}
              type="password"
              placeholder="Confirm password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              onKeyDown={onEnter}
            />
          )}
          {error && <p className="auth-error">{error}</p>}
          <button className="primary-btn full-width" type="button" onClick={submit} disabled={busy}>
            {busy ? "Please wait\u2026" : mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ ONBOARDING -------------------------------- */

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [level, setLevel] = useState(null);
  const [goal, setGoal] = useState(null);

  const steps = ["IDENTITY", "CAPACITY", "OBJECTIVE"];
  const canAdvance = [name.trim().length > 0, !!level, !!goal][step];

  const next = () => {
    if (step < 2) setStep(step + 1);
    else onDone({ name: name.trim(), level, goal });
  };
  const prev = () => step > 0 && setStep(step - 1);

  return (
    <div className="onboarding-screen">
      <div className="intake-panel">
        <div className="intake-header">
          <Radio size={16} className="cyan-icon" />
          <span className="mono-label">SYSTEM REQUIREMENTS INTAKE</span>
        </div>
        <div className="intake-progress">
          {steps.map((s, i) => (
            <div key={s} className={`intake-step ${i <= step ? "intake-step-active" : ""}`}>
              <span className="intake-step-num">{String(i + 1).padStart(2, "0")}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="intake-body">
            <h1 className="intake-title">Who's provisioning this account?</h1>
            <p className="intake-sub">We'll label your dashboard and certificates with this.</p>
            <input
              className="intake-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <div className="intake-body">
            <h1 className="intake-title">Current system load?</h1>
            <p className="intake-sub">This sets the difficulty curve of your track.</p>
            <div className="option-grid">
              {[
                { id: "beginner", label: "Beginner", desc: "New to system design" },
                { id: "intermediate", label: "Intermediate", desc: "Know the basics, want depth" },
                { id: "advanced", label: "Advanced", desc: "Prepping for senior-level interviews" }
              ].map((o) => (
                <button key={o.id} className={`option-card ${level === o.id ? "option-card-active" : ""}`} onClick={() => setLevel(o.id)}>
                  <span className="option-card-label">{o.label}</span>
                  <span className="option-card-desc">{o.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="intake-body">
            <h1 className="intake-title">Deployment target?</h1>
            <p className="intake-sub">Why you're learning shapes what we surface first.</p>
            <div className="option-grid">
              {[
                { id: "interview", label: "Interview prep", desc: "Studying for system design rounds" },
                { id: "work", label: "Level up at work", desc: "Apply this on real systems" },
                { id: "curiosity", label: "General curiosity", desc: "Just want to understand how it works" }
              ].map((o) => (
                <button key={o.id} className={`option-card ${goal === o.id ? "option-card-active" : ""}`} onClick={() => setGoal(o.id)}>
                  <span className="option-card-label">{o.label}</span>
                  <span className="option-card-desc">{o.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="intake-footer">
          <button className="ghost-btn" onClick={prev} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="primary-btn" onClick={next} disabled={!canAdvance}>
            {step < 2 ? "Continue" : "Deploy my track"} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- DASHBOARD -------------------------------- */

function Dashboard({ profile, username, onOpenLesson, onReset, onLogout, saving }) {
  const completedCount = profile.completed.length;
  const pct = Math.round((completedCount / TOTAL) * 100);
  const isActiveToday = profile.lastActiveDate === todayStr();

  const positions = LESSONS.map((_, i) => {
    const x = [16, 50, 84][i % 3];
    const y = 70 + i * 128;
    return { x, y };
  });
  const mapHeight = 70 + (TOTAL - 1) * 128 + 90;

  return (
    <div className="dashboard-screen">
      <header className="dash-header">
        <div>
          <div className="mono-label dim">SYSTEM DESIGN ACADEMY \u00b7 {username}</div>
          <h1 className="dash-title">{profile.name}'s deployment status</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn" title="Reset progress" onClick={() => { if (confirm("Reset all progress? This can't be undone.")) onReset(); }}>
            <RotateCcw size={16} />
          </button>
          <button className="icon-btn" title="Sign out" onClick={onLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <Flame size={20} className={`amber-icon ${isActiveToday ? "flame-pulse" : ""}`} />
          <div>
            <div className="stat-value">{profile.streak}</div>
            <div className="stat-label">day uptime streak</div>
          </div>
        </div>
        <div className="stat-card">
          <Zap size={20} className="cyan-icon" />
          <div>
            <div className="stat-value">{profile.xp}</div>
            <div className="stat-label">throughput (xp)</div>
          </div>
        </div>
        <div className="stat-card">
          <Sparkles size={20} className="cyan-icon" />
          <div>
            <div className="stat-value">{completedCount}/{TOTAL}</div>
            <div className="stat-label">modules deployed</div>
          </div>
        </div>
      </div>

      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="map-wrapper" style={{ height: mapHeight }}>
        <svg viewBox={`0 0 100 ${mapHeight}`} preserveAspectRatio="none" className="map-connector-svg">
          {LESSONS.slice(0, -1).map((_, i) => {
            const a = positions[i], b = positions[i + 1];
            const done = profile.completed.includes(LESSONS[i].id);
            return (
              <line
                key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                className={done ? "map-line-done" : "map-line-pending"}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {LESSONS.map((lesson, i) => {
          const done = profile.completed.includes(lesson.id);
          const unlocked = i === 0 || profile.completed.includes(LESSONS[i - 1].id);
          const isCurrent = unlocked && !done;
          const pos = positions[i];
          return (
            <button
              key={lesson.id}
              className={`map-node ${done ? "map-node-done" : ""} ${isCurrent ? "map-node-current" : ""} ${!unlocked ? "map-node-locked" : ""}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}px` }}
              onClick={() => onOpenLesson(lesson.id)}
            >
              <span className="map-node-circle">
                {done ? <Check size={18} /> : !unlocked ? <Lock size={15} /> : <span className="mono-label">{String(i + 1).padStart(2, "0")}</span>}
              </span>
              <span className="map-node-label">
                <span className="map-node-title">{lesson.title}</span>
                <span className="map-node-tagline">{lesson.tagline}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="dash-footer">
        <span className="mono-label dim">{saving ? "SYNCING\u2026" : "ALL CHANGES SAVED"}</span>
      </div>
    </div>
  );
}

/* -------------------------------- LESSON ----------------------------------- */

function LessonView({ lesson, index, onBack, onComplete, alreadyCompleted }) {
  const [stage, setStage] = useState("content"); // content | quiz | summary
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const q = lesson.quiz[qIndex];
  const speech = useSpeech();
  const spokenChunks = [
    `${lesson.title}.`,
    lesson.intro,
    ...lesson.bullets,
    `Here's the insight: ${lesson.insight}`
  ];
  const readingActive = speech.status === "playing" || speech.status === "paused";
  const activeChunk = readingActive ? speech.current - 1 : -1; // 0-based
  const introActive = activeChunk === 1;
  const insightActive = activeChunk === spokenChunks.length - 1;
  const activeBulletIndex = activeChunk >= 2 && activeChunk < 2 + lesson.bullets.length ? activeChunk - 2 : -1;

  useEffect(() => {
    if (stage !== "content") speech.stop();
  }, [stage]);

  useEffect(() => {
    return () => speech.stop();
  }, [lesson.id]);

  const selectOption = (i) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    if (i === q.correct) setCorrectCount((c) => c + 1);
  };

  const nextQuestion = () => {
    if (qIndex < lesson.quiz.length - 1) {
      setQIndex(qIndex + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setStage("summary");
    }
  };

  const finish = () => {
    onComplete(lesson.id, correctCount);
    onBack();
  };

  return (
    <div className="lesson-screen">
      <div className="lesson-topbar">
        <button className="ghost-btn" onClick={onBack}><ArrowLeft size={15} /> Dashboard</button>
        <span className="mono-label dim">MODULE {String(index + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}</span>
      </div>

      {stage === "content" && (
        <div className="lesson-content">
          <h1 className="lesson-title">{lesson.title}</h1>
          <p className="lesson-tagline">{lesson.tagline}</p>

          <AudioBar chunks={spokenChunks} speech={speech} />

          <div className="diagram-panel">
            <Diagram diagram={lesson.diagram} />
          </div>

          <p className={`lesson-intro ${introActive ? "reading-active" : ""}`}>{lesson.intro}</p>
          <ul className="lesson-bullets">
            {lesson.bullets.map((b, i) => (
              <li key={i} className={activeBulletIndex === i ? "reading-active" : ""}>{b}</li>
            ))}
          </ul>

          <div className={`insight-box ${insightActive ? "reading-active" : ""}`}>
            <span className="mono-label cyan-text">INSIGHT</span>
            <p>{lesson.insight}</p>
          </div>

          <button className="primary-btn full-width" onClick={() => setStage("quiz")}>
            Run validation checks <ChevronRight size={15} />
          </button>
        </div>
      )}

      {stage === "quiz" && (
        <div className="lesson-content">
          <div className="quiz-progress mono-label dim">CHECK {qIndex + 1} / {lesson.quiz.length}</div>
          <h2 className="quiz-question">{q.q}</h2>
          <div className="quiz-options">
            {q.options.map((opt, i) => {
              let cls = "quiz-option";
              if (revealed) {
                if (i === q.correct) cls += " quiz-option-correct";
                else if (i === selected) cls += " quiz-option-incorrect";
                else cls += " quiz-option-dim";
              }
              return (
                <button key={i} className={cls} onClick={() => selectOption(i)}>
                  <span className="quiz-option-marker">{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                  {revealed && i === q.correct && <Check size={16} className="quiz-option-icon" />}
                  {revealed && i === selected && i !== q.correct && <X size={16} className="quiz-option-icon" />}
                </button>
              );
            })}
          </div>
          {revealed && (
            <div className="quiz-note">
              <p>{q.note}</p>
              <button className="primary-btn" onClick={nextQuestion}>
                {qIndex < lesson.quiz.length - 1 ? "Next check" : "See results"} <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {stage === "summary" && (
        <div className="lesson-content summary-content">
          <Sparkles size={32} className="cyan-icon" />
          <h1 className="lesson-title">Validation {correctCount === lesson.quiz.length ? "passed" : "complete"}</h1>
          <p className="lesson-tagline">{correctCount} / {lesson.quiz.length} checks correct{alreadyCompleted ? " \u00b7 already deployed" : ""}</p>
          <button className="primary-btn full-width" onClick={finish}>
            {alreadyCompleted ? "Back to dashboard" : "Deploy module & continue"} <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- STYLES ------------------------------------ */

function GlobalStyle() {
  return (
    <style>{`
      .sda-root {
        --bg: #0a1120;
        --bg-panel: #0f1a2e;
        --bg-panel-raised: #142542;
        --border: #1f3252;
        --border-soft: #17253d;
        --cyan: #5eead4;
        --cyan-dim: #2c5f57;
        --amber: #f5a524;
        --text: #e7edf5;
        --text-dim: #7f92ac;
        --danger: #f87171;
        --font-mono: ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", Menlo, Consolas, monospace;
        --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif;

        background:
          linear-gradient(var(--border-soft) 1px, transparent 1px) 0 0 / 100% 32px,
          linear-gradient(90deg, var(--border-soft) 1px, transparent 1px) 0 0 / 32px 100%,
          var(--bg);
        color: var(--text);
        font-family: var(--font-sans);
        min-height: 100vh;
        width: 100%;
        box-sizing: border-box;
        position: relative;
      }
      .sda-root *, .sda-root *::before, .sda-root *::after { box-sizing: border-box; }
      .sda-root button { font-family: var(--font-sans); cursor: pointer; }
      .sda-root button:disabled { cursor: not-allowed; opacity: 0.5; }
      .sda-root button:focus-visible, .sda-root input:focus-visible {
        outline: 2px solid var(--cyan); outline-offset: 2px;
      }

      .mono-label { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
      .mono-label.dim { color: var(--text-dim); }
      .cyan-text { color: var(--cyan); }
      .cyan-icon { color: var(--cyan); }
      .amber-icon { color: var(--amber); }

      @keyframes spin { to { transform: rotate(360deg); } }
      .spin { animation: spin 1s linear infinite; color: var(--cyan); }

      .loading-screen {
        min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
      }

      /* ---------- Onboarding ---------- */
      .onboarding-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
      .intake-panel {
        width: 100%; max-width: 520px; background: var(--bg-panel); border: 1px solid var(--border);
        border-radius: 10px; padding: 28px; animation: fadeUp 0.4s ease;
      }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .intake-header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
      .intake-progress { display: flex; gap: 6px; margin-bottom: 26px; }
      .intake-step {
        flex: 1; display: flex; flex-direction: column; gap: 4px; padding-bottom: 8px;
        border-bottom: 2px solid var(--border); font-family: var(--font-mono); font-size: 10px;
        letter-spacing: 0.08em; color: var(--text-dim); transition: all 0.25s;
      }
      .intake-step-active { border-color: var(--cyan); color: var(--cyan); }
      .intake-step-num { font-weight: 600; }
      .intake-title { font-size: 22px; font-weight: 600; margin: 0 0 6px; letter-spacing: -0.01em; }
      .intake-sub { color: var(--text-dim); font-size: 14px; margin: 0 0 20px; }
      .intake-input {
        width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 7px;
        padding: 13px 14px; color: var(--text); font-size: 15px;
      }
      .intake-input::placeholder { color: var(--text-dim); }
      .option-grid { display: flex; flex-direction: column; gap: 10px; }
      .option-card {
        text-align: left; background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
        padding: 14px 16px; display: flex; flex-direction: column; gap: 3px; transition: all 0.15s; color: var(--text);
      }
      .option-card:hover { border-color: var(--cyan-dim); }
      .option-card-active { border-color: var(--cyan); background: rgba(94,234,212,0.06); }
      .option-card-label { font-weight: 600; font-size: 14.5px; }
      .option-card-desc { font-size: 12.5px; color: var(--text-dim); }
      .intake-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 26px; }
      .intake-body { min-height: 190px; }

      .auth-tabs { display: flex; gap: 6px; margin-bottom: 22px; background: var(--bg); border: 1px solid var(--border); border-radius: 9px; padding: 4px; }
      .auth-tab { flex: 1; background: transparent; border: none; color: var(--text-dim); font-size: 13px; font-weight: 600; padding: 9px; border-radius: 6px; transition: all 0.15s; }
      .auth-tab-active { background: var(--bg-panel-raised); color: var(--cyan); }
      .auth-error { color: var(--danger); font-size: 12.5px; margin: 12px 0 0; }
      .header-actions { display: flex; gap: 8px; }

      .primary-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        background: var(--cyan); color: #06251f; border: none; border-radius: 7px;
        padding: 12px 18px; font-weight: 600; font-size: 14px; transition: filter 0.15s;
      }
      .primary-btn:hover:not(:disabled) { filter: brightness(1.08); }
      .full-width { width: 100%; margin-top: 20px; }
      .ghost-btn {
        display: inline-flex; align-items: center; gap: 6px; background: transparent; color: var(--text-dim);
        border: 1px solid var(--border); border-radius: 7px; padding: 10px 14px; font-size: 13.5px;
      }
      .ghost-btn:hover { color: var(--text); border-color: var(--cyan-dim); }
      .icon-btn {
        background: transparent; border: 1px solid var(--border); border-radius: 7px; padding: 9px;
        color: var(--text-dim); display: inline-flex;
      }
      .icon-btn:hover { color: var(--text); border-color: var(--cyan-dim); }

      /* ---------- Dashboard ---------- */
      .dashboard-screen { max-width: 720px; margin: 0 auto; padding: 28px 20px 60px; }
      .dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; }
      .dash-title { font-size: 24px; font-weight: 700; margin: 6px 0 0; letter-spacing: -0.01em; }

      .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
      .stat-card {
        background: var(--bg-panel); border: 1px solid var(--border); border-radius: 9px;
        padding: 14px; display: flex; align-items: center; gap: 10px;
      }
      .stat-value { font-family: var(--font-mono); font-size: 19px; font-weight: 700; line-height: 1.1; }
      .stat-label { font-size: 11px; color: var(--text-dim); margin-top: 2px; }

      .progress-bar-track { height: 6px; background: var(--border-soft); border-radius: 4px; overflow: hidden; margin-bottom: 30px; }
      .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--cyan-dim), var(--cyan)); transition: width 0.5s ease; }

      @keyframes flamePulse { 0%,100% { filter: drop-shadow(0 0 0 rgba(245,165,36,0)); } 50% { filter: drop-shadow(0 0 6px rgba(245,165,36,0.7)); } }
      .flame-pulse { animation: flamePulse 1.8s ease-in-out infinite; }

      .map-wrapper { position: relative; width: 100%; }
      .map-connector-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
      .map-line-done { stroke: var(--cyan); stroke-width: 2; }
      .map-line-pending { stroke: var(--border); stroke-width: 2; stroke-dasharray: 4 4; }

      .map-node {
        position: absolute; transform: translate(-50%, -24px); background: transparent; border: none;
        display: flex; align-items: center; gap: 12px; padding: 4px; width: min(78vw, 320px);
      }
      .map-node[style*="left: 16%"], .map-node[style*="left: 84%"] { width: min(60vw, 260px); }
      .map-node-circle {
        flex-shrink: 0; width: 48px; height: 48px; border-radius: 50%; background: var(--bg-panel);
        border: 2px solid var(--border); display: flex; align-items: center; justify-content: center;
        color: var(--text-dim); transition: all 0.2s;
      }
      .map-node-label { text-align: left; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
      .map-node-title { font-weight: 700; font-size: 14.5px; color: var(--text); }
      .map-node-tagline { font-size: 11.5px; color: var(--text-dim); white-space: normal; }
      .map-node-done .map-node-circle { border-color: var(--cyan); color: var(--cyan); background: rgba(94,234,212,0.1); }
      .map-node-current .map-node-circle {
        border-color: var(--amber); color: var(--amber); box-shadow: 0 0 0 4px rgba(245,165,36,0.12);
        animation: currentPulse 2s ease-in-out infinite;
      }
      @keyframes currentPulse { 0%,100% { box-shadow: 0 0 0 4px rgba(245,165,36,0.12); } 50% { box-shadow: 0 0 0 8px rgba(245,165,36,0.05); } }
      .map-node-locked { opacity: 0.62; }
      .map-node-locked .map-node-circle { color: var(--text-dim); }
      .map-node:hover .map-node-circle { border-color: var(--cyan); }

      .dash-footer { margin-top: 20px; text-align: center; }

      /* ---------- Lesson ---------- */
      .lesson-screen { max-width: 640px; margin: 0 auto; padding: 24px 20px 60px; }
      .lesson-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
      .lesson-content { animation: fadeUp 0.35s ease; }
      .lesson-title { font-size: 25px; font-weight: 700; margin: 0 0 4px; letter-spacing: -0.01em; }
      .lesson-tagline { color: var(--text-dim); font-size: 14.5px; margin: 0 0 20px; }
      .audio-bar-wrap { margin-bottom: 18px; }
      .audio-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .audio-btn {
        display: inline-flex; align-items: center; gap: 7px; background: var(--bg-panel);
        border: 1px solid var(--border); border-radius: 20px; padding: 8px 16px; font-size: 13px;
        color: var(--text); transition: all 0.15s;
      }
      .audio-btn:hover { border-color: var(--cyan-dim); }
      .audio-btn-ghost { background: transparent; color: var(--text-dim); padding: 8px 13px; }
      .audio-status { letter-spacing: 0.1em; }
      .rate-pills { display: inline-flex; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 20px; padding: 3px; gap: 2px; }
      .rate-pill { border: none; background: transparent; color: var(--text-dim); font-size: 11.5px; padding: 6px 10px; border-radius: 16px; transition: all 0.15s; }
      .rate-pill-active { background: var(--cyan); color: #06251f; font-weight: 600; }
      .audio-progress-track { height: 3px; background: var(--border-soft); border-radius: 3px; overflow: hidden; margin-top: 8px; }
      .audio-progress-fill { height: 100%; background: var(--cyan); transition: width 0.4s ease; }

      .reading-active { position: relative; transition: background 0.3s ease; }
      p.reading-active {
        background: rgba(94,234,212,0.07); border-radius: 6px; padding: 6px 10px; margin-left: -10px; margin-right: -10px;
      }
      li.reading-active {
        background: rgba(94,234,212,0.07); border-radius: 6px; padding: 4px 8px; margin: -4px -8px;
      }
      .insight-box.reading-active { border-color: var(--cyan); background: rgba(94,234,212,0.09); }

      .diagram-panel {
        background: var(--bg-panel); border: 1px solid var(--border); border-radius: 10px;
        padding: 10px; margin-bottom: 22px;
      }
      .diagram-svg { width: 100%; height: auto; display: block; }
      .diagram-box { fill: var(--bg-panel-raised); stroke: var(--border); stroke-width: 1.5; }
      .diagram-box-primary { stroke: var(--cyan); }
      .diagram-line { stroke: var(--cyan-dim); stroke-width: 1.6; }
      .diagram-arrowhead { fill: var(--cyan-dim); }
      .diagram-label {
        width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; text-align: center;
        font-family: var(--font-mono); font-size: 11px; color: var(--text); padding: 4px 8px; line-height: 1.25;
      }
      .diagram-label-lg { font-size: 13px; font-weight: 600; }
      .diagram-vs { fill: var(--text-dim); font-family: var(--font-mono); font-size: 13px; }
      .diagram-triangle { fill: rgba(94,234,212,0.04); stroke: var(--border); stroke-width: 1.5; }
      .diagram-ring { fill: none; stroke: var(--border); stroke-width: 1.5; stroke-dasharray: 3 4; }
      .diagram-hub { fill: var(--cyan); }
      .diagram-node-ring { fill: var(--bg-panel-raised); stroke: var(--cyan); stroke-width: 1.5; }
      .diagram-node-text { fill: var(--cyan); font-family: var(--font-mono); font-weight: 700; font-size: 16px; }
      .diagram-node-text-sm { fill: var(--cyan); font-family: var(--font-mono); font-weight: 700; font-size: 11px; }
      .diagram-caption { fill: var(--text-dim); font-family: var(--font-mono); font-size: 11px; }
      .diagram-caption-sm { fill: var(--text-dim); font-family: var(--font-mono); font-size: 9.5px; }

      .lesson-intro { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
      .lesson-bullets { margin: 0 0 20px; padding-left: 18px; display: flex; flex-direction: column; gap: 10px; }
      .lesson-bullets li { font-size: 14px; line-height: 1.55; color: var(--text); }
      .insight-box {
        background: rgba(94,234,212,0.05); border: 1px solid var(--cyan-dim); border-radius: 9px;
        padding: 14px 16px; margin-bottom: 8px;
      }
      .insight-box p { margin: 6px 0 0; font-size: 13.5px; line-height: 1.55; }

      .quiz-progress { margin-bottom: 10px; }
      .quiz-question { font-size: 19px; font-weight: 650; line-height: 1.4; margin: 0 0 18px; }
      .quiz-options { display: flex; flex-direction: column; gap: 9px; }
      .quiz-option {
        display: flex; align-items: center; gap: 12px; text-align: left; background: var(--bg-panel);
        border: 1px solid var(--border); border-radius: 8px; padding: 13px 14px; color: var(--text); font-size: 14px;
        transition: all 0.15s;
      }
      .quiz-option:hover:not(:disabled) { border-color: var(--cyan-dim); }
      .quiz-option-marker {
        font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); border: 1px solid var(--border);
        border-radius: 4px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .quiz-option-correct { border-color: var(--cyan); background: rgba(94,234,212,0.08); }
      .quiz-option-incorrect { border-color: var(--danger); background: rgba(248,113,113,0.08); }
      .quiz-option-dim { opacity: 0.45; }
      .quiz-option-icon { margin-left: auto; flex-shrink: 0; }
      .quiz-note {
        margin-top: 18px; padding-top: 16px; border-top: 1px dashed var(--border);
        display: flex; flex-direction: column; gap: 14px; align-items: flex-start;
      }
      .quiz-note p { margin: 0; font-size: 13.5px; color: var(--text-dim); line-height: 1.55; }

      .summary-content { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 30px; }
      .summary-content .lesson-title { margin-top: 14px; }

      @media (max-width: 480px) {
        .stats-row { grid-template-columns: 1fr; }
        .map-node { width: min(72vw, 300px) !important; }
        .intake-panel { padding: 20px; }
      }
    `}</style>
  );
}
