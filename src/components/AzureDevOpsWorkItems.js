import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function AzureDevOpsWorkItems() {
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState(null);
  // Filters
  const [project, setProject] = useState('');
  const [type, setType] = useState('');
  const [limit, setLimit] = useState(20);
  const [projects, setProjects] = useState([]);

  // Fetch available projects (optional, if backend supports)
  useEffect(() => {
    fetch('/api/ado/projects')
      .then(async res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        setProjects(Array.isArray(data) ? data : []);
      });
  }, []);

  // Fetch work items with filters
  useEffect(() => {
    setLoading(true);
    setError(null);
    let url = '/api/ado/work-items?';
    if (project) url += `project=${encodeURIComponent(project)}&`;
    if (type) url += `type=${encodeURIComponent(type)}&`;
    if (limit) url += `limit=${limit}&`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to fetch work items');
        }
        return res.json();
      })
      .then(data => {
        setWorkItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [project, type, limit]);

  if (loading) {
    return <div className="p-4">Loading work items...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (workItems.length === 0) {
    return <div className="p-4">No work items found.</div>;
  }

  // Fetch detail when selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    setDetailError(null);
    fetch(`/api/ado/work-items/${selectedId}`)
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to fetch work item detail');
        }
        return res.json();
      })
      .then(data => {
        setDetail(data);
        setDetailLoading(false);
      })
      .catch(err => {
        setDetailError(err.message);
        setDetailLoading(false);
      });
  }, [selectedId]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Azure DevOps Work Items</h2>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        {projects.length > 0 && (
          <div>
            <label className="mr-2 font-medium">Project:</label>
            <select value={project} onChange={e => setProject(e.target.value)} className="border px-2 py-1 rounded">
              <option value="">All</option>
              {projects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mr-2 font-medium">Type:</label>
          <select value={type} onChange={e => setType(e.target.value)} className="border px-2 py-1 rounded">
            <option value="">All</option>
            <option value="User Story">User Story</option>
            <option value="Feature">Feature</option>
            <option value="Epic">Epic</option>
            <option value="Task">Task</option>
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
      </div>
      {/* ...existing code... */}
      <table className="min-w-full border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 border">ID</th>
            <th className="px-3 py-2 border">Title</th>
            <th className="px-3 py-2 border">Type</th>
            <th className="px-3 py-2 border">State</th>
            <th className="px-3 py-2 border">Assigned To</th>
            <th className="px-3 py-2 border">Priority</th>
            <th className="px-3 py-2 border">Remaining Work</th>
          </tr>
        </thead>
        <tbody>
          {workItems.map(item => (
            <tr
              key={item.id}
              className={
                selectedId === item.id
                  ? 'bg-blue-100 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'
              }
              onClick={() => setSelectedId(item.id)}
            >
              <td className="px-3 py-2 border">{item.id}</td>
              <td className="px-3 py-2 border">{item.title}</td>
              <td className="px-3 py-2 border">{item.type}</td>
              <td className="px-3 py-2 border">{item.state}</td>
              <td className="px-3 py-2 border">{item.assigned_to}</td>
              <td className="px-3 py-2 border">{item.priority ?? '-'}</td>
              <td className="px-3 py-2 border">{item.remaining_work ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* ...existing code... */}
      {selectedId && (
        <div className="mt-6 p-4 border rounded bg-white shadow">
          <h3 className="text-lg font-semibold mb-2">Work Item Details</h3>
          {detailLoading && <div>Loading details...</div>}
          {detailError && <div className="text-red-600">Error: {detailError}</div>}
          {detail && (
            <>
              <div><strong>Title:</strong> {detail.title}</div>
              <div><strong>Description:</strong> {detail.description ?? '-'}</div>
              <div><strong>Acceptance Criteria:</strong> {detail.acceptance_criteria ?? '-'}</div>
              <div><strong>Type:</strong> {detail.type}</div>
              <div><strong>State:</strong> {detail.state}</div>
              <div><strong>Assigned To:</strong> {detail.assigned_to}</div>
              <div><strong>Priority:</strong> {detail.priority ?? '-'}</div>
              <div><strong>Remaining Work:</strong> {detail.remaining_work ?? '-'}</div>
              {detail.html_url && (
                <div className="mt-2">
                  <a href={detail.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open in Azure DevOps</a>
                </div>
              )}
              <div className="mt-4">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  disabled={explanationLoading}
                  onClick={async () => {
                    setExplanationLoading(true);
                    setExplanationError(null);
                    setExplanation(null);
                    try {
                      const res = await fetch(`/api/ado/work-items/${selectedId}/explain`, {
                        method: 'POST',
                      });
                      if (!res.ok) {
                        const msg = await res.text();
                        throw new Error(msg || 'Failed to get explanation');
                      }
                      const data = await res.json();
                      setExplanation(data.explanation || 'No explanation available.');
                    } catch (err) {
                      setExplanationError(err.message);
                    } finally {
                      setExplanationLoading(false);
                    }
                  }}
                >
                  {explanationLoading ? 'Loading...' : 'Get implementation & estimates'}
                </button>
              </div>
              <div className="mt-4">
                {explanationLoading && <div>Loading AI explanation...</div>}
                {explanationError && <div className="text-red-600">Error: {explanationError}</div>}
                {explanation && (
                  <div className="border rounded p-3 bg-gray-50">
                    <ReactMarkdown>{explanation}</ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AzureDevOpsWorkItems;
