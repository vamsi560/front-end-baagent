import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const API_BASE = 'https://backend-new-bagaent1.vercel.app';

const PLATFORM_OPTIONS = [
  { label: 'Azure DevOps', value: 'ado', icon: '⚡' },
  { label: 'Jira', value: 'jira', icon: '🟦' },
];

function WorkItemsBrowser() {
  const [platforms, setPlatforms] = useState([]); // available platforms
  const [platform, setPlatform] = useState(''); // selected platform
  const [status, setStatus] = useState({}); // status info per platform
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);

  // List view
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorItems, setErrorItems] = useState(null);
  const [count, setCount] = useState(0);

  // Filters
  const [project, setProject] = useState('');
  const [type, setType] = useState('');
  const [limit, setLimit] = useState(20);

  // Detail view
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState(null);

  // AI explanation
  const [explanation, setExplanation] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [errorExplanation, setErrorExplanation] = useState(null);

  // Check platform status
  useEffect(() => {
    setLoadingStatus(true);
    setErrorStatus(null);
    Promise.all([
      fetch(`${API_BASE}/api/ado/status`).then(r => r.json()),
      fetch(`${API_BASE}/api/jira/status`).then(r => r.json()),
    ]).then(([ado, jira]) => {
      const available = [];
      const stat = {};
      if (ado.configured) {
        available.push('ado');
        stat.ado = ado;
      }
      if (jira.configured) {
        available.push('jira');
        stat.jira = jira;
      }
      setPlatforms(available);
      setStatus(stat);
      setPlatform(available[0] || '');
      setLoadingStatus(false);
    }).catch(err => {
      setErrorStatus('Failed to check platform status');
      setLoadingStatus(false);
    });
  }, []);

  // Fetch work items/issues
  useEffect(() => {
    if (!platform) return;
    setLoadingItems(true);
    setErrorItems(null);
    setItems([]);
    setCount(0);
    let url = '';
    let params = {};
    if (platform === 'ado') {
      url = `${API_BASE}/api/ado/work-items`;
      if (project) params.project = project;
      if (type) params.types = type;
      if (limit) params.top = limit;
    } else {
      url = `${API_BASE}/api/jira/issues`;
      if (project) params.project_key = project;
      if (type) params.issue_types = type;
      if (limit) params.max_results = limit;
    }
    const qs = new URLSearchParams(params).toString();
    fetch(`${url}${qs ? '?' + qs : ''}`)
      .then(async res => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to fetch work items');
        }
        return res.json();
      })
      .then(data => {
        const items = platform === 'ado' ? data.work_items : data.issues;
        setItems(items || []);
        setCount(data.count || 0);
        setLoadingItems(false);
      })
      .catch(err => {
        setErrorItems(err.message);
        setLoadingItems(false);
      });
  }, [platform, project, type, limit]);

  // Fetch detail
  useEffect(() => {
    if (!platform || !selectedId) return;
    setLoadingDetail(true);
    setErrorDetail(null);
    setDetail(null);
    let url = '';
    if (platform === 'ado') {
      url = `${API_BASE}/api/ado/work-items/${selectedId}`;
      if (project) url += `?project=${encodeURIComponent(project)}`;
    } else {
      url = `${API_BASE}/api/jira/issues/${selectedId}`;
    }
    fetch(url)
      .then(async res => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to fetch item detail');
        }
        return res.json();
      })
      .then(data => {
        setDetail(data);
        setLoadingDetail(false);
      })
      .catch(err => {
        setErrorDetail(err.message);
        setLoadingDetail(false);
      });
  }, [platform, selectedId, project]);

  // Normalize item for display
  function normalizeItem(item) {
    if (platform === 'ado') {
      return {
        id: item.id?.toString(),
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.state,
        assignee: item.assigned_to,
        priority: item.priority,
        estimate: item.remaining_work,
        created_date: item.created_date,
        updated_date: item.changed_date,
        tags: item.tags,
        html_url: item.html_url,
        acceptance_criteria: item.acceptance_criteria,
      };
    } else {
      return {
        id: item.key,
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        assignee: item.assignee,
        priority: item.priority,
        estimate: item.story_points,
        created_date: item.created_date,
        updated_date: item.updated_date,
        tags: item.labels?.join(', '),
        html_url: item.html_url,
        acceptance_criteria: item.acceptance_criteria,
      };
    }
  }

  // AI explanation
  async function handleExplain() {
    setLoadingExplanation(true);
    setErrorExplanation(null);
    setExplanation(null);
    let url = '';
    if (platform === 'ado') {
      url = `${API_BASE}/api/ado/work-items/${selectedId}/explain`;
    } else {
      url = `${API_BASE}/api/jira/issues/${selectedId}/explain`;
    }
    try {
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to get explanation');
      }
      const data = await res.json();
      setExplanation(data.explanation || 'No explanation available.');
    } catch (err) {
      setErrorExplanation(err.message);
    } finally {
      setLoadingExplanation(false);
    }
  }

  // Error: no platforms
  if (!loadingStatus && platforms.length === 0) {
    return <div className="p-4 text-red-600">No work item integrations configured. Contact your administrator.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Work Items</h2>
      {/* Platform selector */}
      <div className="mb-4">
        {platforms.length > 1 ? (
          <div className="flex gap-2">
            {PLATFORM_OPTIONS.filter(opt => platforms.includes(opt.value)).map(opt => (
              <button
                key={opt.value}
                className={`px-4 py-2 rounded font-semibold border ${platform === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                onClick={() => { setPlatform(opt.value); setSelectedId(null); }}
              >
                <span className="mr-2">{opt.icon}</span>{opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="font-medium text-lg">
            {PLATFORM_OPTIONS.find(opt => platforms.includes(opt.value))?.icon} {PLATFORM_OPTIONS.find(opt => platforms.includes(opt.value))?.label}
          </div>
        )}
      </div>
      {/* Platform breadcrumb */}
      {platform && <div className="mb-2 text-sm text-gray-600">Platform: {PLATFORM_OPTIONS.find(opt => opt.value === platform)?.label}</div>}
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="mr-2 font-medium">Project:</label>
          <input
            type="text"
            value={project}
            onChange={e => setProject(e.target.value)}
            className="border px-2 py-1 rounded"
            placeholder={platform === 'ado' ? 'ADO project' : 'Jira project key'}
          />
        </div>
        <div>
          <label className="mr-2 font-medium">Type:</label>
          <select value={type} onChange={e => setType(e.target.value)} className="border px-2 py-1 rounded">
            <option value="">All</option>
            {platform === 'ado' ? (
              <>
                <option value="User Story">User Story</option>
                <option value="Feature">Feature</option>
                <option value="Epic">Epic</option>
                <option value="Task">Task</option>
              </>
            ) : (
              <>
                <option value="Story">Story</option>
                <option value="Bug">Bug</option>
                <option value="Task">Task</option>
                <option value="Epic">Epic</option>
              </>
            )}
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium">Limit:</label>
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="border px-2 py-1 rounded w-20"
          />
        </div>
        <button
          className="bg-gray-200 px-3 py-1 rounded border"
          onClick={() => { setSelectedId(null); setLoadingItems(true); setErrorItems(null); setItems([]); setCount(0); }}
        >Refresh</button>
      </div>
      {/* List view */}
      {loadingItems && <div>Loading work items...</div>}
      {errorItems && <div className="text-red-600">Error: {errorItems}</div>}
      {!loadingItems && items.length === 0 && <div>No work items found.</div>}
      {!loadingItems && items.length > 0 && (
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">ID</th>
              <th className="px-3 py-2 border">Title</th>
              <th className="px-3 py-2 border">Type</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Assignee</th>
              <th className="px-3 py-2 border">Priority</th>
              <th className="px-3 py-2 border">Estimate</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const norm = normalizeItem(item);
              return (
                <tr
                  key={norm.id}
                  className={selectedId === norm.id ? 'bg-blue-100 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}
                  onClick={() => setSelectedId(norm.id)}
                >
                  <td className="px-3 py-2 border">{norm.id}</td>
                  <td className="px-3 py-2 border">{norm.title}</td>
                  <td className="px-3 py-2 border">{norm.type}</td>
                  <td className="px-3 py-2 border">{norm.status}</td>
                  <td className="px-3 py-2 border">{norm.assignee}</td>
                  <td className="px-3 py-2 border">{norm.priority ?? '-'}</td>
                  <td className="px-3 py-2 border">{norm.estimate ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {/* Detail panel */}
      {selectedId && (
        <div className="mt-6 p-4 border rounded bg-white shadow">
          <h3 className="text-lg font-semibold mb-2">Work Item Details ({PLATFORM_OPTIONS.find(opt => opt.value === platform)?.label})</h3>
          {loadingDetail && <div>Loading details...</div>}
          {errorDetail && <div className="text-red-600">Error: {errorDetail}</div>}
          {detail && (
            (() => {
              const norm = normalizeItem(detail);
              return (
                <>
                  <div><strong>ID:</strong> {norm.id}</div>
                  <div><strong>Title:</strong> {norm.title}</div>
                  <div><strong>Description:</strong> {norm.description ?? '-'}</div>
                  <div><strong>Acceptance Criteria:</strong> {norm.acceptance_criteria ?? '-'}</div>
                  <div><strong>Type:</strong> {norm.type}</div>
                  <div><strong>Status:</strong> {norm.status}</div>
                  <div><strong>Assignee:</strong> {norm.assignee}</div>
                  <div><strong>Priority:</strong> {norm.priority ?? '-'}</div>
                  <div><strong>Estimate:</strong> {norm.estimate ?? '-'}</div>
                  <div><strong>Tags:</strong> {norm.tags ?? '-'}</div>
                  {norm.html_url && (
                    <div className="mt-2">
                      <a href={norm.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Open in {PLATFORM_OPTIONS.find(opt => opt.value === platform)?.label}
                      </a>
                    </div>
                  )}
                  <div className="mt-4">
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      disabled={loadingExplanation}
                      onClick={handleExplain}
                    >
                      {loadingExplanation ? 'Loading...' : 'Get AI Explanation'}
                    </button>
                  </div>
                  <div className="mt-4">
                    {loadingExplanation && <div>Loading AI explanation...</div>}
                    {errorExplanation && <div className="text-red-600">Error: {errorExplanation}</div>}
                    {explanation && (
                      <div className="border rounded p-3 bg-gray-50">
                        <ReactMarkdown>{explanation}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}

export default WorkItemsBrowser;
