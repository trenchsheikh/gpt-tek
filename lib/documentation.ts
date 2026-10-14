export type DocSection = { id: string; title: string; paragraphs?: string[]; steps?: string[]; note?: string; code?: string; table?: {headers: string[]; rows: string[][]}; link?: {label: string; href: string} };
export type DocPage = {slug: string; group: string; title: string; description: string; sections: DocSection[]};
export const documentation: DocPage[] = [
  {
    "slug": "overview",
    "group": "Start here",
    "title": "Introduction",
    "description": "A technical guide to building, evaluating and sharing multimodel trading agents.",
    "sections": [
      {
        "id": "what-is-agentrouter",
        "title": "What is AgentRouter?",
        "paragraphs": [
          "AgentRouter turns a trading strategy into a structured agent blueprint. An agent assigns AI models to research, reasoning, decision and execution-planning roles, alongside explicit market, integration and risk settings.",
          "The builder helps you configure this blueprint through a guided conversation. Saving a blueprint creates a private draft in My agents. Testing, publishing and renting are separate actions with server-side eligibility checks."
        ]
      },
      {
        "id": "system-boundaries",
        "title": "System boundaries",
        "table": {
          "headers": [
            "Layer",
            "Responsibility"
          ],
          "rows": [
            [
              "Builder",
              "Collect market, strategy and risk preferences; recommend models and explain each role."
            ],
            [
              "Inference",
              "Run chosen models through OpenRouter, including optional prompt-based Auto Router selection."
            ],
            [
              "Market data",
              "Retrieve supported public feeds. A data feed does not authorize trading."
            ],
            [
              "Execution",
              "Validate supported trade requests and prepare swaps for wallet approval."
            ],
            [
              "Marketplace",
              "Store drafts, enforce listing eligibility and verify time-limited rental access."
            ]
          ]
        },
        "note": "An AI report is not an executed trade. Research-only integrations do not support order placement."
      },
      {
        "id": "reading-guide",
        "title": "Where to begin",
        "paragraphs": [
          "Start with Quickstart to build your first blueprint. Architecture explains the request lifecycle. Model routing covers fixed model assignments and OpenRouter Auto Router. Integrations and Rentals document the available capabilities and payment flow."
        ]
      }
    ]
  },
  {
    "slug": "quickstart",
    "group": "Start here",
    "title": "Quickstart",
    "description": "Create an agent with a clear market, a bounded strategy and a model for every role.",
    "sections": [
      {
        "id": "connect",
        "title": "Connect and sign in",
        "paragraphs": [
          "Open the app and sign in using Phantom or Solflare. The wallet signs a one-time authentication message, creating an account session without requesting a payment or trade.",
          "Connecting a wallet and signing in serve different purposes. Connect wallet makes the wallet available for approval flows; sign-in establishes ownership of chats and drafts. On mobile, use the wallet's in-app browser."
        ]
      },
      {
        "id": "build",
        "title": "Build your blueprint",
        "steps": [
          "Describe the market and strategy: memecoins, perps, spot, prediction markets, DeFi, arbitrage, portfolio management or market research.",
          "Choose risk appetite, research scope, time horizon and maximum trade size in the guided replies.",
          "Review the recommended models and the reason for each choice. In Configure → AI models, select a fixed model or search for Auto Router.",
          "In Configure → Platform connection, choose a supported data feed and a token, symbol or event keyword.",
          "Set an agent name, avatar, colour and hourly rental price. Finish the guided review and save the draft."
        ]
      },
      {
        "id": "evaluate",
        "title": "Evaluate before publishing",
        "paragraphs": [
          "Use My agents to run the workflow and review its reports. Spot paper tests use forward price snapshots; other supported markets produce read-only research reports. The app requires model access credentials for inference, independently of builder access.",
          "Publishing requires five recorded forward paper tests and a supported live-trading configuration. Research reports do not count toward this requirement. Five tests establish a recorded history, not a guarantee of performance."
        ]
      }
    ]
  },
  {
    "slug": "architecture",
    "group": "Core concepts",
    "title": "Architecture",
    "description": "How user input becomes a validated blueprint, a model report and a wallet-approved action.",
    "sections": [
      {
        "id": "request-lifecycle",
        "title": "Request lifecycle",
        "steps": [
          "The browser sends a same-origin request to the relevant API route.",
          "The server verifies the account session, resource ownership or active rental entitlement, and applicable usage limits.",
          "Request schemas validate the payload before database access or external provider calls.",
          "The server retrieves market evidence and runs each assigned model role in sequence.",
          "Outputs are validated before storing a report or preparing a supported trade. The wallet must approve real execution."
        ]
      },
      {
        "id": "builder",
        "title": "Builder state",
        "paragraphs": [
          "Successful builder turns are saved as a user/assistant pair with the blueprint, model rationales and guided preferences. Revision checks prevent concurrent writes from silently overwriting the same chat.",
          "Each app visit starts a new conversation. Saved chats remain account-scoped in the sidebar. Failed turns do not become persisted chat messages.",
          "The strategy architect is separate from the agent's inference pipeline. Changing a role to Auto Router affects that role during agent runs; it does not replace the builder's configured provider."
        ]
      },
      {
        "id": "role-pipeline",
        "title": "Role pipeline",
        "table": {
          "headers": [
            "Role",
            "Input",
            "Output"
          ],
          "rows": [
            [
              "Research",
              "Strategy and supplied market snapshot",
              "Evidence summary and missing information"
            ],
            [
              "Reasoning",
              "Snapshot and prior report",
              "Concise thesis and downside scenarios"
            ],
            [
              "Decision",
              "Context, balances and maximum trade size",
              "Validated buy, sell or hold decision for supported spot workflows"
            ],
            [
              "Execution planning",
              "Validated decision and risk settings",
              "Human-readable plan; no signing privilege"
            ]
          ]
        }
      },
      {
        "id": "storage",
        "title": "Storage and trust boundaries",
        "paragraphs": [
          "The server stores agents, rentals, paper runs, trade intents, authentication challenges and builder chats in PostgreSQL. Private records are queried through authenticated server routes with ownership checks.",
          "Provider credentials remain on the server or, for a user-supplied inference key, in the current page's memory until a requested run sends it to the server. The app does not request seed phrases or wallet private keys."
        ]
      }
    ]
  },
  {
    "slug": "model-routing",
    "group": "Core concepts",
    "title": "Model routing",
    "description": "Assign fixed models or route each role by its task and prompt using OpenRouter Auto Router.",
    "sections": [
      {
        "id": "fixed-and-auto",
        "title": "Fixed assignments and Auto Router",
        "paragraphs": [
          "A fixed assignment sends a role's request to the chosen model ID. Auto Router uses the model ID openrouter/auto, allowing OpenRouter to select an underlying model based on the submitted task and prompt.",
          "Use Configure → AI models to open a role's model selector and search for Auto Router. You can mix routing modes: for example, auto-route research while keeping a fixed decision model.",
          "The selectable catalogue comes from OpenRouter's live text-model endpoint. Catalogue size changes as models appear or retire. Auto Router is a routing option, not an additional underlying model."
        ]
      },
      {
        "id": "selection",
        "title": "What is routed?",
        "paragraphs": [
          "AgentRouter sends the role instructions, strategy and available context as messages. OpenRouter evaluates the request and selects from its eligible routing pool. That pool is distinct from the complete catalogue.",
          "Auto routing does not change the agent's market, integrations, spending limits or signing permissions. A model recommendation cannot add data or execution capabilities.",
          "The selected model may differ across roles or subsequent requests. Reproducibility-sensitive workflows can pin specific models instead."
        ]
      },
      {
        "id": "request-shape",
        "title": "Server-side request",
        "code": "POST https://openrouter.ai/api/v1/chat/completions\nAuthorization: Bearer <server-or-user-model-key>\nContent-Type: application/json\n\n{\n  \"model\": \"openrouter/auto\",\n  \"messages\": [\n    {\"role\": \"system\", \"content\": \"Bounded research instructions\"},\n    {\"role\": \"user\", \"content\": \"Strategy, evidence and research task\"}\n  ],\n  \"max_tokens\": 1800\n}",
        "paragraphs": [
          "This example shows the upstream provider request, not a public AgentRouter endpoint. Credentials belong in server-side requests. OpenRouter's response model field identifies the underlying model; the saved blueprint retains openrouter/auto as the configured routing mode."
        ]
      },
      {
        "id": "constraints",
        "title": "Costs and constraints",
        "paragraphs": [
          "Auto Router pricing follows the selected underlying model. Its effective context window and capabilities also depend on that selection. AgentRouter therefore shows variable pricing for this routing option.",
          "Model access must be configured in the platform or supplied in Settings. The router does not guarantee a profitable strategy, the cheapest possible answer or successful order execution."
        ],
        "link": {
          "label": "OpenRouter Auto Router reference",
          "href": "https://openrouter.ai/docs/guides/routing/routers/auto-router"
        }
      }
    ]
  },
  {
    "slug": "agent-blueprint",
    "group": "Core concepts",
    "title": "Agent blueprint",
    "description": "The typed configuration that defines an agent's strategy, model roles and permitted behaviour.",
    "sections": [
      {
        "id": "fields",
        "title": "Configuration fields",
        "table": {
          "headers": [
            "Field",
            "Meaning",
            "Validation"
          ],
          "rows": [
            [
              "name",
              "Creator-defined agent name",
              "3–60 characters"
            ],
            [
              "description",
              "Public summary",
              "10–300 characters"
            ],
            [
              "strategy",
              "Private strategy instructions",
              "30–8,000 characters"
            ],
            [
              "models",
              "Research, reasoning, decision, execution IDs",
              "Currently selectable model or Auto Router"
            ],
            [
              "maxTradeUsd",
              "Maximum proposed trade size",
              "$1–$10,000"
            ],
            [
              "slippageBps",
              "Allowed slippage setting",
              "10–100 basis points"
            ],
            [
              "stopLossPct",
              "Strategy risk parameter",
              "1–30%"
            ],
            [
              "market / integration / target",
              "Market and evidence configuration",
              "Supported names; target up to 80 characters"
            ]
          ]
        }
      },
      {
        "id": "risk",
        "title": "Risk controls",
        "paragraphs": [
          "The server validates proposed decisions against configured trade limits and available balances. Unsupported integrations are rejected before orders are prepared.",
          "Stop-loss percentage is a strategy parameter. It is not an always-running exchange stop order or an unattended exit guarantee. Slippage limits apply to supported swap preparation; execution still depends on the wallet and network."
        ]
      },
      {
        "id": "identity",
        "title": "Identity and persistence",
        "paragraphs": [
          "Creators choose an avatar and colour independently of strategy configuration. Saving associates the agent with the authenticated creator wallet.",
          "A saved blueprint is a reusable configuration, not newly trained model weights. Builder conversations refine instructions and settings. Model training, fine-tuning and continuous learning are not part of the current save workflow."
        ]
      }
    ]
  },
  {
    "slug": "integrations",
    "group": "Using agents",
    "title": "Platform integrations",
    "description": "Understand the difference between public market evidence, terminal links and authenticated execution.",
    "sections": [
      {
        "id": "capabilities",
        "title": "Capability matrix",
        "table": {
          "headers": [
            "Platform",
            "Available capability",
            "Execution"
          ],
          "rows": [
            [
              "Solana swaps",
              "Coinbase SOL/USD evidence; supported SOL/USDC workflow",
              "Wallet-approved swaps when routing credentials are configured"
            ],
            [
              "DEX Screener",
              "Public Solana pair research",
              "No order placement"
            ],
            [
              "Hyperliquid",
              "Public perpetual market context",
              "No authenticated perp orders"
            ],
            [
              "Polymarket",
              "Public active-event research",
              "No authenticated prediction-market orders"
            ],
            [
              "Axiom / GMGN / Pump.fun / Fomo",
              "Terminal links and DEX Screener-backed public research",
              "No terminal account authorization"
            ],
            [
              "Kalshi",
              "External platform link",
              "No connected API adapter"
            ]
          ]
        }
      },
      {
        "id": "connect",
        "title": "Select and inspect a feed",
        "steps": [
          "Open Configure → Platform connection in the blueprint panel.",
          "Choose a platform or data feed and enter a supported token symbol, address or event keyword.",
          "Use Check live feed to inspect current public evidence. Opening a terminal only navigates to that provider.",
          "Save the integration on your draft. Listed agents must be unlisted before creators change the saved integration."
        ]
      },
      {
        "id": "evidence",
        "title": "Evidence limitations",
        "paragraphs": [
          "Every feed has a source and a limited scope. Token pair data does not establish a full holder audit or verified bonding-curve coverage. Prediction-market listings do not supply independent evidence for an event outcome.",
          "Research workflows cannot place orders. The model is instructed to report missing information rather than invent evidence. A renter's per-run research selection does not overwrite the creator's stored strategy."
        ]
      }
    ]
  },
  {
    "slug": "testing",
    "group": "Using agents",
    "title": "Testing and execution",
    "description": "Recorded paper tests, research-only runs and the approval boundary for real swaps.",
    "sections": [
      {
        "id": "paper",
        "title": "Forward paper tests",
        "paragraphs": [
          "Supported spot paper tests evaluate a strategy using the current SOL price snapshot and simulated balances. Runs record the decision, reports and resulting paper balance. The simulation includes its configured fee assumption.",
          "These are forward tests, not a historical backtest or an executed trade. A single price feed cannot establish comprehensive market coverage. Review the report and assumptions alongside any result."
        ]
      },
      {
        "id": "research",
        "title": "Research-only runs",
        "paragraphs": [
          "Other supported market feeds run the four model roles to produce research reports. The result holds without placing a trade. These records are labelled research and do not count toward the listing threshold.",
          "Use research reports to inspect sources, contradictions and model rationale. Do not interpret their placeholder accounting fields as simulated investment returns."
        ]
      },
      {
        "id": "execute",
        "title": "Live execution",
        "steps": [
          "Request a supported decision using current evidence and available balances.",
          "The server validates the result and supported market configuration.",
          "Prepare a quote and inspect the transaction details, amount and slippage.",
          "Approve the transaction in your wallet. Confirmation is separate from inference or quote preparation."
        ],
        "note": "AgentRouter cannot sign on your behalf. Routing credentials, funds, account access and a supported integration are prerequisites for real swaps."
      }
    ]
  },
  {
    "slug": "rentals",
    "group": "Using agents",
    "title": "Marketplace and rentals",
    "description": "Listing eligibility, hourly pricing, token settlement and time-limited agent access.",
    "sections": [
      {
        "id": "listing",
        "title": "Listing an agent",
        "paragraphs": [
          "Agents begin as private drafts. To publish, the creator must have a supported trading configuration and at least five recorded forward paper tests. A research-only integration cannot be listed for live-trading rentals.",
          "Marketplace cards display the public description, model assignments, configured limits, creator and recorded test count. Private strategy text is not returned in the public listing response."
        ]
      },
      {
        "id": "payment",
        "title": "Rental lifecycle",
        "steps": [
          "Choose an agent and a rental duration from 1 to 168 hours.",
          "Review the hourly $AGENT rate, total and creator recipient before approving payment.",
          "The server verifies the on-chain transfer against the expected mint, sender, recipient, amount and rental reference.",
          "Verified payment activates access. The server checks the rental's expiry on protected agent operations."
        ],
        "paragraphs": [
          "Rental payments go to the creator. SOL is needed for network fees. Token checkout depends on the project's configured token mint and launch settings; it remains unavailable before those are ready."
        ]
      },
      {
        "id": "access",
        "title": "Access boundaries",
        "paragraphs": [
          "A rental grants time-limited use of the agent through authorized operations. It does not transfer the creator's wallet, private key or strategy ownership.",
          "Payment replay prevention and expiry checks happen on the server. A connected browser wallet does not bypass entitlement checks or expand the agent's execution permissions."
        ]
      }
    ]
  },
  {
    "slug": "security",
    "group": "Reference",
    "title": "Security and privacy",
    "description": "Authentication, ownership checks, model guardrails and credential handling.",
    "sections": [
      {
        "id": "auth",
        "title": "Wallet authentication",
        "paragraphs": [
          "Authentication uses an expiring server-issued challenge signed by the selected wallet. The challenge is consumed during verification. The resulting session identifies the account that owns private chats and agents.",
          "Wallet signatures for authentication are separate from payment or swap approvals. AgentRouter does not ask for seed phrases or wallet private keys."
        ]
      },
      {
        "id": "guardrails",
        "title": "Model guardrails",
        "paragraphs": [
          "Builder requests are constrained to trading strategies, market selection, model configuration and risk settings. Structured response validation rejects malformed blueprints and unavailable model choices.",
          "Public market evidence and strategy text are treated as untrusted input. Models have no signing capability. Schema checks and deterministic execution limits provide enforcement beyond prompt instructions.",
          "Prompt safeguards reduce misuse but cannot guarantee that every possible adversarial input will be recognized. The server continues to validate outputs and authorization independently."
        ]
      },
      {
        "id": "privacy",
        "title": "Private data and credentials",
        "paragraphs": [
          "Saved chats and drafts are account-scoped. Database credentials and platform provider keys are server-side configuration. A user-supplied model key is held in page memory, sent only for requested inference and cleared on reload.",
          "Selected providers receive the messages and context required for a requested model run. Provider retention and processing policies are separate from AgentRouter's storage behaviour. Do not include unnecessary personal information in strategy prompts."
        ]
      }
    ]
  },
  {
    "slug": "api-reference",
    "group": "Reference",
    "title": "API reference",
    "description": "The application's same-origin HTTP routes and their authorization boundaries.",
    "sections": [
      {
        "id": "routes",
        "title": "Route index",
        "table": {
          "headers": [
            "Route",
            "Method",
            "Access / purpose"
          ],
          "rows": [
            [
              "/api/models",
              "GET",
              "Public model catalogue plus Auto Router option"
            ],
            [
              "/api/status",
              "GET",
              "Public capability flags, not credentials"
            ],
            [
              "/api/challenge",
              "POST",
              "Issue a wallet authentication challenge"
            ],
            [
              "/api/builder",
              "POST",
              "Signed-in guided builder request"
            ],
            [
              "/api/chats",
              "GET",
              "Signed-in owner-scoped conversation history"
            ],
            [
              "/api/agents",
              "GET / POST / PATCH",
              "Public listings; owner-scoped drafts and mutations"
            ],
            [
              "/api/integrations",
              "GET / POST",
              "Public capability list; signed-in public-feed check"
            ],
            [
              "/api/paper",
              "POST",
              "Owner or active renter; paper or research workflow"
            ],
            [
              "/api/decide",
              "POST",
              "Authorized supported trade analysis"
            ],
            [
              "/api/trade",
              "POST",
              "Authorized supported transaction preparation"
            ],
            [
              "/api/rentals",
              "GET / POST",
              "Signed-in rental management and verification"
            ]
          ]
        }
      },
      {
        "id": "requests",
        "title": "Request conventions",
        "paragraphs": [
          "Private routes require the application's account session. Mutation requests must originate from the same origin. Use JSON bodies with Content-Type: application/json.",
          "These routes power the browser application; they are not an API-key-based public developer service. Agent and chat identifiers do not grant access by themselves."
        ]
      },
      {
        "id": "errors",
        "title": "Errors and retries",
        "table": {
          "headers": [
            "Condition",
            "Behaviour"
          ],
          "rows": [
            [
              "Missing session",
              "Authentication error; sign in before retrying"
            ],
            [
              "Invalid input",
              "Actionable validation error; correct the fields"
            ],
            [
              "Unavailable model or upstream provider",
              "Request fails without preparing a trade"
            ],
            [
              "Unsupported execution platform",
              "Choose a research workflow or supported swap configuration"
            ],
            [
              "Expired rental",
              "Protected agent operation denied"
            ],
            [
              "Invalid builder output",
              "One repair attempt; unsuccessful turns are not persisted"
            ]
          ]
        },
        "paragraphs": [
          "Usage limits apply per route and account. Retry transient provider errors without resubmitting payments or blindly approving another transaction."
        ]
      }
    ]
  }
];
