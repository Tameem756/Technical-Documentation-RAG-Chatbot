"use client";

import { useEffect, useRef, useState } from "react";

import {
  ArrowUp,
  BookOpen,
  FileText,
  Home,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  UploadCloud,
  LoaderCircle,
  Library,
  MessageSquare,
  X,
  Copy,
  Check,
  Database,
  Pencil,
  Trash2,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// TYPES

type Source = string | Record<string, unknown>;

type Message = {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

type Doc = {
  name: string;
  size: number;
  date: string;
};

// SUGGESTED QUESTIONS

const prompts = [
  [
    "Summarize the documentation",
    "Summarize the key points in the uploaded documentation.",
  ],
  [
    "Explain the architecture",
    "Explain the system architecture described in the documents.",
  ],
  [
    "Find API endpoints",
    "List and explain the API endpoints mentioned in the documentation.",
  ],
  [
    "Explore technical concepts",
    "Explain the most important technical concepts in the documentation.",
  ],
];

// HELPER FUNCTIONS

function newChat(): Chat {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
  };
}

async function request(
  path: string,
  options?: RequestInit
): Promise<unknown> {
  const response = await fetch(
    "/api/" + path,
    options
  );

  const raw = await response.text();

  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }

  if (!response.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : JSON.stringify(data)
    );
  }

  return data;
}

function record(
  value: unknown
): Record<string, unknown> {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  return JSON.stringify(value, null, 2) ?? "";
}

function getSources(value: unknown): Source[] {
  const data = record(value);
  const nested = record(data.data);

  const sources =
    data.sources ??
    data.source_documents ??
    data.citations ??
    data.results ??
    data.documents ??
    nested.sources ??
    nested.results ??
    nested.documents ??
    (Array.isArray(data.data)
      ? data.data
      : undefined) ??
    (Array.isArray(value) ? value : []);

  if (Array.isArray(sources)) {
    return sources.map((source) =>
      typeof source === "string"
        ? source
        : record(source)
    );
  }

  return sources
    ? [
        typeof sources === "string"
          ? sources
          : record(sources),
      ]
    : [];
}

function getAnswer(value: unknown): string {
  const data = record(value);
  const nested = record(data.data);

  return asText(
    data.answer ??
      data.response ??
      data.result ??
      data.output ??
      data.message ??
      nested.answer ??
      nested.response ??
      value
  );
}

function getFilename(source: Source): string {
  const data = record(source);
  const metadata = record(data.metadata);

  return asText(
    metadata.source ??
      data.source ??
      data.filename ??
      data.file_name ??
      metadata.filename ??
      (typeof source === "string"
        ? source
        : "Retrieved document")
  );
}

// SOURCE CARD

function SourceCard({
  source,
  index,
}: {
  source: Source;
  index: number;
}) {
  const data = record(source);
  const metadata = record(data.metadata);

  const filename = getFilename(source)
    .split(/[/\\]/)
    .pop();

  const content = asText(
    data.content ??
      data.page_content ??
      data.text ??
      data.chunk_text ??
      ""
  );

  const chunk = metadata.chunk ?? data.chunk;

  return (
    <details className="source-card">
      <summary>
        <div className="source-file-icon">
          <FileText size={20} />
        </div>

        <div className="source-info">
          <strong>{filename}</strong>

          <div className="source-meta">
            <span>PDF Document</span>

            {chunk != null && (
              <span>
                Chunk {asText(chunk)}
              </span>
            )}

            <span>Passage {index + 1}</span>
          </div>

          {content && (
            <p className="source-preview">
              {content.slice(0, 150)}

              {content.length > 150
                ? "..."
                : ""}
            </p>
          )}
        </div>

        <span className="source-expand">
          +
        </span>
      </summary>

      <div className="source-content">
        <h4>Retrieved Passage</h4>

        <p>
          {content ||
            "Passage text was not included in this response."}
        </p>
      </div>
    </details>
  );
}

// GROUPED DOCUMENT SOURCES

function GroupedSources({
  sources,
}: {
  sources: Source[];
}) {
  const groups = new Map<string, Source[]>();

  sources.forEach((source) => {
    const filename = getFilename(source);

    const existing = groups.get(filename) ?? [];

    existing.push(source);

    groups.set(filename, existing);
  });

  return (
    <div className="grouped-sources">
      {Array.from(groups.entries()).map(
        ([filename, chunks]) => (
          <details
            className="document-source-group"
            key={filename}
          >
            <summary>
              <div className="source-file-icon">
                <FileText size={22} />
              </div>

              <div className="group-info">
                <strong>
                  {filename
                    .split(/[/\\]/)
                    .pop()}
                </strong>

                <small>
                  {chunks.length} retrieved{" "}
                  {chunks.length === 1
                    ? "passage"
                    : "passages"}
                </small>
              </div>

              <span className="source-expand">
                +
              </span>
            </summary>

            <div className="group-passages">
              {chunks.map((source, index) => (
                <SourceCard
                  key={index}
                  source={source}
                  index={index}
                />
              ))}
            </div>
          </details>
        )
      )}
    </div>
  );
}

// MAIN PAGE COMPONENT

export default function Page() {
  const [chats, setChats] = useState<Chat[]>([]);

  const [active, setActive] = useState("");

  const [docs, setDocs] = useState<Doc[]>([]);

  const [ready, setReady] = useState(false);

  const [collapsed, setCollapsed] =
    useState(false);

  const [view, setView] = useState<
    "chat" | "docs" | "search"
  >("chat");

  const [input, setInput] = useState("");

  const [busy, setBusy] = useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] = useState("");

  const [online, setOnline] =
    useState<boolean | null>(null);

  const [results, setResults] =
    useState<Source[] | null>(null);

  const [copied, setCopied] = useState("");

  const picker = useRef<HTMLInputElement>(null);

  const bottom = useRef<HTMLDivElement>(null);

  const current = chats.find(
    (chat) => chat.id === active
  );

  const messages = current?.messages ?? [];

  // INITIALIZE BROWSER STORAGE

  useEffect(() => {
    let savedChats: Chat[] = [];
    let savedDocs: Doc[] = [];
    let selected = "";

    try {
      const storedChats = JSON.parse(
        localStorage.getItem(
          "documind-chats"
        ) || "[]"
      );

      const storedDocs = JSON.parse(
        localStorage.getItem(
          "documind-docs"
        ) || "[]"
      );

      savedChats = Array.isArray(storedChats)
        ? storedChats
        : [];

      savedDocs = Array.isArray(storedDocs)
        ? storedDocs
        : [];

      selected =
        localStorage.getItem(
          "documind-active"
        ) || "";
    } catch {
      savedChats = [];
      savedDocs = [];
    }

    if (!savedChats.length) {
      savedChats = [newChat()];
    }

    setChats(savedChats);

    setDocs(savedDocs);

    setActive(
      savedChats.some(
        (chat) => chat.id === selected
      )
        ? selected
        : savedChats[0].id
    );

    setReady(true);

    fetch("/api/health")
      .then((response) =>
        setOnline(response.ok)
      )
      .catch(() => setOnline(false));
  }, []);

  // SAVE CHAT HISTORY AND DOCUMENT LIST

  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem(
        "documind-chats",
        JSON.stringify(chats)
      );

      localStorage.setItem(
        "documind-docs",
        JSON.stringify(docs)
      );

      localStorage.setItem(
        "documind-active",
        active
      );
    } catch {
      setError(
        "Browser storage is unavailable or full."
      );
    }
  }, [chats, docs, active, ready]);

  // AUTOMATIC SCROLL

  useEffect(() => {
    if (view === "chat") {
      bottom.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [chats, busy, active, view]);

  // CREATE NEW CHAT

  function startChat() {
    if (!ready) return;

    const chat = newChat();

    setChats((old) => [chat, ...old]);

    setActive(chat.id);

    setView("chat");

    setInput("");

    setError("");
  }

  // RENAME CHAT

  function renameChat(id: string) {
    const chat = chats.find(
      (item) => item.id === id
    );

    if (!chat) return;

    const title = window.prompt(
      "Rename conversation",
      chat.title
    );

    if (!title?.trim()) return;

    setChats((old) =>
      old.map((item) =>
        item.id === id
          ? {
              ...item,
              title: title.trim(),
            }
          : item
      )
    );
  }

  // DELETE CHAT

  function deleteChat(id: string) {
    if (busy) return;

    const confirmed = window.confirm(
      "Delete this conversation?"
    );

    if (!confirmed) return;

    const remaining = chats.filter(
      (chat) => chat.id !== id
    );

    if (!remaining.length) {
      const fresh = newChat();

      setChats([fresh]);

      setActive(fresh.id);
    } else {
      setChats(remaining);

      if (active === id) {
        setActive(remaining[0].id);
      }
    }

    setView("chat");

    setError("");

    setInput("");
  }

  // PDF UPLOAD

  async function upload(
    files: FileList | null
  ) {
    if (
      !files?.length ||
      uploading ||
      !ready
    ) {
      return;
    }

    setUploading(true);

    setError("");

    const failures: string[] = [];

    for (const file of Array.from(files)) {
      if (
        !file.name
          .toLowerCase()
          .endsWith(".pdf")
      ) {
        failures.push(
          `${file.name}: Only PDF files are supported.`
        );

        continue;
      }

      try {
        const form = new FormData();

        form.append("file", file);

        await request("upload", {
          method: "POST",
          body: form,
        });

        setDocs((old) => [
          {
            name: file.name,
            size: file.size,
            date: new Date().toISOString(),
          },

          ...old.filter(
            (doc) => doc.name !== file.name
          ),
        ]);

        setOnline(true);
      } catch (err) {
        failures.push(
          `${file.name}: ${
            err instanceof Error
              ? err.message
              : String(err)
          }`
        );
      }
    }

    setError(failures.join("\n"));

    setUploading(false);

    if (picker.current) {
      picker.current.value = "";
    }
  }

  // SEND QUESTION OR SEARCH

  async function send(value = input) {
    const question = value.trim();

    if (
      !question ||
      busy ||
      !ready ||
      uploading
    ) {
      return;
    }

    setInput("");

    setError("");

    setBusy(true);

    // SEMANTIC SEARCH

    if (view === "search") {
      setResults(null);

      try {
        const data = await request(
          "search?query=" +
            encodeURIComponent(question)
        );

        setResults(getSources(data));

        setOnline(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : String(err)
        );

        setInput(question);
      } finally {
        setBusy(false);
      }

      return;
    }

    // RAG CHAT

    const id = active;

    const userMessage: Message = {
      role: "user",
      text: question,
    };

    setChats((old) =>
      old.map((chat) =>
        chat.id === id
          ? {
              ...chat,

              title: chat.messages.length
                ? chat.title
                : question.slice(0, 45),

              messages: [
                ...chat.messages,
                userMessage,
              ],
            }
          : chat
      )
    );

    try {
      const data = await request("chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          question,
        }),
      });

      const assistantMessage: Message = {
        role: "assistant",
        text: getAnswer(data),
        sources: getSources(data),
      };

      setChats((old) =>
        old.map((chat) =>
          chat.id === id
            ? {
                ...chat,

                messages: [
                  ...chat.messages,
                  assistantMessage,
                ],
              }
            : chat
        )
      );

      setOnline(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : String(err)
      );

      setChats((old) =>
        old.map((chat) =>
          chat.id === id
            ? {
                ...chat,

                messages:
                  chat.messages.slice(0, -1),
              }
            : chat
        )
      );

      setInput(question);
    } finally {
      setBusy(false);
    }
  }

  function uploadButton() {
    picker.current?.click();
  }

  function nav(
    target: "chat" | "docs" | "search"
  ) {
    setView(target);

    setError("");

    setInput("");
  }

  // DASHBOARD UI

  return (
    <div
      className={`workspace ${
        collapsed ? "collapsed" : ""
      }`}
    >
      <input
        ref={picker}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(event) =>
          void upload(event.target.files)
        }
      />

      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <BookOpen size={21} />
          </div>

          <div className="nav-label">
            <strong>DocuMind</strong>

            <small>
              Knowledge workspace
            </small>
          </div>

          <button
            className="icon-button collapse"
            aria-label="Toggle sidebar"
            onClick={() =>
              setCollapsed(!collapsed)
            }
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>
        </div>

        {/* NAVIGATION */}

        <nav>
          <button
            className={
              view === "chat"
                ? "nav active"
                : "nav"
            }
            onClick={() => nav("chat")}
            title="Home"
          >
            <Home size={18} />

            <span className="nav-label">
              Home
            </span>
          </button>

          <button
            className="nav"
            onClick={startChat}
            title="New Chat"
          >
            <MessageSquarePlus size={18} />

            <span className="nav-label">
              New Chat
            </span>
          </button>

          <button
            className="nav"
            onClick={uploadButton}
            disabled={uploading}
            title="Upload PDF"
          >
            {uploading ? (
              <LoaderCircle
                className="spin"
                size={18}
              />
            ) : (
              <UploadCloud size={18} />
            )}

            <span className="nav-label">
              Upload PDF
            </span>
          </button>

          <button
            className={
              view === "docs"
                ? "nav active"
                : "nav"
            }
            onClick={() => nav("docs")}
            title="My Documents"
          >
            <Library size={18} />

            <span className="nav-label">
              My Documents
            </span>
          </button>

          <button
            className={
              view === "search"
                ? "nav active"
                : "nav"
            }
            onClick={() => nav("search")}
            title="Semantic Search"
          >
            <Search size={18} />

            <span className="nav-label">
              Semantic Search
            </span>
          </button>
        </nav>

        {/* CHAT HISTORY */}

        <div className="history nav-label">
          <div className="section-label">
            RECENT CHATS
          </div>

          {chats
            .filter(
              (chat) => chat.messages.length
            )
            .map((chat) => (
              <div
                key={chat.id}
                className={`history-row ${
                  active === chat.id &&
                  view === "chat"
                    ? "selected"
                    : ""
                }`}
              >
                <button
                  className="history-item"
                  title={chat.title}
                  onClick={() => {
                    setActive(chat.id);

                    nav("chat");
                  }}
                >
                  <MessageSquare size={15} />

                  <span>
                    {chat.title}
                  </span>
                </button>

                <div className="history-actions">
                  <button
                    title="Rename conversation"
                    aria-label="Rename conversation"
                    disabled={busy}
                    onClick={() =>
                      renameChat(chat.id)
                    }
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    className="delete-chat"
                    title="Delete conversation"
                    aria-label="Delete conversation"
                    disabled={busy}
                    onClick={() =>
                      deleteChat(chat.id)
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* SIDEBAR FOOTER */}

        <div className="sidebar-footer nav-label">
          <div className="knowledge">
            <Database size={17} />

            <strong>
              Knowledge Base
            </strong>

            <p>
              {docs.length} document
              {docs.length === 1
                ? ""
                : "s"}{" "}
              uploaded in this browser
            </p>

            <button
              onClick={uploadButton}
              disabled={uploading}
            >
              Add Document

              <Plus size={15} />
            </button>
          </div>

          <small>
            Technical Documentation RAG
          </small>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}

      <main className="main">
        <header className="topbar">
          <span>
            {view === "docs"
              ? "Document Library"
              : view === "search"
              ? "Semantic Search"
              : "AI Workspace"}
          </span>

          <div className="status">
            <i
              className={
                online === true
                  ? "online"
                  : online === false
                  ? "offline"
                  : ""
              }
            />

            {online === true
              ? "Backend Online"
              : online === false
              ? "Backend Unavailable"
              : "Checking Backend"}
          </div>
        </header>

        <div className="scroll-area">
          <div className="content">
            {/* WELCOME SCREEN */}

            {view === "chat" &&
              messages.length === 0 && (
                <div className="welcome">
                  <div className="eyebrow">
                    <Sparkles size={15} />

                    YOUR KNOWLEDGE, SIMPLIFIED
                  </div>

                  <h1>
                    <span>
                      Welcome to DocuMind.
                    </span>

                    <br />

                    <em>
                      How can I help you today?
                    </em>
                  </h1>

                  <div className="card-grid">
                    {/* RECENT DOCUMENTS */}

                    <section className="tile">
                      <div className="tile-label">
                        <FileText size={17} />

                        Recent Documents
                      </div>

                      {docs.length ? (
                        docs
                          .slice(0, 3)
                          .map((doc) => (
                            <div
                              className="file-row"
                              key={doc.name}
                            >
                              <FileText
                                size={17}
                              />

                              <span>
                                {doc.name}
                              </span>
                            </div>
                          ))
                      ) : (
                        <p>
                          No recent uploads.
                          Add a PDF to get
                          started.
                        </p>
                      )}

                      <button
                        className="text-button"
                        onClick={() =>
                          nav("docs")
                        }
                      >
                        View Document Library
                      </button>
                    </section>

                    {/* UPLOAD CARD */}

                    <button
                      className="tile upload-tile"
                      onClick={uploadButton}
                      disabled={uploading}
                      onDragOver={(event) =>
                        event.preventDefault()
                      }
                      onDrop={(event) => {
                        event.preventDefault();

                        void upload(
                          event.dataTransfer
                            .files
                        );
                      }}
                    >
                      <div className="tile-label">
                        <UploadCloud size={17} />

                        Add to your Knowledge Base
                      </div>

                      <div className="upload-icon">
                        {uploading ? (
                          <LoaderCircle className="spin" />
                        ) : (
                          <Plus />
                        )}
                      </div>

                      <strong>
                        {uploading
                          ? "Processing PDF..."
                          : "Upload a PDF"}
                      </strong>

                      <p>
                        Click or drag and drop
                        a document
                      </p>
                    </button>

                    {/* SUGGESTED QUESTIONS */}

                    {prompts.map(
                      ([title, question]) => (
                        <button
                          key={title}
                          className="tile suggestion"
                          disabled={
                            busy ||
                            uploading ||
                            !ready
                          }
                          onClick={() =>
                            void send(question)
                          }
                        >
                          <div className="tile-label">
                            <Sparkles
                              size={15}
                            />

                            Suggested Question
                          </div>

                          <strong>
                            {title}
                          </strong>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* CHAT MESSAGES */}

            {view === "chat" &&
              messages.map(
                (message, index) => (
                  <div
                    key={`${active}-${index}`}
                    className={`message ${message.role}`}
                  >
                    <div className="message-label">
                      {message.role ===
                      "assistant" ? (
                        <>
                          <span className="assistant-icon">
                            <Sparkles
                              size={16}
                            />
                          </span>

                          DocuMind
                        </>
                      ) : (
                        "You"
                      )}
                    </div>

                    <div className="message-body">
                      <ReactMarkdown
                        remarkPlugins={[
                          remarkGfm,
                        ]}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>

                    {/* SOURCE CITATIONS */}

                    {message.sources &&
                      message.sources.length >
                        0 && (
                        <div className="sources">
                          <div className="section-label">
                            RETRIEVED SOURCES
                          </div>

                          <GroupedSources
                            sources={
                              message.sources
                            }
                          />
                        </div>
                      )}

                    {/* COPY ANSWER */}

                    {message.role ===
                      "assistant" && (
                      <button
                        className="icon-button copy"
                        title="Copy Answer"
                        aria-label="Copy Answer"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              message.text
                            );

                            setCopied(
                              `${active}-${index}`
                            );
                          } catch {
                            setError(
                              "Clipboard unavailable."
                            );
                          }
                        }}
                      >
                        {copied ===
                        `${active}-${index}` ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    )}
                  </div>
                )
              )}

            {/* DOCUMENT LIBRARY */}

            {view === "docs" && (
              <div className="welcome">
                <h1>
                  Document Library
                </h1>

                <p className="muted">
                  PDFs uploaded through this
                  browser. The backend may
                  contain additional indexed
                  documents.
                </p>

                <button
                  className="primary"
                  onClick={uploadButton}
                  disabled={uploading}
                >
                  <UploadCloud size={17} />

                  {uploading
                    ? "Uploading..."
                    : "Upload PDF"}
                </button>

                <div className="document-list">
                  {docs.length ? (
                    docs.map((doc) => (
                      <div
                        className="document"
                        key={doc.name}
                      >
                        <span className="pdf-icon">
                          <FileText
                            size={24}
                          />
                        </span>

                        <div>
                          <strong>
                            {doc.name}
                          </strong>

                          <p>
                            {(
                              doc.size / 1024
                            ).toFixed(1)}{" "}
                            KB
                            {" · "}
                            {new Date(
                              doc.date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted">
                      No documents uploaded
                      from this browser yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* SEMANTIC SEARCH */}

            {view === "search" && (
              <div className="welcome">
                <h1>
                  Semantic Search
                </h1>

                <p className="muted">
                  Find relevant passages
                  directly from your indexed
                  documents.
                </p>

                {results !== null &&
                  (results.length ? (
                    <GroupedSources
                      sources={results}
                    />
                  ) : (
                    <p>
                      No results returned.
                    </p>
                  ))}
              </div>
            )}

            {/* UPLOAD STATUS */}

            {uploading && (
              <div className="loading">
                <LoaderCircle
                  className="spin"
                  size={18}
                />

                Uploading and indexing
                documents...
              </div>
            )}

            {/* LOADING STATE */}

            {busy && (
              <div className="loading">
                <LoaderCircle
                  className="spin"
                  size={18}
                />

                {view === "search"
                  ? "Searching documents..."
                  : "Thinking through your documents..."}
              </div>
            )}

            {/* ERROR MESSAGE */}

            {error && (
              <div
                className="error"
                role="alert"
              >
                <span>
                  {error}
                </span>

                <button
                  className="icon-button"
                  aria-label="Dismiss Error"
                  onClick={() =>
                    setError("")
                  }
                >
                  <X size={17} />
                </button>
              </div>
            )}

            <div ref={bottom} />
          </div>
        </div>

        {/* BOTTOM PROMPT BAR */}

        {view !== "docs" && (
          <footer className="composer-area">
            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();

                void send();
              }}
            >
              <button
                className="attach"
                type="button"
                title="Upload PDF"
                aria-label="Upload PDF"
                disabled={uploading}
                onClick={uploadButton}
              >
                <Plus size={23} />
              </button>

              <textarea
                rows={1}
                value={input}
                aria-label={
                  view === "search"
                    ? "Search documents"
                    : "Ask a question"
                }
                onChange={(event) =>
                  setInput(
                    event.target.value
                  )
                }
                placeholder={
                  view === "search"
                    ? "Search your knowledge base..."
                    : "Ask anything about your documents..."
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent
                      .isComposing
                  ) {
                    event.preventDefault();

                    void send();
                  }
                }}
              />

              <button
                className="send"
                type="submit"
                disabled={
                  !input.trim() ||
                  busy ||
                  uploading ||
                  !ready
                }
                aria-label="Submit Question"
              >
                {busy ? (
                  <LoaderCircle
                    className="spin"
                    size={19}
                  />
                ) : (
                  <ArrowUp size={21} />
                )}
              </button>
            </form>

            <p>
              Powered by RAG · Verify important
              information against the original
              documents.
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}